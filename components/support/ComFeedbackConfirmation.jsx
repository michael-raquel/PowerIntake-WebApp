import React from "react";
import { CheckCircle2 } from "lucide-react";

export default function ComFeedbackConfirmation({
  message = "Thanks for your feedback — we will review it shortly.",
  onClose,
}) {
  return (
    <div className="w-full max-w-lg text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-300">
        <CheckCircle2 className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
        Feedback submitted
      </h3>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
        {message}
      </p>
      <div className="mt-6 flex justify-center">
        <button
          type="button"
          onClick={onClose}
          className="rounded-full bg-violet-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-violet-700 dark:bg-violet-500 dark:hover:bg-violet-600"
        >
          Close
        </button>
      </div>
    </div>
  );
}
