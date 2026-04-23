"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const ratingValues = [1, 2, 3, 4, 5];

export default function ComTicketFeedback({ feedback, onFeedbackChange }) {
	const [isEditing, setIsEditing] = useState(!feedback?.submitted);

	useEffect(() => {
		setIsEditing(!feedback?.submitted);
	}, [feedback?.submitted]);

	const rating = feedback?.rating ?? 0;
	const message = feedback?.message ?? "";
	const submitted = feedback?.submitted ?? false;

	const handleSubmit = () => {
		if (!rating || !message.trim()) return;
		onFeedbackChange?.({ submitted: true, updatedAt: new Date().toISOString() });
		setIsEditing(false);
	};

	return (
		<div className="space-y-4">
			<div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-950">
				<h4 className="text-sm font-semibold text-gray-900 dark:text-white">
					Ticket feedback
				</h4>
				<p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
					Help us improve your experience by sharing your feedback on this ticket. Your insights are valuable in enhancing our support services.
				</p>
			</div>

			{submitted && !isEditing ? (
				<div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
					<div className="flex items-center gap-1">
						{ratingValues.map((value) => (
							<Star
								key={`rating-view-${value}`}
								className={`h-4 w-4 ${
									value <= rating
										? "text-amber-400"
										: "text-gray-300 dark:text-gray-600"
								}`}
								fill={value <= rating ? "currentColor" : "none"}
							/>
						))}
					</div>
					<p className="mt-3 text-sm text-gray-700 dark:text-gray-200">
						{message}
					</p>
					<div className="mt-4 flex items-center justify-between gap-2">
						<p className="text-[11px] text-gray-400 dark:text-gray-500">
							Update your feedback whenever needed.
						</p>
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() => setIsEditing(true)}
							className="border-violet-200 text-violet-700 hover:bg-violet-50 dark:border-violet-700 dark:text-violet-200 dark:hover:bg-violet-950/30"
						>
							Edit feedback
						</Button>
					</div>
				</div>
			) : (
				<div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900 space-y-4">
					<div>
						<p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
							Rating
						</p>
						<div className="mt-2 flex flex-wrap items-center gap-2">
							<div className="flex items-center gap-1">
								{ratingValues.map((value) => (
									<button
										type="button"
										key={`rating-edit-${value}`}
										onClick={() => onFeedbackChange?.({ rating: value })}
										className="rounded-sm p-0.5"
										aria-pressed={value <= rating}
									>
										<Star
											className={`h-5 w-5 ${
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
						<p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
							Feedback
						</p>
						<Textarea
							value={message}
							onChange={(event) => onFeedbackChange?.({ message: event.target.value })}
							rows={4}
							placeholder="Share your feedback..."
							className="mt-2 bg-white dark:bg-gray-900"
						/>
					</div>

					<div className="flex items-center justify-between gap-2">
						<p className="text-[11px] text-gray-400 dark:text-gray-500">
							Submit once. You can update later.
						</p>
						<Button
							type="button"
							size="sm"
							onClick={handleSubmit}
							disabled={!rating || !message.trim()}
							className="bg-violet-600 text-white hover:bg-violet-700 dark:bg-violet-500 dark:hover:bg-violet-600"
						>
							{submitted ? "Update feedback" : "Submit feedback"}
						</Button>
					</div>
				</div>
			)}
		</div>
	);
}
