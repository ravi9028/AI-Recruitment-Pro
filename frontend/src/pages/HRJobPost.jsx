import React, { useState } from "react";
import HRLayout from "../layout/HRLayout";

function HRJobPost() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [skills, setSkills] = useState("");
  const [location, setLocation] = useState("");
  const [experience, setExperience] = useState("");
  const [jdUrl, setJdUrl] = useState("");

  const token = localStorage.getItem("token");

  const createJob = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          description,
          required_skills: skills,
          location,
          experience_required: experience,
          jd_file_url: jdUrl || null,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to create job");
      }

      await res.json();
      alert("Job created successfully");

      setTitle("");
      setDescription("");
      setSkills("");
      setLocation("");
      setExperience("");
      setJdUrl("");
    } catch (err) {
      console.error("Error creating job:", err);
      alert(err.message);
    }
  };

  return (
    <div className="bg-white p-8 rounded-xl shadow-md max-w-2xl">
      <h1 className="text-3xl font-semibold mb-6">Post a New Job</h1>

      <input
        placeholder="Job Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full p-3 border rounded mb-4"
      />

      <textarea
        placeholder="Job Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full p-3 border rounded mb-4"
      />

      <input
        placeholder="Required Skills"
        value={skills}
        onChange={(e) => setSkills(e.target.value)}
        className="w-full p-3 border rounded mb-4"
      />

      <input
        placeholder="Location"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        className="w-full p-3 border rounded mb-4"
      />

      <input
        placeholder="Experience Required"
        value={experience}
        onChange={(e) => setExperience(e.target.value)}
        className="w-full p-3 border rounded mb-4"
      />

      <input
        placeholder="JD File URL (optional)"
        value={jdUrl}
        onChange={(e) => setJdUrl(e.target.value)}
        className="w-full p-3 border rounded mb-6"
      />

      <button
        onClick={createJob}
        className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700"
      >
        Create Job
      </button>
    </div>
  );
}

export default HRJobPost;
