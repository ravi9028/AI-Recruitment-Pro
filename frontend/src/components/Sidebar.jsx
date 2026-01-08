import React from "react";
import { NavLink, useNavigate } from "react-router-dom";

export default function Sidebar() {
  const role = localStorage.getItem("role");
  const navigate = useNavigate();

  function handleLogout() {
    localStorage.clear();
    navigate("/login");
  }

  // Helper component for Links
  const SidebarLink = ({ to, icon, label, exact = false }) => (
    <NavLink
      to={to}
      end={exact}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm mb-1 group relative overflow-hidden ${
          isActive
            ? "bg-slate-900 text-white shadow-lg shadow-slate-900/20" // Active (Dark Theme)
            : "text-slate-500 hover:bg-slate-50 hover:text-slate-900" // Inactive
        }`
      }
    >
      <span className="text-xl relative z-10">{icon}</span>
      <span className="relative z-10">{label}</span>

      {/* Active Indicator Dot */}
      <NavLink to={to} className={({ isActive }) => isActive ? "absolute right-3 w-1.5 h-1.5 bg-blue-500 rounded-full" : "hidden"} />
    </NavLink>
  );

  return (
    <div className="w-64 bg-white border-r border-slate-200 min-h-screen flex flex-col fixed left-0 top-0 z-50 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">

      {/* 1. BRAND HEADER */}
      <div className="h-20 flex items-center px-6 border-b border-slate-100">
        <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center mr-3 shadow-blue-500/30 shadow-lg text-white font-black text-lg">
          R
        </div>
        <div>
          <h1 className="text-lg font-black text-slate-800 tracking-tight leading-none">
            Recruit<span className="text-blue-600">Pro</span>
          </h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Enterprise AI</p>
        </div>
      </div>

      {/* 2. MAIN NAVIGATION */}
      <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">
        <p className="px-4 text-[10px] font-black text-slate-400 uppercase mb-3 tracking-widest">
          {role === "hr" ? "Main Menu" : "Candidate Menu"}
        </p>

        {role === "hr" && (
          <>
            <SidebarLink to="/hr/dashboard" icon="📊" label="Dashboard" />
            <SidebarLink to="/hr/analytics" icon="📈" label="Talent Intelligence" />
            <SidebarLink to="/hr/jobs" icon="💼" label="Job Inventory" exact />
            <SidebarLink to="/hr/create-job" icon="✨" label="Post New Job" />
          </>
        )}

        {role === "candidate" && (
          <>
            <SidebarLink to="/candidate/dashboard" icon="🏠" label="Job Board" />
            <SidebarLink to="/candidate/applications" icon="📂" label="My Applications" />
            <SidebarLink to="/candidate/profile" icon="👤" label="My Profile" />
          </>
        )}

        {/* 3. UTILITY SECTION (The "Pro" Touch) */}
        {role === "hr" && (
          <>
            <div className="my-4 border-t border-slate-100 mx-2"></div>
            <p className="px-4 text-[10px] font-black text-slate-400 uppercase mb-3 tracking-widest">
               System
            </p>
            {/* These are dummy links for visual completeness */}
            <div className="opacity-60 hover:opacity-100 transition-opacity">
               <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-slate-50 font-bold text-sm mb-1 text-left">
                  <span className="text-xl">⚙️</span> Settings
               </button>
               <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-slate-50 font-bold text-sm mb-1 text-left">
                  <span className="text-xl">❓</span> Help Center
               </button>
            </div>
          </>
        )}
      </div>

      {/* 4. USER PROFILE FOOTER */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-3 mb-3 px-2">
           <div className="w-8 h-8 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-xs">
              HM
           </div>
           <div className="flex-1">
              <p className="text-xs font-bold text-slate-800">Hiring Manager</p>
              <p className="text-[10px] text-slate-400">admin@recruitpro.com</p>
           </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 w-full py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition shadow-sm"
        >
          <span>🚪</span> Sign Out
        </button>
      </div>
    </div>
  );
}