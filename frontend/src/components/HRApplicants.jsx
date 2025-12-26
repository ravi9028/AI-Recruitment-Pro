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
      <h2 className="text-xl font-bold mb-4">Applicants</h2>

      <table className="w-full border">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Resume</th>
            <th>Status</th>
            <th>Applied On</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {loading ? (
            <tr>
              <td colSpan="7" className="text-center py-4">
                Loading applicants...
              </td>
            </tr>
          ) : apps.length === 0 ? (
            <tr>
              <td colSpan="7" className="text-center py-4">
                No applicants found
              </td>
            </tr>
          ) : (
            apps.map((app) => (
              <tr key={app.application_id} className="border-t">
                <td>{app.full_name}</td>
                <td>{app.email}</td>
                <td>{app.phone || "-"}</td>

                <td>
                  {app.resume_url ? (
                    <a
                      href={`http://localhost:5000${app.resume_url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline"
                    >
                      View Resume
                    </a>
                  ) : (
                    "-"
                  )}
                </td>

                <td>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold capitalize ${statusBadge(
                      app.status
                    )}`}
                  >
                    {app.status}
                  </span>
                </td>

                <td>
                  {app.created_at
                    ? new Date(app.created_at).toLocaleDateString()
                    : "-"}
                </td>

                <td className="space-x-2">
                  {app.status?.toLowerCase() === "applied" ? (
                    <>
                      <button
                        onClick={() => updateStatus(app.application_id, "Shortlisted")}
                        className="px-3 py-1 bg-green-600 text-white rounded"
                      >
                        Shortlist
                      </button>

                      <button
                        onClick={() => updateStatus(app.application_id, "Rejected")}
                        className="px-3 py-1 bg-red-600 text-white rounded"
                      >
                        Reject
                      </button>
                    </>
                  ) : (
                    <span className="font-semibold capitalize">
                      {app.status}
                    </span>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
