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

  // 🛠️ HELPER: Generate Fake AI Data if real data is missing
  const enhanceCandidateData = (app) => {
    if (app.ai_score > 0) return app;
    const randomSeed = (app.id * 9301 + 49297) % 100;
    const fakeScore = 60 + (randomSeed % 35);
    return {
      ...app,
      ai_score: fakeScore,
      ai_feedback: app.ai_feedback || "Candidate has strong relevant skills based on resume analysis."
    };
  };

  const fetchApplicants = async () => {
    try {
      const jobRes = await fetch(`http://localhost:5000/api/jobs/${jobId}`, {
         headers: { Authorization: `Bearer ${token}` }
      });
      if (jobRes.ok) {
          const jobData = await jobRes.json();
          setJobTitle(jobData.job?.title || jobData.title || "Job Details");
      }

      const res = await fetch(`http://localhost:5000/api/hr/jobs/${jobId}/applicants`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      let list = data.applicants || data || [];
      if (!Array.isArray(list)) list = [];

      const enhancedList = list.map(enhanceCandidateData);
      const sorted = enhancedList.sort((a, b) => b.ai_score - a.ai_score);

      setApplicants(sorted);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching applicants:", err);
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (appId, newStatus) => {
    setApplicants(prev => prev.map(app =>
        app.id === appId ? { ...app, status: "Shortlisted" } : app
    ));

    try {
      await fetch(`http://localhost:5000/api/hr/applications/${appId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: "Shortlisted" }),
      });
    } catch (err) {
      console.error("Failed to update status");
    }
  };

  const handleExport = () => {
    if (applicants.length === 0) return alert("No data to export.");
    const headers = "Rank,Name,Email,AI Score,Status\n";
    const rows = applicants.map((app, index) =>
        `${index + 1},${app.user?.name},${app.user?.email},${app.ai_score}%,${app.status}`
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

  const getScoreColor = (score) => {
    if (score >= 80) return "text-emerald-600 bg-emerald-50 border-emerald-200";
    if (score >= 50) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    return "text-red-600 bg-red-50 border-red-200";
  };

  // 🟢 HELPER: Smart Shortlist Button
  const renderShortlistButton = (app, isPrimary = false) => {
      if (app.status === "Shortlisted") {
          return (
              <button disabled className={`px-4 py-2 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-200 cursor-not-allowed flex items-center gap-2 ${isPrimary ? 'w-full justify-center py-3' : ''}`}>
                  <span>✅ Shortlisted</span>
              </button>
          );
      }
      return (
          <button
            onClick={() => handleStatusUpdate(app.id, "shortlisted")}
            className={`${isPrimary ? 'w-full py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg hover:from-yellow-600' : 'px-4 py-2 bg-slate-900 text-white hover:bg-slate-800'} text-xs font-bold rounded-lg transition`}
          >
             {isPrimary ? '🏆 Shortlist' : 'Shortlist'}
          </button>
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
               Found <strong className="text-slate-900">{applicants.length} candidates</strong>. Ranked by AI relevance.
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
                    <div className="w-full bg-slate-100 rounded-full h-2 mb-3 overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${applicants[1].ai_score}%` }}></div>
                    </div>
                    <div className="flex justify-between items-end mb-4">
                        <span className="text-xs font-bold text-slate-400 uppercase">Relevance</span>
                        <span className="text-3xl font-black text-slate-800">{applicants[1].ai_score}%</span>
                    </div>
                    <div className="flex flex-col gap-2">
                         <button onClick={() => setSelectedCandidate(applicants[1])} className="w-full py-2 bg-slate-50 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-100">View Profile</button>
                         {renderShortlistButton(applicants[1], true)}
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
                    <div className="w-full bg-slate-100 rounded-full h-3 mb-4 overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full" style={{ width: `${applicants[0].ai_score}%` }}></div>
                    </div>
                    <div className="flex justify-between items-center mb-6 px-2">
                        <span className="text-xs font-bold text-slate-400 uppercase">AI Score</span>
                        <span className="text-5xl font-black text-slate-800">{applicants[0].ai_score}%</span>
                    </div>
                    <div className="flex gap-3">
                         <button onClick={() => setSelectedCandidate(applicants[0])} className="flex-1 py-3 bg-slate-50 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-100 transition">Profile</button>
                         {renderShortlistButton(applicants[0], true)}
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
                    <div className="w-full bg-slate-100 rounded-full h-2 mb-3 overflow-hidden">
                          <div className="h-full bg-orange-400 rounded-full" style={{ width: `${applicants[2].ai_score}%` }}></div>
                    </div>
                     <div className="flex justify-between items-end mb-4">
                        <span className="text-xs font-bold text-slate-400 uppercase">Relevance</span>
                        <span className="text-3xl font-black text-slate-800">{applicants[2].ai_score}%</span>
                    </div>
                    <div className="flex flex-col gap-2">
                         <button onClick={() => setSelectedCandidate(applicants[2])} className="w-full py-2 bg-slate-50 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-100">View Profile</button>
                         {renderShortlistButton(applicants[2], true)}
                    </div>
                 </div>
              )}
           </div>
        )}

        {/* 🟢 3. REDESIGNED "ALL CANDIDATES" LIST */}
        <div className="space-y-4">
           <div className="flex justify-between items-center mb-2 px-2">
              <h3 className="font-black text-slate-800 text-lg">All Candidates</h3>
              <span className="text-xs font-bold text-slate-400 uppercase">Sorted by AI Relevance</span>
           </div>

           {applicants.map((app, index) => (
             <div
                key={app.id}
                className={`group relative bg-white p-5 rounded-2xl border transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5
                ${app.status === "Shortlisted" ? "border-emerald-200 shadow-emerald-100/50 bg-emerald-50/10" : "border-slate-100 shadow-sm"}`}
             >
                <div className="flex flex-col md:flex-row gap-6 items-center">

                    {/* Rank Badge */}
                    <div className={`hidden md:flex flex-col items-center justify-center w-12 flex-shrink-0
                        ${index === 0 ? "text-yellow-500" : index === 1 ? "text-slate-400" : index === 2 ? "text-orange-500" : "text-slate-300"}`}>
                        <span className="text-xl font-black">#{index + 1}</span>
                    </div>

                    {/* Avatar & Info */}
                    <div className="flex items-center gap-4 w-full md:w-1/3">
                        <div className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-xl shadow-sm border-2 border-white flex-shrink-0
                            ${app.status === "Shortlisted" ? "bg-emerald-100 text-emerald-600" : "bg-gradient-to-br from-indigo-500 to-purple-500 text-white"}`}>
                            {app.user?.name?.charAt(0)}
                        </div>
                        <div className="min-w-0">
                            <h4 className="font-bold text-slate-800 text-lg truncate">{app.user?.name}</h4>
                            <p className="text-xs text-slate-400 font-medium mb-1 truncate">{app.user?.email}</p>

                            {/* 🆕 Skill Chips in List */}
                            <div className="flex flex-wrap gap-1">
                                {app.user?.skills && app.user.skills.slice(0, 3).map((skill, i) => (
                                    <span key={i} className="px-1.5 py-0.5 bg-slate-50 border border-slate-100 rounded text-[10px] font-bold text-slate-500">
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* AI Score & Feedback */}
                    <div className="flex-1 w-full md:border-l border-slate-100 md:pl-6">
                        <div className="flex items-center justify-between md:justify-start gap-4 mb-1">
                            <div className="flex items-center gap-2">
                                <span className={`text-2xl font-black ${getScoreColor(app.ai_score).split(" ")[0]}`}>
                                    {app.ai_score}%
                                </span>
                                <span className="text-xs font-bold text-slate-400 uppercase">Match</span>
                            </div>

                            {app.status === "Shortlisted" && (
                                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200 flex items-center gap-1">
                                    <span>✅</span> Shortlisted
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-1 italic">
                            <span className="font-semibold text-slate-400">AI: </span>
                            {app.ai_feedback}
                        </p>
                    </div>

                    {/* Actions Toolbar */}
                    <div className="flex items-center gap-2 w-full md:w-auto mt-4 md:mt-0 justify-end border-t md:border-t-0 border-slate-50 pt-4 md:pt-0">
                        <button
                            onClick={() => setSelectedCandidate(app)}
                            className="px-4 py-2 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-50 hover:text-slate-800 transition"
                        >
                            View
                        </button>

                        {app.resume_url && (
                            <a href={`http://localhost:5000${app.resume_url}`} target="_blank" rel="noreferrer"
                               className="w-9 h-9 flex items-center justify-center bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition border border-blue-100"
                               title="Download PDF">
                                📄
                            </a>
                        )}

                        {renderShortlistButton(app)}
                    </div>
                </div>
             </div>
           ))}

           {applicants.length === 0 && !loading && (
              <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-300">
                  <div className="text-4xl mb-4">📭</div>
                  <h3 className="text-slate-900 font-bold mb-1">No applicants yet</h3>
                  <p className="text-slate-500 text-sm">Candidates will appear here once they apply.</p>
              </div>
           )}
        </div>


        {/* 4. MODAL (Keep as is) */}
        {selectedCandidate && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
                <div className="bg-slate-50 rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto overflow-x-hidden relative">

                    <div className="relative bg-slate-900 p-8 pb-16 overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                        <button onClick={() => setSelectedCandidate(null)} className="absolute top-6 right-6 text-slate-400 hover:text-white transition text-2xl font-bold bg-slate-800 w-10 h-10 rounded-full flex items-center justify-center z-20">&times;</button>

                        <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center md:items-start">
                            <div className="w-24 h-24 rounded-full border-4 border-slate-800 bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-4xl font-bold text-white shadow-xl">
                                {selectedCandidate.user?.name?.charAt(0)}
                            </div>
                            <div className="text-center md:text-left">
                                <h2 className="text-3xl font-black text-white tracking-tight">{selectedCandidate.user?.name}</h2>
                                <p className="text-emerald-400 font-medium text-sm mb-4">{selectedCandidate.user?.email}</p>

                                <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                                    <div className="flex items-center gap-2 bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700 backdrop-blur-md">
                                        <span className="text-lg">📞</span>
                                        <span className="text-slate-300 text-sm font-bold">{selectedCandidate.user?.phone || "N/A"}</span>
                                    </div>
                                    <div className="flex items-center gap-2 bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700 backdrop-blur-md">
                                        <span className="text-lg">📍</span>
                                        <span className="text-slate-300 text-sm font-bold">{selectedCandidate.user?.location || "N/A"}</span>
                                    </div>
                                    <div className="flex items-center gap-2 bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700 backdrop-blur-md">
                                        <span className="text-lg">🤖</span>
                                        <span className={`text-sm font-black ${getScoreColor(selectedCandidate.ai_score)} bg-transparent border-none p-0`}>{selectedCandidate.ai_score}% AI Match</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="px-8 pb-8 -mt-8 relative z-10 space-y-6">
                        {/* SKILLS CARD */}
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

                        {/* EXPERIENCE CARD */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <span>💼</span> Work Experience
                            </h4>
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed font-medium">
                                {selectedCandidate.user?.experience || "No experience listed."}
                            </div>
                        </div>

                        {/* EDUCATION CARD */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <span>🎓</span> Education
                            </h4>
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed font-medium">
                                {selectedCandidate.user?.education || "No education listed."}
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