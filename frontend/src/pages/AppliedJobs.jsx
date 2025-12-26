import React, { useEffect, useState } from "react";
import axios from "axios";
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

  loadApplications();
}, []);


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
              <td className="p-2 border font-semibold">{a.status}</td>
              <td className="p-2 border">
  {a.applied_at
    ? new Date(a.applied_at).toLocaleString()
    : "—"}
</td>

            </tr>
          ))}
        </tbody>
      </table>
    </div>
    </CandidateLayout>
  );
}
