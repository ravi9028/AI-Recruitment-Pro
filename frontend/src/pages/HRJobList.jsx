// HRJobList.jsx
// Clean Tailwind Table + View Modal + Edit Sidebar

import React, { useEffect, useState } from "react";
import JobDetailsModal from "../components/JobDetailsModal";
import EditJobSidebar from "../components/EditJobSidebar";

export default function HRJobList() {
  const [jobs, setJobs] = useState([]);
  const [editingJob, setEditingJob] = useState(null);
  const [detailsJobId, setDetailsJobId] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const token = localStorage.getItem("token");

  const loadJobs = async () => {
  try {
    const res = await fetch("http://localhost:5000/api/hr/jobs", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      throw new Error("Failed to load jobs");
    }

    const data = await res.json();

    // ✅ SAFE handling (works for both API styles)
    setJobs(data.jobs || data || []);
  } catch (err) {
    console.error("Error loading jobs:", err);
    setJobs([]);
  }
};

  useEffect(() => {
    loadJobs();
  }, []);

  function openDetails(id) {
    setDetailsJobId(id);
    setDetailsOpen(true);
  }

  function closeDetails() {
    setDetailsOpen(false);
    setDetailsJobId(null);
  }

  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to delete this job?")) return;

    try {
      await fetch(`http://localhost:5000/api/jobs/${id}`, {
  method: "DELETE",
  headers: { Authorization: `Bearer ${token}` },
});


      loadJobs();
    } catch (error) {
      console.error("Delete failed:", error);
    }
  }

  async function handleSaveEdit(updatedJob) {
    try {
      await fetch(`http://localhost:5000/api/jobs/${updatedJob.id}`, {
  method: "PUT",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify(updatedJob),
});

      setEditingJob(null);
      await loadJobs();
    } catch (err) {
      console.error("Update failed:", err);
    }
  }

  return (
    <div className="p-6 w-full">
      <h2 className="text-2xl font-semibold mb-6">Job Listings</h2>

      <div className="overflow-x-auto bg-white shadow rounded-xl border">
        <table className="min-w-full text-sm text-left">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="px-6 py-3">Job Title</th>
              <th className="px-6 py-3">Location</th>
              <th className="px-6 py-3">Experience</th>
              <th className="px-6 py-3">Created At</th>
              <th className="px-6 py-3 text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {jobs.map(job => (
              <tr
                key={job.id}
                className="border-b hover:bg-gray-50 transition"
              >
                <td className="px-6 py-4 font-medium">{job.title}</td>
                <td className="px-6 py-4">{job.location}</td>
                <td className="px-6 py-4">{job.experience_required} yrs</td>
                <td className="px-6 py-4">
                  {job.created_at
                    ? new Date(job.created_at).toLocaleDateString()
                    : "-"}
                </td>

               <td className="px-6 py-4 flex gap-3 justify-center">
  <button
    onClick={() => openDetails(job.id)}
    className="px-3 py-1 rounded-lg bg-indigo-600 text-white"
  >
    View
  </button>

  <button
    onClick={() => setEditingJob(job)}
    className="px-3 py-1 rounded-lg bg-blue-600 text-white"
  >
    Edit
  </button>

  <button
    onClick={() => handleDelete(job.id)}
    className="px-3 py-1 rounded-lg bg-red-600 text-white"
  >
    Delete
  </button>

  <button
    onClick={() =>
      window.location.href = `/hr/jobs/${job.id}/applicants`
    }
    className="px-3 py-1 rounded-lg bg-emerald-600 text-white"
  >
    View Applicants
  </button>
</td>
              </tr>
            ))}

            {jobs.length === 0 && (
              <tr>
                <td
                  colSpan="5"
                  className="px-6 py-6 text-center text-gray-500"
                >
                  No jobs found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* View Modal */}
      <JobDetailsModal
        jobId={detailsJobId}
        open={detailsOpen}
        onClose={closeDetails}
      />

      {/* Edit Sidebar */}
      {editingJob && (
        <EditJobSidebar
          job={editingJob}
          open={true}
          onClose={() => setEditingJob(null)}
          onSave={handleSaveEdit}
        />
      )}
    </div>
  );
}
