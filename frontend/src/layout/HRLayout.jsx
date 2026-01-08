import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

export default function HRLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  // 🟢 MODAL STATES
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [showHelp, setShowHelp] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // 🟢 PERSISTED SETTINGS
  const [theme, setTheme] = useState(() => localStorage.getItem("recruitpro_theme") || "light");
  const [emailNotifs, setEmailNotifs] = useState(() => localStorage.getItem("recruitpro_email") !== "false");
  const [language, setLanguage] = useState(() => localStorage.getItem("recruitpro_lang") || "English (US)");
  const [timezone, setTimezone] = useState(() => localStorage.getItem("recruitpro_tz") || "IST (GMT+5:30)");
  const [userName, setUserName] = useState(() => localStorage.getItem("recruitpro_name") || "Hiring Manager");
  const [userTitle, setUserTitle] = useState(() => localStorage.getItem("recruitpro_title") || "Senior Recruiter");
  const [isSaving, setIsSaving] = useState(false);

  // 🟢 LIVE CHAT STATE
  const [chatActive, setChatActive] = useState(false);
  const [chatMessages, setChatMessages] = useState([
      { sender: "bot", text: "👋 Hello! I'm your AI Co-Pilot.\n\nI can help you:\n1. Post new jobs\n2. Screen candidates\n3. Schedule interviews\n\nWhat would you like to do?" }
  ]);
  const [chatInput, setChatInput] = useState("");
  const chatEndRef = useRef(null);
  const [isTyping, setIsTyping] = useState(false);

  // 🟢 HELP SEARCH & VIDEO STATE
  const [searchQuery, setSearchQuery] = useState("");
  const [showVideo, setShowVideo] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);

  // 🟢 PASSWORD STATE
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");

  const notifications = [
      { id: 1, text: "New candidate 'Rahul Sharma' applied for Python Dev", time: "2 mins ago" },
      { id: 2, text: "AI Analysis complete for Job ID #102", time: "1 hour ago" },
      { id: 3, text: "System maintenance scheduled for Sunday", time: "1 day ago" },
  ];

  const helpTopics = [
      { title: "How AI Scoring Works", content: "Our engine extracts keywords from resumes (PDF/DOCX) using NLP and compares them against the Job Description." },
      { title: "How to post a job", content: "Navigate to 'Post New Job', fill in skills, and click Publish." },
      { title: "Exporting Analytics", content: "Go to Talent Intelligence tab and click 'Export Report' to get CSV data." },
      { title: "Changing Passwords", content: "Go to Settings > Security to update your credentials." }
  ];

  const filteredTopics = helpTopics.filter(topic =>
      topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      topic.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    localStorage.setItem("recruitpro_theme", theme);
    localStorage.setItem("recruitpro_email", emailNotifs);
    localStorage.setItem("recruitpro_lang", language);
    localStorage.setItem("recruitpro_tz", timezone);
    localStorage.setItem("recruitpro_name", userName);
    localStorage.setItem("recruitpro_title", userTitle);
  }, [theme, emailNotifs, language, timezone, userName, userTitle]);

  useEffect(() => {
    const handleEsc = (event) => {
       if (event.key === 'Escape') {
          setShowSettings(false);
          setShowHelp(false);
          setShowVideo(false);
          setShowNotifications(false);
       }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const handleLogout = () => {
    if(window.confirm("Are you sure you want to log out?")) {
        localStorage.clear();
        navigate("/");
    }
  };

  const handleDownloadManual = () => {
      const element = document.createElement("a");
      const file = new Blob(["RecruitPro Manual..."], {type: 'text/plain'});
      element.href = URL.createObjectURL(file);
      element.download = "RecruitPro_Manual.txt";
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
  };

  const handleSendMessage = async (e) => {
      if ((e.key === 'Enter' || e.type === 'click') && chatInput.trim()) {
          const userText = chatInput;
          setChatMessages(prev => [...prev, { sender: "user", text: userText }]);
          setChatInput("");
          setIsTyping(true);

          try {
            const response = await fetch("http://localhost:5000/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: userText })
            });
            const data = await response.json();
            setChatMessages(prev => [...prev, { sender: "bot", text: data.reply }]);
          } catch (error) {
            setChatMessages(prev => [...prev, { sender: "bot", text: "⚠️ Server Offline. I cannot reach the brain right now." }]);
          } finally {
            setIsTyping(false);
          }
      }
  };

  useEffect(() => {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, chatActive, isTyping]);

  const handleSaveSettings = () => {
    if(activeTab === 'security' && newPass && newPass.length < 6) {
        alert("⚠️ Security Alert: Password must be at least 6 characters.");
        return;
    }

    setIsSaving(true);
    setTimeout(() => {
        setIsSaving(false);
        alert("✅ Configuration Saved Successfully!");
        setCurrentPass("");
        setNewPass("");
    }, 800);
  };

  const navItems = [
    { label: "Dashboard", path: "/hr/dashboard", icon: "📊" },
    { label: "Talent Intelligence", path: "/hr/analytics", icon: "📈" },
    { label: "Job Inventory", path: "/hr/jobs", icon: "💼" },
    { label: "Post New Job", path: "/hr/create-job", icon: "✨" },
  ];

  return (
    <div className="flex h-screen font-sans overflow-hidden bg-slate-50 text-slate-900">

      {/* 🔴 INJECTED CSS TO HIDE SCROLLBAR GLOBALLY FOR SIDEBAR */}
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      {/* 🟢 SIDEBAR (Now with no-scrollbar class) */}
      <aside className="w-72 bg-[#0B1120] text-white flex flex-col shadow-2xl z-40 relative">

        {/* BRAND */}
        <div className="h-20 flex items-center px-8 border-b border-slate-800/50 flex-shrink-0">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3 shadow-[0_0_15px_rgba(37,99,235,0.5)] text-white font-black text-lg">
            R
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-white leading-none">
              Recruit<span className="text-blue-500">Pro</span>
            </h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">Enterprise</p>
          </div>
        </div>

        {/* NAVIGATION (Added no-scrollbar class here) */}
        <nav className="flex-1 py-8 px-4 space-y-1 overflow-y-auto no-scrollbar">
          <p className="px-4 text-[10px] font-black text-slate-500 uppercase mb-4 tracking-widest">Main Menu</p>

          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`group relative flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200 font-bold text-sm mb-1
                  ${isActive
                    ? "text-white bg-blue-600/10 shadow-inner"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
              >
                {/* Active Indicator Line */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-blue-500 rounded-r-full shadow-[0_0_10px_rgba(59,130,246,0.6)]"></div>
                )}

                <span className={`text-xl transition-transform group-hover:scale-110 ${isActive ? "grayscale-0" : "grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100"}`}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}

          <div className="my-8 border-t border-slate-800/50 mx-4"></div>

          <p className="px-4 text-[10px] font-black text-slate-500 uppercase mb-4 tracking-widest">System</p>

          <button
            onClick={() => { setShowSettings(true); setActiveTab('profile'); }}
            className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl font-bold text-sm text-slate-400 hover:text-white hover:bg-white/5 transition text-left group"
          >
             <span className="text-xl grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition">⚙️</span> Settings
          </button>

          <button
            onClick={() => setShowHelp(true)}
            className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl font-bold text-sm text-slate-400 hover:text-white hover:bg-white/5 transition text-left group"
          >
             <span className="text-xl grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition">❓</span> Help Center
          </button>
        </nav>

        {/* PROFILE FOOTER */}
        <div className="p-4 border-t border-slate-800/50 bg-[#0F172A] flex-shrink-0">
          <div className="flex items-center gap-3 mb-4 px-2">
             <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-sm shadow-lg">
                {userName.charAt(0)}
             </div>
             <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">{userName}</p>
                <p className="text-[10px] text-slate-400 truncate">{userTitle}</p>
             </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-slate-800 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/50 border border-slate-700 text-slate-300 rounded-lg text-xs font-bold transition-all"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* 🟢 MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col overflow-hidden relative bg-[#F8FAFC]">
        {/* Header */}
        <header className="h-20 flex justify-between items-center px-10 border-b border-slate-200 bg-white/80 backdrop-blur-md z-10 sticky top-0 flex-shrink-0">
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Overview</h2>

          <div className="flex items-center gap-6">
             {/* Notification Bell */}
             <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="w-10 h-10 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-600 hover:text-blue-600 hover:shadow-md transition"
                >
                   🔔
                   <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
                </button>
                {/* Dropdown */}
                {showNotifications && (
                    <div className="absolute right-0 top-14 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-fade-in z-50">
                        <div className="px-5 py-4 border-b border-slate-50 bg-slate-50/50 font-bold text-xs text-slate-500 uppercase tracking-wide">Notifications</div>
                        <div className="max-h-64 overflow-y-auto no-scrollbar">
                            {notifications.map(n => (
                                <div key={n.id} className="px-5 py-4 border-b border-slate-50 hover:bg-blue-50/50 cursor-pointer transition">
                                    <p className="text-sm font-bold text-slate-800">{n.text}</p>
                                    <p className="text-xs text-slate-400 mt-1 font-medium">{n.time}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
             </div>

             {/* Status Badge */}
             <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-full">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wide">System Online</span>
             </div>
          </div>
        </header>

        {/* Content Scroll Area */}
        <div className="flex-1 overflow-y-auto bg-slate-50">
          {children}
        </div>
      </main>

      {/* ------------------------------------------------ */}
      {/* 🚀 SETTINGS MODAL */}
      {/* ------------------------------------------------ */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
           <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl h-[650px] flex overflow-hidden ring-1 ring-black/5">

              {/* SETTINGS SIDEBAR */}
              <div className="w-72 bg-slate-50 border-r border-slate-100 p-8 flex flex-col">
                 <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-8">Configuration</h3>
                 <div className="space-y-3">
                    {['profile', 'general', 'security', 'danger'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`w-full text-left px-5 py-4 rounded-xl text-sm font-bold transition-all duration-200 flex items-center gap-4 ${
                                activeTab === tab
                                ? 'bg-white text-blue-600 shadow-lg shadow-slate-200/50 ring-1 ring-slate-100 translate-x-2'
                                : 'text-slate-500 hover:bg-white hover:text-slate-700'
                            }`}
                        >
                            <span className="text-xl">
                                {tab === 'profile' && '👤'}
                                {tab === 'general' && '⚙️'}
                                {tab === 'security' && '🛡️'}
                                {tab === 'danger' && '⚠️'}
                            </span>
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                 </div>
              </div>

              {/* SETTINGS CONTENT */}
              <div className="flex-1 flex flex-col bg-white">
                 <div className="px-10 py-8 border-b border-slate-50 flex justify-between items-center bg-white sticky top-0 z-10">
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                            {activeTab === 'profile' && "Public Profile"}
                            {activeTab === 'general' && "System Preferences"}
                            {activeTab === 'security' && "Login & Security"}
                            {activeTab === 'danger' && "Danger Zone"}
                        </h2>
                        <p className="text-sm text-slate-400 font-medium mt-1">Manage your recruiting environment.</p>
                    </div>
                    <button onClick={() => setShowSettings(false)} className="w-10 h-10 rounded-full bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition flex items-center justify-center font-bold text-xl">&times;</button>
                 </div>

                 <div className="flex-1 p-10 overflow-y-auto custom-scrollbar">
                    {/* PROFILE TAB */}
                    {activeTab === 'profile' && (
                        <div className="space-y-8 animate-fade-in-up">
                            <div className="flex items-center gap-8">
                                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-4xl font-bold text-white shadow-xl ring-4 ring-white">
                                    {userName.charAt(0)}
                                </div>
                                <div>
                                    <button className="px-5 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800 transition shadow-lg">Upload New Photo</button>
                                    <p className="text-xs text-slate-400 mt-2">Recommended: 400x400px JPG/PNG</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Display Name</label>
                                    <input value={userName} onChange={(e) => setUserName(e.target.value)} className="w-full bg-slate-50 border-none rounded-xl px-5 py-4 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-500/20 outline-none transition" />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Job Title</label>
                                    <input value={userTitle} onChange={(e) => setUserTitle(e.target.value)} className="w-full bg-slate-50 border-none rounded-xl px-5 py-4 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-500/20 outline-none transition" />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* GENERAL TAB */}
                    {activeTab === 'general' && (
                        <div className="space-y-8 animate-fade-in-up">
                            <div onClick={() => setEmailNotifs(!emailNotifs)} className="flex items-center justify-between p-6 rounded-2xl bg-slate-50 border border-slate-100 cursor-pointer hover:border-blue-200 transition-all group">
                                <div>
                                    <h4 className="font-bold text-slate-800">Daily Digest Emails</h4>
                                    <p className="text-sm text-slate-500 mt-1">Receive a summary of new candidates every morning.</p>
                                </div>
                                <div className={`w-14 h-8 rounded-full relative transition-colors duration-300 ${emailNotifs ? 'bg-blue-600' : 'bg-slate-300'}`}>
                                    <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-all duration-300 ${emailNotifs ? 'left-7' : 'left-1'}`}></div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SECURITY TAB */}
                    {activeTab === 'security' && (
                         <div className="space-y-6 animate-fade-in-up">
                            <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100 flex gap-4">
                                <div className="text-2xl">🛡️</div>
                                <div>
                                    <h4 className="font-bold text-blue-900">Secure Session</h4>
                                    <p className="text-sm text-blue-700 mt-1">You are logged in via secure token (JWT). Your session expires in 24 hours.</p>
                                </div>
                            </div>
                         </div>
                    )}
                 </div>

                 {/* FOOTER */}
                 <div className="p-6 border-t border-slate-50 bg-slate-50/50 flex justify-end">
                    <button onClick={handleSaveSettings} disabled={isSaving} className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:shadow-xl hover:-translate-y-1 transition-all">
                        {isSaving ? "Saving..." : "Save Changes"}
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* 🟢 HELP MODAL (Identical Logic, Improved UI) */}
      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
           <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]">
              <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-900 text-white">
                 <h3 className="font-bold text-lg flex items-center gap-3">
                    <span className="text-2xl">🤖</span> AI Co-Pilot
                 </h3>
                 <button onClick={() => { setShowHelp(false); setChatActive(false); }} className="text-white/50 hover:text-white transition font-bold text-2xl">&times;</button>
              </div>

              {/* Chat Interface */}
              <div className="flex flex-col h-[500px]">
                  <div className="flex-1 p-6 bg-slate-50 overflow-y-auto space-y-6 no-scrollbar">
                      {chatMessages.map((msg, i) => (
                          <div key={i} className={`flex gap-4 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${msg.sender === 'user' ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-700'}`}>
                                  {msg.sender === 'user' ? '👤' : '🤖'}
                              </div>
                              <div className={`px-5 py-4 rounded-2xl text-sm shadow-sm leading-relaxed max-w-[80%] ${msg.sender === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white text-slate-700 rounded-tl-none border border-slate-100'}`}>
                                  {msg.text}
                              </div>
                          </div>
                      ))}
                      {isTyping && <div className="text-xs text-slate-400 italic ml-14 animate-pulse">AI is thinking...</div>}
                      <div ref={chatEndRef} />
                  </div>
                  <div className="p-4 bg-white border-t border-slate-100 flex gap-3">
                      <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={handleSendMessage} placeholder="Ask me about candidates, jobs..." className="flex-1 bg-slate-50 border-none rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 ring-blue-500/20 font-medium transition" />
                      <button onClick={handleSendMessage} className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl transition shadow-lg shadow-blue-200">➤</button>
                  </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}