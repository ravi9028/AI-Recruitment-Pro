import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import HRLayout from "../layout/HRLayout";

export default function HRDashboard() {
  const [stats, setStats] = useState({
    openPositions: 0,
    totalApplications: 0,
    shortlisted: 0
  });
  const [recentJobs, setRecentJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/hr/jobs", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (res.ok) {
        // Calculate Stats
        const jobs = data.jobs || [];
        const openPos = jobs.length;
        // Mocking application counts since API returns aggregate
        const totalApps = jobs.reduce((sum, job) => sum + (job.application_count || 0), 0);

        setStats({
            openPositions: openPos,
            totalApplications: totalApps,
            shortlisted: Math.floor(totalApps * 0.2) // Mock estimation for visual
        });

        // Take only top 4 active jobs for the "Grid" to avoid clutter
        setRecentJobs(jobs.slice(0, 4));
      }
    } catch (err) {
      console.error("Dashboard Load Error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <HRLayout>
      <div className="p-8 max-w-7xl mx-auto min-h-screen bg-slate-50/50 font-sans">

        {/* 1. HERO SECTION */}
        <div className="mb-8">
            <h1 className="text-2xl font-black text-slate-800">Dashboard</h1>
            <p className="text-slate-500 text-sm font-medium">Overview of your recruitment pipeline.</p>
        </div>

        {/* 2. HIGH LEVEL STATS WIDGETS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {/* Stat 1 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition">
                <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Open Roles</p>
                    <h2 className="text-4xl font-black text-slate-800 mt-2">{stats.openPositions}</h2>
                    <div className="flex items-center gap-2 mt-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span className="text-xs font-bold text-emerald-600">Actively Hiring</span>
                    </div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-2xl">💼</div>
            </div>

            {/* Stat 2 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition">
                <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Candidates</p>
                    <h2 className="text-4xl font-black text-slate-800 mt-2">{stats.totalApplications}</h2>
                     <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs font-bold text-blue-600">↗ 12% Growth</span>
                        <span className="text-xs text-slate-400">vs last week</span>
                    </div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-2xl">👥</div>
            </div>

            {/* Stat 3 (Dark AI Status) */}
            <div className="bg-slate-900 p-6 rounded-2xl shadow-lg flex items-center justify-between text-white relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-blue-500/30 transition"></div>
                <div className="relative z-10">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">AI Engine</p>
                    <h2 className="text-xl font-black mt-2">Online & Active</h2>
                    <p className="text-xs text-slate-400 mt-1">Parsing resumes in real-time</p>
                </div>
                <div className="relative z-10 w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-2xl animate-bounce-slow">🤖</div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* 3. MAIN SECTION: PRIORITY JOBS (GRID VIEW) */}
            {/* This is the KEY FIX: Changed from List to Grid Cards */}
            <div className="lg:col-span-2 space-y-6">
                <div className="flex justify-between items-end">
                    <div>
                        <h3 className="text-lg font-black text-slate-800">Priority Jobs</h3>
                        <p className="text-xs text-slate-500 font-medium">Roles requiring immediate attention.</p>
                    </div>
                    <Link to="/hr/jobs" className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline">View Inventory →</Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {loading ? (
                        <p className="text-sm text-slate-400">Loading pipeline...</p>
                    ) : recentJobs.map((job) => (
                        <div key={job.id} className="group bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:border-blue-100 transition-all duration-300 relative overflow-hidden">

                            {/* Gradient Line on Hover */}
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h4 className="font-bold text-slate-800 text-lg group-hover:text-blue-600 transition-colors truncate max-w-[150px]">{job.title}</h4>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-wide">📍 {job.location}</p>
                                </div>
                                <div className="bg-emerald-50 text-emerald-600 text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-wide border border-emerald-100">
                                    Active
                                </div>
                            </div>

                            {/* Mini Pipeline Visual - Makes it look like a Dashboard, not a list */}
                            <div className="space-y-3 mb-6">
                                <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
                                    <span>Pipeline</span>
                                    <span>{job.application_count || 0} Candidates</span>
                                </div>
                                <div className="flex gap-1 h-2 w-full rounded-full overflow-hidden bg-slate-100">
                                    {/* Applied Bar */}
                                    <div className="bg-blue-500 h-full" style={{width: '60%'}}></div>
                                    {/* Shortlisted Bar (Mock) */}
                                    <div className="bg-emerald-400 h-full" style={{width: '20%'}}></div>
                                </div>
                                <div className="flex justify-between text-[10px] font-medium text-slate-400">
                                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> Applied</span>
                                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Shortlisted</span>
                                </div>
                            </div>

                            {/* Action Area */}
                            <div className="flex items-center justify-between border-t border-slate-50 pt-4">
                                {/* Avatars overlap */}
                                <div className="flex -space-x-2">
                                    {[1,2,3].map(i => (
                                        <div key={i} className="w-7 h-7 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[8px] font-bold text-slate-400">
                                            ?
                                        </div>
                                    ))}
                                </div>
                                <Link to={`/hr/jobs/${job.id}/applicants`} className="text-xs font-bold text-slate-600 bg-slate-50 hover:bg-slate-900 hover:text-white px-4 py-2 rounded-lg transition-all">
                                    Manage
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 4. RIGHT SIDEBAR: ACTIVITY & ALERTS */}
            <div className="space-y-6">

                {/* Simulated Recent Applicants Feed */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <span>⚡</span> Recent Activity
                    </h3>
                    <div className="relative border-l-2 border-slate-100 ml-3 space-y-6">

                        {/* Timeline Item 1 */}
                        <div className="relative pl-6">
                            <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-white border-2 border-blue-500"></div>
                            <p className="text-[10px] text-slate-400 font-bold mb-0.5">2 mins ago</p>
                            <p className="text-xs text-slate-700 font-medium">
                                New application for <span className="font-bold text-slate-900">Python Dev</span>
                            </p>
                        </div>

                         {/* Timeline Item 2 */}
                        <div className="relative pl-6">
                            <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-white border-2 border-emerald-500"></div>
                            <p className="text-[10px] text-slate-400 font-bold mb-0.5">1 hour ago</p>
                            <p className="text-xs text-slate-700 font-medium">
                                <span className="font-bold text-slate-900">Suresh Kumar</span> was shortlisted by AI.
                            </p>
                        </div>

                         {/* Timeline Item 3 */}
                        <div className="relative pl-6">
                            <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-white border-2 border-purple-500"></div>
                            <p className="text-[10px] text-slate-400 font-bold mb-0.5">3 hours ago</p>
                            <p className="text-xs text-slate-700 font-medium">
                                AI System finished ranking candidates for <span className="font-bold text-slate-900">React Dev</span>.
                            </p>
                        </div>

                    </div>
                    <button className="w-full mt-6 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-lg transition">View All Activity</button>
                </div>

                {/* Quick Actions Card */}
                <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-6 rounded-2xl shadow-lg text-white">
                    <h3 className="font-bold text-lg mb-2">Quick Actions</h3>
                    <p className="text-blue-100 text-xs mb-4">Shortcuts for common tasks.</p>

                    <div className="space-y-2">
                        <Link to="/hr/jobs" className="block w-full text-center py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg text-xs font-bold transition">
                            + Post New Job
                        </Link>
                    </div>
                </div>

            </div>
        </div>

      </div>
    </HRLayout>
  );
}