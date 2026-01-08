import React, { useState } from "react";

export default function JobDetailsModal({ job, onClose }) {
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    cover_letter: "",
  });
  const [resume, setResume] = useState(null);
  const [video, setVideo] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!job) return null;

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (type === "resume") setResume(file);
    if (type === "video") setVideo(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!resume) {
      alert("Please upload a resume.");
      return;
    }

    setIsSubmitting(true);
    const data = new FormData();
    data.append("full_name", formData.full_name);
    data.append("email", formData.email);
    data.append("phone", formData.phone);
    data.append("cover_letter", formData.cover_letter);
    data.append("resume", resume);
    if (video) data.append("video", video);

    try {
      const res = await fetch(`http://localhost:5000/api/jobs/${job.id}/apply`, {
        method: "POST",
        body: data,
      });

      const result = await res.json();
      if (res.ok) {
        alert("Application Submitted Successfully!");
        onClose();
      } else {
        alert(result.error || result.message || "Failed to apply");
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong. Check console.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col">

        {/* Header - Look for the Sparkle ✨ */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-start sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">✨ Apply: {job.title}</h2>
            <div className="flex gap-4 text-sm text-slate-500 mt-1">
              <span>📍 {job.location}</span>
              <span>💼 {job.experience_required} Yrs Exp</span>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full transition">✕</button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Full Name */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Full Name</label>
              <input type="text" required placeholder="e.g. John Doe" value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>

            {/* Email & Phone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Email</label>
                <input type="email" required placeholder="john@example.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Phone</label>
                <input type="tel" required placeholder="+91 98765 43210" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            </div>

            {/* Cover Letter */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Cover Letter (Optional)</label>
              <textarea rows="3" placeholder="Why are you a good fit?" value={formData.cover_letter} onChange={(e) => setFormData({ ...formData, cover_letter: e.target.value })} className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"></textarea>
            </div>

            {/* 📂 Beautiful File Uploads */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition relative ${resume ? "border-green-500 bg-green-50" : "border-slate-300 hover:border-blue-400 hover:bg-slate-50"}`}>
                <input type="file" accept=".pdf" required onChange={(e) => handleFileChange(e, "resume")} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                <div className="text-3xl mb-2">{resume ? "📄" : "📤"}</div>
                <p className="text-sm font-bold text-slate-700 truncate max-w-[90%]">{resume ? resume.name : "Upload Resume (PDF)"}</p>
                {resume && <p className="text-xs text-green-600 font-bold mt-2">✓ Attached</p>}
              </div>

              <div className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition relative ${video ? "border-green-500 bg-green-50" : "border-slate-300 hover:border-blue-400 hover:bg-slate-50"}`}>
                <input type="file" accept="video/mp4,video/webm" onChange={(e) => handleFileChange(e, "video")} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                <div className="text-3xl mb-2">{video ? "🎥" : "🎬"}</div>
                <p className="text-sm font-bold text-slate-700 truncate max-w-[90%]">{video ? video.name : "Intro Video (Optional)"}</p>
                {video && <p className="text-xs text-green-600 font-bold mt-2">✓ Attached</p>}
              </div>
            </div>

            {/* Submit */}
            <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-slate-100">
              <button type="button" onClick={onClose} className="px-5 py-2.5 text-slate-600 font-bold hover:bg-slate-100 rounded-lg">Cancel</button>
              <button type="submit" disabled={isSubmitting} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-lg disabled:opacity-50 flex items-center gap-2">
                {isSubmitting ? "Submitting..." : "Submit Application"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}