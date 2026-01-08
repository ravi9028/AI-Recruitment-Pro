// src/components/JobCard.jsx
import { Link } from "react-router-dom";
import React from "react";

export default function JobCard({
  job,
  applied,
  status,
  appliedAt,
  loading,
  meeting_link,
  ai_score,
  ai_feedback,
  ai_graph, // 🟢 ADDED THIS (It was missing)
  onApply
}) {

return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 flex flex-col h-full min-h-[400px]">
      {/* 1. Header Row: Title & Status Badge */}
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-bold text-slate-900 capitalize">
          {job.title}
        </h3>
        {applied && (
          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
            status === "Shortlisted" ? "bg-green-600 text-white" : "bg-gray-500 text-white"
          }`}>
            {status || "Applied"}
          </span>
        )}
      </div>

      {/* 2. Job Info Body */}
      <div className="text-sm text-slate-600 space-y-2 flex-grow">
        <p className="italic text-slate-400">"{job.description?.slice(0, 80)}..."</p>
        <div className="pt-2 space-y-1">
          <div><span className="mr-2">📍</span><strong>Location:</strong> {job.location || "—"}</div>
          <div><span className="mr-2">🛠️</span><strong>Skills:</strong> {job.required_skills || "—"}</div>
          <div><span className="mr-2">💼</span><strong>Exp:</strong> {job.experience_required || "—"} yrs</div>
        </div>
      </div>

      {/* 3. Phase 9.2: Interview Link Section */}
      {status === "Shortlisted" && applied && meeting_link && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md animate-pulse border-2">
          <p className="text-[10px] font-bold text-green-800 uppercase flex items-center gap-1">
            🗓️ Interview Link Generated
          </p>
          <Link
            to={`/interview/${meeting_link.split('/').pop()}`}
            className="text-xs text-blue-600 underline break-all font-bold block mt-1 hover:text-blue-800"
          >
            Click here to Join Room
          </Link>
        </div>
      )}

      {/* 4. AI Analysis Section (Phase 8.3) */}
      {applied && (
        <div className="mt-3">
          {status === "Applied" ? (
            // 🔒 LOCKED VIEW (Pending)
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-md flex items-center gap-3 opacity-75">
               <div className="bg-gray-200 p-2 rounded-full text-xs">🔒</div>
               <div>
                 <p className="text-xs font-bold text-gray-600">Analysis Locked</p>
                 <p className="text-[10px] text-gray-500">Result visible after HR review.</p>
               </div>
            </div>
          ) : (
            // 🔓 UNLOCKED VIEW (Shortlisted/Rejected)
            <div className={`p-3 rounded-md border ${
              (ai_score || 0) > 70 ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
            }`}>
               <div className="flex justify-between items-center mb-1">
                 <p className="text-[10px] font-bold uppercase text-slate-700">🤖 AI Match Score:</p>
                 <span className={`text-lg font-black ${
                    (ai_score || 0) > 70 ? "text-green-800" : "text-red-800"
                 }`}>
                   {ai_score || 0}%
                 </span>
               </div>

               {/* 📊 NEW: SKILL GRAPH VISUALIZATION */}
               {ai_graph && (
                 <div className="mt-3 bg-white p-2 rounded border border-gray-100">
                   <p className="text-[10px] font-bold uppercase text-slate-500 mb-2">Skill Gap Analysis</p>

                   {/* Render the bars */}
                   <div className="space-y-2">
                     {/* 1. Matched Skills Bar */}
                     <div>
                       <div className="flex justify-between text-[9px] mb-0.5">
                         <span className="font-bold text-green-700">Matched Skills</span>
                         <span className="text-gray-500">{ai_graph.matched?.length || 0} found</span>
                       </div>
                       <div className="w-full bg-gray-200 rounded-full h-1.5">
                         <div
                           className="bg-green-500 h-1.5 rounded-full"
                           style={{ width: `${ai_score}%` }}
                         ></div>
                       </div>
                       <p className="text-[9px] text-slate-400 mt-0.5 truncate">
                         {ai_graph.matched?.join(", ") || "None"}
                       </p>
                     </div>

                     {/* 2. Missing Skills Bar */}
                     <div>
                       <div className="flex justify-between text-[9px] mb-0.5">
                         <span className="font-bold text-red-700">Missing Skills</span>
                         <span className="text-gray-500">{ai_graph.missing?.length || 0} missing</span>
                       </div>
                       <div className="w-full bg-gray-200 rounded-full h-1.5">
                         <div
                           className="bg-red-500 h-1.5 rounded-full"
                           style={{ width: `${100 - (ai_score || 0)}%` }}
                         ></div>
                       </div>
                       <p className="text-[9px] text-red-400 mt-0.5 font-medium">
                         ⚠️ {ai_graph.missing?.join(", ") || "None"}
                       </p>
                     </div>
                   </div>
                 </div>
               )}

               {/* Feedback Preview */}
               <div className="mt-2 text-[10px] text-slate-600 bg-white/60 p-2 rounded border border-gray-100">
                 <p className="font-bold mb-0.5">💡 Key Feedback:</p>
                 <p className="italic line-clamp-2">
                   "{ai_feedback ? ai_feedback.substring(0, 100) : "Check dashboard for details..."}..."
                 </p>
               </div>
            </div>
          )}
        </div>
      )}

      {/* 5. Footer Action Button */}
      {!applied && (
        <button
          onClick={() => onApply(job.id)}
          className="mt-4 w-full bg-[#021E4C] text-white py-2 rounded-lg font-bold hover:bg-blue-900 transition-colors"
        >
          Apply Now →
        </button>
      )}
    </div>
  );
}