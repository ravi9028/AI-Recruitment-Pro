// src/components/PreferenceModal.jsx
import React, { useState, useEffect } from "react";

export default function PreferenceModal({ open, onClose, onSaved }) {
  const [preferredRole, setPreferredRole] = useState("");
  const [preferredLocation, setPreferredLocation] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");
  const [expectedSalary, setExpectedSalary] = useState("");

  const token = localStorage.getItem("token");

  // ----------------------------------
  // Load existing preferences (FETCH)
  // ----------------------------------
  useEffect(() => {
    if (!open || !token) return;

    const loadPreferences = async () => {
      try {
        const res = await fetch(
          "http://localhost:5000/api/candidate/preferences",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) {
          throw new Error("Failed to load preferences");
        }

        const data = await res.json();
        const p = data.preferences;

        if (p) {
          setPreferredRole(p.preferred_role || "");
          setPreferredLocation(p.preferred_location || "");
          setExperienceLevel(p.experience_level || "");
          setExpectedSalary(p.expected_salary || "");
        } else {
          // reset if no preferences saved
          setPreferredRole("");
          setPreferredLocation("");
          setExperienceLevel("");
          setExpectedSalary("");
        }
      } catch (err) {
        console.error("Could not load preferences:", err);
      }
    };

    loadPreferences();
  }, [open, token]);

  // ----------------------------------
  // Save preferences (FETCH)
  // ----------------------------------
  const savePreferences = async () => {
    try {
      const res = await fetch(
        "http://localhost:5000/api/candidate/preferences",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            preferred_role: preferredRole,
            preferred_location: preferredLocation,
            experience_level: experienceLevel,
            expected_salary: expectedSalary,
          }),
        }
      );

      if (!res.ok) {
        throw new Error("Failed to save preferences");
      }

      alert("Preferences saved successfully");
      if (onSaved) onSaved();
      onClose();
    } catch (err) {
      console.error("Error saving preferences", err);
      alert("Failed to save preferences");
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white w-full max-w-xl rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Career Preferences</h3>
          <button onClick={onClose} className="text-gray-600">
            ✖
          </button>
        </div>

        <div className="space-y-3">
          <label className="block">
            <div className="text-sm text-gray-700 mb-1">
              Job role / keyword
            </div>
            <input
              type="text"
              value={preferredRole}
              onChange={(e) => setPreferredRole(e.target.value)}
              placeholder="e.g. React Developer"
              className="w-full border px-3 py-2 rounded"
            />
          </label>

          <label className="block">
            <div className="text-sm text-gray-700 mb-1">
              Preferred location
            </div>
            <input
              type="text"
              value={preferredLocation}
              onChange={(e) => setPreferredLocation(e.target.value)}
              placeholder="City / Country"
              className="w-full border px-3 py-2 rounded"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <div className="text-sm text-gray-700 mb-1">
                Experience level
              </div>
              <select
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value)}
                className="w-full border px-3 py-2 rounded"
              >
                <option value="">-- Select --</option>
                <option value="0-1">0-1 years</option>
                <option value="1-3">1-3 years</option>
                <option value="3-5">3-5 years</option>
                <option value="5+">5+ years</option>
              </select>
            </label>

            <label className="block">
              <div className="text-sm text-gray-700 mb-1">
                Expected salary
              </div>
              <input
                type="text"
                value={expectedSalary}
                onChange={(e) => setExpectedSalary(e.target.value)}
                placeholder="e.g. 6 LPA"
                className="w-full border px-3 py-2 rounded"
              />
            </label>
          </div>

          <div className="flex gap-3 justify-end mt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 border rounded"
            >
              Cancel
            </button>
            <button
              onClick={savePreferences}
              className="px-4 py-2 bg-blue-600 text-white rounded"
            >
              Save Preferences
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
