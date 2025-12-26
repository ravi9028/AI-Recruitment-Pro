import React from "react";

export default function SearchBar({ onSearch }) {
  return (
    <input
      type="text"
      onChange={(e) => onSearch(e.target.value)}
      className="w-full rounded-lg border border-slate-200 p-3 shadow-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
      placeholder="Search by title, location or skill..."
    />
  );
}
