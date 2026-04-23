import { useState } from "react";
import { ChevronDown, ChevronUp, MoreVertical, ThumbsUp } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

function getInitials(name) {
	return name
		.split(" ")
		.filter(Boolean)
		.map((part) => part[0])
		.join("")
		.slice(0, 2)
		.toUpperCase();
}

export default function ComApplicationFeedBackComment({
	comment,
	itemId,
	depth = 0,
	onAddComment,
	onToggleCommentLike,
	onEditComment,
	onDeleteComment,
	canAddComment = false,
	canToggleCommentLike = false,
	canEditComment = false,
	canDeleteComment = false,
}) {
	const [isReplyOpen, setIsReplyOpen] = useState(false);
	const [replyDraft, setReplyDraft] = useState("");
	const [showReplies, setShowReplies] = useState(true);
	const replies = comment.replies || [];
	const likedByMe = Boolean(comment.likedByMe);
	const likeCount = comment.likes ?? 0;

	const handleMenuAction = (event, action) => {
		action?.();
		const details = event.currentTarget.closest("details");
		if (details) {
			details.removeAttribute("open");
		}
	};

	const handleToggleReply = () => {
		setIsReplyOpen((prev) => !prev);
	};

	const handleCancelReply = () => {
		setIsReplyOpen(false);
		setReplyDraft("");
	};

	const handleReplySubmit = (event) => {
		event.preventDefault();
		if (!canAddComment) return;
		const message = replyDraft.trim();
		if (!message) return;
		onAddComment?.(itemId, message, comment.id);
		setReplyDraft("");
		setIsReplyOpen(false);
	};

	return (
		<div
			className={`flex items-start gap-3 ${depth > 0 ? "ml-8 sm:ml-12" : ""}`}
		>
			<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-[11px] font-semibold text-violet-600 dark:bg-violet-900/40 dark:text-violet-200">
				{getInitials(comment.name || "User")}
			</div>
			<div className="min-w-0 flex-1">
				<div className="flex flex-col">
					<div className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200">
						<div className="flex items-start justify-between gap-2">
							<div className="flex flex-wrap items-center gap-2">
								<p className="text-[11px] font-semibold text-gray-600 dark:text-gray-300">
									{comment.name}
								</p>
								{comment.createdAt && (
									<span className="text-[10px] text-gray-400 dark:text-gray-500">
										{comment.createdAt}
									</span>
								)}
							</div>
							{(canEditComment || canDeleteComment) && (
								<details className="relative">
									<summary className="list-none inline-flex h-6 w-6 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 dark:hover:bg-gray-800 [&::-webkit-details-marker]:hidden cursor-pointer">
										<MoreVertical className="h-3.5 w-3.5" />
									</summary>
									<div className="absolute right-0 z-10 mt-2 w-32 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 text-sm text-gray-600 shadow-lg dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200">
										{canEditComment && (
											<button
												type="button"
												onClick={(event) => handleMenuAction(event, () => onEditComment?.(itemId, comment))}
												className="w-full px-4 py-2 text-left text-xs font-semibold hover:bg-gray-50 dark:hover:bg-gray-800"
											>
												Edit
											</button>
										)}
										{canDeleteComment && (
											<button
												type="button"
												onClick={(event) => handleMenuAction(event, () => onDeleteComment?.(itemId, comment.id))}
												className="w-full px-4 py-2 text-left text-xs font-semibold text-red-500 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950/40"
											>
												Delete
											</button>
										)}
									</div>
								</details>
							)}
						</div>
						<p className="mt-1 text-sm text-gray-700 dark:text-gray-200 break-words">
							{comment.comment}
						</p>
						<div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-gray-500 dark:text-gray-400">
							{canToggleCommentLike && (
								<button
									type="button"
									onClick={() => onToggleCommentLike?.(itemId, comment.id)}
									className={`inline-flex items-center gap-1 font-semibold transition ${
										likedByMe
											? "text-violet-600 dark:text-violet-300"
											: "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
									}`}
									aria-pressed={likedByMe}
								>
									<ThumbsUp className="h-3.5 w-3.5" />
									<span>{likedByMe ? "Liked" : "Like"}</span>
									{likeCount > 0 && <span>({likeCount})</span>}
								</button>
							)}
							{canAddComment && (
								<button
									type="button"
									onClick={handleToggleReply}
									className="font-semibold text-gray-500 transition hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
								>
									Reply
								</button>
							)}
						</div>
					</div>
				</div>

				{replies.length > 0 && (
					<button
						type="button"
						onClick={() => setShowReplies(!showReplies)}
						className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-violet-600 transition hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300"
					>
						{showReplies ? (
							<>
								<ChevronUp className="h-3.5 w-3.5" />
								<span>Hide {replies.length} {replies.length === 1 ? 'reply' : 'replies'}</span>
							</>
						) : (
							<>
								<ChevronDown className="h-3.5 w-3.5" />
								<span>Show {replies.length} {replies.length === 1 ? 'reply' : 'replies'}</span>
							</>
						)}
					</button>
				)}

				{isReplyOpen && canAddComment && (
					<form className="mt-3 space-y-2" onSubmit={handleReplySubmit}>
						<Textarea
							value={replyDraft}
							onChange={(event) => setReplyDraft(event.target.value)}
							placeholder="Write a reply..."
							rows={2}
							className="bg-white text-sm dark:bg-gray-900"
						/>
						<div className="flex items-center justify-end gap-2">
							<Button
								type="button"
								variant="ghost"
								size="sm"
								onClick={handleCancelReply}
							>
								Cancel
							</Button>
							<Button
								type="submit"
								size="sm"
								className="bg-violet-600 text-white hover:bg-violet-700 dark:bg-violet-500 dark:hover:bg-violet-600"
								disabled={!replyDraft.trim()}
							>
								Post reply
							</Button>
						</div>
					</form>
				)}

				{showReplies && replies.length > 0 && (
					<div className="mt-3 space-y-3">
						{replies.map((reply) => (
							<ComApplicationFeedBackComment
								key={reply.id}
								comment={reply}
								itemId={itemId}
								depth={depth + 1}
								onAddComment={onAddComment}
								onToggleCommentLike={onToggleCommentLike}
								onEditComment={onEditComment}
								onDeleteComment={onDeleteComment}
								canAddComment={canAddComment}
								canToggleCommentLike={canToggleCommentLike}
								canEditComment={canEditComment}
								canDeleteComment={canDeleteComment}
							/>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
