// src/pages/CandidateProfile.jsx

import React, { useEffect, useState } from "react";
import CandidateLayout from "../layout/CandidateLayout";

// --- 🔔 CUSTOM TOAST COMPONENT (Built-in for safety) ---
const Toast = ({ message, type, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 3000); // Auto-hide after 3 seconds
        return () => clearTimeout(timer);
    }, [onClose]);

    const bgColors = {
        success: "bg-emerald-600",
        error: "bg-red-500",
        info: "bg-blue-500"
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

// --- 📊 STRENGTH METER COMPONENT ---
const StrengthMeter = ({ profile }) => {
    let score = 0;
    if (profile.name) score += 10;
    if (profile.phone) score += 10;
    if (profile.location) score += 10;
    if (profile.resume_url || profile.resume) score += 30;
    if (profile.skills && profile.skills.length > 0) score += 20;
    if (profile.experience) score += 10;
    if (profile.education) score += 10;

    // Cap at 100
    score = Math.min(score, 100);

    let color = "bg-red-500";
    if (score > 40) color = "bg-yellow-500";
    if (score > 80) color = "bg-emerald-500";

    return (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm mb-8">
            <div className="flex justify-between items-end mb-2">
                <div>
                    <h3 className="text-lg font-bold text-slate-800">Profile Strength</h3>
                    <p className="text-xs text-slate-500">Complete your profile to get noticed by AI.</p>
                </div>
                <span className={`text-2xl font-black ${score === 100 ? 'text-emerald-600' : 'text-slate-700'}`}>
                    {score}%
                </span>
            </div>
            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                    className={`h-full transition-all duration-1000 ease-out ${color}`}
                    style={{ width: `${score}%` }}
                ></div>
            </div>
        </div>
    );
};


export default function CandidateProfile() {
  // 1️⃣ STATE
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    skills: [],
    experience: "",
    education: "",
    github: "",
    linkedin: "",
    resume: null, // Holds file object
    resume_url: "", // Holds URL string
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newSkill, setNewSkill] = useState("");
  const [toast, setToast] = useState(null); // State for our new Toast notification

  const token = localStorage.getItem("token");

  // Helper to show toast
  const showToast = (message, type = "success") => {
      setToast({ message, type });
  };

  // 2️⃣ FETCH PROFILE
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/candidate/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();

        // Safe Skills Parsing
        let parsedSkills = [];
        if (Array.isArray(data.skills)) {
            parsedSkills = data.skills;
        } else if (typeof data.skills === "string") {
            try {
                parsedSkills = JSON.parse(data.skills);
            } catch {
                parsedSkills = data.skills.split(",").map(s => s.trim()).filter(Boolean);
            }
        }

        setProfile({
            ...data,
            skills: parsedSkills || [],
            resume: null,
            resume_url: data.resume_url || data.resume || "",
            name: data.name || "",
            email: data.email || "",
            phone: data.phone || "",
            location: data.location || "",
            experience: data.experience || "",
            education: data.education || "",
            github: data.github || "",
            linkedin: data.linkedin || "",
        });
      } catch (err) {
        console.error("Failed to load profile", err);
        showToast("Failed to load profile data", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [token]);

  // 3️⃣ SMART SAVE HANDLER (Safe & Stable)
  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      let finalResumeUrl = profile.resume_url;

      // STEP 1: Upload Resume File (if new one selected)
      if (profile.resume && profile.resume instanceof File) {
          const uploadData = new FormData();
          uploadData.append("file", profile.resume);

          const uploadRes = await fetch("http://localhost:5000/api/upload/resume", {
             method: "POST",
             body: uploadData,
          });

          if (!uploadRes.ok) throw new Error("Resume upload failed.");

          const uploadJson = await uploadRes.json();
          finalResumeUrl = uploadJson.file_url;
      }

      // STEP 2: Update Profile Data (JSON)
      const payload = {
        name: profile.name,
        phone: profile.phone,
        location: profile.location,
        experience: profile.experience,
        education: profile.education,
        skills: profile.skills,
        linkedin: profile.linkedin,
        github: profile.github,
        resume_url: finalResumeUrl
      };

      const updateRes = await fetch("http://localhost:5000/api/candidate/update", {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      if (updateRes.ok) {
        showToast("Profile updated successfully!", "success");
        setProfile(prev => ({
            ...prev,
            resume_url: finalResumeUrl,
            resume: null
        }));
      } else {
        throw new Error("Failed to save profile text.");
      }

    } catch (err) {
      console.error(err);
      showToast(err.message || "Something went wrong", "error");
    } finally {
      setSaving(false);
    }
  };

  // 🛠️ HELPERS
  const addSkill = () => {
    if (newSkill.trim() && !profile.skills.includes(newSkill.trim())) {
      setProfile({ ...profile, skills: [...profile.skills, newSkill.trim()] });
      setNewSkill("");
    }
  };

  const removeSkill = (skill) => {
    setProfile({ ...profile, skills: profile.skills.filter((s) => s !== skill) });
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
        setProfile({ ...profile, resume: e.target.files[0] });
    }
  };

  const getViewUrl = () => {
    if (profile.resume && profile.resume instanceof File) return URL.createObjectURL(profile.resume);
    if (profile.resume_url) return `http://localhost:5000${profile.resume_url}`;
    return null;
  };

  if (loading) return (
    <CandidateLayout>
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-slate-900"></div>
      </div>
    </CandidateLayout>
  );

  return (
    <CandidateLayout>
      <div className="min-h-screen bg-slate-50/50 pb-20 font-sans">

        {/* 🔔 TOAST NOTIFICATION CONTAINER */}
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

        {/* HEADER */}
        <div className="bg-[#0f172a] border-b border-slate-800 px-8 py-10 shadow-lg relative overflow-hidden">
            <div className="max-w-6xl mx-auto relative z-10 flex flex-col md:flex-row justify-between items-end gap-6">
                <div className="flex items-center gap-6">
                    <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-teal-700 rounded-2xl flex items-center justify-center text-4xl font-bold text-white shadow-2xl border-4 border-[#0f172a]">
                        {profile.name?.charAt(0) || "U"}
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-white tracking-tight">{profile.name || "Your Name"}</h1>
                        <p className="text-emerald-400 font-medium flex items-center gap-2 mt-1">
                            <span className="opacity-80">{profile.location || "Location not set"}</span>
                            <span className="text-slate-600">•</span>
                            <span className="opacity-80">{profile.email}</span>
                        </p>
                    </div>
                </div>

                <button
                    onClick={handleUpdate}
                    disabled={saving}
                    className="px-8 py-3 bg-white text-slate-900 rounded-xl font-bold hover:bg-emerald-50 transition shadow-lg flex items-center gap-2 disabled:opacity-50"
                >
                    {saving ? "Saving..." : "Save Changes"}
                </button>
            </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="max-w-6xl mx-auto px-8 -mt-8 relative z-20">

            {/* 📊 NEW PROFILE STRENGTH METER */}
            <StrengthMeter profile={profile} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* LEFT COLUMN: Resume & Skills */}
                <div className="space-y-6">

                    {/* RESUME CARD */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Resume & CV</h3>

                        {!profile.resume && !profile.resume_url && (
                            <div className="relative group">
                                <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center transition-all hover:border-emerald-400 hover:bg-slate-50">
                                    <div className="text-2xl mb-2 opacity-30 group-hover:opacity-100 group-hover:scale-110 transition duration-300">☁️</div>
                                    <p className="text-xs font-bold text-slate-500">Upload Resume</p>
                                    <input type="file" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept=".pdf,.doc,.docx" />
                                </div>
                            </div>
                        )}

                        {(profile.resume || profile.resume_url) && (
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg shadow-sm border border-slate-100 ${profile.resume ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                        {profile.resume ? "📂" : "📄"}
                                    </div>
                                    <div className="flex flex-col overflow-hidden">
                                        <span className="text-xs font-bold text-slate-700 truncate max-w-[180px]">
                                            {profile.resume ? profile.resume.name : "Current_Resume"}
                                        </span>
                                        <span className={`text-[10px] font-bold uppercase tracking-wider ${profile.resume ? 'text-amber-500' : 'text-emerald-500'}`}>
                                            {profile.resume ? "Unsaved Changes" : "Saved on Server"}
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <a
                                        href={getViewUrl() || "#"}
                                        target="_blank"
                                        rel="noreferrer"
                                        className={`flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wide border transition ${getViewUrl() ? "bg-white border-slate-200 hover:border-blue-500 hover:text-blue-600" : "bg-slate-100 text-slate-300 pointer-events-none"}`}
                                    >
                                        👁️ View
                                    </a>
                                    <div className="relative">
                                        <div className="flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wide border bg-slate-900 border-slate-900 text-white hover:bg-slate-800 transition cursor-pointer">
                                            🔄 Replace
                                        </div>
                                        <input type="file" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept=".pdf,.doc,.docx" />
                                    </div>
                                </div>
                            </div>
                        )}
                         <p className="text-[10px] text-slate-400 mt-3 text-center">Supported: PDF, DOCX (Max 5MB)</p>
                    </div>

                    {/* SKILLS */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Skills</h3>
                        <div className="flex flex-wrap gap-2 mb-4">
                            {profile.skills.map((skill, index) => (
                                <span key={index} className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-2 border border-slate-200">
                                    {skill}
                                    <button onClick={() => removeSkill(skill)} className="text-slate-400 hover:text-red-500 hover:bg-slate-200 rounded px-1 transition">×</button>
                                </span>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newSkill}
                                onChange={(e) => setNewSkill(e.target.value)}
                                placeholder="Add skill..."
                                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:border-emerald-500 transition"
                                onKeyDown={(e) => e.key === 'Enter' && addSkill()}
                            />
                            <button onClick={addSkill} className="px-4 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 shadow-md transition">+</button>
                        </div>
                    </div>

                    {/* SOCIALS */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
                         <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Links</h3>
                         <input value={profile.linkedin} onChange={(e) => setProfile({...profile, linkedin: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none" placeholder="LinkedIn URL" />
                         <input value={profile.github} onChange={(e) => setProfile({...profile, github: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none" placeholder="GitHub URL" />
                    </div>
                </div>

                {/* RIGHT COLUMN: FORM */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                        <h3 className="text-lg font-bold text-slate-800 mb-6">Personal Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div><label className="text-[10px] font-black text-slate-400">Name</label><input value={profile.name} onChange={(e) => setProfile({...profile, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold" /></div>
                            <div><label className="text-[10px] font-black text-slate-400">Email</label><input value={profile.email} disabled className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-500" /></div>
                            <div><label className="text-[10px] font-black text-slate-400">Phone</label><input value={profile.phone} onChange={(e) => setProfile({...profile, phone: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold" /></div>
                            <div><label className="text-[10px] font-black text-slate-400">Location</label><input value={profile.location} onChange={(e) => setProfile({...profile, location: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold" /></div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                        <h3 className="text-lg font-bold text-slate-800 mb-6">Experience & Education</h3>
                        <div className="space-y-4">
                            <div><label className="text-[10px] font-black text-slate-400">Experience</label><textarea value={profile.experience} onChange={(e) => setProfile({...profile, experience: e.target.value})} rows="4" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium" /></div>
                            <div><label className="text-[10px] font-black text-slate-400">Education</label><textarea value={profile.education} onChange={(e) => setProfile({...profile, education: e.target.value})} rows="3" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium" /></div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
      </div>
    </CandidateLayout>
  );
}