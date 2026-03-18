"use client";

import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";

export default function ComFeedbackForm({ open, onClose }) {
	const [message, setMessage] = useState("");
	const [selectedMood, setSelectedMood] = useState(null);

	const moods = useMemo(
		() => [
			{
				key: "unhappy",
				label: "Unhappy",
				emoji: "😠",
				accent: "bg-violet-600 text-white",
				body:
					"We\'re truly sorry to hear about your experience. Please help us understand what went wrong and how we can make things right.",
			},
			{
				key: "sad",
				label: "Sad",
				emoji: "😔",
				accent: "bg-blue-600 text-white",
				body:
					"Thanks for letting us know. Your feedback helps us improve and we\'ll do better.",
			},
			{
				key: "okay",
				label: "Okay",
				emoji: "😐",
				accent: "bg-gray-800 text-white",
				body:
					"Thanks for sharing. Tell us what would make this experience better for you.",
			},
			{
				key: "happy",
				label: "Happy",
				emoji: "🙂",
				accent: "bg-emerald-600 text-white",
				body:
					"Awesome! We\'d love to know what\'s working well for you.",
			},
			{
				key: "love",
				label: "Love It",
				emoji: "😍",
				accent: "bg-pink-600 text-white",
				body:
					"Amazing! Share what you love most so we can keep it going.",
			},
		],
		[]
	);

	const activeMood = moods.find((mood) => mood.key === selectedMood) || moods[0];
	const isSubmitDisabled = message.trim().length === 0 || !selectedMood;

	useEffect(() => {
		if (!open) return;

		const handleKey = (event) => {
			if (event.key === "Escape") {
				onClose?.();
			}
		};

		document.addEventListener("keydown", handleKey);
		return () => document.removeEventListener("keydown", handleKey);
	}, [open, onClose]);

	if (!open) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
			<div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl dark:bg-gray-900">
				<div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-800">
					<div className="flex items-center gap-3">
						<span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-300">
							<svg
								viewBox="0 0 24 24"
								className="h-4 w-4"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
							>
								<path d="M21 15a4 4 0 0 1-4 4H7l-4 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
							</svg>
						</span>
						<div>
							<h3 className="text-lg font-semibold text-gray-900 dark:text-white">
								Feedback
							</h3>
							<p className="text-xs text-gray-500 dark:text-gray-400">
								Help us improve your experience
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

				<div className="px-6 py-6">
					<div className="text-center">
						<h4 className="text-2xl font-semibold text-gray-900 dark:text-white">
							How are you feeling?
						</h4>
						<p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
							Your input is valuable in helping us better understand your needs and
							tailor our service accordingly.
						</p>
					</div>

					<div className="mt-6 flex items-center justify-center gap-6">
						{moods.map((mood) => {
							const isActive = mood.key === selectedMood;
							return (
								<button
									key={mood.key}
									type="button"
									onClick={() => setSelectedMood(mood.key)}
									className={`flex h-12 w-12 items-center justify-center rounded-full border text-xl transition ${
										isActive
											? "border-violet-400 bg-violet-50 ring-2 ring-violet-200 dark:border-violet-500 dark:bg-violet-900/30 dark:ring-violet-900/60"
											: "border-gray-200 bg-gray-100 text-gray-500 hover:border-gray-300 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-400"
									}`}
									aria-pressed={isActive}
								>
									<span aria-hidden>{mood.emoji}</span>
									<span className="sr-only">{mood.label}</span>
								</button>
							);
						})}
					</div>

					<div className="mt-4 flex items-center justify-center">
						<span
							className={`rounded-full px-4 py-1 text-xs font-semibold ${
								activeMood?.accent || "bg-violet-600 text-white"
							}`}
						>
							{activeMood?.label || "Unhappy"}
						</span>
					</div>

					<div className="mt-4">
						<label className="sr-only" htmlFor="feedback-message">
							Share your feedback
						</label>
						<textarea
							id="feedback-message"
							rows={8}
							placeholder={activeMood?.body}
							value={message}
							onChange={(event) => setMessage(event.target.value)}
							className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-200 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-100 dark:focus:border-violet-500 dark:focus:ring-violet-900/40"
						/>
					</div>

					<div className="mt-6">
						<button
							type="button"
							className={`w-full rounded-full px-6 py-3 text-sm font-semibold transition ${
								isSubmitDisabled
									? "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500"
									: "bg-violet-600 text-white hover:bg-violet-700 dark:bg-violet-500 dark:hover:bg-violet-600"
							}`}
							disabled={isSubmitDisabled}
						>
							Submit
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
