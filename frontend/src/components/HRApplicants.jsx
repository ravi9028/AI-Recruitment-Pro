import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

export default function HRApplicants() {
  const { jobId } = useParams();
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  // ----------------------------------
  // Load applicants
  // ----------------------------------
  useEffect(() => {
    const loadApplicants = async () => {
      try {
        const res = await fetch(
          `http://localhost:5000/api/hr/jobs/${jobId}/applications`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) {
          throw new Error("Failed to load applicants");
        }

        const data = await res.json();
        setApps(data.applications || []);
      } catch (err) {
        console.error("Failed to load applicants", err);
        setApps([]);
      } finally {
        setLoading(false);
      }
    };

    if (token && jobId) {
      loadApplicants();
    }
  }, [jobId, token]);

  // ----------------------------------
  // Update application status
  // ----------------------------------
  const updateStatus = async (id, status) => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/hr/applications/${id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        }
      );

      if (!res.ok) {
        throw new Error("Status update failed");
      }
      const result = await res.json(); // ➕ Add this to capture the new meeting_link

      // Optimistic UI update
      setApps((prev) =>
       prev.map((a) =>
  a.application_id === id ? { ...a, status } : a
)
      );
    } catch (err) {
      console.error("Failed to update status", err);
      alert("Failed to update status");
    }
  };

  // ----------------------------------
  // Status badge color
  // ----------------------------------
  const statusBadge = (status) => {
    switch (status) {
  case "Applied":
    return "bg-yellow-100 text-yellow-800";
  case "Shortlisted":
    return "bg-green-100 text-green-800";
  case "Rejected":
    return "bg-red-100 text-red-800";
  default:
    return "bg-gray-100 text-gray-800";
}
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Applicants for Job ID: {jobId}</h2>

      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full table-auto">
          {/* Header Section (Line 100) */}
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-left">Email</th>
              <th className="px-4 py-2 text-left">Phone</th>
              <th className="px-4 py-2 text-left">Resume</th>
              {/* Phase 8.2: AI Assessment Header */}
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">AI & Proctoring Analysis</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Applied On</th>
              <th className="px-4 py-2 text-left">Action</th>
            </tr>
          </thead>

          {/* Body Section (Line 115) */}
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" className="text-center py-4 text-gray-500">Loading applicants...</td>
              </tr>
            ) : apps.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center py-4 text-gray-500">No applicants found</td>
              </tr>
            ) : (
              apps.map((app) => (
                <tr key={app.application_id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-2">
  <div className="flex flex-col">
    <div className="flex items-center gap-2">
      <span className="font-medium text-gray-900">{app.full_name}</span>
      {/* 🛡️ Phase 9.3: Proctoring Badge */}
      {app.feedback && app.feedback.includes("🚩") && (
        <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-[10px] font-bold border border-red-200 animate-pulse">
          ⚠️ PROCTORING ALERT
        </span>
      )}
    </div>
  </div>
</td>
                  <td className="px-4 py-2">{app.email}</td>
                  <td className="px-4 py-2">{app.phone || "-"}</td>

                  {/* Resume Column */}
                  <td className="px-4 py-2">
                    {app.resume_url ? (
                      <a
                        href={`http://localhost:5000${app.resume_url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline text-sm"
                      >
                        View Resume
                      </a>
                    ) : "-"}
                  </td>

                  {/* ➕ AI Assessment Column (Phase 8.2) */}
                  <td className="px-4 py-2">
                    <div className="flex flex-col">
                      <span className={`text-sm font-bold ${app.score > 70 ? 'text-green-600' : 'text-orange-600'}`}>
                        {app.score !== null && app.score !== undefined ? `${app.score}% Match` : "0% Match"}
                      </span>
                      <p className="text-[10px] text-gray-500 italic truncate w-32" title={app.feedback}>
                        {app.feedback || "Analysis Pending..."}
                      </p>
                      {/* 🛡️ Phase 9.3: Detailed Proctoring Log */}
{app.feedback && app.feedback.includes("🚩") && (
  <div className="mt-2 p-2 bg-red-50 border-l-2 border-red-400 rounded text-[9px] text-red-800 leading-tight">
    <p className="font-bold uppercase mb-1">Security Incidents:</p>
    {app.feedback.split('\n').filter(line => line.includes("🚩")).map((incident, idx) => (
      <div key={idx}>{incident}</div>
    ))}
  </div>
)}
                    </div>
                  </td>

                  {/* Status Column */}
                  <td className="px-4 py-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${statusBadge(app.status)}`}>
                      {app.status}
                    </span>
                  </td>

                  {/* Applied Date */}
                  <td className="px-4 py-2 text-sm">
                    {app.created_at ? new Date(app.created_at).toLocaleDateString() : "-"}
                  </td>

                  {/* Action Buttons */}
                  <td className="px-4 py-2 space-x-2">
                    {app.status?.toLowerCase() === "applied" ? (
                      <>
                        <button
                          onClick={() => updateStatus(app.application_id, "Shortlisted")}
                          className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                        >
                          Shortlist
                        </button>
                        <button
                          onClick={() => updateStatus(app.application_id, "Rejected")}
                          className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                        >
                          Reject
                        </button>
                      </>
                    ) : (
                      <span className="text-sm font-medium text-gray-600">{app.status}</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}