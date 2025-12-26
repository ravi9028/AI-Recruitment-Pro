// App.jsx
// Main router. All HR routes are nested under a ProtectedRoute => HRLayout so sidebar + content render correctly.

import React from "react";
import { BrowserRouter, Routes, Route, Link, Navigate } from "react-router-dom";

import Register from "./pages/Register";
import Login from "./pages/Login";
import CandidateForm from "./CandidateForm";
import CandidateRegister from "./pages/CandidateRegisterForm";

import HRJobPost from "./pages/HRJobPost";
import HRJobList from "./pages/HRJobList";
import HRLayout from "./layout/HRLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import JobsPublic from "./pages/JobsPublic";
import CandidateDashboard from "./pages/CandidateDashboard";
import AppliedJobs from "./pages/AppliedJobs";
import HRApplicants from "./components/HRApplicants"


export default function App() {
  return (
   <BrowserRouter>
  <div style={{ padding: 10 }}>
    <Routes>

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Public */}
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/candidate/register" element={<CandidateRegister />} />

      {/* Protected HR */}
      <Route element={<ProtectedRoute roleRequired="hr" />}>
        <Route element={<HRLayout />}>
          <Route path="/hr/post-job" element={<HRJobPost />} />
          <Route path="/hr/jobs" element={<HRJobList />} />
              <Route path="/hr/jobs/:jobId/applicants" element= {<HRApplicants />} />
        </Route>
      </Route>
      <Route
  path="/candidate/applications"
  element={<AppliedJobs />}
  />

      {/* Candidate */}
      <Route path="/jobs" element={<JobsPublic />} />
      <Route path="/candidate/dashboard" element={<CandidateDashboard />} />

      {/* Fallback */}
      <Route path="*" element={<div style={{ padding: 20 }}>404 — Page not found</div>} />
    </Routes>
  </div>
</BrowserRouter>

  );
}
