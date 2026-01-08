import React, { useEffect, useState } from "react";

export default function PreferenceModal({ open, onClose, onSaved }) {
  const [formData, setFormData] = useState({
    preferred_role: "",
    preferred_location: "",
    experience_level: "",
    expected_salary: ""
  });
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem("token");

  // 1. Fetch current preferences when modal opens
  useEffect(() => {
    if (open) {
      const fetchPrefs = async () => {
        try {
          const res = await fetch("http://localhost:5000/api/candidate/preferences", {
            headers: { Authorization: `Bearer ${token}` }
          });
          const data = await res.json();
          if (data.preferences) {
            setFormData({
              preferred_role: data.preferences.preferred_role || "",
              preferred_location: data.preferences.preferred_location || "",
              experience_level: data.preferences.experience_level || "",
              expected_salary: data.preferences.expected_salary || ""
            });
          }
        } catch (err) {
          console.error("Failed to load preferences", err);
        }
      };
      fetchPrefs();
    }
  }, [open, token]);

  // 2. Handle Input Change
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 3. Save Changes
  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/candidate/preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        onSaved();
        onClose();
      } else {
        alert("Failed to save preferences.");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving data.");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    // 🌟 FIX: Added 'text-slate-800' to ensure visibility if something fails
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 animate-fade-in font-sans">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">

        {/* Header - Changed from bg-pro-dark to bg-slate-900 (Standard) */}
        <div className="bg-slate-900 px-6 py-4 flex justify-between items-center">
          <h3 className="text-white font-bold text-lg flex items-center gap-2">
            <span>🎯</span> Update Your Habits
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors text-xl">
            &times;
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Preferred Role</label>
            <input
              type="text"
              name="preferred_role"
              value={formData.preferred_role}
              onChange={handleChange}
              placeholder="e.g. React Developer"
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-600 outline-none transition-all text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Preferred Location</label>
            <input
              type="text"
              name="preferred_location"
              value={formData.preferred_location}
              onChange={handleChange}
              placeholder="e.g. Mumbai, Remote"
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-600 outline-none transition-all text-slate-800"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Experience</label>
              <select
                name="experience_level"
                value={formData.experience_level}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-600 outline-none transition-all text-slate-800"
              >
                <option value="">Select...</option>
                <option value="Fresher">Fresher (0-1 yrs)</option>
                <option value="Junior">Junior (1-3 yrs)</option>
                <option value="Mid">Mid-Level (3-5 yrs)</option>
                <option value="Senior">Senior (5+ yrs)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Expected Salary</label>
              <input
                type="text"
                name="expected_salary"
                value={formData.expected_salary}
                onChange={handleChange}
                placeholder="e.g. 12 LPA"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-600 outline-none transition-all text-slate-800"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 flex justify-end gap-3 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors"
          >
            Cancel
          </button>

          {/* 🌟 FIX: Changed bg-pro-primary to bg-teal-600 (Visible Standard Color) */}
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold rounded-lg shadow-md transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Preferences"}
          </button>
        </div>
      </div>
    </div>
  );
}