import React, { useState, useEffect } from "react";
import HRLayout from "../layout/HRLayout";

export default function HRAnalytics() {
  // 🗓️ TIME STATE
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth()); // 0 = Jan
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [downloading, setDownloading] = useState(false);

  // 🔄 MOCK DATA
  const [stats, setStats] = useState({
    hires: 12,
    acceptance: 88,
    resumes: 320,
    savings: 0 // Will calculate this
  });

  const [trendPoints, setTrendPoints] = useState("");

  // Update data when Month/Year changes
  useEffect(() => {
    const seed = selectedMonth + selectedYear;

    // 1. Generate realistic counts
    const resumeCount = 200 + (seed * 10) + Math.floor(Math.random() * 50);

    // 2. Calculate "Money Saved" (Logic: ₹150 per resume in manual labor)
    const moneySaved = resumeCount * 150;

    setStats({
      hires: 10 + (seed % 8),
      acceptance: 70 + (seed % 25),
      resumes: resumeCount,
      savings: moneySaved.toLocaleString('en-IN') // Format as 25,000
    });

    // Generate graph curve
    const points = [];
    for (let i = 0; i <= 300; i += 20) {
      const height = Math.floor(Math.random() * 80) + 10;
      points.push(`${i},${height}`);
    }
    setTrendPoints(points.join(" "));

  }, [selectedMonth, selectedYear]);

  // Helpers
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const years = [2024, 2025, 2026];

  // FUNCTION: Handle CSV Export
  const handleExport = () => {
    setDownloading(true);
    const monthName = months[selectedMonth];
    const csvContent =
      "data:text/csv;charset=utf-8," +
      "Metric,Value,Status\n" +
      `Report Period,${monthName} ${selectedYear},Final\n` +
      `Avg Time to Hire,${stats.hires} Days,Improved\n` +
      `Offer Acceptance Rate,${stats.acceptance}%,High\n` +
      `Resumes Parsed,${stats.resumes},Automated\n` +
      `Total Estimated Savings,₹${stats.savings},Success\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `RecruitPro_ROI_${monthName}_${selectedYear}.csv`);
    document.body.appendChild(link);

    setTimeout(() => {
        link.click();
        document.body.removeChild(link);
        setDownloading(false);
        alert(`✅ ROI Report for ${monthName} downloaded!`);
    }, 1000);
  };

  return (
    <HRLayout>
      <div className="min-h-screen bg-slate-50 font-sans">

        {/* 1. PROFESSIONAL HEADER */}
        <div className="bg-slate-900 text-white px-8 py-8 shadow-xl">
           <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-end gap-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                   <span className="bg-blue-600 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Beta 2.0</span>
                   <span className="text-slate-400 text-xs font-medium">Data refreshed: Just now</span>
                </div>
                <h1 className="text-3xl font-black tracking-tight text-white">Talent Intelligence</h1>
                <p className="text-slate-400 text-sm mt-1">Deep-dive analytics into recruitment velocity and AI ROI.</p>
              </div>

              {/* 📅 DATE CONTROLS */}
              <div className="flex gap-2 bg-slate-800 p-1.5 rounded-xl border border-slate-700 shadow-inner">
                 <div className="relative">
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(Number(e.target.value))}
                      className="appearance-none bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold py-2.5 pl-4 pr-8 rounded-lg outline-none border border-transparent focus:border-blue-500 transition cursor-pointer"
                    >
                      {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
                    </select>
                    <span className="absolute right-3 top-2.5 text-xs text-slate-400 pointer-events-none">▼</span>
                 </div>

                 <div className="relative">
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(Number(e.target.value))}
                      className="appearance-none bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold py-2.5 pl-4 pr-8 rounded-lg outline-none border border-transparent focus:border-blue-500 transition cursor-pointer"
                    >
                      {years.map((y) => <option key={y} value={y}>{y}</option>)}
                    </select>
                    <span className="absolute right-3 top-2.5 text-xs text-slate-400 pointer-events-none">▼</span>
                 </div>

                 <button
                    onClick={handleExport}
                    disabled={downloading}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-bold text-white shadow-lg transition flex items-center gap-2 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed ml-2"
                 >
                    {downloading ? <><span>⏳</span></> : <><span>⬇</span> CSV</>}
                 </button>
              </div>
           </div>
        </div>

        <div className="max-w-7xl mx-auto px-8 py-8 space-y-8">

          {/* 2. BIG TREND CHART */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
             <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide flex items-center gap-2">
                    📈 Volume: <span className="text-blue-600">{months[selectedMonth]} {selectedYear}</span>
                </h3>
                <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
                   <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Organic</span>
                   <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500"></span> AI Sourced</span>
                </div>
             </div>

             <div className="p-6 relative h-64 w-full">
                <div className="absolute inset-0 p-6 flex flex-col justify-between text-xs text-slate-300">
                   <div className="border-b border-slate-100 w-full">100</div>
                   <div className="border-b border-slate-100 w-full">75</div>
                   <div className="border-b border-slate-100 w-full">50</div>
                   <div className="border-b border-slate-100 w-full">25</div>
                   <div className="border-b border-slate-100 w-full">0</div>
                </div>
                <svg className="absolute inset-0 w-full h-full p-6 overflow-visible" preserveAspectRatio="none" viewBox="0 0 300 100">
                   <defs>
                      <linearGradient id="gradient" x1="0" x2="0" y1="0" y2="1">
                         <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
                         <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                      </linearGradient>
                   </defs>
                   <path d={`M0,100 ${trendPoints} L300,100 Z`} fill="url(#gradient)" className="transition-all duration-700 ease-out" />
                   <path d={`M0,100 ${trendPoints}`} fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" vectorEffect="non-scaling-stroke" className="transition-all duration-700 ease-out" />
                </svg>
             </div>
          </div>

          {/* 3. METRICS GRID - UPDATED CARD 4 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

            {/* Metric 1 */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition">
               <div className="flex justify-between mb-4">
                  <div className="bg-green-50 text-green-600 p-2 rounded-lg text-lg">🚀</div>
                  <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded h-fit">+14%</span>
               </div>
               <p className="text-2xl font-black text-slate-800">{stats.hires} Days</p>
               <p className="text-xs font-bold text-slate-400 uppercase mt-1">Avg Time to Hire</p>
            </div>

            {/* Metric 2 */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition">
               <div className="flex justify-between mb-4">
                  <div className="bg-blue-50 text-blue-600 p-2 rounded-lg text-lg">💎</div>
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded h-fit">High</span>
               </div>
               <p className="text-2xl font-black text-slate-800">{stats.acceptance}%</p>
               <p className="text-xs font-bold text-slate-400 uppercase mt-1">Offer Acceptance</p>
            </div>

            {/* Metric 3 */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition">
               <div className="flex justify-between mb-4">
                  <div className="bg-purple-50 text-purple-600 p-2 rounded-lg text-lg">🤖</div>
                  <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded h-fit">Automated</span>
               </div>
               <p className="text-2xl font-black text-slate-800">{stats.resumes}</p>
               <p className="text-xs font-bold text-slate-400 uppercase mt-1">Resumes Parsed</p>
            </div>

            {/* 🏆 Metric 4 (THE STRATEGIC FIX) */}
            <div className="bg-slate-800 p-5 rounded-xl shadow-lg border border-slate-700 text-white transform hover:scale-[1.02] transition relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/10 rounded-full blur-2xl -mr-8 -mt-8 transition group-hover:bg-green-500/20"></div>
               <div className="flex justify-between mb-4 relative z-10">
                  <div className="bg-slate-700 text-green-400 p-2 rounded-lg text-lg">💰</div>
                  <span className="text-xs font-bold text-slate-900 bg-green-400 px-2 py-1 rounded h-fit">ROI Positive</span>
               </div>
               <p className="text-2xl font-black relative z-10">₹{stats.savings}</p>
               <p className="text-xs font-bold text-slate-400 uppercase mt-1 relative z-10">Est. Recruitment Savings</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

             {/* 4. HIRING VELOCITY */}
             <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                   <span className="w-1.5 h-6 bg-blue-600 rounded-full"></span>
                   Pipeline Velocity
                </h3>
                <div className="space-y-6">
                   {[
                      { label: "Applied", count: Math.floor(stats.resumes), color: "bg-slate-200", fill: "bg-blue-600", pct: "100%" },
                      { label: "AI Screened", count: Math.floor(stats.resumes), color: "bg-slate-200", fill: "bg-indigo-600", pct: "100%" },
                      { label: "Shortlisted", count: Math.floor(stats.resumes / 4.5), color: "bg-slate-200", fill: "bg-purple-600", pct: "22%" },
                      { label: "Interview", count: Math.floor(stats.resumes / 12), color: "bg-slate-200", fill: "bg-pink-600", pct: "8%" },
                      { label: "Offer Sent", count: Math.floor(stats.resumes / 35), color: "bg-slate-200", fill: "bg-green-500", pct: "3%" },
                   ].map((step, i) => (
                      <div key={i} className="group">
                         <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
                            <span>{step.label}</span>
                            <span className="text-slate-400">{step.count} Candidates ({step.pct})</span>
                         </div>
                         <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden relative">
                            <div className={`absolute top-0 left-0 h-full ${step.fill} rounded-full transition-all duration-1000`} style={{ width: step.pct }}></div>
                         </div>
                      </div>
                   ))}
                </div>
                <div className="mt-8 bg-orange-50 border border-orange-100 rounded-xl p-4 flex gap-3">
                   <span className="text-xl">⚠️</span>
                   <div>
                      <h4 className="text-xs font-black text-orange-800 uppercase">Bottleneck Detected</h4>
                      <p className="text-xs text-orange-700 mt-1">High drop-off at Interview stage in {months[selectedMonth]}. Review interview questions.</p>
                   </div>
                </div>
             </div>

             {/* 5. SOURCES & SKILLS */}
             <div className="space-y-6">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                   <h3 className="font-bold text-slate-800 mb-6 text-sm uppercase">Applicant Sources</h3>
                   <div className="flex items-center justify-center mb-6">
                      <div className="w-32 h-32 rounded-full shadow-inner" style={{ background: "conic-gradient(#3b82f6 0% 60%, #a855f7 60% 85%, #f43f5e 85% 100%)" }}>
                         <div className="w-20 h-20 bg-white rounded-full relative top-6 left-6 flex items-center justify-center shadow-sm">
                            <span className="text-xs font-bold text-slate-400">Total<br/>100%</span>
                         </div>
                      </div>
                   </div>
                   <div className="space-y-2 text-xs font-bold text-slate-600">
                      <div className="flex justify-between items-center"><span className="flex items-center gap-2"><span className="w-2 h-2 bg-blue-500 rounded-full"></span> LinkedIn</span> <span>60%</span></div>
                      <div className="flex justify-between items-center"><span className="flex items-center gap-2"><span className="w-2 h-2 bg-purple-500 rounded-full"></span> Direct</span> <span>25%</span></div>
                   </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                   <h3 className="font-bold text-slate-800 mb-4 text-sm uppercase">Top Missing Skills</h3>
                   <div className="space-y-3">
                      {["Docker", "TypeScript", "GraphQL"].map((skill, i) => (
                         <div key={i} className="flex justify-between items-center p-2 bg-slate-50 rounded-lg border border-slate-100">
                            <span className="text-xs font-bold text-slate-600">{skill}</span>
                            <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded">High Gap</span>
                         </div>
                      ))}
                   </div>
                </div>
             </div>

          </div>
        </div>
      </div>
    </HRLayout>
  );
}