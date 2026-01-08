// src/pages/AppliedJobs.jsx

import React, { useEffect, useState } from "react";
import CandidateLayout from "../layout/CandidateLayout";

export default function AppliedJobs() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 🟢 Filter State
  const [filter, setFilter] = useState("all");

  // Modal State
  const [selectedApp, setSelectedApp] = useState(null);
  const [modalType, setModalType] = useState("");

  // 🔽 FETCH DATA
  useEffect(() => {
    const token = localStorage.getItem("token");

    fetch("http://localhost:5000/api/candidate/applications", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setApplications(data);
        } else if (data.applications && Array.isArray(data.applications)) {
          setApplications(data.applications);
        } else {
          setApplications([]);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError("Could not load applications.");
        setApplications([]);
        setLoading(false);
      });
  }, []);

  // 📊 CALCULATE STATS
  const stats = {
      total: applications.length,
      active: applications.filter(a => !a.status?.toLowerCase().includes('rejected')).length,
      interview: applications.filter(a => a.status?.toLowerCase().includes('interview') || a.status?.toLowerCase().includes('shortlisted')).length,
      rejected: applications.filter(a => a.status?.toLowerCase().includes('rejected')).length
  };

  // 🔍 FILTER LOGIC
  const filteredApps = applications.filter(app => {
      const s = app.status?.toLowerCase() || "";
      if (filter === 'active') return !s.includes('rejected');
      if (filter === 'interview') return s.includes('interview') || s.includes('shortlisted');
      if (filter === 'rejected') return s.includes('rejected');
      return true; // 'all'
  });

  // 🎨 COLORS & ICONS
  const getStatusMeta = (status) => {
    const s = status?.toLowerCase() || "";
    if (s.includes("shortlisted")) return { color: "emerald", label: "Shortlisted" };
    if (s.includes("rejected")) return { color: "rose", label: "Closed" };
    if (s.includes("interview")) return { color: "violet", label: "Interview" };
    if (s.includes("hired")) return { color: "blue", label: "Hired" };
    return { color: "blue", label: "Applied" };
  };

  // 📊 STEPPER LOGIC
  const getStepIndex = (status) => {
    const s = status?.toLowerCase() || "";
    if (s.includes("applied")) return 1;
    if (s.includes("shortlisted")) return 2;
    if (s.includes("interview")) return 3;
    if (s.includes("hired")) return 4;
    if (s.includes("rejected")) return 2;
    return 1;
  };

  // 🛠️ SVG ICONS
  const StepIcon = ({ step, active, color }) => {
      const icons = {
          1: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>,
          2: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>,
          3: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>,
          4: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
      };
      const activeClass = active ? `bg-${color}-600 text-white shadow-lg shadow-${color}-500/40 ring-4 ring-${color}-500/20 scale-110` : "bg-slate-100 text-slate-400 border border-slate-200";
      return <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 z-10 ${activeClass}`}>{icons[step]}</div>;
  };

  const openDetails = (app) => { setSelectedApp(app); setModalType("details"); };
  const openDescription = (app) => { setSelectedApp(app); setModalType("description"); };
  const closeModal = () => { setSelectedApp(null); setModalType(""); };

  if (loading) return <CandidateLayout><div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-4 border-slate-900"></div></div></CandidateLayout>;

  return (
    <CandidateLayout>
      <div className="min-h-screen bg-slate-50/50 pb-20 font-sans">

        {/* 🟢 HEADER with INTERACTIVE FILTERS */}
        <div className="bg-[#0f172a] border-b border-slate-800 px-8 py-12 shadow-lg relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

            {/* 🚀 FIXED: Moved Content from "Between" to "Start/Center" to fill the empty circle */}
            <div className="max-w-6xl mx-auto relative z-10 flex flex-col lg:flex-row lg:items-end gap-12">

                {/* 1. Title Section */}
                <div className="flex-shrink-0">
                    <h1 className="text-4xl font-black text-white tracking-tight mb-2">Application Tracker</h1>
                    <p className="text-slate-400 font-medium text-lg">Manage and track your career opportunities.</p>
                </div>

                {/* 🟢 2. CLICKABLE FILTER CARDS (Now sitting in the empty circle area) */}
                <div className="flex gap-4">
                    <button onClick={() => setFilter('active')} className={`bg-white/5 border p-4 rounded-2xl min-w-[130px] backdrop-blur-md shadow-xl transition text-left group hover:bg-white/10 hover:-translate-y-1 ${filter === 'active' ? 'border-emerald-500 ring-1 ring-emerald-500 bg-white/10' : 'border-white/10'}`}>
                        <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${filter === 'active' ? 'text-emerald-400' : 'text-emerald-400/70'}`}>Active</p>
                        <p className="text-3xl font-black text-white">{stats.active}</p>
                    </button>
                    <button onClick={() => setFilter('interview')} className={`bg-white/5 border p-4 rounded-2xl min-w-[130px] backdrop-blur-md shadow-xl transition text-left group hover:bg-white/10 hover:-translate-y-1 ${filter === 'interview' ? 'border-violet-500 ring-1 ring-violet-500 bg-white/10' : 'border-white/10'}`}>
                        <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${filter === 'interview' ? 'text-violet-400' : 'text-violet-400/70'}`}>Interviews</p>
                        <p className="text-3xl font-black text-white">{stats.interview}</p>
                    </button>
                    <button onClick={() => setFilter('all')} className={`bg-white/5 border p-4 rounded-2xl min-w-[130px] backdrop-blur-md shadow-xl transition text-left group hover:bg-white/10 hover:-translate-y-1 ${filter === 'all' ? 'border-blue-500 ring-1 ring-blue-500 bg-white/10' : 'border-white/10'}`}>
                        <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${filter === 'all' ? 'text-blue-400' : 'text-blue-400/70'}`}>Total</p>
                        <p className="text-3xl font-black text-white">{stats.total}</p>
                    </button>
                </div>
            </div>
        </div>

        {/* 🟢 LIST SECTION */}
        <div className="max-w-6xl mx-auto px-8 -mt-8 relative z-20 space-y-6">

            {/* Filter Indicator */}
            {filter !== 'all' && (
                <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-bold text-slate-500">Showing: <span className="text-slate-800 capitalize">{filter} Applications</span></p>
                    <button onClick={() => setFilter('all')} className="text-xs font-bold text-blue-600 hover:underline">Clear Filter</button>
                </div>
            )}

            {filteredApps.length === 0 ? (
                <div className="bg-white rounded-2xl p-16 text-center border border-slate-200 shadow-xl">
                    <div className="text-6xl mb-4 grayscale opacity-50">📂</div>
                    <h3 className="text-xl font-bold text-slate-800">No applications found</h3>
                    <p className="text-slate-500 mt-2 mb-6">No applications match the selected filter.</p>
                    <button onClick={() => setFilter('all')} className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition">View All</button>
                </div>
            ) : (
                filteredApps.map((app) => {
                    const meta = getStatusMeta(app.status);
                    const stepIndex = getStepIndex(app.status);
                    const isRejected = app.status?.toLowerCase().includes("rejected");

                    return (
                        <div key={app.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col lg:flex-row hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group">

                            {/* LEFT CONTENT */}
                            <div className="p-8 lg:w-1/3 flex flex-col justify-center border-b lg:border-b-0 lg:border-r border-slate-100 bg-white relative">
                                <div className={`absolute top-6 left-8 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-${meta.color}-50 text-${meta.color}-700 border border-${meta.color}-100`}>
                                    <span className={`w-1.5 h-1.5 rounded-full bg-${meta.color}-600 animate-pulse`}></span>
                                    {meta.label}
                                </div>

                                <div className="mt-8">
                                    <h3 className="text-xl font-bold text-slate-800 mb-1 group-hover:text-blue-700 transition-colors capitalize">
                                        {app.job_title || app.title || "Unknown Role"}
                                    </h3>
                                    <p className="text-sm text-slate-500 font-medium flex items-center gap-2 capitalize">
                                        <span>📍 {app.location || "Remote"}</span>
                                        <span className="text-slate-300">•</span>
                                        <span>Applied {app.applied_at ? new Date(app.applied_at).toLocaleDateString() : "Recently"}</span>
                                    </p>
                                </div>

                                <div className="mt-6 flex gap-3">
                                    <button onClick={() => openDetails(app)} className="flex-1 text-xs font-bold text-white bg-slate-900 px-4 py-3 rounded-xl hover:bg-slate-800 transition shadow-lg shadow-slate-900/10">Analytics</button>
                                    <button onClick={() => openDescription(app)} className="flex-1 text-xs font-bold text-slate-600 bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl hover:bg-white hover:border-slate-300 transition">Details</button>
                                </div>
                            </div>

                            {/* RIGHT CONTENT */}
                            <div className="flex-1 bg-slate-50/50 p-8 flex items-center justify-center relative">
                                {isRejected ? (
                                    <div className="flex items-center gap-4 text-rose-700 bg-rose-50 px-6 py-4 rounded-2xl border border-rose-100 w-full max-w-lg">
                                        <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center text-xl">⛔</div>
                                        <div>
                                            <p className="font-bold text-sm">Application Closed</p>
                                            <p className="text-xs opacity-80 mt-0.5">Thank you for your interest. Unfortunately, we are not proceeding with this application.</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="w-full max-w-lg relative">
                                        <div className="absolute top-5 left-0 w-full h-1 bg-slate-200 rounded-full -z-0"></div>
                                        <div className={`absolute top-5 left-0 h-1 rounded-full z-0 transition-all duration-1000 ease-out bg-${meta.color}-500 shadow-sm shadow-${meta.color}-500/50`} style={{ width: `${((stepIndex - 1) / 3) * 100}%` }}></div>
                                        <div className="relative z-10 flex justify-between">
                                            {[{l:"Applied", id:1}, {l:"Review", id:2}, {l:"Interview", id:3}, {l:"Decision", id:4}].map((step) => (
                                                <div key={step.id} className="flex flex-col items-center gap-3">
                                                    <StepIcon step={step.id} active={step.id <= stepIndex} color={meta.color} />
                                                    <span className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${step.id <= stepIndex ? `text-${meta.color}-700` : "text-slate-300"}`}>{step.l}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })
            )}
        </div>

        {/* MODAL */}
        {selectedApp && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
                <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden transform scale-100 transition-all">
                    <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                        <h3 className="text-lg font-black text-slate-800 uppercase tracking-wide">{modalType === "details" ? "Application Insights" : "Job Description"}</h3>
                        <button onClick={closeModal} className="w-8 h-8 rounded-full flex items-center justify-center bg-white text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition text-xl">×</button>
                    </div>
                    <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                        {modalType === "details" ? (
                            <div className="space-y-6">
                                <div>
                                    <div className="flex justify-between items-end mb-2"><p className="text-xs font-black text-slate-400 uppercase">Match Score</p><span className="text-2xl font-black text-blue-600">{selectedApp.score || 0}%</span></div>
                                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-blue-600 rounded-full" style={{ width: `${selectedApp.score || 0}%` }}></div></div>
                                </div>
                                <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl"><p className="text-xs font-bold text-blue-600 uppercase mb-2">💡 AI Analysis</p><p className="text-sm text-blue-800 leading-relaxed">"{selectedApp.feedback || "Your profile is under review."}"</p></div>
                                {selectedApp.meeting_link && <a href={selectedApp.meeting_link} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 w-full py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition shadow-lg shadow-emerald-500/20 text-sm"><span>📹</span> Join Interview Room</a>}
                            </div>
                        ) : (
                            <div><h4 className="font-bold text-xl text-slate-900 mb-3 capitalize">{selectedApp.job_title}</h4><p className="text-slate-600 text-sm whitespace-pre-wrap leading-relaxed">{selectedApp.job_description || "No description."}</p></div>
                        )}
                    </div>
                </div>
            </div>
        )}
      </div>
    </CandidateLayout>
  );
}