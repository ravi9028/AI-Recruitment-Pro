import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import HRLayout from "../layout/HRLayout";

export default function HRJobPost() {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    required_skills: "",
    location: "",
    experience_required: "",
    salary_range: "",
    job_description_file: "",
  });

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
// 🟢 NEW: Handle File Upload & Auto-Fill
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // 1. Set the file in state (for saving later)
    setFormData({ ...formData, job_description_file: file });

    // 2. Prepare to send to backend for parsing
    const uploadData = new FormData();
    uploadData.append("file", file);

    setLoading(true); // Show loading state while parsing
    try {
      // NOTE: Ensure you have created this endpoint in your backend
      const res = await fetch("http://localhost:5000/api/hr/parse-jd", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }, // Don't add Content-Type for FormData
        body: uploadData,
      });

      const data = await res.json();

      if (res.ok) {
        // 🟢 MAGICAL FIX: Auto-fill the description box with the PDF text
        setFormData((prev) => ({
          ...prev,
          description: data.extractedText, // The text from the PDF
          required_skills: data.extractedSkills || prev.required_skills // Optional: Auto-fill skills
        }));
        alert("JD Parsed! Description has been auto-filled.");
      } else {
        console.error("Parse error:", data.error);
      }
    } catch (err) {
      console.error("Upload failed", err);
    } finally {
      setLoading(false);
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // 🟢 1. Create a FormData object (The vehicle for files)
    const submissionData = new FormData();

    // 🟢 2. Append all text fields manually
    submissionData.append("title", formData.title);
    submissionData.append("description", formData.description);
    submissionData.append("required_skills", formData.required_skills);
    submissionData.append("location", formData.location);
    submissionData.append("experience_required", formData.experience_required);
    submissionData.append("salary_range", formData.salary_range);

    // 🟢 3. Append the FILE (The critical part)
    // Only append if the user actually selected a file
    if (formData.job_description_file) {
        submissionData.append("job_description_file", formData.job_description_file);
    }

    try {
      const res = await fetch("http://localhost:5000/api/hr/create-job", {
        method: "POST",
        headers: {
          // ❌ REMOVE "Content-Type": "application/json"
          // When using FormData, the browser sets the correct Content-Type (multipart/form-data) automatically.
          Authorization: `Bearer ${token}`,
        },
        body: submissionData, // 🟢 Send the FormData object, NOT JSON string
      });

      const data = await res.json();
      if (res.ok) {
        navigate("/hr/dashboard");
      } else {
        alert(data.error || "Failed to create job");
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };
  return (
    <HRLayout>
      <div className="p-8 max-w-7xl mx-auto min-h-screen font-sans bg-slate-50/50">

        {/* 1. HEADER */}
        <div className="mb-8 animate-fade-in-down">
          <div className="flex justify-between items-end">
             <div>
                <div className="flex items-center gap-3 mb-2">
                   <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-100 text-[10px] font-black uppercase tracking-wider">
                      Recruitment Wizard
                   </span>
                </div>
                <h1 className="text-4xl font-black text-slate-800 tracking-tight">Post a New Opportunity</h1>
                <p className="text-slate-500 font-medium mt-2">
                  Create a role and let our <span className="text-blue-600 font-bold bg-blue-50 px-1 rounded">AI Matching Engine</span> find your top 1% talent.
                </p>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

          {/* LEFT: THE FORM */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 space-y-10 relative overflow-hidden">

              {/* Gradient Top Border */}
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>

              {/* SECTION 1: CORE DETAILS */}
              <div className="space-y-6">
                 <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                    <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">1</div>
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">
                        Role Essentials
                    </h3>
                 </div>

                 {/* Job Title */}
                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-wide">Job Title <span className="text-red-500">*</span></label>
                    <div className="relative group">
                      <span className="absolute left-5 top-4 text-xl group-focus-within:scale-110 transition-transform duration-200 grayscale opacity-50 group-focus-within:grayscale-0 group-focus-within:opacity-100">💼</span>
                      <input
                        required
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        className="w-full pl-14 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all duration-200 font-bold text-slate-800 placeholder:text-slate-300 text-base"
                        placeholder="e.g. Senior Full Stack Engineer"
                      />
                    </div>
                  </div>

                  {/* Grid: Loc / Exp / Salary */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-wide">Location <span className="text-red-500">*</span></label>
                      <div className="relative group">
                        <span className="absolute left-4 top-4 text-lg grayscale opacity-50 group-focus-within:grayscale-0 group-focus-within:opacity-100 transition-all">📍</span>
                        <input
                          required
                          name="location"
                          value={formData.location}
                          onChange={handleChange}
                          className="w-full pl-11 pr-3 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none transition-all font-bold text-slate-700 text-sm"
                          placeholder="City or Remote"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-wide">Experience <span className="text-red-500">*</span></label>
                      <div className="relative group">
                        <span className="absolute left-4 top-4 text-lg grayscale opacity-50 group-focus-within:grayscale-0 group-focus-within:opacity-100 transition-all">⏳</span>
                        <input
                          required
                          name="experience_required"
                          value={formData.experience_required}
                          onChange={handleChange}
                          className="w-full pl-11 pr-3 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none transition-all font-bold text-slate-700 text-sm"
                          placeholder="e.g. 3-5 Years"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-wide">Salary <span className="text-slate-300 font-normal normal-case">(Optional)</span></label>
                      <div className="relative group">
                        <span className="absolute left-4 top-4 text-lg grayscale opacity-50 group-focus-within:grayscale-0 group-focus-within:opacity-100 transition-all">💰</span>
                        <input
                          name="salary_range"
                          value={formData.salary_range}
                          onChange={handleChange}
                          className="w-full pl-11 pr-3 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none transition-all font-bold text-slate-700 text-sm"
                          placeholder="e.g. ₹12L - ₹18L"
                        />
                      </div>
                    </div>
                  </div>
              </div>

              {/* SECTION 2: INTELLIGENCE */}
              <div className="space-y-6">
                 <div className="flex justify-between items-end border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-sm">2</div>
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">
                            AI Calibration
                        </h3>
                    </div>
                    <span className="text-[10px] font-bold bg-purple-50 text-purple-600 border border-purple-100 px-2 py-1 rounded-md flex items-center gap-1 animate-pulse">
                        ✨ Scoring Active
                    </span>
                 </div>

                 {/* Skills */}
                 <div className="bg-purple-50/50 p-6 rounded-2xl border border-purple-100/50">
                    <label className="block text-xs font-bold text-purple-900 uppercase mb-3 tracking-wide">Required Technical Skills <span className="text-red-500">*</span></label>

                    <div className="relative group mb-3">
                      <span className="absolute left-4 top-3.5 text-lg grayscale opacity-50 group-focus-within:grayscale-0 group-focus-within:opacity-100 transition-all">🧠</span>
                      <input
                        required
                        name="required_skills"
                        value={formData.required_skills}
                        onChange={handleChange}
                        className="w-full pl-12 pr-4 py-3.5 bg-white border border-purple-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all font-medium text-slate-700 shadow-sm"
                        placeholder="e.g. React, Node.js, AWS, TypeScript (Comma separated)"
                      />
                    </div>

                    <div className="flex gap-2 items-start">
                        <span className="text-lg">💡</span>
                        <p className="text-xs text-purple-700 leading-relaxed">
                           <strong>Pro Tip:</strong> The AI Ranking Engine uses these exact keywords to score resumes. <br/>
                           Include both generic terms (e.g. "Frontend") and specific tools (e.g. "Redux").
                        </p>
                    </div>
                  </div>
              </div>

              {/* SECTION 3: DESCRIPTION */}
              <div className="space-y-6">
                 <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                    <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-sm">3</div>
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">
                        The Pitch
                    </h3>
                 </div>

                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-wide">Job Description</label>
                    <textarea
                      required
                      rows="8"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      className="w-full p-5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm leading-relaxed text-slate-600 font-medium resize-none"
                      placeholder="Describe the responsibilities, team culture, and benefits..."
                    />
                 </div>

                 {/* File URL */}
                 {/* NEW CODE (ADD THIS) */}
<div>
   <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-wide">
      Auto-Fill from PDF <span className="text-blue-500 font-bold normal-case">(Recommended)</span>
   </label>

   <div className="border-2 border-dashed border-slate-200 hover:border-blue-400 bg-slate-50 hover:bg-blue-50/30 rounded-xl transition-all p-6 text-center group cursor-pointer relative">
      <input
        type="file"
        accept=".pdf,.doc,.docx"
        onChange={handleFileUpload}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
      />

      <div className="flex flex-col items-center gap-2">
         <span className="text-2xl group-hover:scale-110 transition-transform">📄</span>
         <p className="text-sm font-bold text-slate-600">
            {formData.job_description_file?.name ? (
               <span className="text-blue-600">Selected: {formData.job_description_file.name}</span>
            ) : (
               "Click to Upload JD (PDF/DOCX)"
            )}
         </p>
         <p className="text-xs text-slate-400">
            This will extract text and fill the description automatically.
         </p>
      </div>
   </div>
</div>
              </div>

              {/* ACTION BAR */}
              <div className="pt-6 border-t border-slate-100 flex gap-4">
                <button
                   type="button"
                   onClick={() => navigate("/hr/jobs")}
                   className="flex-1 py-4 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 hover:text-slate-800 transition-all text-sm"
                >
                   Save Draft
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-[2] bg-slate-900 hover:bg-blue-600 text-white font-bold py-4 rounded-xl shadow-xl hover:shadow-2xl hover:shadow-blue-200 transition-all transform active:scale-[0.99] flex justify-center items-center gap-3 text-sm tracking-wide"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        Publishing...
                    </span>
                  ) : (
                    <>
                      <span>🚀 Publish Opportunity</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>

          {/* RIGHT: STICKY SIDEBAR */}
          <div className="lg:col-span-1 space-y-6 sticky top-6">

            {/* 🟢 1. LIVE PREVIEW CARD (NOW WITH GRADIENT) */}
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white rounded-2xl shadow-xl shadow-indigo-500/20 border border-white/10 overflow-hidden transition-all duration-300 relative group">

               {/* Background Glow */}
               <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all duration-700"></div>

               <div className="bg-white/10 px-5 py-4 border-b border-white/10 flex justify-between items-center backdrop-blur-md">
                  <span className="text-[10px] font-black text-indigo-100 uppercase tracking-widest">Candidate Preview</span>
                  <div className="flex gap-1.5 opacity-80">
                     <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                     <div className="w-2.5 h-2.5 rounded-full bg-yellow-400"></div>
                     <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
                  </div>
               </div>

               <div className="p-6 relative z-10">
                  <div className="flex justify-between items-start mb-4">
                     <div className="w-12 h-12 rounded-xl bg-white text-indigo-600 flex items-center justify-center font-black text-xl shadow-lg">
                        {formData.title ? formData.title.charAt(0).toUpperCase() : "J"}
                     </div>
                     <span className="text-[10px] font-bold bg-white/20 text-white px-2.5 py-1 rounded-md border border-white/20">
                        {formData.salary_range || "Salary N/A"}
                     </span>
                  </div>

                  <h4 className="font-bold text-white text-lg leading-tight mb-2 line-clamp-2 shadow-sm">
                     {formData.title || "Job Title"}
                  </h4>
                  <p className="text-xs text-indigo-100 font-medium mb-6 flex items-center gap-2">
                     <span>📍 {formData.location || "Location"}</span>
                     <span className="w-1 h-1 bg-indigo-300 rounded-full"></span>
                     <span>⏳ {formData.experience_required || "Exp"} Yrs</span>
                  </p>

                  <div className="flex flex-wrap gap-2 mb-6 min-h-[40px]">
                     {/* ✅ Updated to use required_skills */}
                     {(formData.required_skills ? formData.required_skills.split(',') : ["Skill 1", "Skill 2"]).slice(0,3).map((s,i) => (
                        <span key={i} className="text-[10px] font-bold bg-white/10 text-white border border-white/20 px-2 py-1 rounded-md">
                            {s.trim()}
                         </span>
))}
{(formData.required_skills?.split(',').length > 3) && <span className="text-[10px] text-indigo-200 self-center font-medium">+More</span>}
                  </div>

                  <button className="w-full py-3 bg-white text-indigo-700 text-xs font-bold rounded-xl shadow-lg hover:bg-indigo-50 transition cursor-not-allowed opacity-90">
                     Apply Now
                  </button>
               </div>
            </div>

            {/* 2. AI TIPS CARD (Kept Dark Slate as requested) */}
            <div className="bg-[#0F172A] rounded-2xl p-6 text-white shadow-2xl relative overflow-hidden group border border-slate-800">
              <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl group-hover:bg-indigo-500/30 transition-all duration-500"></div>
              <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-24 h-24 bg-blue-500/20 rounded-full blur-2xl"></div>

              <h3 className="font-bold text-sm mb-4 flex items-center gap-2 relative z-10 text-indigo-100">
                 <span>🤖</span> Intelligence
              </h3>

              <div className="space-y-4 relative z-10">
                 <div className="bg-white/5 rounded-xl p-4 backdrop-blur-md border border-white/5 hover:bg-white/10 transition cursor-help">
                    <p className="text-[10px] text-indigo-300 uppercase font-bold mb-1">Impact Score</p>
                    <p className="text-xs font-medium text-slate-300">Adding <strong>5+ skills</strong> improves matching accuracy by ~40%.</p>
                 </div>

                 <div className="bg-white/5 rounded-xl p-4 backdrop-blur-md border border-white/5 hover:bg-white/10 transition cursor-help">
                    <p className="text-[10px] text-indigo-300 uppercase font-bold mb-1">Keywords</p>
                    <p className="text-xs font-medium text-slate-300">Use industry terms (e.g. "Software Development" vs "Coding").</p>
                 </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </HRLayout>
  );
}
