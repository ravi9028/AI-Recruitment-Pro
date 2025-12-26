// EditJobSidebar.jsx
import React, { useState } from "react";

export default function EditJobSidebar({ job, open, onClose, onSave }) {
  const [form, setForm] = useState({
    id: job.id,
    title: job.title,
    description: job.description,
    required_skills: job.required_skills,
    location: job.location,
    experience_required: job.experience_required,
    jd_file_url: job.jd_file_url || "",
  });

  if (!open) return null;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const saveChanges = () => {
    onSave(form);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-end z-50">
      <div className="w-96 bg-white text-gray-900 h-full p-6 border-l border-gray-300 shadow-2xl">

        <h2 className="text-xl font-semibold mb-4">Edit Job</h2>

        <div className="space-y-4">
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            className="w-full p-2 rounded border border-gray-300 focus:ring-2 focus:ring-blue-500"
            placeholder="Job Title"
          />

          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows="4"
            className="w-full p-2 rounded border border-gray-300 focus:ring-2 focus:ring-blue-500"
            placeholder="Description"
          />

          <input
            name="required_skills"
            value={form.required_skills}
            onChange={handleChange}
            className="w-full p-2 rounded border border-gray-300 focus:ring-2 focus:ring-blue-500"
            placeholder="Skills"
          />

          <input
            name="location"
            value={form.location}
            onChange={handleChange}
            className="w-full p-2 rounded border border-gray-300 focus:ring-2 focus:ring-blue-500"
            placeholder="Location"
          />

          <input
            name="experience_required"
            value={form.experience_required}
            onChange={handleChange}
            className="w-full p-2 rounded border border-gray-300 focus:ring-2 focus:ring-blue-500"
            placeholder="Experience Required"
          />

          <input
            name="jd_file_url"
            value={form.jd_file_url}
            onChange={handleChange}
            className="w-full p-2 rounded border border-gray-300 focus:ring-2 focus:ring-blue-500"
            placeholder="JD File URL"
          />
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100"
          >
            Cancel
          </button>

          <button
            onClick={saveChanges}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
