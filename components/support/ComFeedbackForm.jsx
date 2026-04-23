"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Check, Heart, ImagePlus, Lightbulb, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useFetchTicket } from "@/hooks/UseFetchTicket";
import { useCreateFeedback } from "@/hooks/UseCreateFeedbacks";
import useUploadImage from "@/hooks/UseUploadImage";
import ComFeedbackConfirmation from "./ComFeedbackConfirmation";

const CLASSIFICATION_TEXT = {
	compliment: {
		prompt: "What did you like?",
		placeholder: "Tell us what worked well for you.",
		helper: "Do not include private or sensitive information.",
	},
	problem: {
		prompt: "What did you dislike?",
		placeholder: "Describe the issue you ran into and what happened.",
		helper: "Do not include private or sensitive information.",
	},
	suggestion: {
		prompt: "What can we do better?",
		placeholder: "Share your idea or suggestion for improvement.",
		helper: "Do not include private or sensitive information.",
	},
};

export default function ComFeedbackForm({ open, onClose }) {
	const { tokenInfo, userInfo } = useAuth();
	const currentEntraId = tokenInfo?.account?.localAccountId ?? null;
	const defaultEmail = userInfo?.email || tokenInfo?.account?.username || "";
	const fileInputRef = useRef(null);

	const { tickets, loading: ticketsLoading } = useFetchTicket({
		entrauserid: currentEntraId,
		enabled: open && Boolean(currentEntraId),
	});

	const { createFeedback, submitting, error } = useCreateFeedback();
	const { uploadImage } = useUploadImage();

	const [classification, setClassification] = useState("compliment");
	const [feedbackScope, setFeedbackScope] = useState("ticket");
	const [ticketuuid, setTicketuuid] = useState("");
	const [message, setMessage] = useState("");
	const [contactConsent, setContactConsent] = useState(true);
	const [email, setEmail] = useState("");
	const [uploadedImages, setUploadedImages] = useState([]);
	const [uploading, setUploading] = useState(false);
	const [formError, setFormError] = useState(null);
	const [showConfirmation, setShowConfirmation] = useState(false);

	const classificationOptions = useMemo(
		() => [
			{
				key: "compliment",
				title: "Give a compliment",
				description: "Share what went well.",
				icon: Heart,
			},
			{
				key: "problem",
				title: "Report a problem",
				description: "Tell us what did not go as expected.",
				icon: AlertTriangle,
			},
			{
				key: "suggestion",
				title: "Make a suggestion",
				description: "Share ideas to improve the experience.",
				icon: Lightbulb,
			},
		],
		[]
	);

	const activeCopy = CLASSIFICATION_TEXT[classification] || CLASSIFICATION_TEXT.compliment;

	useEffect(() => {
		if (!open) {
			setClassification("compliment");
			setFeedbackScope("ticket");
			setTicketuuid("");
			setMessage("");
			setContactConsent(true);
			setEmail("");
			setUploadedImages([]);
			setUploading(false);
			setFormError(null);
			setShowConfirmation(false);
			return;
		}

		setEmail((prev) => prev || defaultEmail);
	}, [open, defaultEmail]);

	useEffect(() => {
		if (!open) return;
		if (feedbackScope === "app") {
			setTicketuuid("");
			return;
		}
		if (!ticketuuid && tickets?.length) {
			setTicketuuid(tickets[0]?.v_ticketuuid || "");
		}
	}, [open, feedbackScope, ticketuuid, tickets]);

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

	const handleFileChange = async (event) => {
		const files = Array.from(event.target.files || []);
		if (files.length === 0) return;

		setFormError(null);
		setUploading(true);
		try {
			const uploads = await Promise.all(files.map((file) => uploadImage(file)));
			setUploadedImages((prev) => [...prev, ...uploads]);
		} catch (uploadErr) {
			setFormError(uploadErr.message || "Failed to upload images");
		} finally {
			setUploading(false);
			event.target.value = "";
		}
	};

	const removeImage = (blobName) => {
		setUploadedImages((prev) => prev.filter((img) => img.blobName !== blobName));
	};

	const requiresTicket = feedbackScope === "ticket";
	const isSubmitDisabled =
		!message.trim() ||
		!classification ||
		!feedbackScope ||
		(requiresTicket && !ticketuuid) ||
		!email.trim() ||
		!currentEntraId ||
		uploading ||
		submitting;

	const handleSubmit = async () => {
		if (isSubmitDisabled) return;

		try {
			setFormError(null);
			await createFeedback({
				...(requiresTicket ? { ticketuuid } : {}),
				feedback: message.trim(),
				feedbacktype: feedbackScope,
				contactconsent: contactConsent,
				email: email.trim(),
				classification,
				createdby: currentEntraId,
				images: uploadedImages.length
					? uploadedImages.map((img) => img.url)
					: null,
			});
			setShowConfirmation(true);
		} catch (submitErr) {
			setFormError(submitErr.message || "Failed to submit feedback");
		}
	};

	const ticketOptions = useMemo(() => {
		return [...(tickets || [])].sort((a, b) => {
			const aDate = a?.v_createdat ? new Date(a.v_createdat).getTime() : 0;
			const bDate = b?.v_createdat ? new Date(b.v_createdat).getTime() : 0;
			return bDate - aDate;
		});
	}, [tickets]);

	if (!open) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
			<div className="flex w-full max-w-[95vw] md:max-w-[80vw] lg:max-w-[70vw] xl:max-w-[60vw] 2xl:max-w-[50vw] flex-col overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-gray-900 max-h-[calc(100dvh-4rem)]">
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
								Submit feedback
							</h3>
							<p className="text-xs text-gray-500 dark:text-gray-400">
									Share your thoughts about the app or a ticket experience
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

				<div className="flex-1 overflow-y-auto px-6 py-6">
					{showConfirmation ? (
						<div className="flex items-center justify-center">
							<ComFeedbackConfirmation
								message="Thanks for your feedback. We will review it shortly."
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
									Classify your feedback
								</h4>
								<p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
									Choose the type that best matches your feedback.
								</p>
							</div>

							<div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 px-4 py-4 dark:border-gray-800 dark:bg-gray-950">
								<p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
									Feedback for
								</p>
								<div className="mt-3 grid grid-cols-2 gap-2">
									<button
										type="button"
										onClick={() => setFeedbackScope("ticket")}
										className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
											feedbackScope === "ticket"
												? "border-violet-500 bg-violet-600 text-white shadow-sm"
												: "border-gray-200 bg-white text-gray-700 hover:border-gray-300 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200"
										}`}
									>
										Ticket feedback
									</button>
									<button
										type="button"
										onClick={() => setFeedbackScope("app")}
										className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
											feedbackScope === "app"
												? "border-violet-500 bg-violet-600 text-white shadow-sm"
												: "border-gray-200 bg-white text-gray-700 hover:border-gray-300 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200"
										}`}
									>
										App feedback
									</button>
								</div>
							</div>

							<div className="mt-6 grid gap-3">
								{classificationOptions.map((option) => {
									const Icon = option.icon;
									const isActive = option.key === classification;
									return (
										<button
											key={option.key}
											type="button"
											onClick={() => setClassification(option.key)}
											className={`relative w-full rounded-2xl border px-4 py-3 text-left transition ${
												isActive
													? "border-violet-500 bg-violet-600 text-white shadow-sm"
													: "border-gray-200 bg-white text-gray-900 hover:border-gray-300 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-100"
											}`}
											aria-pressed={isActive}
										>
											<div className="relative z-10 flex w-full items-center justify-between">
												<span
													className={`flex h-11 w-11 items-center justify-center rounded-xl ${
														isActive
															? "bg-white/15 text-white"
															: "bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-300"
													}`}
												>
													<Icon className="h-5 w-5" />
												</span>
												<span className="flex-1 px-4">
													<span className="block text-sm font-semibold">
														{option.title}
													</span>
													<span
														className={`mt-1 block text-xs ${
															isActive ? "text-white/80" : "text-gray-500 dark:text-gray-400"
														}`}
													>
														{option.description}
													</span>
												</span>
												{isActive && (
													<span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white">
														<Check className="h-4 w-4" />
													</span>
												)}
											</div>
										</button>
									);
								})}
							</div>

							<div className={`mt-6 grid gap-4 ${feedbackScope === "ticket" ? "md:grid-cols-2" : ""}`}>
								{feedbackScope === "ticket" && (
									<div>
										<label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
											Ticket
										</label>
										<div className="mt-2">
											<select
												value={ticketuuid}
												onChange={(event) => setTicketuuid(event.target.value)}
												className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-200 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-100 dark:focus:border-violet-500 dark:focus:ring-violet-900/40"
											>
												<option value="">Select a ticket</option>
												{ticketOptions.map((ticket) => (
													<option key={ticket.v_ticketuuid} value={ticket.v_ticketuuid}>
														{ticket.v_ticketnumber ? `#${ticket.v_ticketnumber}` : "Ticket"} - {ticket.v_title || "Untitled"}
													</option>
												))}
											</select>
											{ticketsLoading && (
												<p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
													Loading your tickets...
												</p>
											)}
											{!ticketsLoading && ticketOptions.length === 0 && (
												<p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
													No tickets found yet.
												</p>
											)}
										</div>
									</div>
								)}

								<div>
									<label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
										Email
									</label>
									<div className="mt-2">
										<input
											type="email"
											value={email}
											onChange={(event) => setEmail(event.target.value)}
											placeholder="you@company.com"
											className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-200 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-100 dark:focus:border-violet-500 dark:focus:ring-violet-900/40"
										/>
									</div>
								</div>
							</div>

							<div className="mt-6">
								<label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
									{activeCopy.prompt}
								</label>
								<p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
									{activeCopy.helper}
								</p>
								<textarea
									rows={6}
									placeholder={activeCopy.placeholder}
									value={message}
									onChange={(event) => setMessage(event.target.value)}
									className="mt-3 w-full resize-none rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-200 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-100 dark:focus:border-violet-500 dark:focus:ring-violet-900/40"
								/>
							</div>

							<div className="mt-6">
								<label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
									Add more details
								</label>
								<div className="mt-3 flex flex-wrap items-center gap-3">
									<input
										ref={fileInputRef}
										type="file"
										accept="image/*"
										multiple
										className="hidden"
										onChange={handleFileChange}
									/>
									<button
										type="button"
										onClick={() => fileInputRef.current?.click()}
										disabled={uploading}
										className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition ${
											uploading
												? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400 dark:border-gray-800 dark:bg-gray-900"
												: "border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100 dark:border-violet-900/40 dark:bg-violet-950/40 dark:text-violet-200"
										}`}
									>
										<ImagePlus className="h-4 w-4" />
										{uploading ? "Uploading..." : "Upload an image"}
									</button>
									{uploadedImages.length > 0 && (
										<div className="flex flex-wrap gap-2">
											{uploadedImages.map((img) => (
												<button
													key={img.blobName}
													onClick={() => removeImage(img.blobName)}
													type="button"
													className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-3 py-1 text-[11px] text-gray-600 transition hover:border-gray-300 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-300"
												>
													{img.name}
													<span className="text-gray-400">x</span>
												</button>
											))}
										</div>
									)}
								</div>
							</div>

							<div className="mt-6">
								<p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
									May we contact you about your feedback?
								</p>
								<div className="mt-3 grid gap-2 text-sm text-gray-700 dark:text-gray-200">
									<label className="flex items-center gap-2">
										<input
											type="radio"
											name="contactConsent"
											checked={contactConsent === true}
											onChange={() => setContactConsent(true)}
											className="h-4 w-4 border-gray-300 text-violet-600 focus:ring-violet-500"
										/>
										Yes, you may contact me
									</label>
									<label className="flex items-center gap-2">
										<input
											type="radio"
											name="contactConsent"
											checked={contactConsent === false}
											onChange={() => setContactConsent(false)}
											className="h-4 w-4 border-gray-300 text-violet-600 focus:ring-violet-500"
										/>
										No, do not contact me
									</label>
								</div>
							</div>

							{(formError || error) && (
								<div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-200">
									{formError || error}
								</div>
							)}

							<div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
								<p className="text-[11px] text-gray-400 dark:text-gray-500">
									By pressing Submit, your feedback will be used to improve our products and services.
								</p>
								<button
									type="button"
									onClick={handleSubmit}
									disabled={isSubmitDisabled}
									className={`inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold transition ${
										isSubmitDisabled
											? "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500"
											: "bg-violet-600 text-white hover:bg-violet-700 dark:bg-violet-500 dark:hover:bg-violet-600"
									}`}
								>
									{submitting ? "Submitting..." : "Submit"}
								</button>
							</div>
						</>
					)}
				</div>
			</div>
		</div>
	);
}
