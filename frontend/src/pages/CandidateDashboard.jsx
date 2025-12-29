// src/pages/CandidateDashboard.jsx

import React, { useEffect, useState } from "react";
import PreferenceModal from "../components/PreferenceModal";
import JobCard from "../components/JobCard";
import ApplyModal from "../components/ApplyModal";
import CandidateLayout from "../layout/CandidateLayout";

export default function CandidateDashboard() {
  // ---------------------------
  // Search inputs
  // ---------------------------
  const [role, setRole] = useState("");
  const [location, setLocation] = useState("");

  // ---------------------------
  // Jobs
  // ---------------------------
  const [jobs, setJobs] = useState([]);
  const [filtered, setFiltered] = useState([]);

  // ---------------------------
  // Applied jobs (IMPORTANT)
  // ---------------------------
  const [appliedJobIds, setAppliedJobIds] = useState([]);
  const [loadingApplied, setLoadingApplied] = useState(true);
  const [appsLoaded, setAppsLoaded] = useState(false);
//const [applicationStatusMap, setApplicationStatusMap] = useState({});
const [appliedDateMap, setAppliedDateMap] = useState({});
  // ---------------------------
  // Modals
  // ---------------------------
  const [prefOpen, setPrefOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [applyOpen, setApplyOpen] = useState(false);

  const token = localStorage.getItem("token");
const [statusMap, setStatusMap] = useState({});
const [meetingLinkMap, setMeetingLinkMap] = useState({});
  // =====================================================
  // 1️⃣ Load ALL public jobs
  // =====================================================
useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/jobs", {
           headers: { Authorization: `Bearer ${token}` } // ➕ Auth needed for meeting links [cite: 41]
        });
        const data = await res.json();
        setJobs(data.jobs || []);
        setFiltered(data.jobs || []);
      } catch (err) {
        console.error("Error fetching jobs", err);
      }
    };
    fetchJobs();
  }, [token]);

  // =====================================================
  // 2️⃣ Load applied job IDs ONCE (source of truth)
  // =====================================================
useEffect(() => {
  if (!token) return;

  const loadAppliedJobs = async () => {
    setLoadingApplied(true);

    try {
      const res = await fetch("http://localhost:5000/api/candidate/applications", {
  headers: { Authorization: `Bearer ${token}` },
});

const data = await res.json();

const ids = [];
const statusObj = {};
const dateObj = {};
const linkObj = {};

(data.applications || []).forEach(app => {
  ids.push(Number(app.job_id));
  statusObj[app.job_id] = app.status;
  dateObj[app.job_id] = app.applied_at;
  linkObj[app.job_id] = app.meeting_link;
});

setAppliedJobIds(ids);
setStatusMap(statusObj);
setAppliedDateMap(dateObj);
setMeetingLinkMap(linkObj);
    } catch (err) {
  console.error(err);
  setAppliedJobIds([]);
  setApplicationStatusMap({});
  setAppliedDateMap({});
}
 finally {
      setLoadingApplied(false);
    }
  };
  loadAppliedJobs();
}, [token]);

  // =====================================================
  // 3️⃣ Search logic
  // =====================================================
  const searchJobs = () => {
    const qRole = role.toLowerCase().trim();
    const qLoc = location.toLowerCase().trim();

    const results = jobs.filter((job) => {
      const title = (job.title || "").toLowerCase();
      const skills = (job.required_skills || "").toLowerCase();
      const loc = (job.location || "").toLowerCase();

      const matchRole = qRole
        ? title.includes(qRole) || skills.includes(qRole)
        : true;

      const matchLoc = qLoc ? loc.includes(qLoc) : true;

      return matchRole && matchLoc;
    });

    setFiltered(results);
  };

  // =====================================================
  // UI
  // =====================================================
 // =====================================================
  // UI
  // =====================================================
  return (
    <CandidateLayout>
      <div className="min-h-screen bg-gray-100 text-gray-900">
        {/* HERO */}
        <div className="bg-[#021E4C] text-white py-12 px-6">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <h1 className="text-3xl font-bold">
              Find your next opportunity
            </h1>
            <button
              onClick={() => setPrefOpen(true)}
              className="bg-white text-[#021E4C] px-4 py-2 rounded shadow"
            >
              Preferences
            </button>
          </div>
        </div>

        {/* SEARCH */}
        <div className="py-4 px-6 flex items-center justify-center gap-4 bg-yellow-500">
          <input
            type="text"
            placeholder="Search by skill or keyword"
            className="w-1/3 px-4 py-2 rounded-md bg-white"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          />
          <input
            type="text"
            placeholder="Preferred Location"
            className="w-1/4 px-4 py-2 rounded-md bg-white"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
          <button
            onClick={searchJobs}
            className="px-6 py-2 bg-black text-white rounded-md"
          >
            SEARCH →
          </button>
        </div>

        {/* JOB LIST — Phase 9.1 */}
        <div className="px-10 py-8 max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold mb-4">
            Recommended Jobs
          </h2>

          {filtered.length === 0 ? (
            <p className="text-gray-600">No jobs found.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((job) => {
                // 1. Prepare data variables
                const isApplied = appliedJobIds.includes(Number(job.id));
                const status = statusMap[job.id];
                const appliedAt = appliedDateMap[job.id];

                // 2. Return the card
                return (
                  <JobCard
                    key={job.id}
                    job={job}
                    applied={isApplied}
                    status={status}
                    appliedAt={appliedAt}
                    meeting_link={meetingLinkMap[job.id]}
                    onApply={() => {
                      if (isApplied) return;
                      setSelectedJob(job);
                      setApplyOpen(true);
                    }}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* PREFERENCES */}
        <PreferenceModal
          open={prefOpen}
          onClose={() => setPrefOpen(false)}
          onSaved={() => alert("Preferences saved")}
        />

        {/* APPLY MODAL */}
        {applyOpen && selectedJob && (
          <ApplyModal
            job={selectedJob}
            onClose={() => setApplyOpen(false)}
            onSuccess={(jobId) => {
              setAppliedJobIds((prev) =>
                prev.includes(jobId) ? prev : [...prev, jobId]
              );
              setApplyOpen(false);
            }}
          />
        )}
      </div>
    </CandidateLayout>
  );
}
