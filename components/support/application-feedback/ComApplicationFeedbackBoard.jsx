import { useState } from "react";
import {
  Image as ImageIcon,
  MessageSquare,
  MoreVertical,
  Star,
  ThumbsUp,
  X,
} from "lucide-react";
import ComApplicationFeedBackComment from "./ComApplicationFeedBackComment";
import ComApplicationFeedbackPhotoViewer from "./ComApplicationFeedbackPhotoViewer";
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

export default function ComApplicationFeedbackBoard({
  items = [],
  onEdit,
  onAddComment,
  onToggleCommentLike,
  onToggleFeedbackLike,
  onDelete,
  onEditComment,
  onDeleteComment,
}) {
  const canEdit = typeof onEdit === "function";
  const canAddComment = typeof onAddComment === "function";
  const canToggleCommentLike = typeof onToggleCommentLike === "function";
  const canToggleFeedbackLike = typeof onToggleFeedbackLike === "function";
  const canDelete = typeof onDelete === "function";
  const canEditComment = typeof onEditComment === "function";
  const canDeleteComment = typeof onDeleteComment === "function";
  const [commentDrafts, setCommentDrafts] = useState({});
  const [discussionItemId, setDiscussionItemId] = useState(null);
  const [photoViewerState, setPhotoViewerState] = useState({
    open: false,
    item: null,
    imageIndex: 0,
  });

  const discussionItem =
    items.find((item) => item.id === discussionItemId) || null;

  const handleCommentChange = (itemId, value) => {
    setCommentDrafts((prev) => ({
      ...prev,
      [itemId]: value,
    }));
  };

  const handleCommentSubmit = (event, itemId) => {
    event.preventDefault();
    if (!canAddComment) return;
    const message = (commentDrafts[itemId] || "").trim();
    if (!message) return;
    onAddComment(itemId, message);
    setCommentDrafts((prev) => ({
      ...prev,
      [itemId]: "",
    }));
  };

  const handleMenuAction = (event, action) => {
    action?.();
    const details = event.currentTarget.closest("details");
    if (details) {
      details.removeAttribute("open");
    }
  };

  const renderMenu = (item, className = "") => {
    if (!canEdit && !canDelete) return null;

    return (
      <details className={`relative ${className}`}>
        <summary className="list-none inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm transition hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 [&::-webkit-details-marker]:hidden cursor-pointer">
          <MoreVertical className="h-4 w-4" />
        </summary>
        <div className="absolute right-0 z-10 mt-2 w-36 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 text-sm text-gray-600 shadow-lg dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200">
          {canEdit && (
            <button
              type="button"
              onClick={(event) => handleMenuAction(event, () => onEdit(item))}
              className="w-full px-4 py-2 text-left text-xs font-semibold hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Edit feedback
            </button>
          )}
          {canDelete && (
            <button
              type="button"
              onClick={(event) => handleMenuAction(event, () => onDelete(item))}
              className="w-full px-4 py-2 text-left text-xs font-semibold text-red-500 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950/40"
            >
              Delete feedback
            </button>
          )}
        </div>
      </details>
    );
  };

  const renderFeedbackActions = (item, commentCount) => {
    const feedbackLikeCount = item.likes ?? 0;
    const feedbackLikedByMe = Boolean(item.likedByMe);

    return (
      <div className="inline-flex items-center gap-3">
        {canToggleFeedbackLike && (
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
          onClick={() => setDiscussionItemId(item.id)}
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-500 transition hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <MessageSquare className="h-3.5 w-3.5" />
          <span>Comment</span>
          {commentCount > 0 && <span>({commentCount})</span>}
        </button>
      </div>
    );
  };

  return (
    <>
      <div className="space-y-4">
        {items.map((item) => {
          const images = item.images || [];
          const comments = item.comments || [];
          const commentCount = getCommentCount(comments);
          const visibilityLabel = item.visibility || "Public";

          return (
            <div key={item.id} className="space-y-3">
              <article className="relative rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <div className="absolute right-4 top-4">
                  {renderMenu(item)}
                </div>

                <div className="flex flex-col gap-4">
                  <div className="flex items-start gap-3 pr-10">
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
                            visibilityLabel === "Private"
                              ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-200"
                              : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-200"
                          }`}
                        >
                          {visibilityLabel}
                        </span>
                      </div>
                      {item.classification === "Compliment" && (
                        <div className="mt-2 flex items-center gap-1">
                          {renderStars(item.rating)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-3">
                  <p className="text-sm text-gray-700 dark:text-gray-200">
                    {item.feedback}
                  </p>
                </div>

                <div className="mt-4">
                  <div className="flex flex-wrap gap-2 sm:gap-3">
                    {images.length > 0 && (
                      <>
                        {images.map((image, index) => (
                          <button
                            key={image.id}
                            type="button"
                            onClick={() => setPhotoViewerState({ open: true, item, imageIndex: index })}
                            className={`min-w-[150px] sm:min-w-[220px] items-center gap-2 sm:gap-3 rounded-xl border border-gray-200 bg-gray-50 px-2.5 py-2 sm:px-3 dark:border-gray-800 dark:bg-gray-950 transition hover:bg-gray-100 dark:hover:bg-gray-900 cursor-pointer ${
                              index === 0 ? "flex" : "hidden sm:flex"
                            }`}
                          >
                            <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-white text-gray-400 shadow-sm dark:bg-gray-900">
                              <ImageIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                            </div>
                            <div>
                              <p className="text-[11px] sm:text-xs font-semibold text-gray-900 dark:text-white">
                                {image.name}
                              </p>
                              <p className="text-[10px] sm:text-[11px] text-gray-500 dark:text-gray-400">
                                Attached image
                              </p>
                            </div>
                          </button>
                        ))}
                        {images.length > 1 && (
                          <div className="flex sm:hidden min-w-[90px] items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-500 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-400">
                            +{images.length - 1}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  <div className="mt-3">
                    {renderFeedbackActions(item, commentCount)}
                  </div>
                </div>
              </article>


            </div>
          );
        })}
      </div>

      {discussionItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-[95vw] md:max-w-[80vw] lg:max-w-[70vw] xl:max-w-[60vw] 2xl:max-w-[50vw] max-h-[90vh] overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-gray-900"
          >
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-800">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Feedback Discussion
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {discussionItem.userName} | {discussionItem.classification}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDiscussionItemId(null)}
                className="rounded-full p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                aria-label="Close discussion"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[calc(90vh-5rem)] overflow-y-auto p-5">
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-950">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 text-sm font-semibold text-violet-600 dark:bg-violet-900/40 dark:text-violet-200">
                    {getInitials(discussionItem.userName)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {discussionItem.userName}
                    </p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Status: {discussionItem.status} | Classification: {discussionItem.classification}
                    </p>
                    <div className="mt-1 flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
                      <span>Created: {discussionItem.createdAt}</span>
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                          (discussionItem.visibility || "Public") === "Private"
                            ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-200"
                            : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-200"
                        }`}
                      >
                        {discussionItem.visibility || "Public"}
                      </span>
                    </div>
                    {discussionItem.classification === "Compliment" && (
                      <div className="mt-2 flex items-center gap-1">
                        {renderStars(discussionItem.rating)}
                      </div>
                    )}
                  </div>
                </div>
                <p className="mt-3 text-sm text-gray-700 dark:text-gray-200">
                  {discussionItem.feedback}
                </p>
                {(discussionItem.images || []).length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2 sm:gap-3">
                    {(discussionItem.images || []).map((image, index) => (
                      <button
                        key={image.id}
                        type="button"
                        onClick={() => setPhotoViewerState({ open: true, item: discussionItem, imageIndex: index })}
                        className="min-w-[180px] items-center gap-2 rounded-xl border border-gray-200 bg-white px-2.5 py-2 dark:border-gray-800 dark:bg-gray-900 transition hover:bg-gray-50 dark:hover:bg-gray-950 cursor-pointer sm:flex"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-50 text-gray-400 shadow-sm dark:bg-gray-950">
                          <ImageIcon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-900 dark:text-white">
                            {image.name}
                          </p>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400">
                            Attached image
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-4 rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-950">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Comments ({getCommentCount(discussionItem.comments || [])})
                </p>
                <div className="mt-3 space-y-3">
                  {(discussionItem.comments || []).length > 0 ? (
                    (discussionItem.comments || []).map((comment) => (
                      <ComApplicationFeedBackComment
                        key={comment.id}
                        comment={comment}
                        itemId={discussionItem.id}
                        onAddComment={onAddComment}
                        onToggleCommentLike={onToggleCommentLike}
                        onEditComment={onEditComment}
                        onDeleteComment={onDeleteComment}
                        canAddComment={canAddComment}
                        canToggleCommentLike={canToggleCommentLike}
                        canEditComment={canEditComment}
                        canDeleteComment={canDeleteComment}
                      />
                    ))
                  ) : (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      No comments yet.
                    </p>
                  )}
                </div>

                {canAddComment && (
                  <form
                    className="mt-4 space-y-3"
                    onSubmit={(event) => handleCommentSubmit(event, discussionItem.id)}
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Add a comment
                    </p>
                    <Textarea
                      value={commentDrafts[discussionItem.id] || ""}
                      onChange={(event) =>
                        handleCommentChange(discussionItem.id, event.target.value)
                      }
                      placeholder="Write a comment..."
                      rows={3}
                      className="bg-white text-sm dark:bg-gray-900"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        type="submit"
                        size="sm"
                        className="bg-violet-600 text-white hover:bg-violet-700 dark:bg-violet-500 dark:hover:bg-violet-600"
                        disabled={!commentDrafts[discussionItem.id]?.trim()}
                      >
                        Post comment
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <ComApplicationFeedbackPhotoViewer
        open={photoViewerState.open}
        onClose={() => setPhotoViewerState({ open: false, item: null, imageIndex: 0 })}
        item={photoViewerState.item}
        initialImageIndex={photoViewerState.imageIndex}
        onToggleFeedbackLike={onToggleFeedbackLike}
        onAddComment={onAddComment}
        onToggleCommentLike={onToggleCommentLike}
        onEditComment={onEditComment}
        onDeleteComment={onDeleteComment}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </>
  );
}
