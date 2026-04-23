import { useState } from "react";
import { ChevronLeft, ChevronRight, X, Star, ThumbsUp, MessageSquare, MoreVertical } from "lucide-react";
import ComApplicationFeedBackComment from "./ComApplicationFeedBackComment";
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

function renderStars(rating) {
  return Array.from({ length: 5 }).map((_, index) => (
    <Star
      key={`rating-${rating}-${index}`}
      className={`h-4 w-4 ${
        index < rating
          ? "text-amber-400"
          : "text-gray-300 dark:text-gray-600"
      }`}
      fill={index < rating ? "currentColor" : "none"}
    />
  ));
}

function getCommentCount(comments = []) {
  return comments.reduce(
    (total, comment) => total + 1 + getCommentCount(comment.replies || []),
    0
  );
}

export default function ComApplicationFeedbackPhotoViewer({
  open,
  onClose,
  item,
  initialImageIndex = 0,
  onToggleFeedbackLike,
  onAddComment,
  onToggleCommentLike,
  onEditComment,
  onDeleteComment,
  onEdit,
  onDelete,
}) {
  const [currentImageIndex, setCurrentImageIndex] = useState(initialImageIndex);
  const [commentDraft, setCommentDraft] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [mobileCommentsOpen, setMobileCommentsOpen] = useState(false);

  if (!open || !item) return null;

  const images = item.images || [];
  const comments = item.comments || [];
  const commentCount = getCommentCount(comments);
  const feedbackLikeCount = item.likes ?? 0;
  const feedbackLikedByMe = Boolean(item.likedByMe);

  const canNavigatePrev = currentImageIndex > 0;
  const canNavigateNext = currentImageIndex < images.length - 1;

  const handlePrev = () => {
    if (canNavigatePrev) {
      setCurrentImageIndex((prev) => prev - 1);
    }
  };

  const handleNext = () => {
    if (canNavigateNext) {
      setCurrentImageIndex((prev) => prev + 1);
    }
  };

  const handleMenuAction = (event, action) => {
    action?.();
    const details = event.currentTarget.closest("details");
    if (details) {
      details.removeAttribute("open");
    }
  };

  const handleCommentSubmit = (event) => {
    event.preventDefault();
    const message = commentDraft.trim();
    if (!message) return;
    onAddComment?.(item.id, message);
    setCommentDraft("");
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      {/* Desktop Layout */}
      <div className="hidden md:flex flex-1">
        <button
          type="button"
          onClick={onClose}
          className="absolute left-4 top-4 z-10 rounded-full bg-black/50 p-2 text-white transition hover:bg-black/70"
          aria-label="Close photo viewer"
        >
          <X className="h-5 w-5" />
        </button>

        {(onEdit || onDelete) && (
          <details className="absolute right-4 top-4 z-10">
            <summary className="list-none inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white transition hover:bg-black/70 [&::-webkit-details-marker]:hidden cursor-pointer">
              <MoreVertical className="h-4 w-4" />
            </summary>
            <div className="absolute right-0 mt-2 w-36 overflow-hidden rounded-xl border border-gray-700 bg-gray-900 py-1 text-sm text-gray-200 shadow-lg">
              {onEdit && (
                <button
                  type="button"
                  onClick={(event) => handleMenuAction(event, () => onEdit(item))}
                  className="w-full px-4 py-2 text-left text-xs font-semibold hover:bg-gray-800"
                >
                  Edit feedback
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={(event) => handleMenuAction(event, () => onDelete(item))}
                  className="w-full px-4 py-2 text-left text-xs font-semibold text-red-400 hover:bg-red-950/40"
                >
                  Delete feedback
                </button>
              )}
            </div>
          </details>
        )}

        <div className="flex flex-1 items-center justify-center relative">
          {canNavigatePrev && (
            <button
              type="button"
              onClick={handlePrev}
              className="absolute left-4 z-10 rounded-full bg-black/50 p-3 text-white transition hover:bg-black/70"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}

          {images.length > 0 && (
            <div className="flex h-full w-full items-center justify-center p-4">
              <img
                src={images[currentImageIndex]?.url || "/placeholder.png"}
                alt={images[currentImageIndex]?.name || "Feedback image"}
                className="max-h-full max-w-full object-contain"
              />
            </div>
          )}

          {canNavigateNext && (
            <button
              type="button"
              onClick={handleNext}
              className="absolute right-4 z-10 rounded-full bg-black/50 p-3 text-white transition hover:bg-black/70"
              aria-label="Next image"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          )}

          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-4 py-2 text-sm text-white">
              {currentImageIndex + 1} / {images.length}
            </div>
          )}
        </div>

        <div className="w-full max-w-md overflow-y-auto border-l border-gray-800 bg-white dark:bg-gray-900">
          <div className="p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 text-sm font-semibold text-violet-600 dark:bg-violet-900/40 dark:text-violet-200">
                {getInitials(item.userName)}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {item.userName}
                </p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Status: {item.status} | Classification: {item.classification}
                </p>
                <div className="mt-1 flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
                  <span>Created: {item.createdAt}</span>
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                      (item.visibility || "Public") === "Private"
                        ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-200"
                        : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-200"
                    }`}
                  >
                    {item.visibility || "Public"}
                  </span>
                </div>
                {item.classification === "Compliment" && (
                  <div className="mt-2 flex items-center gap-1">
                    {renderStars(item.rating)}
                  </div>
                )}
              </div>
            </div>

            <p className="mt-4 text-sm text-gray-700 dark:text-gray-200">
              {item.feedback}
            </p>

            <div className="mt-4 flex items-center gap-3 border-t border-gray-200 pt-4 dark:border-gray-800">
              {onToggleFeedbackLike && (
                <button
                  type="button"
                  onClick={() => onToggleFeedbackLike(item.id)}
                  className={`inline-flex items-center gap-1 text-[11px] font-semibold transition ${
                    feedbackLikedByMe
                      ? "text-violet-600 dark:text-violet-300"
                      : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  }`}
                  aria-pressed={feedbackLikedByMe}
                >
                  <ThumbsUp className="h-3.5 w-3.5" />
                  <span>{feedbackLikedByMe ? "Liked" : "Like"}</span>
                  {feedbackLikeCount > 0 && <span>({feedbackLikeCount})</span>}
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowComments(!showComments)}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                <span>Comment</span>
                {commentCount > 0 && <span>({commentCount})</span>}
              </button>
            </div>

            {showComments && (
              <div className="mt-4 border-t border-gray-200 pt-4 dark:border-gray-800">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Comments ({commentCount})
                </p>
                <div className="mt-3 space-y-3">
                  {comments.length > 0 ? (
                    comments.map((comment) => (
                      <ComApplicationFeedBackComment
                        key={comment.id}
                        comment={comment}
                        itemId={item.id}
                        onAddComment={onAddComment}
                        onToggleCommentLike={onToggleCommentLike}
                        onEditComment={onEditComment}
                        onDeleteComment={onDeleteComment}
                        canAddComment={typeof onAddComment === "function"}
                        canToggleCommentLike={typeof onToggleCommentLike === "function"}
                        canEditComment={typeof onEditComment === "function"}
                        canDeleteComment={typeof onDeleteComment === "function"}
                      />
                    ))
                  ) : (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      No comments yet.
                    </p>
                  )}
                </div>

                {onAddComment && (
                  <form className="mt-4 space-y-3" onSubmit={handleCommentSubmit}>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Add a comment
                    </p>
                    <Textarea
                      value={commentDraft}
                      onChange={(event) => setCommentDraft(event.target.value)}
                      placeholder="Write a comment..."
                      rows={3}
                      className="bg-gray-50 text-sm dark:bg-gray-950"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        type="submit"
                        size="sm"
                        className="bg-violet-600 text-white hover:bg-violet-700 dark:bg-violet-500 dark:hover:bg-violet-600"
                        disabled={!commentDraft.trim()}
                      >
                        Post comment
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden flex flex-col flex-1 relative">
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-black/50 p-2 text-white transition hover:bg-black/70"
            aria-label="Close photo viewer"
          >
            <X className="h-5 w-5" />
          </button>

          {(onEdit || onDelete) && (
            <details>
              <summary className="list-none inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white transition hover:bg-black/70 [&::-webkit-details-marker]:hidden cursor-pointer">
                <MoreVertical className="h-4 w-4" />
              </summary>
              <div className="absolute right-4 mt-2 w-36 overflow-hidden rounded-xl border border-gray-700 bg-gray-900 py-1 text-sm text-gray-200 shadow-lg">
                {onEdit && (
                  <button
                    type="button"
                    onClick={(event) => handleMenuAction(event, () => onEdit(item))}
                    className="w-full px-4 py-2 text-left text-xs font-semibold hover:bg-gray-800"
                  >
                    Edit feedback
                  </button>
                )}
                {onDelete && (
                  <button
                    type="button"
                    onClick={(event) => handleMenuAction(event, () => onDelete(item))}
                    className="w-full px-4 py-2 text-left text-xs font-semibold text-red-400 hover:bg-red-950/40"
                  >
                    Delete feedback
                  </button>
                )}
              </div>
            </details>
          )}
        </div>

        <div className="flex-1 flex items-center justify-center relative">
          {canNavigatePrev && !mobileCommentsOpen && (
            <button
              type="button"
              onClick={handlePrev}
              className="absolute left-4 z-10 rounded-full bg-black/50 p-2 text-white transition hover:bg-black/70"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}

          {images.length > 0 && (
            <img
              src={images[currentImageIndex]?.url || "/placeholder.png"}
              alt={images[currentImageIndex]?.name || "Feedback image"}
              className="max-h-full max-w-full object-contain"
            />
          )}

          {canNavigateNext && !mobileCommentsOpen && (
            <button
              type="button"
              onClick={handleNext}
              className="absolute right-4 z-10 rounded-full bg-black/50 p-2 text-white transition hover:bg-black/70"
              aria-label="Next image"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          {images.length > 1 && (
            <div className="flex justify-center mb-3">
              <div className="rounded-full bg-black/50 px-3 py-1 text-xs text-white">
                {currentImageIndex + 1} / {images.length}
              </div>
            </div>
          )}

          <div className="flex items-center justify-center gap-6">
            {onToggleFeedbackLike && (
              <button
                type="button"
                onClick={() => onToggleFeedbackLike(item.id)}
                className="flex flex-col items-center gap-1"
              >
                <ThumbsUp
                  className={`h-6 w-6 ${
                    feedbackLikedByMe ? "text-violet-400" : "text-white"
                  }`}
                />
                <span className="text-xs text-white">
                  {feedbackLikeCount > 0 ? feedbackLikeCount : "Like"}
                </span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setMobileCommentsOpen(!mobileCommentsOpen)}
              className="flex flex-col items-center gap-1"
            >
              <MessageSquare className="h-6 w-6 text-white" />
              <span className="text-xs text-white">
                {commentCount > 0 ? commentCount : "Comment"}
              </span>
            </button>
          </div>
        </div>

        {mobileCommentsOpen && (
          <div className="absolute bottom-0 left-0 right-0 h-3/4 bg-white dark:bg-gray-900 rounded-t-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-800">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Comments ({commentCount})
              </h3>
              <button
                type="button"
                onClick={() => setMobileCommentsOpen(false)}
                className="rounded-full p-1 text-gray-500 transition hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-3">
                {comments.length > 0 ? (
                  comments.map((comment) => (
                    <ComApplicationFeedBackComment
                      key={comment.id}
                      comment={comment}
                      itemId={item.id}
                      onAddComment={onAddComment}
                      onToggleCommentLike={onToggleCommentLike}
                      onEditComment={onEditComment}
                      onDeleteComment={onDeleteComment}
                      canAddComment={typeof onAddComment === "function"}
                      canToggleCommentLike={typeof onToggleCommentLike === "function"}
                      canEditComment={typeof onEditComment === "function"}
                      canDeleteComment={typeof onDeleteComment === "function"}
                    />
                  ))
                ) : (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    No comments yet.
                  </p>
                )}
              </div>
            </div>

            {onAddComment && (
              <form className="border-t border-gray-200 p-4 dark:border-gray-800" onSubmit={handleCommentSubmit}>
                <Textarea
                  value={commentDraft}
                  onChange={(event) => setCommentDraft(event.target.value)}
                  placeholder="Write a comment..."
                  rows={2}
                  className="bg-gray-50 text-sm dark:bg-gray-950"
                />
                <div className="mt-2 flex items-center justify-end">
                  <Button
                    type="submit"
                    size="sm"
                    className="bg-violet-600 text-white hover:bg-violet-700 dark:bg-violet-500 dark:hover:bg-violet-600"
                    disabled={!commentDraft.trim()}
                  >
                    Post comment
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
