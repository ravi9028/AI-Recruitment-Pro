// Sidebar.jsx
// Simple sidebar with NavLink so active link is styled.

import React from "react";
import { NavLink } from "react-router-dom";

export default function Sidebar() {
  const linkStyle = ({ isActive }) => ({
    display: "block",
    padding: "12px 20px",
    color: isActive ? "#111" : "#444",
    textDecoration: "none",
  });
const role = localStorage.getItem("role");

  function handleLogout() {
    localStorage.clear();
    window.location.href = "/login";
  }

  return (
    <div style={{ padding: 24, borderRight: "1px solid #eee", minHeight: "100vh", background: "#fff" }}>
      <h2 style={{ marginBottom: 20 }}>
  {role === "hr" ? "HR Dashboard" : "Candidate Dashboard"}
</h2>

{role === "hr" && (
  <>
    <NavLink to="/hr/jobs" style={linkStyle}>Job List</NavLink>
    <NavLink to="/hr/post-job" style={linkStyle}>Post New Job</NavLink>
  </>
)}

{role === "candidate" && (
  <>
    <NavLink to="/candidate/dashboard" style={linkStyle}>Jobs</NavLink>
    <NavLink to="/candidate/applications" style={linkStyle}>My Applications</NavLink>
  </>
)}
      <div style={{ marginTop: 30 }}>
        <button onClick={handleLogout} style={{ color: "crimson", background: "transparent", border: "none", cursor: "pointer" }}>
          Logout
        </button>
      </div>
    </div>
  );
}
