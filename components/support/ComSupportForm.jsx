"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import ComEmailSupportConfirmation from "./ComEmailSupportConfirmation";

export default function ComSupportForm({ open, onClose }) {
	const [message, setMessage] = useState("");
	const [showConfirmation, setShowConfirmation] = useState(false);
	const [prevOpen, setPrevOpen] = useState(open);

	if (open !== prevOpen) {
		setPrevOpen(open);
		if (!open) {
			setMessage("");
			setShowConfirmation(false);
		}
	}

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

	const isSubmitDisabled = message.trim().length === 0;

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
								<path d="M12 20l9-5-9-5-9 5 9 5z" />
								<path d="M12 12l9-5-9-5-9 5 9 5z" />
							</svg>
						</span>
						<div>
							<h3 className="text-lg font-semibold text-gray-900 dark:text-white">
								Support
							</h3>
							<p className="text-xs text-gray-500 dark:text-gray-400">
								We&apos;d love to help you
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
					{showConfirmation ? (
						<div className="flex items-center justify-center">
							<ComEmailSupportConfirmation
								message={"Your support request has been sent. We'll respond via email soon."}
								onClose={() => {
									setShowConfirmation(false);
									onClose?.();
								}}
							/>
						</div>
					) : (
					<>
						<div className="text-center">
						<h4 className="text-xl font-semibold text-gray-900 dark:text-white">
							We&apos;d love to help you
						</h4>
						<p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
							Reach out and we&apos;ll get in touch within 24 hours.
						</p>
					</div>

					<div className="mt-6">
						<label className="sr-only" htmlFor="support-message">
							Describe your issue
						</label>
						<textarea
							id="support-message"
							rows={10}
							placeholder="Please describe your issue."
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
								onClick={() => {
									setShowConfirmation(true);
									setMessage("");
								}}
							>
								Submit
							</button>
						</div>
					</>
					)}
				</div>
			</div>
		</div>
	);
}
