import React from "react";
import { BrowserRouter, Routes, Route, Link, Navigate } from "react-router-dom";

// Pages
import InterviewRoom from "./pages/InterviewRoom";
import Register from "./pages/Register";
import Login from "./pages/Login";
import CandidateRegister from "./pages/CandidateRegisterForm";
import CandidateProfile from "./pages/CandidateProfile";

// HR Pages
import HRJobPost from "./pages/HRJobPost";
import HRJobList from "./pages/HRJobList";
import HRDashboard from "./pages/HRDashboard";
import HRApplicants from "./pages/HRApplicants";
import HRAnalytics from "./pages/HRAnalytics"; // ✅ IMPORTING THE NEW PAGE

// Layouts & Protection
import ProtectedRoute from "./components/ProtectedRoute";

// Candidate Pages
import JobsPublic from "./pages/JobsPublic";
import CandidateDashboard from "./pages/CandidateDashboard";
import AppliedJobs from "./pages/AppliedJobs";

export default function App() {
  return (
   <BrowserRouter>
  <div className="font-sans text-slate-900 bg-slate-50 min-h-screen">
    <Routes>
      <Route path="/interview/:roomName" element={<InterviewRoom />} />

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Public Routes */}
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/candidate/register" element={<CandidateRegister />} />

      {/* 🛡️ PROTECTED HR ROUTES */}
      <Route element={<ProtectedRoute roleRequired="hr" />}>
          <Route path="/hr/dashboard" element={<HRDashboard />} />
          <Route path="/hr/create-job" element={<HRJobPost />} />
          <Route path="/hr/jobs" element={<HRJobList />} />
          <Route path="/hr/jobs/:jobId/applicants" element={<HRApplicants />} />

          {/* ✅ THIS IS THE MISSING ROUTE */}
          <Route path="/hr/analytics" element={<HRAnalytics />} />
      </Route>

      {/* 🛡️ PROTECTED CANDIDATE ROUTES */}
      <Route path="/candidate/applications" element={<AppliedJobs />} />
      <Route path="/jobs" element={<JobsPublic />} />
      <Route path="/candidate/dashboard" element={<CandidateDashboard />} />
      <Route path="/candidate/profile" element={<CandidateProfile />} />

      {/* Fallback 404 */}
      <Route path="*" element={<div className="p-10 text-center"><h1>404 — Page not found</h1><p>Check the URL or Route definition.</p></div>} />
    </Routes>
  </div>
</BrowserRouter>
  );
}