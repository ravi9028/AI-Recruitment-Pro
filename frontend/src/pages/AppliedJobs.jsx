import React, { useEffect, useState } from "react";
// axios is imported but not used, we are using fetch
import CandidateLayout from "../layout/CandidateLayout";

export default function AppliedJobs() {
  const [apps, setApps] = useState([]);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const loadApplications = async () => {
      try {
        const res = await fetch(
          "http://localhost:5000/api/candidate/applications",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) throw new Error("Failed to load applications");

        const data = await res.json();
        setApps(data.applications || []);
      } catch (err) {
        console.error(err);
      }
    };

    if (token) loadApplications(); // Added a check for token
  }, [token]);

  // Helper function placed correctly inside the component
  const getStatusStyles = (status) => {
    switch (status) {
      case "Shortlisted":
        return "bg-green-100 text-green-800 border-green-200";
      case "Rejected":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-blue-100 text-blue-800 border-blue-200";
    }
  };

  return (
    <CandidateLayout>
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4">My Applications</h2>

        <table className="w-full border">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border">Job Title</th>
              <th className="p-2 border">Location</th>
              <th className="p-2 border">Status</th>
              <th className="p-2 border">Applied On</th>
            </tr>
          </thead>
          <tbody>
            {apps.map((a) => (
              <tr key={a.id}>
                <td className="p-2 border">{a.title}</td>
                <td className="p-2 border">{a.location}</td>

                {/* Fixed the <td> structure here */}
                <td className="p-2 border text-center">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusStyles(a.status)}`}>
                    {a.status}
                  </span>
                </td>

                <td className="p-2 border">
                  {a.applied_at ? new Date(a.applied_at).toLocaleString() : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </CandidateLayout>
  );
}