import React, { useEffect, useState } from "react";
import HRLayout from "../layout/HRLayout";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area,
  ScatterChart, Scatter, ZAxis, ReferenceLine, Label
} from 'recharts';

export default function HRAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState("all"); // "all" or specific ID
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");

  // 1. Fetch Job List for Dropdown
  useEffect(() => {
    fetch("http://localhost:5000/api/hr/jobs", {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => setJobs(data.jobs || []))
    .catch(err => console.error("Failed to load jobs", err));
  }, []);

  // 2. Fetch Analytics (Depends on Selected Job)
  useEffect(() => {
    setLoading(true);
    const url = selectedJob === "all"
      ? "http://localhost:5000/api/hr/analytics"
      : `http://localhost:5000/api/hr/analytics?job_id=${selectedJob}`;

    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        // Safe defaults to prevent crash if backend returns nulls
        const safeData = {
            ...data,
            total: data.total || 0,
            avg_score: data.avg_score || 0,
            avg_trust: data.avg_trust || 0,
            funnel: data.funnel || [],
            sentiment: data.sentiment || [],
            skills_gap: data.skills_gap || []
        };
        setAnalytics(safeData);
        setLoading(false);
      })
      .catch(err => console.error("Analytics Error", err));
  }, [selectedJob]);

  // Loading State
  if (loading || !analytics) return (
      <HRLayout>
          <div className="flex items-center justify-center min-h-screen bg-slate-50">
              <div className="text-center">
                  <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-slate-400 font-bold animate-pulse">Analyzing Recruitment Data...</p>
              </div>
          </div>
      </HRLayout>
  );
// 🎨 CUSTOM AVATAR COMPONENT
// This turns a boring dot into a "User Bubble" with initials
const CustomAvatarNode = (props) => {
  const { cx, cy, payload } = props;

  // Logic to determine color based on Quadrant
  let fillColor = "#94a3b8"; // Default Gray
  let strokeColor = "#64748b";

  if (payload.x >= 70 && payload.y >= 70) {
      fillColor = "#10b981"; // Emerald (Star)
      strokeColor = "#059669";
  } else if (payload.x < 50 && payload.y >= 70) {
      fillColor = "#ef4444"; // Red (Risky)
      strokeColor = "#b91c1c";
  } else if (payload.x >= 70 && payload.y < 50) {
      fillColor = "#3b82f6"; // Blue (Junior)
      strokeColor = "#2563eb";
  }

  return (
    <g transform={`translate(${cx},${cy})`}>
      {/* The Bubble */}
      <circle
        cx="0"
        cy="0"
        r="14"
        fill={fillColor}
        stroke="white"
        strokeWidth="2"
        className="drop-shadow-md hover:scale-125 transition-transform duration-300 cursor-pointer"
      />
      {/* The Initial */}
      <text
        x="0"
        y="4"
        textAnchor="middle"
        fill="white"
        fontSize="10px"
        fontWeight="bold"
        pointerEvents="none"
      >
        {payload.name ? payload.name.charAt(0).toUpperCase() : "?"}
      </text>
    </g>
  );
};
  return (
    <HRLayout>
      <div className="p-8 max-w-7xl mx-auto min-h-screen bg-slate-50 font-sans">

        {/* HEADER & FILTER */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Talent Intelligence 📊</h1>
            <p className="text-slate-500 mt-1 font-medium">Real-time recruitment insights & AI trends.</p>
          </div>

          {/* 🟢 JOB SELECTOR DROPDOWN */}
          <div className="relative group">
            <select
              value={selectedJob}
              onChange={(e) => setSelectedJob(e.target.value)}
              className="appearance-none bg-white border border-slate-200 text-slate-700 py-3 pl-4 pr-12 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm cursor-pointer hover:border-blue-400 transition"
            >
              <option value="all">🌍 Global Report (All Jobs)</option>
              {jobs.map(job => (
                <option key={job.id} value={job.id}>{job.title}</option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-blue-500 transition">▼</div>
          </div>
        </div>

        {/* 1. KEY METRICS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Card 1: Total Volume */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between hover:shadow-md transition">
             <div>
               <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Candidates</p>
               <h3 className="text-4xl font-black text-slate-800 mt-1">{analytics.total}</h3>
             </div>
             <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-xl">👥</div>
          </div>

          {/* Card 2: AI Quality */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between hover:shadow-md transition">
             <div>
               <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Avg Match Score</p>
               <h3 className={`text-4xl font-black mt-1 ${analytics.avg_score > 70 ? 'text-emerald-600' : 'text-yellow-500'}`}>
                 {analytics.avg_score}%
               </h3>
             </div>
             <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center text-xl">⚡</div>
          </div>

          {/* Card 3: Integrity */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between hover:shadow-md transition">
             <div>
               <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Integrity Rate</p>
               <h3 className="text-4xl font-black text-slate-800 mt-1">{analytics.avg_trust}%</h3>
             </div>
             <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center text-xl">🛡️</div>
          </div>
        </div>

        {/* 2. MAIN GRAPHS ROW */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">

          {/* GRAPH A: Hiring Funnel (Bar Chart) */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <h4 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                <span>🧬</span> Hiring Pipeline Funnel
            </h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.funnel} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={80} tick={{fontSize: 11, fontWeight: 'bold', fill: '#64748b'}} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                  <Bar dataKey="value" barSize={24} radius={[0, 10, 10, 0]} animationDuration={1000} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* GRAPH B: Sentiment Distribution (Donut Chart) */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col">
            <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                <span>🎭</span> Video Interview Sentiment
            </h4>
            <p className="text-xs text-slate-400 font-medium mb-4">AI analysis of candidate confidence & tone.</p>
            <div className="h-64 flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.sentiment}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {analytics.sentiment.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Custom Legend */}
            <div className="flex justify-center gap-6 mt-2">
              {analytics.sentiment.map(item => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{backgroundColor: item.fill}}></div>
                  <span className="text-xs font-bold text-slate-600">{item.name} ({item.value})</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* 3. THE TALENT MATRIX (Scatter Plot) */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <div>
               <h4 className="font-bold text-slate-800 flex items-center gap-2">
                   <span>🎯</span> The Talent Matrix
               </h4>
               <p className="text-sm text-slate-500 mt-1">
                 Performance vs. Integrity Correlation. Identify <strong>High-Trust Top Performers</strong> instantly.
               </p>
            </div>
            {/* Legend */}
            <div className="flex gap-4 text-[10px] font-bold uppercase tracking-wider">
                <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-emerald-500"></span> Star Candidate</div>
                <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-400"></span> Risky</div>
            </div>
          </div>

          <div className="h-80 w-full">
             <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />

                  {/* X Axis = Trust Score */}
                  <XAxis type="number" dataKey="x" name="Trust Score" unit="%" domain={[0, 100]}>
                      <Label value="Integrity / Trust Score" offset={0} position="insideBottom" style={{fontSize: '12px', fill: '#94a3b8', fontWeight: 'bold'}} />
                  </XAxis>

                  {/* Y Axis = AI Skill Score */}
                  <YAxis type="number" dataKey="y" name="AI Score" unit="%" domain={[0, 100]}>
                      <Label value="AI Skill Match" angle={-90} position="insideLeft" style={{fontSize: '12px', fill: '#94a3b8', fontWeight: 'bold'}} />
                  </YAxis>

                  <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-800 text-white p-3 rounded-lg shadow-xl text-xs">
                            <p className="font-bold text-sm mb-1">{data.name}</p>
                            <p>✨ Skill Match: <span className="font-bold text-emerald-400">{data.y}%</span></p>
                            <p>🛡️ Trust Score: <span className="font-bold text-blue-400">{data.x}%</span></p>
                            <p className="mt-1 opacity-70 italic">{data.status}</p>
                          </div>
                        );
                      }
                      return null;
                  }} />

                  {/* The Quadrant Lines */}
                  <ReferenceLine x={50} stroke="#cbd5e1" strokeDasharray="3 3" />
                  <ReferenceLine y={50} stroke="#cbd5e1" strokeDasharray="3 3" />

                  {/* The Dots */}
                  {/* 🟢 NEW: Uses the Custom Avatar Node defined above */}
                  <Scatter
                      name="Candidates"
                      data={analytics.matrix || []}
                      shape={<CustomAvatarNode />}
                  />

                </ScatterChart>
             </ResponsiveContainer>
          </div>
        </div>
      </div>
    </HRLayout>
  );
}