// HRLayout.jsx
// Sidebar + page content container. Uses <Outlet /> to render nested HR pages (job-list, post-job, etc.).

import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";

export default function HRLayout() {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar column */}
      <div style={{ width: 260 }}>
        <Sidebar />
      </div>

      {/* Main content */}
      <div style={{ flex: 1, padding: 24, background: "#f1f5f9" }}>
        <Outlet />
      </div>
    </div>
  );
}
