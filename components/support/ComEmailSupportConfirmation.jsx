import React from "react";

export default function ComEmailSupportConfirmation({
  message = "Your support request has been sent. We'll respond via email soon.",
  onClose,
}) {
  return (
    <div className="p-4 bg-white rounded shadow max-w-md dark:bg-gray-900 dark:text-gray-100">
      <h3 className="text-lg font-semibold mb-2">Support request sent</h3>
      <p className="mb-4 text-gray-700 dark:text-gray-300">{message}</p>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 dark:hover:bg-blue-500"
        >
          Close
        </button>
      </div>
    </div>
  );
}
