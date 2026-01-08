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
        alert("You have already applied for this job.");
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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">

        {/* ✨ IMPROVED HEADER */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-800 leading-tight">Apply for {job?.title}</h2>
            {/* Styled Badges for Location & Experience */}
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-bold border border-slate-200 flex items-center gap-1">
                📍 {job?.location}
              </span>
              <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-bold border border-slate-200 flex items-center gap-1">
                💼 {job?.experience_required} Yrs Exp
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition"
          >
            ✕
          </button>
        </div>

        <form onSubmit={submitApplication} className="space-y-4">
          <input
            className="w-full border border-slate-300 p-3 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
            placeholder="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <input
              className="w-full border border-slate-300 p-3 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
              placeholder="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              className="w-full border border-slate-300 p-3 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
              placeholder="Phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>

          <textarea
            className="w-full border border-slate-300 p-3 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
            placeholder="Cover Letter (optional)"
            rows="3"
            value={coverLetter}
            onChange={(e) => setCoverLetter(e.target.value)}
          />

          {/* 📂 SIDE-BY-SIDE UPLOAD GRID (Fixed!) */}
          <div className="grid grid-cols-2 gap-4 pt-2">

            {/* 📄 RESUME SECTION (Left) */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Resume (PDF)</label>

              <div className={`relative border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-center cursor-pointer transition hover:bg-slate-50 h-32
                  ${resumeFile ? "border-green-500 bg-green-50" : "border-slate-300 hover:border-blue-400"}`}
              >
                <input
                  type="file"
                  accept=".pdf"
                  required
                  onChange={(e) => setResumeFile(e.target.files[0])}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />

                <div className="pointer-events-none w-full px-2">
                  {resumeFile ? (
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-2xl">✅</span>
                      <p className="text-xs font-bold text-green-700 truncate w-full px-2">
                        {resumeFile.name}
                      </p>
                      <p className="text-[10px] text-green-600 font-semibold">Attached</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-2xl text-slate-400">📄</span>
                      <div>
                        <p className="text-xs font-bold text-slate-600">Upload Resume</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">PDF Only</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 🎥 VIDEO SECTION (Right) */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Intro Video</label>

              <div className={`relative border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-center cursor-pointer transition hover:bg-slate-50 h-32
                  ${videoFile ? "border-blue-500 bg-blue-50" : "border-slate-300 hover:border-blue-400"}`}
              >
                <input
                  type="file"
                  accept="video/mp4,video/webm"
                  onChange={(e) => setVideoFile(e.target.files[0])}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />

                <div className="pointer-events-none w-full px-2">
                  {videoFile ? (
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-2xl">🎥</span>
                      <p className="text-xs font-bold text-blue-700 truncate w-full px-2">
                        {videoFile.name}
                      </p>
                      <p className="text-[10px] text-blue-600 font-semibold">Attached</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-2xl text-slate-400">🎬</span>
                      <div>
                        <p className="text-xs font-bold text-slate-600">Upload Video</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">MP4/WebM</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 mt-4 pt-5 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-lg hover:shadow-blue-500/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Submitting..." : "Submit Application"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}