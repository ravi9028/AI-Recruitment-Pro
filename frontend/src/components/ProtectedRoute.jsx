// ProtectedRoute.jsx
// Ensures a token exists and (optionally) role matches. Used as a wrapper Route element for nested routes.

import React from "react";
import { Navigate, Outlet } from "react-router-dom";

export default function ProtectedRoute({ roleRequired }) {
  // IMPORTANT: make sure Login stores token under the same key (we use "token")
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  // not logged in
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // role mismatch (if roleRequired passed)
  if (roleRequired && role !== roleRequired) {
    // you could navigate to an unauthorized page instead
    return <Navigate to="/login" replace />;
  }

  // allow nested routes to render
  return <Outlet />;
}
