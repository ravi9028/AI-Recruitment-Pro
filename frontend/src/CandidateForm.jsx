import { useState } from "react";

function CandidateForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeUrl, setResumeUrl] = useState("");
  const [status, setStatus] = useState("");

  // ----------------------------------
  // Upload resume (FETCH)
  // ----------------------------------
  const uploadResume = async () => {
    if (!resumeFile) {
      alert("Please select a file to upload!");
      return;
    }

    const form = new FormData();
    form.append("file", resumeFile);

    try {
      setStatus("Uploading resume...");

      const res = await fetch(
        "http://localhost:5000/api/upload/resume",
        {
          method: "POST",
          body: form, // ❗ do NOT set Content-Type
        }
      );

      if (!res.ok) {
        throw new Error("Resume upload failed");
      }

      const data = await res.json();
      setResumeUrl(data.file_url);
      setStatus("Resume uploaded successfully!");
    } catch (err) {
      console.error(err);
      setStatus("Error uploading resume");
    }
  };

  // ----------------------------------
  // Save candidate (FETCH)
  // ----------------------------------
  const saveCandidate = async () => {
    if (!resumeUrl) {
      alert("Upload resume first!");
      return;
    }

    try {
      const res = await fetch(
        "http://localhost:5000/api/candidates",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            email,
            phone,
            resume_url: resumeUrl,
          }),
        }
      );

      if (!res.ok) {
        throw new Error("Failed to save candidate");
      }

      const data = await res.json();
      alert("Candidate created with ID: " + data.candidate_id);
    } catch (err) {
      console.error(err);
      alert("Error saving candidate");
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Create Candidate</h2>

      <input
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <br />
      <br />

      <input
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <br />
      <br />

      <input
        placeholder="Phone"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />
      <br />
      <br />

      <h3>Upload Resume</h3>
      <input
        type="file"
        onChange={(e) => setResumeFile(e.target.files[0])}
      />
      <button onClick={uploadResume}>Upload Resume</button>

      <p>{status}</p>

      <button onClick={saveCandidate}>Save Candidate</button>

      {resumeUrl && (
        <p>
          Resume uploaded:{" "}
          <a
            href={`http://localhost:5000${resumeUrl}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            View Resume
          </a>
        </p>
      )}
    </div>
  );
}

export default CandidateForm;
