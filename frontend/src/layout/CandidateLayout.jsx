// src/layout/CandidateLayout.jsx

import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

export default function CandidateLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  // 🟢 SCROLL STATE
  const [isScrolled, setIsScrolled] = useState(false);

  // 🟢 MODAL STATES
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const [showNotifications, setShowNotifications] = useState(false);

  // 🟢 SETTINGS STATE
  const [emailNotifs, setEmailNotifs] = useState(() => localStorage.getItem("recruitpro_email") !== "false");
  const [relocation, setRelocation] = useState(() => localStorage.getItem("recruitpro_relocation") === "true");
  const [workPref, setWorkPref] = useState(() => localStorage.getItem("recruitpro_work_pref") || "Remote");
  const [jobStatus, setJobStatus] = useState(() => localStorage.getItem("recruitpro_job_status") || "Active");

  // 🟢 USER IDENTITY & AVATAR
  const [candidateName, setCandidateName] = useState(() => localStorage.getItem("recruitpro_cand_name") || "Alex Candidate");
  const [candidateRole, setCandidateRole] = useState(() => localStorage.getItem("recruitpro_cand_role") || "Software Engineer");
  const [avatar, setAvatar] = useState(() => localStorage.getItem("recruitpro_avatar") || null);
  const [isSaving, setIsSaving] = useState(false);

  // 🟢 REFS
  const fileInputRef = useRef(null);
  const chatEndRef = useRef(null);

  // 🟢 LIVE CHAT
  const [chatActive, setChatActive] = useState(false);
  const [chatMessages, setChatMessages] = useState([
      {
        sender: "bot",
        text: "👋 Hello! I'm your Personal Job Assistant.\n\nI can help you optimize your profile, find relevant roles, or prepare for interviews."
      }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // 🟢 NOTIFICATIONS
  const [notifications, setNotifications] = useState([
      { id: 1, type: "view", text: "Your application for 'Python Dev' was viewed by HR.", time: "2 hours ago" },
      { id: 2, type: "job", text: "New job alert: 'React Frontend' matches your profile.", time: "1 day ago" },
      { id: 3, type: "system", text: "Profile completion is at 80%. Add skills to reach 100%.", time: "2 days ago" },
  ]);

  const dismissNotification = (id, e) => {
      e.stopPropagation();
      setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const markAllRead = () => setNotifications([]);

  // 🟢 SCROLL HANDLER
  const handleScroll = (e) => {
      setIsScrolled(e.target.scrollTop > 20);
  };

  // 🟢 FETCH PROFILE
  useEffect(() => {
    const fetchRealUser = async () => {
        const token = localStorage.getItem("token");
        if (!token) return;
        try {
            const res = await fetch("http://localhost:5000/api/candidate/profile", {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                if (data.name) {
                    setCandidateName(data.name);
                    localStorage.setItem("recruitpro_cand_name", data.name);
                }
            }
        } catch (err) { console.error(err); }
    };
    fetchRealUser();
  }, []);

  // 🟢 SAVE SETTINGS
  useEffect(() => {
    localStorage.setItem("recruitpro_email", emailNotifs);
    localStorage.setItem("recruitpro_relocation", relocation);
    localStorage.setItem("recruitpro_work_pref", workPref);
    localStorage.setItem("recruitpro_job_status", jobStatus);
    if (avatar) {
        localStorage.setItem("recruitpro_avatar", avatar);
    } else {
        localStorage.removeItem("recruitpro_avatar");
    }
  }, [emailNotifs, relocation, workPref, jobStatus, avatar]);

  // 🟢 AVATAR HANDLERS
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
          alert("Image is too large! Please choose an image under 2MB.");
          return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveAvatar = () => {
      if(window.confirm("Are you sure you want to remove your profile picture?")) {
          setAvatar(null);
      }
  };

  // 🟢 CHAT BRAIN
  const getCandidateBotResponse = (text) => {
      const lower = text.toLowerCase();
      if (lower.includes("hello") || lower.includes("hi")) return "Hello! Ready to land your dream job?";
      if (lower.includes("job") || lower.includes("find")) return "Navigate to 'Find Jobs' to see AI-recommended roles based on your skills.";
      if (lower.includes("resume") || lower.includes("cv")) return "Recruiters love metrics! Try adding 'Increased efficiency by 20%' to your resume descriptions.";
      if (lower.includes("interview")) return "Check 'My Applications'. If shortlisted, you'll see a 'Join Room' button directly on the card.";
      return "I'm tuned for job search assistance. Try asking about 'Resume Tips', 'Interviews', or 'Finding Jobs'.";
  };

  const handleSendMessage = async (textOverride = null) => {
      const textToSend = textOverride || chatInput;
      if (!textToSend.trim()) return;

      setChatMessages(prev => [...prev, { sender: "user", text: textToSend }]);
      setChatInput("");
      setIsTyping(true);

      setTimeout(() => {
          const reply = getCandidateBotResponse(textToSend);
          setChatMessages(prev => [...prev, { sender: "bot", text: reply }]);
          setIsTyping(false);
      }, 1000);
  };

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMessages, chatActive, isTyping]);

  const handleLogout = () => {
    if(window.confirm("Log out?")) { localStorage.clear(); navigate("/login"); }
  };

  const handleSaveSettings = () => {
    setIsSaving(true);
    setTimeout(() => { setIsSaving(false); alert("✅ Preferences Updated"); setShowSettings(false); }, 600);
  };

  const navItems = [
    { label: "Find Jobs", path: "/candidate/dashboard", icon: "🔍" },
    { label: "My Applications", path: "/candidate/applications", icon: "📂" },
    { label: "My Profile", path: "/candidate/profile", icon: "👤" },
  ];

  return (
    <div className="flex h-screen font-sans overflow-hidden bg-slate-50 text-slate-900">

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .typing-dot { animation: typing 1.4s infinite ease-in-out both; }
        .typing-dot:nth-child(1) { animation-delay: -0.32s; }
        .typing-dot:nth-child(2) { animation-delay: -0.16s; }
        @keyframes typing { 0%, 80%, 100% { transform: scale(0); } 40% { transform: scale(1); } }
      `}</style>

      {/* 🟢 SIDEBAR */}
      <aside className="w-72 bg-[#0B1120] text-white flex flex-col shadow-2xl z-50 relative flex-shrink-0">
        <div className="h-20 flex items-center px-8 border-b border-slate-800/50 flex-shrink-0">
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center mr-3 shadow-[0_0_15px_rgba(16,185,129,0.5)] text-white font-black text-lg">C</div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-white leading-none">Recruit<span className="text-emerald-500">Pro</span></h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">Candidate Portal</p>
          </div>
        </div>

        <nav className="flex-1 py-8 px-4 space-y-1 overflow-y-auto no-scrollbar">
          <p className="px-4 text-[10px] font-black text-slate-500 uppercase mb-4 tracking-widest">Main Menu</p>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} className={`group relative flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200 font-bold text-sm mb-1 ${isActive ? "text-white bg-emerald-600/10 shadow-inner" : "text-slate-400 hover:text-white hover:bg-white/5"}`}>
                {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-emerald-500 rounded-r-full shadow-[0_0_10px_rgba(16,185,129,0.6)]"></div>}
                <span className={`text-xl transition-transform group-hover:scale-110 ${isActive ? "grayscale-0 text-emerald-400" : "grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100"}`}>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
          <div className="my-8 border-t border-slate-800/50 mx-4"></div>
          <p className="px-4 text-[10px] font-black text-slate-500 uppercase mb-4 tracking-widest">Account</p>
          <button onClick={() => { setShowSettings(true); setActiveTab('general'); }} className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl font-bold text-sm text-slate-400 hover:text-white hover:bg-white/5 transition text-left group">
             <span className="text-xl grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition">⚙️</span> Settings
          </button>
          <button onClick={() => setChatActive(true)} className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl font-bold text-sm text-slate-400 hover:text-white hover:bg-white/5 transition text-left group">
             <span className="text-xl grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition">💬</span> Help & Chat
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800/50 bg-[#0F172A] flex-shrink-0">
          <div className="flex items-center gap-3 mb-4 px-2">
             <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold text-sm shadow-lg overflow-hidden">
                {avatar ? <img src={avatar} alt="Avatar" className="w-full h-full object-cover" /> : candidateName.charAt(0)}
             </div>
             <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">{candidateName}</p>
                <p className="text-[10px] text-slate-400 truncate">{candidateRole}</p>
             </div>
          </div>
          <button onClick={handleLogout} className="flex items-center justify-center gap-2 w-full py-2.5 bg-slate-800 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/50 border border-slate-700 text-slate-300 rounded-lg text-xs font-bold transition-all">Sign Out</button>
        </div>
      </aside>

      {/* 🟢 MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col overflow-hidden relative bg-slate-50">

        {/* 🚀 FLOAT HEADER CAPSULE */}
        <header className="absolute top-10 right-10 z-40 flex items-center pointer-events-none">
          <div className={`pointer-events-auto flex items-center gap-5 px-5 py-2 rounded-full transition-all duration-300 shadow-xl ${isScrolled ? 'bg-white shadow-slate-200/50 border border-slate-100' : 'bg-white/10 backdrop-blur-md border border-white/10'}`}>

             {/* Notification Bell */}
             <div className="relative">
                <button onClick={() => setShowNotifications(!showNotifications)} className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${isScrolled ? 'text-slate-600 hover:bg-slate-100' : 'text-white hover:bg-white/20'} ${showNotifications ? '!text-emerald-600 !bg-white shadow-sm' : ''}`}>
                   🔔
                   {notifications.length > 0 && <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>}
                </button>
                {/* Dropdown */}
                {showNotifications && (
                    <div className="absolute right-0 top-12 w-96 bg-white rounded-3xl shadow-2xl shadow-black/20 border border-slate-100 overflow-hidden animate-fade-in-up z-50 origin-top-right ring-1 ring-black/5">
                        <div className="px-5 py-3 border-b border-slate-50 flex justify-between items-center bg-slate-50/50"><h3 className="font-bold text-slate-800 text-xs uppercase tracking-wide">Notifications</h3><button onClick={() => setShowNotifications(false)} className="text-slate-400 hover:text-emerald-600 font-bold">&times;</button></div>
                        <div className="max-h-64 overflow-y-auto custom-scrollbar p-1">
                            {notifications.length === 0 ? <div className="p-6 text-center text-slate-400 text-xs">No updates yet.</div> : notifications.map(n => (
                                <div key={n.id} className="relative group p-3 hover:bg-slate-50 rounded-xl transition cursor-pointer flex gap-3">
                                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></div>
                                    <div className="flex-1"><p className="text-xs font-bold text-slate-700 leading-snug">{n.text}</p><p className="text-[10px] text-slate-400 mt-1">{n.time}</p></div>
                                    <button onClick={(e) => dismissNotification(n.id, e)} className="opacity-0 group-hover:opacity-100 absolute top-2 right-2 text-slate-300 hover:text-red-500 p-1">✕</button>
                                </div>
                            ))}
                        </div>
                        <div className="p-2 border-t border-slate-50 text-center"><button onClick={markAllRead} className="text-[10px] font-bold text-slate-500 hover:text-emerald-600">Mark all read</button></div>
                    </div>
                )}
             </div>

             <div className={`w-px h-4 ${isScrolled ? 'bg-slate-200' : 'bg-white/20'}`}></div>

             <div className="text-right">
                <p className={`text-xs font-bold leading-none ${isScrolled ? 'text-slate-800' : 'text-white'}`}>{candidateName}</p>
                <p className={`text-[9px] font-bold mt-0.5 ${isScrolled ? 'text-emerald-600' : 'text-emerald-300'} flex items-center justify-end gap-1`}>● {jobStatus === 'Active' ? 'Open to Work' : 'Passive'} <span className="opacity-60 font-normal ml-1 border-l border-current pl-1 uppercase tracking-wider">{workPref}</span></p>
             </div>

             <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-sm overflow-hidden ${isScrolled ? 'bg-slate-900 text-white' : 'bg-white text-emerald-900'}`}>
                {avatar ? <img src={avatar} alt="Avatar" className="w-full h-full object-cover" /> : candidateName.charAt(0)}
             </div>
          </div>
        </header>

        {/* 🟢 CONTENT AREA */}
        <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth" onScroll={handleScroll}>
          <div className="w-full max-w-7xl mx-auto pt-6 px-6">
             {children}
          </div>
        </div>
      </main>

      {/* 🚀 COMPACT & PROFESSIONAL SETTINGS MODAL */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fade-in">
           <div className="bg-slate-50 rounded-2xl shadow-2xl w-full max-w-3xl h-auto min-h-[450px] flex overflow-hidden ring-1 ring-black/5">

              {/* SIDEBAR */}
              <div className="w-56 bg-[#0f172a] text-slate-300 p-5 flex flex-col justify-between flex-shrink-0">
                 <div>
                     <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 pl-2">Settings</h3>
                     <div className="space-y-1">
                        {['general', 'profile', 'security'].map((tab) => (
                            <button key={tab} onClick={() => setActiveTab(tab)} className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-3 ${activeTab === tab ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
                                <span className={`text-sm`}>{tab === 'general' ? '⚙️' : tab === 'profile' ? '👤' : '🛡️'}</span>
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </button>
                        ))}
                     </div>
                 </div>
                 <div className="px-2">
                    <div className="p-3 bg-slate-800 rounded-xl border border-slate-700/50"><p className="text-[10px] text-emerald-400 font-bold mb-1">💡 Pro Tip</p><p className="text-[9px] text-slate-400 leading-relaxed">Complete your profile to boost visibility by 40%.</p></div>
                 </div>
              </div>

              {/* CONTENT AREA */}
              <div className="flex-1 flex flex-col bg-slate-50">
                 <div className="px-8 py-5 border-b border-slate-200/60 flex justify-between items-center bg-white shadow-sm z-10">
                    <div><h2 className="text-lg font-black text-slate-800">{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Settings</h2><p className="text-xs text-slate-400 mt-0.5">Manage your personal preferences.</p></div>
                    <button onClick={() => setShowSettings(false)} className="text-slate-300 hover:text-slate-500 transition text-2xl leading-none">&times;</button>
                 </div>

                 <div className="flex-1 p-6 overflow-y-auto">

                    {/* 🟢 GENERAL TAB (COMPACTED) */}
                    {activeTab === 'general' && (
                        <div className="space-y-5">
                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-3 block">Current Status</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button onClick={() => setJobStatus("Active")} className={`relative p-3 rounded-lg border-2 text-left transition-all duration-200 group ${jobStatus === "Active" ? "border-emerald-500 bg-emerald-50/30" : "border-slate-100 hover:border-slate-200"}`}>
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center mb-1 text-base ${jobStatus === "Active" ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400"}`}>🚀</div>
                                        <p className={`text-xs font-bold ${jobStatus === "Active" ? "text-emerald-900" : "text-slate-600"}`}>Actively Looking</p>
                                        {jobStatus === "Active" && <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>}
                                    </button>
                                    <button onClick={() => setJobStatus("Passive")} className={`relative p-3 rounded-lg border-2 text-left transition-all duration-200 group ${jobStatus === "Passive" ? "border-amber-400 bg-amber-50/30" : "border-slate-100 hover:border-slate-200"}`}>
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center mb-1 text-base ${jobStatus === "Passive" ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-400"}`}>👀</div>
                                        <p className={`text-xs font-bold ${jobStatus === "Passive" ? "text-amber-900" : "text-slate-600"}`}>Open to Offers</p>
                                    </button>
                                </div>
                            </div>

                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-4">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2 block">Work Preference</label>
                                    <div className="bg-slate-100 p-1 rounded-lg flex shadow-inner">
                                        {['Remote', 'Hybrid', 'Onsite'].map(type => (
                                            <button key={type} onClick={() => setWorkPref(type)} className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all shadow-sm ${workPref === type ? 'bg-white text-slate-900 shadow ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 shadow-none'}`}>{type}</button>
                                        ))}
                                    </div>
                                </div>

                                <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                                    <div><p className="text-xs font-bold text-slate-700">Willing to Relocate</p><p className="text-[9px] text-slate-400">Open to moving?</p></div>
                                    <button onClick={() => setRelocation(!relocation)} className={`w-9 h-5 rounded-full relative transition-colors duration-300 ${relocation ? 'bg-emerald-500' : 'bg-slate-200'}`}><div className={`absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm transition-all duration-300 ${relocation ? 'left-5' : 'left-1'}`}></div></button>
                                </div>
                                <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                                    <div><p className="text-xs font-bold text-slate-700">Email Alerts</p><p className="text-[9px] text-slate-400">Daily job digests</p></div>
                                    <button onClick={() => setEmailNotifs(!emailNotifs)} className={`w-9 h-5 rounded-full relative transition-colors duration-300 ${emailNotifs ? 'bg-emerald-500' : 'bg-slate-200'}`}><div className={`absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm transition-all duration-300 ${emailNotifs ? 'left-5' : 'left-1'}`}></div></button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 🟢 PROFILE TAB (COMPACTED) */}
                    {activeTab === 'profile' && (
                        <div className="space-y-5">
                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                                <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-full flex items-center justify-center text-xl font-bold text-white shadow-md overflow-hidden relative group">
                                    {avatar ? <img src={avatar} alt="Profile" className="w-full h-full object-cover" /> : candidateName.charAt(0)}
                                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer" onClick={() => fileInputRef.current.click()}><span className="text-[9px] text-white font-bold">Edit</span></div>
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 text-sm">{candidateName}</h3>
                                    <p className="text-[10px] text-slate-500 mb-2">{candidateRole}</p>
                                    <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleAvatarChange} />
                                    <div className="flex gap-2">
                                        <button onClick={() => fileInputRef.current.click()} className="text-[9px] font-bold bg-slate-50 border border-slate-200 text-slate-600 px-2.5 py-1 rounded-md hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-all shadow-sm flex items-center gap-1"><span>📷</span> Update</button>
                                        {avatar && <button onClick={handleRemoveAvatar} className="text-[9px] font-bold bg-white border border-slate-200 text-red-500 px-2.5 py-1 rounded-md hover:bg-red-50 hover:border-red-200 transition-all shadow-sm">Remove</button>}
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                                <div><label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Full Name</label><input value={candidateName} onChange={(e) => setCandidateName(e.target.value)} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:ring-1 focus:ring-emerald-500/20 focus:border-emerald-500 transition" /></div>
                                <div><label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Target Job Title</label><input value={candidateRole} onChange={(e) => setCandidateRole(e.target.value)} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:ring-1 focus:ring-emerald-500/20 focus:border-emerald-500 transition" /></div>
                            </div>
                        </div>
                    )}

                    {/* 🟢 SECURITY TAB (COMPACTED) */}
                    {activeTab === 'security' && (
                        <div className="space-y-5">
                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex gap-3 items-start">
                                <span className="text-amber-500 text-lg bg-amber-50 p-1.5 rounded-lg">🔒</span>
                                <div><p className="text-xs font-bold text-amber-800">Password Security</p><p className="text-[10px] text-amber-600 mt-0.5 leading-relaxed">It's recommended to change your password every 90 days.</p></div>
                            </div>
                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                                <div><label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">New Password</label><input type="password" placeholder="••••••••" className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:ring-1 focus:ring-emerald-500/20 focus:border-emerald-500 transition" /></div>
                                <div><label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Confirm Password</label><input type="password" placeholder="••••••••" className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:ring-1 focus:ring-emerald-500/20 focus:border-emerald-500 transition" /></div>
                            </div>
                        </div>
                    )}
                 </div>

                 <div className="p-4 border-t border-slate-200/60 flex justify-end bg-white rounded-b-2xl">
                    <button onClick={handleSaveSettings} disabled={isSaving} className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-bold text-xs hover:bg-emerald-700 transition shadow-lg shadow-emerald-500/20 active:scale-95">{isSaving ? "Saving..." : "Save"}</button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* CHAT & OTHER COMPONENTS UNTOUCHED */}
      {chatActive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col h-[600px] ring-1 ring-black/5">
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-[#0B1120] text-white">
                 <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-lg">🤖</div><div><h3 className="font-bold text-sm">Job Search Assistant</h3><p className="text-[10px] text-emerald-400 font-medium">Online • Instant Support</p></div></div>
                 <button onClick={() => setChatActive(false)} className="text-white/60 hover:text-white font-bold text-xl">&times;</button>
              </div>
              <div className="flex-1 p-6 bg-slate-50 overflow-y-auto space-y-5 custom-scrollbar">
                  {chatMessages.map((msg, i) => (<div key={i} className={`flex gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>{msg.sender === 'bot' && (<div className="w-8 h-8 rounded-full flex items-center justify-center text-xs bg-white border border-slate-200 shadow-sm flex-shrink-0">🤖</div>)}<div className={`max-w-[80%] px-5 py-3.5 text-sm shadow-sm leading-relaxed ${msg.sender === 'user' ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl rounded-tr-none' : 'bg-white border border-slate-100 text-slate-700 rounded-2xl rounded-tl-none'}`}>{msg.text}</div></div>))}
                  {isTyping && (<div className="flex gap-3"><div className="w-8 h-8 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-xs">🤖</div><div className="bg-white border border-slate-100 px-4 py-3 rounded-2xl rounded-tl-none shadow-sm flex gap-1"><span className="w-1.5 h-1.5 bg-slate-400 rounded-full typing-dot"></span><span className="w-1.5 h-1.5 bg-slate-400 rounded-full typing-dot"></span><span className="w-1.5 h-1.5 bg-slate-400 rounded-full typing-dot"></span></div></div>)}
                  <div ref={chatEndRef} />
              </div>
              <div className="bg-white border-t border-slate-100 p-4 space-y-3">
                  <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">{['🔍 Find Jobs', '📄 Resume Tips', '⏳ Application Status'].map((chip) => (<button key={chip} onClick={() => handleSendMessage(chip)} className="flex-shrink-0 px-3 py-1.5 bg-slate-50 border border-slate-200 text-xs font-bold text-slate-600 rounded-full hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition">{chip}</button>))}</div>
                  <div className="flex gap-2 items-center"><input value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} placeholder="Type your message..." className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition" /><button onClick={() => handleSendMessage()} className="bg-emerald-600 hover:bg-emerald-700 text-white p-3 rounded-xl transition shadow-lg shadow-emerald-200 active:scale-95">➤</button></div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}