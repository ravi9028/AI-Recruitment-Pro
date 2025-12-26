// src/components/JobDetailsModal.jsx
import React, { useEffect, useState } from "react";

export default function JobDetailsModal({ jobId, open, onClose }) {
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ----------------------------------
  // Load job details (FETCH)
  // ----------------------------------
  useEffect(() => {
  if (!open || !jobId) return;

  const token = localStorage.getItem("token");

  const loadJobDetails = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        `http://localhost:5000/api/jobs/${jobId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`, // ✅ FIX
          },
        }
      );

      if (!res.ok) {
        throw new Error("Failed to load job details");
      }

      const data = await res.json();
      setJob(data.job || data);
    } catch (err) {
      console.error("Job details error:", err);
      setError("Unable to load job details");
      setJob(null);
    } finally {
      setLoading(false);
    }
  };

  loadJobDetails();
}, [jobId, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white w-full max-w-2xl rounded-lg shadow-lg p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-600"
        >
          ✖
        </button>

        {loading && (
          <div className="text-center py-6">Loading job details...</div>
        )}

        {error && (
          <div className="text-center text-red-600 py-6">{error}</div>
        )}

        {!loading && !error && job && (
          <>
            <h2 className="text-2xl font-bold mb-2">
              {job.title}
            </h2>

            <p className="text-gray-600 mb-4">
              {job.location} · {job.experience_required}
            </p>

            <div className="mb-4">
              <h4 className="font-semibold mb-1">Description</h4>
              <p className="text-gray-800 whitespace-pre-line">
                {job.description || "-"}
              </p>
            </div>

            <div className="mb-4">
              <h4 className="font-semibold mb-1">Required Skills</h4>
              <p className="text-gray-800">
                {job.required_skills || "-"}
              </p>
            </div>

            {job.jd_file_url && (
              <div className="mt-4">
                <a
                  href={`http://localhost:5000${job.jd_file_url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline"
                >
                  View Job Description (JD)
                </a>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
