// JobCard.jsx
import { Link } from "react-router-dom";
import React from "react";

export default function JobCard({
  job,
  applied,
  status,
  appliedAt,
  loading,
  meeting_link, // ➕ ADD THIS EXACT NAME HERE
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

      {/* 3. Phase 9.2: Interview Link Section (FIXED PLACEMENT) */}
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

      {/* 4. AI Result Section */}
      {applied && (status === "Shortlisted" || status === "Rejected") && (
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
           <p className="text-[10px] font-bold text-blue-800 uppercase">🤖 AI Analysis Result:</p>
           <p className="text-xs text-slate-700 mt-1">
             Match Score: <span className="font-bold text-blue-900">Calculated</span>
           </p>
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