import React, { useState, useEffect } from "react";
import axios from "axios";
import JobDetailsModal from "../components/JobDetailsModal";

export default function JobsPublic() {
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);

  useEffect(() => {
  fetch("http://localhost:5000/api/jobs")
    .then(res => res.json())
    .then(data => setJobs(data.jobs || []))
    .catch(console.error);
}, []);


  return (
    <div className="p-10 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Available Jobs</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {jobs.map(job => (
          <div
            key={job.id}
            className="bg-white shadow p-5 rounded-lg cursor-pointer hover:shadow-lg transition"
            onClick={() => setSelectedJob(job)}
          >
            <h2 className="text-xl font-semibold">{job.title}</h2>
            <p className="text-gray-600 mt-2">{job.location}</p>
            <p className="text-sm text-gray-500 mt-1">
              Experience: {job.experience_required} yrs
            </p>
          </div>
        ))}
      </div>

      {selectedJob && (
        <JobDetailsModal
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
        />
      )}
    </div>
  );
}
