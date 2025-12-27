// CandidateRegister.jsx
// Page: Candidate registration form for applicants.
// - Professional, clean UI (responsive).
// - Handles resume upload to backend (/api/upload/resume).
// - Submits candidate JSON to backend (/api/candidates).
// - Uses token from localStorage ("token") for candidate creation if needed.
// - Inline comments explain important parts.

import React, { useState } from "react";
import axios from "axios"; // or use your api helper if available: import api from "../utils/api";

const API_BASE = "http://localhost:5000"; // change if your backend uses different host

export default function CandidateRegister() {
  // form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [skills, setSkills] = useState("");
  const [experience, setExperience] = useState("");
  const [resumeFile, setResumeFile] = useState(null);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [errors, setErrors] = useState({});

  // small client-side validation
  function validate() {
    const e = {};
    if (!name.trim()) e.name = "Name is required";
    if (!email.trim()) e.email = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(email)) e.email = "Invalid email";
    if (!phone.trim()) e.phone = "Phone is required";
    if (!resumeFile) e.resume = "Resume is required";
    return e;
  }

  // upload resume via the upload endpoint, returns file_url or throws
async function uploadResume(file) {
  const form = new FormData();
  form.append("file", file);

  const res = await fetch(
    "http://localhost:5000/api/upload/resume",
    {
      method: "POST",
      body: form,
    }
  );

  if (!res.ok) throw new Error("Resume upload failed");

  const data = await res.json();
  return data.file_url;
}


  // main submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setErrors({});
    const v = validate();
    if (Object.keys(v).length) {
      setErrors(v);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setLoading(true);

    try {
      // 1) Upload resume first
      const resumeUrl = await uploadResume(resumeFile);

      // 2) Get the token from localStorage (MUST match your Login.jsx storage key)
      const token = localStorage.getItem("token");

      // 3) Prepare payload - we REMOVE user_id: null because the backend
      // will now get the ID from the Token instead
      const payload = {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        location: location.trim(),
        experience: experience.trim(),
        skills: skills.trim(),
        resume_url: resumeUrl,
        video_url: ""
      };

      // 4) Send candidate data with Authorization Header
      const res = await fetch("http://localhost:5000/api/candidates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // ✅ THIS IS THE FIX: It tells Flask who is registering
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Profile creation failed");
      }

      setMessage({ type: "success", text: "Profile created! You can now apply for jobs." });

      // Clear form
      setName(""); setEmail(""); setPhone(""); setLocation("");
      setSkills(""); setExperience(""); setResumeFile(null);

    } catch (err) {
      console.error("Submit error:", err);
      setMessage({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="candidate-container" style={styles.page}>
      <div style={styles.card}>
        <h2 style={styles.title}>Candidate Registration</h2>

        {message && (
          <div style={ message.type === "success" ? styles.success : styles.error }>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form} noValidate>
          <div style={styles.row}>
            <label style={styles.label}>Full name</label>
            <input
              name="name"
              id="name"
              style={styles.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. John Doe"
            />
            {errors.name && <div style={styles.fieldError}>{errors.name}</div>}
          </div>

          <div style={styles.row}>
            <label style={styles.label}>Email</label>
            <input
              name="email"
              id="email"
              type="email"
              style={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
            />
            {errors.email && <div style={styles.fieldError}>{errors.email}</div>}
          </div>

          <div style={styles.flexRow}>
            <div style={styles.col}>
              <label style={styles.label}>Phone</label>
              <input
                name="phone"
                id="phone"
                style={styles.input}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
              />
              {errors.phone && <div style={styles.fieldError}>{errors.phone}</div>}
            </div>

            <div style={styles.col}>
              <label style={styles.label}>Location</label>
              <input
                name="location"
                id="location"
                style={styles.input}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="City, Country"
              />
            </div>
          </div>

          <div style={styles.row}>
            <label style={styles.label}>Experience</label>
            <input
              name="experience"
              id="experience"
              style={styles.input}
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              placeholder="e.g. 2 years"
            />
          </div>

          <div style={styles.row}>
            <label style={styles.label}>Skills</label>
            <input
              name="skills"
              id="skills"
              style={styles.input}
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="Comma separated (React, Node, SQL)"
            />
          </div>

          <div style={styles.row}>
            <label style={styles.label}>Upload Resume (PDF / DOC)</label>
            <input
              name="resume"
              id="resume"
              type="file"
              accept=".pdf,.doc,.docx"
              style={styles.fileInput}
              onChange={(e) => setResumeFile(e.target.files && e.target.files[0])}
            />
            {errors.resume && <div style={styles.fieldError}>{errors.resume}</div>}
          </div>

          <div style={{ ...styles.row, justifyContent: "flex-end" }}>
            <button type="submit" disabled={loading} style={styles.button}>
              {loading ? "Submitting..." : "Submit Application"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// simple inline styles to produce a clean professional look — you can move them to CSS file
const styles = {
  page: {
    display: "flex",
    justifyContent: "center",
    padding: "28px 16px",
  },
  card: {
    width: "100%",
    maxWidth: 820,
    background: "#fff",
    borderRadius: 12,
    boxShadow: "0 6px 24px rgba(8,15,30,0.08)",
    padding: 28,
  },
  title: {
    margin: 0,
    marginBottom: 14,
    fontSize: 22,
    fontWeight: 700,
    color: "#0f172a"
  },
  form: {
    display: "flex",
    flexDirection: "column",
  },
  row: {
    marginBottom: 12,
    display: "flex",
    flexDirection: "column"
  },
  flexRow: {
    display: "flex",
    gap: 14,
    marginBottom: 12,
    flexWrap: "wrap"
  },
  col: {
    flex: 1,
    minWidth: 200
  },
  label: {
    fontSize: 13,
    marginBottom: 6,
    color: "#334155",
    fontWeight: 600
  },
  input: {
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #e6e9ef",
    fontSize: 14,
    outline: "none",
    width: "100%"
  },
  fileInput: {
    fontSize: 14,
    padding: "6px 0"
  },
  button: {
    background: "#0f172a",
    color: "#fff",
    border: "none",
    padding: "10px 16px",
    borderRadius: 8,
    cursor: "pointer"
  },
  fieldError: {
    marginTop: 6,
    color: "#b91c1c",
    fontSize: 13
  },
  success: {
    marginBottom: 12,
    padding: 10,
    background: "#ecfeff",
    border: "1px solid #a7f3d0",
    color: "#064e3b",
    borderRadius: 8
  },
  error: {
    marginBottom: 12,
    padding: 10,
    background: "#fff1f2",
    border: "1px solid #fecaca",
    color: "#7f1d1d",
    borderRadius: 8
  }
};
