import { useEffect, useState } from "react";
import { ImagePlus, MessageSquare, Star, X } from "lucide-react";

const classificationOptions = [
  { value: "Compliment", hint: "Share what went well" },
  { value: "Problem", hint: "Report a bug or issue" },
  { value: "Suggestion", hint: "Suggest an improvement" },
];

const ratingValues = [1, 2, 3, 4, 5];

export default function ComApplicationFeedbackCreate({
  open,
  onClose,
  onSubmit,
}) {
  const [classification, setClassification] = useState("Compliment");
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [visibility, setVisibility] = useState("Public");

  useEffect(() => {
    if (!open) return;
    setClassification("Compliment");
    setRating(0);
    setFeedback("");
    setVisibility("Public");
  }, [open]);

  if (!open) return null;

  const isSubmitDisabled = !rating || !feedback.trim();
  const handleSubmit = () => {
    if (isSubmitDisabled) return;
    onSubmit?.({
      classification,
      rating,
      feedback: feedback.trim(),
      visibility,
    });
    onClose?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-[95vw] md:max-w-[80vw] lg:max-w-[70vw] xl:max-w-[60vw] 2xl:max-w-[50vw] overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-gray-900"
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-300">
              <MessageSquare className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Create feedback
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Classification, rating, and feedback details for the team.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[calc(100dvh-12rem)] overflow-y-auto px-6 py-6">
          <div className="grid gap-5">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Classification
              </label>
              <select
                value={classification}
                onChange={(event) => setClassification(event.target.value)}
                className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-200 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-100 dark:focus:border-violet-500 dark:focus:ring-violet-900/40"
              >
                {classificationOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.value} - {option.hint}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Rating
              </label>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1">
                  {ratingValues.map((value) => (
                    <button
                      key={`rating-${value}`}
                      type="button"
                      onClick={() => setRating(value)}
                      className="rounded-sm p-0.5"
                      aria-pressed={value <= rating}
                    >
                      <Star
                        className={`h-6 w-6 ${
                          value <= rating
                            ? "text-amber-400"
                            : "text-gray-300 dark:text-gray-600"
                        }`}
                        fill={value <= rating ? "currentColor" : "none"}
                      />
                    </button>
                  ))}
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {rating ? `${rating} / 5` : "Select a rating"}
                </span>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Feedback
              </label>
              <textarea
                rows={6}
                placeholder="Share the details of your experience."
                value={feedback}
                onChange={(event) => setFeedback(event.target.value)}
                className="mt-3 w-full resize-none rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-200 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-100 dark:focus:border-violet-500 dark:focus:ring-violet-900/40"
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Privacy
              </label>
              <div className="mt-3 inline-flex rounded-full border border-gray-200 bg-gray-50 p-1 dark:border-gray-800 dark:bg-gray-950">
                {["Public", "Private"].map((option) => {
                  const isActive = visibility === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setVisibility(option)}
                      className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                        isActive
                          ? "bg-violet-600 text-white shadow-sm"
                          : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      }`}
                      aria-pressed={isActive}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Public feedback is visible to all admins. Private feedback stays internal.
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Attachment
              </label>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-4 py-2 text-xs font-semibold text-violet-700 transition hover:bg-violet-100 dark:border-violet-900/40 dark:bg-violet-950/40 dark:text-violet-200"
                >
                  <ImagePlus className="h-4 w-4" />
                  Upload images
                </button>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Maximum of 5 images. Supported formats: JPG, PNG, GIF.
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <p className="text-[11px] text-gray-400 dark:text-gray-500">
                Your feedback helps improve the app experience for everyone.
              </p>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitDisabled}
                className={`w-full inline-flex items-center justify-center rounded-full px-6 py-2 text-sm font-semibold transition ${
                  isSubmitDisabled
                    ? "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500"
                    : "bg-violet-600 text-white hover:bg-violet-700 dark:bg-violet-500 dark:hover:bg-violet-600"
                }`}
              >
                Submit feedback
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
