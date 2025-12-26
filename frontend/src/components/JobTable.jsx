// src/components/JobTable.jsx
import React from "react";

export default function JobTable({ jobs, onEdit, onDeleted }) {
  const token = localStorage.getItem("token");

  // ----------------------------------
  // Delete job (FETCH)
  // ----------------------------------
  const deleteJob = async (id) => {
    if (!window.confirm("Are you sure you want to delete this job?")) {
      return;
    }

    try {
      const res = await fetch(
        `http://localhost:5000/api/jobs/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        throw new Error("Failed to delete job");
      }

      alert("Job deleted successfully");
      if (onDeleted) onDeleted(id);
    } catch (err) {
      console.error("Delete job error:", err);
      alert("Unable to delete job");
    }
  };

  return (
    <table className="w-full border mt-4">
      <thead>
        <tr className="bg-gray-100">
          <th className="border px-3 py-2">Title</th>
          <th className="border px-3 py-2">Location</th>
          <th className="border px-3 py-2">Experience</th>
          <th className="border px-3 py-2">Status</th>
          <th className="border px-3 py-2">Actions</th>
        </tr>
      </thead>

      <tbody>
        {jobs.length === 0 ? (
          <tr>
            <td
              colSpan="5"
              className="text-center py-4 text-gray-500"
            >
              No jobs found
            </td>
          </tr>
        ) : (
          jobs.map((job) => (
            <tr key={job.id} className="border-t">
              <td className="border px-3 py-2">{job.title}</td>
              <td className="border px-3 py-2">{job.location}</td>
              <td className="border px-3 py-2">
                {job.experience_required}
              </td>
              <td className="border px-3 py-2">
                {job.is_active ? "Active" : "Inactive"}
              </td>
              <td className="border px-3 py-2 space-x-2">
                <button
                  onClick={() => onEdit(job)}
                  className="px-3 py-1 bg-blue-600 text-white rounded"
                >
                  Edit
                </button>

                <button
                  onClick={() => deleteJob(job.id)}
                  className="px-3 py-1 bg-red-600 text-white rounded"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}
