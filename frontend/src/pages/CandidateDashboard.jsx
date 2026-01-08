// src/pages/CandidateDashboard.jsx

import React, { useEffect, useState } from "react";
import PreferenceModal from "../components/PreferenceModal";
import JobCard from "../components/JobCard";
import ApplyModal from "../components/ApplyModal";
import CandidateLayout from "../layout/CandidateLayout";
import SkeletonJobCard from "../components/SkeletonJobCard";

// --- 🔔 REUSABLE TOAST COMPONENT ---
const Toast = ({ message, type, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const bgColors = {
        success: "bg-emerald-600",
        error: "bg-red-500",
        info: "bg-blue-600"
    };

    return (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl text-white transform transition-all animate-slide-in ${bgColors[type] || bgColors.info}`}>
            <span className="text-xl">
                {type === "success" ? "✅" : type === "error" ? "⚠️" : "ℹ️"}
            </span>
            <div>
                <h4 className="font-bold text-sm uppercase tracking-wider opacity-90">{type}</h4>
                <p className="font-medium text-sm">{message}</p>
            </div>
            <button onClick={onClose} className="ml-4 opacity-50 hover:opacity-100 text-xl">×</button>
        </div>
    );
};

export default function CandidateDashboard() {
  const [role, setRole] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(true);

  // Jobs Data
  const [jobs, setJobs] = useState([]);
  const [filtered, setFiltered] = useState([]);

  // Application Data
  const [appliedJobIds, setAppliedJobIds] = useState([]);
  const [loadingApplied, setLoadingApplied] = useState(true);

  // Data Maps
  const [graphMap, setGraphMap] = useState({});
  const [appliedDateMap, setAppliedDateMap] = useState({});
  const [statusMap, setStatusMap] = useState({});
  const [meetingLinkMap, setMeetingLinkMap] = useState({});
  const [scoreMap, setScoreMap] = useState({});
  const [feedbackMap, setFeedbackMap] = useState({});

  // Modals & Toasts
  const [prefOpen, setPrefOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [applyOpen, setApplyOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const token = localStorage.getItem("token");

  const showToast = (message, type = "success") => {
      setToast({ message, type });
  };

  // 1️⃣ Load ALL public jobs
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/jobs", {
           headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setJobs(data.jobs || []);
        // Don't set filtered here immediately, allow the useEffect hook below to handle it
      } catch (err) {
        console.error("Error fetching jobs", err);
        showToast("Could not load jobs", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, [token]);

  // 2️⃣ Load applied job IDs
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
        const scoreObj = {};
        const feedbackObj = {};
        const graphObj = {};

        (data.applications || []).forEach(app => {
          ids.push(Number(app.job_id));
          statusObj[app.job_id] = app.status; // "Applied", "Shortlisted", "Rejected"
          dateObj[app.job_id] = app.applied_at;
          linkObj[app.job_id] = app.meeting_link;
          scoreObj[app.job_id] = app.score;
          feedbackObj[app.job_id] = app.feedback;
          graphObj[app.job_id] = app.graph_data;
        });

        setAppliedJobIds(ids);
        setStatusMap(statusObj);
        setAppliedDateMap(dateObj);
        setMeetingLinkMap(linkObj);
        setScoreMap(scoreObj);
        setFeedbackMap(feedbackObj);
        setGraphMap(graphObj);
      } catch (err) { console.error(err); } finally { setLoadingApplied(false); }
    };
    loadAppliedJobs();
  }, [token]);

  // 3️⃣ UNIFIED FILTER LOGIC (Search Only)
  useEffect(() => {
      const qRole = role.toLowerCase().trim();
      const qLoc = location.toLowerCase().trim();

      const results = jobs.filter((job) => {
        // Keyword Search
        const title = (job.title || "").toLowerCase();
        const skills = (job.required_skills || "").toLowerCase();
        const loc = (job.location || "").toLowerCase();
        return (qRole ? title.includes(qRole) || skills.includes(qRole) : true) &&
               (qLoc ? loc.includes(qLoc) : true);
      });

      setFiltered(results);
  }, [jobs, role, location]);


  return (
    <CandidateLayout>
      <div className="min-h-screen pb-12 bg-slate-100 font-sans">

        {/* 🔔 TOAST */}
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

        {/* HEADER */}
        <div className="bg-[#0f172a] border-b border-slate-800 px-8 py-12 mb-8 shadow-md">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-3">
              Find your next opportunity.
            </h1>
            <p className="text-slate-400 mb-8 text-lg font-medium">
              Browse roles tailored to your skills and experience.
            </p>

            {/* SEARCH BAR */}
            <div className="bg-white p-2 rounded-lg flex flex-col md:flex-row gap-2 shadow-xl max-w-4xl">
               <div className="flex-1 flex items-center px-4 bg-white rounded border border-slate-200 focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600 transition">
                  <span className="text-slate-400 mr-3">🔍</span>
                  <input
                    type="text"
                    placeholder="Job title, keywords..."
                    className="w-full py-3 outline-none text-sm font-semibold text-slate-800 placeholder-slate-400"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                  />
               </div>
               <div className="flex-1 flex items-center px-4 bg-white rounded border border-slate-200 focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600 transition">
                  <span className="text-slate-400 mr-3">📍</span>
                  <input
                    type="text"
                    placeholder="City, State..."
                    className="w-full py-3 outline-none text-sm font-semibold text-slate-800 placeholder-slate-400"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
               </div>
               {/* Search is now automatic via useEffect, but button forces focus out */}
               <button className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded transition shadow-sm pointer-events-none">
                  Search
               </button>
            </div>

            {/* SEARCH PRESETS (Kept these as they are helpful for search) */}
            <div className="mt-6 flex gap-4 text-sm text-slate-400">
               <span className="font-medium text-slate-500">Popular:</span>
               <button onClick={() => setRole("Remote")} className="hover:text-white transition underline decoration-slate-600 underline-offset-4">Remote</button>
               <button onClick={() => setRole("Engineer")} className="hover:text-white transition underline decoration-slate-600 underline-offset-4">Engineer</button>
               <button onClick={() => setRole("Manager")} className="hover:text-white transition underline decoration-slate-600 underline-offset-4">Manager</button>
            </div>

          </div>
        </div>

        {/* JOB GRID */}
        <div className="px-8 max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
             <h2 className="text-xl font-bold text-slate-800">Latest Openings</h2>
             <span className="text-sm font-medium text-slate-500">{filtered.length} jobs found</span>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => <SkeletonJobCard key={i} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="text-4xl mb-4">🔍</div>
              <p className="text-slate-800 font-bold">No jobs found.</p>
              <button onClick={() => {setRole(""); setLocation("");}} className="mt-4 text-blue-600 font-bold hover:underline">Clear Filters</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((job) => {
                const isApplied = appliedJobIds.includes(Number(job.id));
                const status = statusMap[job.id];
                const appliedAt = appliedDateMap[job.id];

                return (
                  <div key={job.id} className="relative group">
                      <JobCard
                        job={job}
                        applied={isApplied}
                        status={status}
                        appliedAt={appliedAt}
                        meeting_link={meetingLinkMap[job.id]}
                        ai_score={scoreMap[job.id]}
                        ai_feedback={feedbackMap[job.id]}
                        ai_graph={graphMap[job.id]}
                        onApply={() => {
                          if (isApplied) return;
                          setSelectedJob(job);
                          setApplyOpen(true);
                        }}
                      />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* MODALS */}
        <PreferenceModal
            open={prefOpen}
            onClose={() => setPrefOpen(false)}
            onSaved={() => showToast("Preferences updated successfully!", "success")}
        />

        {applyOpen && selectedJob && (
          <ApplyModal
            job={selectedJob}
            onClose={() => setApplyOpen(false)}
            onSuccess={(jobId) => {
              setAppliedJobIds((prev) => prev.includes(jobId) ? prev : [...prev, jobId]);
              setApplyOpen(false);
              showToast("Application Submitted Successfully! Good Luck!", "success");
            }}
          />
        )}
      </div>
    </CandidateLayout>
  );
}