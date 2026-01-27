import React, { useState, useEffect } from "react";

export default function EditJobSidebar({ job, open, onClose, onSave }) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    required_skills: "",
    location: "",
    experience_required: "",
    salary_range: "", // Added Salary field
    job_description_file: "" // Can hold URL string (existing) or File object (new)
  });

  // Load job data when the sidebar opens
  useEffect(() => {
    if (job) {
      setFormData({
        id: job.id,
        title: job.title || "",
        description: job.description || "",
        required_skills: job.required_skills || "",
        location: job.location || "",
        experience_required: job.experience_required || "",
        salary_range: job.salary_range || "",
        job_description_file: job.job_description_file || ""
      });
    }
  }, [job]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 🟢 NEW: Handle File Selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, job_description_file: file });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* 1. Backdrop (Click to close) */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      {/* 2. Sidebar Panel */}
      <div className="relative w-full max-w-md bg-white shadow-2xl h-full flex flex-col animate-slide-in-right">

        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Edit Job Details</h2>
            <p className="text-xs text-slate-500">Update the job posting information</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 transition"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Form Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">

          {/* Job Title */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Job Title</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              placeholder="e.g. Senior React Developer"
            />
          </div>

          {/* Location & Experience (2 Columns) */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Location</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="e.g. Mumbai"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Experience (Yrs)</label>
              <input
                type="text"
                name="experience_required"
                value={formData.experience_required}
                onChange={handleChange}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="e.g. 2-5"
              />
            </div>
          </div>

          {/* Skills */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Required Skills</label>
            <input
              type="text"
              name="required_skills"
              value={formData.required_skills}
              onChange={handleChange}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="e.g. Python, Django, SQL"
            />
          </div>

           {/* Salary Range (New) */}
           <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Salary Range</label>
            <input
              type="text"
              name="salary_range"
              value={formData.salary_range}
              onChange={handleChange}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="e.g. ₹12L - ₹18L per annum"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Job Description</label>
            <textarea
              rows="6"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="w-full p-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm leading-relaxed"
              placeholder="Describe the role, responsibilities, and perks..."
            />
          </div>

          {/* 🟢 JD File Upload (Replaced Text Input) */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">JD Document (Upload)</label>

            {/* Show existing URL if it exists (as a string) */}
            {typeof formData.job_description_file === 'string' && formData.job_description_file && (
               <div className="mb-2 flex items-center gap-2 text-xs bg-blue-50 p-2 rounded border border-blue-100 text-blue-700">
                  <span className="text-lg">📄</span>
                  <div className="flex-1 truncate">
                    <span className="font-bold">Current: </span>
                    <a href={formData.job_description_file} target="_blank" rel="noreferrer" className="underline truncate">
                      View Document
                    </a>
                  </div>
               </div>
            )}

            <input
              type="file"
              name="job_description_file"
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx"
              className="w-full text-sm text-slate-500
                file:mr-4 file:py-2.5 file:px-4
                file:rounded-lg file:border-0
                file:text-xs file:font-bold
                file:bg-blue-600 file:text-white
                hover:file:bg-blue-700
                cursor-pointer border border-slate-200 rounded-lg bg-slate-50 transition"
            />
            <p className="text-[10px] text-slate-400 mt-1">Accepted: PDF, DOC, DOCX. Uploading overrides the current file.</p>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-200 bg-slate-50 flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 py-2.5 px-4 bg-white border border-slate-300 text-slate-700 font-bold rounded-lg hover:bg-slate-100 transition"
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit}
            className="flex-1 py-2.5 px-4 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-md transition transform active:scale-95"
          >
            Save Changes
          </button>
        </div>

      </div>
    </div>
  );
}