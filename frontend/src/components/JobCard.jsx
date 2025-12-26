// JobCard.jsx
import React from "react";

export default function JobCard({
  job,
  applied,
  status,
  appliedAt,
  loading,
  onApply
}) {
  return (
    <div className="card border-l-4 border-brand-500 hover:-translate-y-1 transition-transform">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            {job.title}
          </h3>

          <p className="text-sm text-slate-600 mt-1">
            {job.description?.slice(0, 120)}
            {job.description?.length > 120 && "…"}
          </p>

          <div className="mt-3 text-sm text-slate-700 space-y-1">
            <div><strong>Location:</strong> {job.location || "—"}</div>
            <div><strong>Skills:</strong> {job.required_skills || "—"}</div>
            <div><strong>Experience:</strong> {job.experience_required || "—"} yrs</div>
          </div>
        </div>

        <div className="ml-4 flex flex-col gap-2 items-end">
          {applied ? (
            <div className="space-y-1 text-right">
              <div
                className={`px-3 py-1 rounded-md text-sm font-medium ${
                  status === "Shortlisted"
                    ? "bg-green-600 text-white"
                    : status === "Rejected"
                    ? "bg-red-600 text-white"
                    : "bg-gray-500 text-white"
                }`}
              >
                {status || "Applied"}
              </div>

              {appliedAt && (
                <div className="text-xs text-slate-500">
                  Applied on {new Date(appliedAt).toLocaleDateString()}
                </div>
              )}
            </div>
          ) : (
            <button
              disabled={loading}
              onClick={() => onApply(job.id)}
              className="px-3 py-1 rounded-md text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              Apply Now
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
