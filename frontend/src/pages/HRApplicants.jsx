import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import HRLayout from "../layout/HRLayout";

export default function HRApplicants() {
  const { jobId } = useParams();
  const [applicants, setApplicants] = useState([]);
  const [jobTitle, setJobTitle] = useState("Loading...");
  const [loading, setLoading] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchApplicants();
  }, [jobId]);

  // 🟢 HELPER: Normalize Data
  const enhanceCandidateData = (app) => {
    return {
      ...app,
      trust_score: app.trust_score !== undefined ? app.trust_score : 100,
      // 👇 NEW: Handle the sentiment data coming from backend
      video_sentiment: app.video_sentiment || "Not Analyzed",
      tab_switches: app.tab_switches || 0,
      faces_detected: app.faces_detected || "Single Face",
      voices_detected: app.voices_detected || "Single Voice",
      ai_feedback: app.ai_feedback || "Candidate has strong relevant skills based on resume analysis."
    };
  };

  const fetchApplicants = async () => {
    try {
      // 1. Get Job Details
      const jobRes = await fetch(`http://localhost:5000/api/jobs/${jobId}`, {
         headers: { Authorization: `Bearer ${token}` }
      });
      if (jobRes.ok) {
          const jobData = await jobRes.json();
          setJobTitle(jobData.job?.title || jobData.title || "Job Details");
      }

      // 2. Get Applicants
      const res = await fetch(`http://localhost:5000/api/hr/jobs/${jobId}/applicants`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      let list = data.applicants || data || [];
      if (!Array.isArray(list)) list = [];

      // 3. Process Data & Sort by AI Score
      const enhancedList = list.map(enhanceCandidateData);
      const sorted = enhancedList.sort((a, b) => b.ai_score - a.ai_score);

      setApplicants(sorted);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching applicants:", err);
      setLoading(false);
    }
  };

  // 🟢 FIXED: Now accepts dynamic status (Shortlisted, Rejected, or Hired)
  const handleStatusUpdate = async (appId, newStatus) => {
    // Optimistic UI Update
    setApplicants(prev => prev.map(app =>
        app.id === appId ? { ...app, status: newStatus } : app
    ));

    try {
      await fetch(`http://localhost:5000/api/hr/applications/${appId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        // Send the specific status clicked
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (err) {
      console.error("Failed to update status");
      alert("Failed to update status on server.");
    }
  };

  const handleExport = () => {
    if (applicants.length === 0) return alert("No data to export.");
    const headers = "Rank,Name,Email,AI Score,Trust Score,Status\n";
    const rows = applicants.map((app, index) =>
        `${index + 1},${app.user?.name},${app.user?.email},${app.ai_score}%,${app.trust_score}%,${app.status}`
    ).join("\n");
    const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(headers + rows);
    const link = document.createElement("a");
    link.setAttribute("href", csvContent);
    link.setAttribute("download", `Candidates_Job_${jobId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBulkEmail = () => {
    const emails = applicants.map(app => app.user?.email).filter(email => email).join(",");
    if (!emails) return alert("No valid emails found.");
    window.location.href = `mailto:?bcc=${emails}&subject=Update regarding your application at RecruitPro`;
  };

  // 🎨 COLOR HELPERS
  const getScoreColor = (score) => {
    if (score >= 80) return "text-emerald-600 bg-emerald-50 border-emerald-200";
    if (score >= 50) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    return "text-red-600 bg-red-50 border-red-200";
  };

  const getTrustColor = (score) => {
      if (score >= 90) return "bg-blue-50 text-blue-700 border-blue-200";
      if (score >= 70) return "bg-orange-50 text-orange-700 border-orange-200";
      return "bg-red-50 text-red-700 border-red-200 animate-pulse";
  };

  // 🟢 PROFESSIONAL UPGRADE: Smart Sentiment Config
  const getSentimentConfig = (sentiment) => {
      // Normalize input to handle case variations
      const s = (sentiment || "").toLowerCase();

      if (s.includes("positive")) return {
          style: "bg-emerald-100 text-emerald-700 border-emerald-200",
          icon: "✨",
          label: "Positive Attitude",
          tooltip: "AI Analysis: Candidate displayed high confidence, clear modulation, and positive facial expressions."
      };
      if (s.includes("negative")) return {
          style: "bg-rose-50 text-rose-700 border-rose-200",
          icon: "🚩",
          label: "Negative / Flat",
          tooltip: "AI Analysis: Detected low energy, hesitation, or negative keywords in speech."
      };
      if (s.includes("nervous")) return {
          style: "bg-amber-50 text-amber-700 border-amber-200",
          icon: "😰",
          label: "Nervous Tone",
          tooltip: "AI Analysis: Detected rapid speech, stuttering, or lack of sustained eye contact."
      };
      if (s.includes("neutral")) return {
          style: "bg-blue-50 text-blue-600 border-blue-200",
          icon: "😐",
          label: "Neutral",
          tooltip: "AI Analysis: Standard professional tone with balanced emotion."
      };

      // Default / Not Analyzed
      return {
          style: "bg-slate-100 text-slate-500 border-slate-200",
          icon: "⏸️",
          label: "Not Analyzed",
          tooltip: "Video data not available or not yet processed."
      };
  };

  // 🟢 UPDATED: Renders Logic for Shortlisted (Interview) -> Hired
  const renderActionButtons = (app, isPrimary = false) => {

      // 1. STATUS: SHORTLISTED (Interview Phase)
      // Show Interview Link + Final Decision Buttons
      if (app.status === "Shortlisted") {
          return (
              <div className={`flex flex-col gap-2 ${isPrimary ? 'w-full' : ''}`}>

                  {/* A. INTERVIEW LINK (The Blue Button) */}
                  {app.meeting_link && (
                      <a
                        href={app.meeting_link}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full px-4 py-3 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 shadow-md flex items-center gap-2 justify-center transition animate-pulse"
                      >
                          🎥 Join Interview Room
                      </a>
                  )}

                  {/* B. FINAL DECISION BUTTONS (Hire vs Reject) */}
                  <div className="flex gap-2">
                      <button
                          onClick={() => handleStatusUpdate(app.id, "Rejected")}
                          className="flex-1 px-3 py-2 bg-white border border-red-200 text-red-500 hover:bg-red-50 text-xs font-bold rounded-lg transition"
                      >
                          Reject
                      </button>
                      <button
                          onClick={() => handleStatusUpdate(app.id, "Hired")}
                          className="flex-[2] px-3 py-2 bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg text-xs font-bold rounded-lg transition"
                      >
                          🤝 Hire Candidate
                      </button>
                  </div>
              </div>
          );
      }

      // 2. STATUS: HIRED (Final State)
      if (app.status === "Hired") {
          return (
              <button disabled className={`px-4 py-3 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-200 cursor-not-allowed flex items-center gap-2 justify-center ${isPrimary ? 'w-full' : ''}`}>
                  <span>🎉 Hired Successfully</span>
              </button>
          );
      }

      // 3. STATUS: REJECTED
      if (app.status === "Rejected") {
          return (
              <button disabled className={`px-4 py-2 bg-red-100 text-red-700 text-xs font-bold rounded-lg border border-red-200 cursor-not-allowed flex items-center gap-2 justify-center ${isPrimary ? 'w-full py-3' : ''}`}>
                  <span>❌ Rejected</span>
              </button>
          );
      }

      // 4. STATUS: APPLIED (Initial State - Reject | Shortlist)
      return (
          <div className={`flex gap-2 ${isPrimary ? 'w-full' : ''}`}>
             {/* REJECT BUTTON */}
             <button
                onClick={() => handleStatusUpdate(app.id, "Rejected")}
                className={`flex-1 px-3 py-2 bg-white border border-red-200 text-red-500 hover:bg-red-50 text-xs font-bold rounded-lg transition ${isPrimary ? 'py-3' : ''}`}
             >
                Reject
             </button>

             {/* SHORTLIST BUTTON */}
             <button
                onClick={() => handleStatusUpdate(app.id, "Shortlisted")}
                className={`flex-[2] px-3 py-2 ${isPrimary ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg hover:from-yellow-600' : 'bg-slate-900 text-white hover:bg-slate-800'} text-xs font-bold rounded-lg transition ${isPrimary ? 'py-3' : ''}`}
             >
                {isPrimary ? '🏆 Shortlist' : 'Shortlist'}
             </button>
          </div>
      );
  };

  return (
    <HRLayout>
      <div className="p-8 max-w-7xl mx-auto min-h-screen bg-slate-50 font-sans">

        {/* 1. HEADER */}
        <div className="mb-10 flex flex-col md:flex-row justify-between items-end gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
               <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Candidate Ranking</span>
               <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">AI Active</span>
            </div>
            <h1 className="text-4xl font-black text-slate-800 capitalize tracking-tight">{jobTitle}</h1>
            <p className="text-slate-500 font-medium mt-2">
               Found <strong className="text-slate-900">{applicants.length} candidates</strong>. Ranked by AI relevance & Integrity.
            </p>
          </div>
          <div className="flex gap-3">
             <button onClick={handleExport} className="px-4 py-2.5 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-50 transition shadow-sm flex items-center gap-2">⬇ Export CSV</button>
             <button onClick={handleBulkEmail} className="px-4 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition shadow-lg flex items-center gap-2">✉️ Bulk Email</button>
          </div>
        </div>

        {/* 2. TOP 3 PODIUM */}
        {applicants.length > 0 && (
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 items-end">
              {/* RANK #2 */}
              {applicants[1] && (
                 <div className="relative bg-white p-6 rounded-3xl shadow-lg border border-slate-100 overflow-hidden hover:-translate-y-2 transition-all duration-300">
                    <div className="absolute top-0 right-0 px-4 py-2 rounded-bl-2xl bg-slate-200 text-slate-600 font-black text-lg">#2</div>
                    <div className="flex items-center gap-4 mb-6">
                       <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 border-2 border-white shadow-sm flex items-center justify-center text-xl font-bold text-blue-600">
                          {applicants[1].user?.name?.charAt(0)}
                       </div>
                       <div>
                          <h3 className="font-bold text-slate-800 text-lg leading-tight">{applicants[1].user?.name}</h3>
                          <p className="text-xs text-slate-500 font-medium">{applicants[1].user?.email}</p>
                       </div>
                    </div>

                    <div className={`mb-4 flex items-center justify-between px-3 py-2 rounded-lg border ${getTrustColor(applicants[1].trust_score)}`}>
                        <span className="text-[10px] font-black uppercase tracking-wider flex items-center gap-1">🛡️ Trust Score</span>
                        <span className="text-sm font-black">{applicants[1].trust_score}%</span>
                    </div>

                    <div className="w-full bg-slate-100 rounded-full h-2 mb-2 overflow-hidden"><div className="h-full bg-blue-500 rounded-full" style={{ width: `${applicants[1].ai_score}%` }}></div></div>
                    <div className="flex justify-between items-end mb-4"><span className="text-xs font-bold text-slate-400 uppercase">AI Match</span><span className="text-2xl font-black text-slate-800">{applicants[1].ai_score}%</span></div>

                    <div className="flex flex-col gap-2">
                         <button onClick={() => setSelectedCandidate(applicants[1])} className="w-full py-2 bg-slate-50 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-100">View Profile</button>
                         {renderActionButtons(applicants[1], true)}
                    </div>
                 </div>
              )}

              {/* RANK #1 */}
              {applicants[0] && (
                 <div className="relative bg-white p-8 rounded-3xl shadow-xl border-2 border-yellow-400/30 overflow-hidden transform md:-translate-y-4 hover:-translate-y-6 transition-all duration-300 z-10">
                    <div className="absolute top-0 right-0 px-6 py-3 rounded-bl-3xl bg-yellow-400 text-white font-black text-2xl shadow-md">#1</div>
                    <div className="flex flex-col items-center text-center mb-6">
                       <div className="w-24 h-24 rounded-full bg-gradient-to-br from-yellow-50 to-orange-50 border-4 border-white shadow-lg flex items-center justify-center text-4xl font-bold text-yellow-600 mb-4">
                          {applicants[0].user?.name?.charAt(0)}
                       </div>
                       <h3 className="font-black text-2xl text-slate-800 tracking-tight">{applicants[0].user?.name}</h3>
                       <p className="text-sm text-slate-500 font-medium">{applicants[0].user?.email}</p>
                    </div>

                    <div className={`mx-auto mb-6 flex items-center justify-center gap-3 px-4 py-2 rounded-xl border w-fit ${getTrustColor(applicants[0].trust_score)}`}>
                        <span className="text-xs font-black uppercase tracking-wider">🛡️ Proctoring</span>
                        <span className="text-lg font-black">{applicants[0].trust_score}% Clean</span>
                    </div>

                    <div className="w-full bg-slate-100 rounded-full h-3 mb-4 overflow-hidden"><div className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full" style={{ width: `${applicants[0].ai_score}%` }}></div></div>
                    <div className="flex justify-between items-center mb-6 px-2"><span className="text-xs font-bold text-slate-400 uppercase">AI Score</span><span className="text-5xl font-black text-slate-800">{applicants[0].ai_score}%</span></div>

                    <div className="flex gap-3">
                         <button onClick={() => setSelectedCandidate(applicants[0])} className="flex-1 py-3 bg-slate-50 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-100 transition">Profile</button>
                         <div className="flex-[2]">
                            {renderActionButtons(applicants[0], true)}
                         </div>
                    </div>
                 </div>
              )}

              {/* RANK #3 */}
              {applicants[2] && (
                 <div className="relative bg-white p-6 rounded-3xl shadow-lg border border-slate-100 overflow-hidden hover:-translate-y-2 transition-all duration-300">
                    <div className="absolute top-0 right-0 px-4 py-2 rounded-bl-2xl bg-orange-200 text-orange-800 font-black text-lg">#3</div>
                    <div className="flex items-center gap-4 mb-6">
                       <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-50 to-red-50 border-2 border-white shadow-sm flex items-center justify-center text-xl font-bold text-orange-500">
                          {applicants[2].user?.name?.charAt(0)}
                       </div>
                       <div>
                          <h3 className="font-bold text-slate-800 text-lg leading-tight">{applicants[2].user?.name}</h3>
                          <p className="text-xs text-slate-500 font-medium">{applicants[2].user?.email}</p>
                       </div>
                    </div>

                    <div className={`mb-4 flex items-center justify-between px-3 py-2 rounded-lg border ${getTrustColor(applicants[2].trust_score)}`}>
                        <span className="text-[10px] font-black uppercase tracking-wider flex items-center gap-1">🛡️ Trust Score</span>
                        <span className="text-sm font-black">{applicants[2].trust_score}%</span>
                    </div>

                    <div className="w-full bg-slate-100 rounded-full h-2 mb-3 overflow-hidden"><div className="h-full bg-orange-400 rounded-full" style={{ width: `${applicants[2].ai_score}%` }}></div></div>
                    <div className="flex justify-between items-end mb-4"><span className="text-xs font-bold text-slate-400 uppercase">AI Match</span><span className="text-2xl font-black text-slate-800">{applicants[2].ai_score}%</span></div>

                    <div className="flex flex-col gap-2">
                         <button onClick={() => setSelectedCandidate(applicants[2])} className="w-full py-2 bg-slate-50 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-100">View Profile</button>
                         {renderActionButtons(applicants[2], true)}
                    </div>
                 </div>
              )}
           </div>
        )}

        {/* 3. LIST VIEW */}
        <div className="space-y-4">
           {applicants.map((app, index) => (
             <div key={app.id} className={`group relative bg-white p-5 rounded-2xl border transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 ${app.status === "Shortlisted" ? "border-emerald-200 bg-emerald-50/10" : app.status === "Rejected" ? "border-red-200 bg-red-50/10" : app.status === "Hired" ? "border-emerald-500 bg-emerald-100/20" : "border-slate-100"}`}>
                <div className="flex flex-col md:flex-row gap-6 items-center">
                    <div className="hidden md:flex flex-col items-center justify-center w-12 flex-shrink-0 text-slate-300"><span className="text-xl font-black">#{index + 1}</span></div>

                    <div className="flex items-center gap-4 w-full md:w-1/3">
                        <div className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-xl shadow-sm border-2 border-white bg-slate-100 text-slate-500">{app.user?.name?.charAt(0)}</div>
                        <div className="min-w-0">
                            <h4 className="font-bold text-slate-800 text-lg truncate">{app.user?.name}</h4>
                            <p className="text-xs text-slate-400 font-medium truncate">{app.user?.email}</p>
                        </div>
                    </div>

                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <span className={`text-2xl font-black ${getScoreColor(app.ai_score).split(" ")[0]}`}>{app.ai_score}%</span>
                            <span className="text-xs font-bold text-slate-400 uppercase">Match</span>
                        </div>
                    </div>

                    {/* 🟢 PROFESSIONAL SENTIMENT BADGE WITH TOOLTIP */}
                    <div className="w-40 flex flex-col items-end justify-center gap-2">

                        {/* 1. Trust Score */}
                        <div className={`px-3 py-1 rounded-full border text-[10px] font-black uppercase flex items-center gap-1 ${getTrustColor(app.trust_score)}`}>
                            <span>🛡️</span> {app.trust_score}% Trust
                        </div>

                        {/* 2. SMART SENTIMENT PILL */}
                        {(() => {
                            const config = getSentimentConfig(app.video_sentiment);
                            return (
                                <div
                                    className={`group relative cursor-help px-3 py-1 rounded-full border text-[10px] font-black uppercase flex items-center gap-1.5 transition-all hover:scale-105 ${config.style}`}
                                >
                                    <span className="text-sm">{config.icon}</span>
                                    <span>{config.label}</span>

                                    {/* Tooltip on Hover */}
                                    <div className="absolute bottom-full mb-2 right-0 w-48 bg-slate-800 text-white text-[10px] font-medium p-2 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                                        {config.tooltip}
                                        <div className="absolute top-full right-4 border-4 border-transparent border-t-slate-800"></div>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>

                    <div className="flex items-center gap-2">
                        <button onClick={() => setSelectedCandidate(app)} className="px-4 py-2 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-50">View</button>
                        {/* 🟢 Action Buttons */}
                        {renderActionButtons(app)}
                    </div>
                </div>
             </div>
           ))}
        </div>

        {/* 4. MODAL */}
        {selectedCandidate && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
                <div className="bg-slate-50 rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto relative">
                    {/* Header */}
                    <div className="relative bg-slate-900 p-8 pb-16">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                        <button onClick={() => setSelectedCandidate(null)} className="absolute top-6 right-6 text-white text-2xl font-bold hover:text-red-400 transition z-20">&times;</button>

                        <div className="flex gap-6 items-center relative z-10">
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-3xl font-bold text-white shadow-xl border-4 border-slate-800">
                                {selectedCandidate.user?.name?.charAt(0)}
                            </div>
                            <div>
                                <h2 className="text-3xl font-black text-white">{selectedCandidate.user?.name}</h2>
                                <p className="text-emerald-400 font-medium text-sm">{selectedCandidate.user?.email}</p>
                                <div className="flex gap-4 mt-2 text-slate-400 text-xs font-bold">
                                    <span>📞 {selectedCandidate.user?.phone || "N/A"}</span>
                                    <span>📍 {selectedCandidate.user?.location || "N/A"}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="px-8 pb-8 -mt-10 relative z-10 space-y-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex items-center justify-between">
                            <div>
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                                    <span>🛡️</span> Integrity Report
                                </h4>
                                <p className="text-sm font-bold text-slate-700">Detailed logs from the assessment session.</p>
                            </div>
                            <div className="text-right">
                                <div className={`text-3xl font-black ${selectedCandidate.trust_score < 70 ? 'text-red-600' : 'text-emerald-600'}`}>
                                    {selectedCandidate.trust_score}%
                                </div>
                                <p className="text-xs text-slate-400 font-bold uppercase">Trust Score</p>
                            </div>
                        </div>

                        {selectedCandidate.trust_score < 100 && (
                            <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex gap-3 items-start">
                                <span className="text-2xl">⚠️</span>
                                <div>
                                    <h5 className="font-bold text-red-700 text-sm">Suspicious Activity Detected</h5>
                                    <ul className="text-xs text-red-600 mt-1 list-disc list-inside">
                                        {selectedCandidate.tab_switches > 0 && <li>Switched tabs {selectedCandidate.tab_switches} times</li>}
                                        {selectedCandidate.faces_detected !== "Single Face" && <li>Face Detection: {selectedCandidate.faces_detected}</li>}
                                        {selectedCandidate.voices_detected !== "Single Voice" && <li>Voice Detection: {selectedCandidate.voices_detected}</li>}
                                    </ul>
                                </div>
                            </div>
                        )}

                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <span>⚡</span> Top Skills
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {selectedCandidate.user?.skills && selectedCandidate.user.skills.length > 0 ? (
                                    selectedCandidate.user.skills.map((skill, i) => (
                                        <span key={i} className="px-3 py-1.5 bg-slate-50 text-slate-700 text-xs font-bold rounded-md border border-slate-200">
                                            {skill}
                                        </span>
                                    ))
                                ) : (
                                    <span className="text-slate-400 text-sm italic">No skills listed</span>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Experience</h4>
                                <p className="text-sm text-slate-600 leading-relaxed">{selectedCandidate.user?.experience || "No experience listed."}</p>
                            </div>
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Education</h4>
                                <p className="text-sm text-slate-600 leading-relaxed">{selectedCandidate.user?.education || "No education listed."}</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 bg-white border-t border-slate-100 flex justify-end gap-3 sticky bottom-0 z-20 rounded-b-3xl">
                        <button onClick={() => setSelectedCandidate(null)} className="px-6 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition">Close</button>

                        {selectedCandidate.resume_url && (
                             <a href={`http://localhost:5000${selectedCandidate.resume_url}`} target="_blank" rel="noreferrer" className="px-6 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 shadow-xl flex items-center gap-2 transition transform hover:scale-105">
                                📄 View Resume
                             </a>
                        )}
                    </div>
                </div>
            </div>
        )}

      </div>
    </HRLayout>
  );
}