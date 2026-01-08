import React from "react";

export default function SkeletonJobCard() {
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 h-full min-h-[400px] animate-pulse">
      {/* Header Skeleton */}
      <div className="flex justify-between items-start mb-4">
        <div className="h-6 bg-gray-200 rounded w-1/2"></div>
        <div className="h-5 bg-gray-200 rounded-full w-16"></div>
      </div>

      {/* Body Skeleton */}
      <div className="space-y-4 flex-grow">
        <div className="h-3 bg-gray-200 rounded w-full"></div>
        <div className="h-3 bg-gray-200 rounded w-3/4"></div>

        <div className="pt-4 space-y-2">
          <div className="h-3 bg-gray-200 rounded w-1/3"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/4"></div>
        </div>
      </div>

      {/* Footer Skeleton */}
      <div className="mt-6">
        <div className="h-10 bg-gray-200 rounded w-full"></div>
      </div>
    </div>
  );
}