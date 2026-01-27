import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import HRLayout from "../layout/HRLayout";
import EditJobSidebar from "../components/EditJobSidebar";

export default function HRJobList() {
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔍 Search & Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("All");
  const [editingJob, setEditingJob] = useState(null);
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/hr/jobs", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setJobs(data.jobs || []);
      setFilteredJobs(data.jobs || []);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    let result = jobs;
    if (searchTerm) {
      result = result.filter(job =>
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (locationFilter !== "All") {
      result = result.filter(job => job.location === locationFilter);
    }
    setFilteredJobs(result);
  }, [searchTerm, locationFilter, jobs]);

 async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to permanently delete this job?")) return;

    try {
      const res = await fetch(`http://localhost:5000/api/jobs/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      // 🟢 FIX: Check if the deletion was actually successful
      if (res.ok) {
        alert("Job deleted successfully");
        fetchJobs(); // Only refresh if it worked
      } else {
        // If failed, read the error message from backend
        const data = await res.json();
        alert(`Failed to delete: ${data.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Delete failed:", error);
      alert("Network Error: Could not connect to server.");
    }
  }

  const uniqueLocations = ["All", ...new Set(jobs.map(job => job.location))];

  return (
    <HRLayout>
      <div className="p-8 max-w-7xl mx-auto min-h-screen font-sans bg-slate-50/50">

        {/* 1. CLEAN HEADER (No Duplicate Dashboard Stats) */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white text-2xl shadow-lg shadow-blue-200">
               💼
            </div>
            <div>
               <h1 className="text-3xl font-black text-slate-800 tracking-tight">Job Inventory</h1>
               <div className="flex gap-3 text-sm font-medium text-slate-500">
                  <span>Managing <strong>{filteredJobs.length}</strong> active roles</span>
                  <span className="w-px h-4 bg-slate-300"></span>
                  <span><strong>{jobs.reduce((acc, j) => acc + (j.application_count || 0), 0)}</strong> total candidates</span>
               </div>
            </div>
          </div>

          <Link
            to="/hr/create-job"
            className="group bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-bold shadow-xl transition-all flex items-center gap-3 transform hover:-translate-y-1"
          >
            <span>+</span> Post New Job
          </Link>
        </div>

        {/* 2. HERO SEARCH BAR (The Main Focus) */}
        <div className="sticky top-6 z-40 bg-white p-2 rounded-2xl shadow-xl shadow-slate-200/40 border border-slate-100 mb-8 flex flex-col md:flex-row gap-2 items-center">
          <div className="flex-1 w-full relative">
            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 text-xl">🔍</span>
            <input
              type="text"
              placeholder="Search by job title, ID, or keyword..."
              className="w-full pl-14 pr-4 py-3 bg-transparent border-none rounded-xl outline-none font-bold text-slate-700 placeholder:text-slate-400 text-lg"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="w-px h-8 bg-slate-200 hidden md:block"></div>
          <div className="w-full md:w-64 px-2">
            <select
              className="w-full p-3 bg-transparent font-bold text-slate-600 cursor-pointer outline-none hover:text-slate-900 transition rounded-xl"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
            >
              {uniqueLocations.map(loc => (
                <option key={loc} value={loc}>{loc === "All" ? "🌍 All Locations" : `📍 ${loc}`}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 3. THE LIST (Wide Cards) */}
        <div className="space-y-4">
          {loading ? (
             <div className="text-center p-20 text-slate-400 font-medium">Loading inventory...</div>
          ) : filteredJobs.length === 0 ? (
             <div className="p-16 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200">
                <div className="text-4xl mb-4 grayscale opacity-30">📂</div>
                <h3 className="text-slate-900 font-black text-xl">No jobs found</h3>
                <p className="text-slate-500 font-medium">Try clearing your filters.</p>
             </div>
          ) : (
             filteredJobs.map(job => (
                <div key={job.id} className="group relative bg-white rounded-2xl p-1 border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all duration-300">

                   {/* Subtle Left Accent */}
                   <div className="absolute left-0 top-4 bottom-4 w-1 bg-blue-500 rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity"></div>

                   <div className="flex flex-col xl:flex-row items-center gap-6 p-5">

                      {/* A. IDENTITY */}
                      <div className="flex items-center gap-5 w-full xl:w-1/3">
                          <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-2xl font-black text-slate-300 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                             {job.title.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                             <h3 className="text-xl font-bold text-slate-800 group-hover:text-blue-600 transition-colors truncate">{job.title}</h3>
                             <div className="flex items-center gap-3 mt-1 text-xs font-bold text-slate-400">
                                <span>#{job.id}</span>
                                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                <span>{job.location}</span>
                                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center gap-1">
                                   <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> LIVE
                                </span>
                             </div>
                          </div>
                      </div>

                      {/* B. PIPELINE VISUAL (The Centerpiece) */}
                      <div className="flex-1 w-full xl:w-auto xl:px-8 xl:border-l xl:border-r border-slate-100">
                          <div className="flex justify-between items-end mb-2">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pipeline Velocity</span>
                              <div className="flex items-center gap-2">
                                  <div className="flex -space-x-2">
                                      {[...Array(Math.min(3, job.application_count))].map((_, i) => (
                                          <div key={i} className={`w-5 h-5 rounded-full border border-white flex items-center justify-center text-[8px] font-bold text-white
                                            ${i === 0 ? 'bg-blue-500' : i === 1 ? 'bg-indigo-500' : 'bg-purple-500'}`}>
                                              {String.fromCharCode(65 + i)}
                                          </div>
                                      ))}
                                  </div>
                                  <span className="text-slate-800 font-bold text-sm">{job.application_count} Candidates</span>
                              </div>
                          </div>

                          {/* Progress Bar */}
                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden flex">
                             <div className="bg-blue-500 h-full" style={{ width: `${Math.min(60, job.application_count * 5)}%` }}></div>
                             <div className="bg-emerald-400 h-full" style={{ width: `${Math.min(20, job.application_count * 2)}%` }}></div>
                          </div>

                          <div className="flex gap-4 mt-2 text-[10px] font-bold text-slate-400">
                             <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> Applied: {job.application_count}</span>
                             <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Shortlisted: {Math.floor(job.application_count * 0.2)}</span>
                          </div>
                      </div>

                      {/* C. ACTIONS */}
                      <div className="flex items-center gap-3 w-full xl:w-auto justify-end">
                          <button onClick={() => setEditingJob(job)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Edit">✏️</button>
                          <button onClick={() => handleDelete(job.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Delete">🗑️</button>

                          <Link
                            to={`/hr/jobs/${job.id}/applicants`}
                            className="bg-slate-900 text-white hover:bg-blue-600 px-6 py-2.5 rounded-xl font-bold text-xs shadow-lg shadow-slate-200 hover:shadow-blue-200 transition-all transform group-hover:scale-105"
                          >
                            Manage Pipeline →
                          </Link>
                      </div>

                   </div>
                </div>
             ))
          )}
        </div>

        {/* EDIT SIDEBAR */}
        {editingJob && (
          <EditJobSidebar
            job={editingJob}
            open={true}
            onClose={() => setEditingJob(null)}
            onSave={(updated) => {
                setJobs(prev => prev.map(j => j.id === updated.id ? {...j, ...updated} : j));
                setEditingJob(null);
            }}
          />
        )}
      </div>
    </HRLayout>
  );
}