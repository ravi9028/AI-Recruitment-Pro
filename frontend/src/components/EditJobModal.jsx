import React, { useState, useEffect } from "react";

export default function EditJobModal({ job, isOpen, onClose, onSave }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    required_skills: "",
    location: "",
    experience_required: "",
  });

  useEffect(() => {
    if (job) {
      setForm({
        title: job.title,
        description: job.description,
        required_skills: job.required_skills,
        location: job.location,
        experience_required: job.experience_required,
      });
    }
  }, [job]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
      <div className="bg-white shadow-xl rounded-lg w-[500px] p-6">
        <h2 className="text-xl font-semibold mb-4">Edit Job</h2>

        <div className="space-y-3">
          <input name="title" value={form.title} onChange={handleChange}
            placeholder="Job Title"
            className="w-full border p-2 rounded" />

          <textarea name="description" value={form.description} onChange={handleChange}
            placeholder="Job Description"
            className="w-full border p-2 rounded" />

          <input name="required_skills" value={form.required_skills} onChange={handleChange}
            placeholder="Required Skills"
            className="w-full border p-2 rounded" />

          <input name="location" value={form.location} onChange={handleChange}
            placeholder="Location"
            className="w-full border p-2 rounded" />

          <input name="experience_required" value={form.experience_required} onChange={handleChange}
            placeholder="Experience Required"
            className="w-full border p-2 rounded" />
        </div>

        <div className="flex justify-end gap-3 mt-5">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
          >
            Cancel
          </button>

          <button
            onClick={() => onSave(form)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
