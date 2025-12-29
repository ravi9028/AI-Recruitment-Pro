import { useState } from "react";

export default function ApplyModal({ job, onClose, onSuccess }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [resumeFile, setResumeFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [videoFile, setVideoFile] = useState(null);
  const token = localStorage.getItem("token");

  // ----------------------------------
  // Submit application (FETCH)
  // ----------------------------------
  const submitApplication = async (e) => {
    e.preventDefault();
    if (!token) {
      alert("Please login first");
      return;
    }

    const form = new FormData();
    form.append("full_name", fullName);
    form.append("email", email);
    form.append("phone", phone);
    form.append("cover_letter", coverLetter);

    if (resumeFile) {
      form.append("resume", resumeFile);
    }
    if (videoFile) {
      form.append("video", videoFile);
    }

    try {
      setLoading(true);

      const res = await fetch(
        `http://localhost:5000/api/jobs/${job.id}/apply`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            // ❌ DO NOT set Content-Type for FormData
          },
          body: form,
        }
      );

      if (res.status === 409) {
  // Already applied — treat as success
  if (onSuccess) onSuccess(job.id);
  onClose();
  return;
}

if (!res.ok) {
  const errData = await res.json().catch(() => ({}));
  throw new Error(errData.error || "Apply failed");
}


      await res.json(); // consume response

      alert("Application submitted successfully");
      if (onSuccess) onSuccess(job.id);
      onClose();
    } catch (err) {
      console.error("Apply failed:", err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      <div className="bg-white w-full max-w-lg rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Apply for Job</h2>

        <form onSubmit={submitApplication} className="space-y-3">
          <input
            className="w-full border p-2 rounded"
            placeholder="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />

          <input
            className="w-full border p-2 rounded"
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            className="w-full border p-2 rounded"
            placeholder="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />

          <textarea
            className="w-full border p-2 rounded"
            placeholder="Cover Letter (optional)"
            value={coverLetter}
            onChange={(e) => setCoverLetter(e.target.value)}
          />

          <input
            type="file"
            onChange={(e) => setResumeFile(e.target.files[0])}
          />

          0{/* ➕ ADD THIS VIDEO INPUT SECTION */}
          <div className="space-y-1 mt-3 border-t pt-3">
            <label className="text-sm font-medium text-gray-700">
              Intro Video (Optional)
            </label>
            <input
              type="file"
              accept="video/*"
              onChange={(e) => setVideoFile(e.target.files[0])}
              className="w-full border p-2 rounded text-sm"
            />
            <p className="text-xs text-gray-500">
              Upload a short video (MP4/WebM) introducing yourself.
            </p>
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded"
            >
              Cancel
            </button>

            <button
  type="submit"
  disabled={loading}
  className={`px-4 py-2 rounded text-white ${
    loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600"
  }`}
>

              {loading ? "Applying..." : "Apply"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
