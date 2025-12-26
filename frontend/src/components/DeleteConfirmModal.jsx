import React from "react";

export default function DeleteConfirmModal({ isOpen, onClose, onConfirm }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
      <div className="bg-white shadow-xl rounded-lg w-[400px] p-6 text-center">
        <h2 className="text-xl font-semibold mb-4 text-red-600">
          Delete Job?
        </h2>

        <p className="text-gray-700 mb-6">
          This action cannot be undone. Are you sure you want to delete this job?
        </p>

        <div className="flex justify-center gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
