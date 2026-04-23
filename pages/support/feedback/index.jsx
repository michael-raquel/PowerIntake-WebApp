import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, Star, Search, SlidersHorizontal } from "lucide-react";
import ComApplicationFeedbackBoard from "@/components/support/application-feedback/ComApplicationFeedbackBoard";
import ComApplicationFeedbackCreate from "@/components/support/application-feedback/ComApplicationFeedbackCreate";
import ComApplicationFeedbackUpdate from "@/components/support/application-feedback/ComApplicationFeedbackUpdate";
import ComApplicationFeedbackTabs from "@/components/support/application-feedback/ComApplicationFeedbackTabs";
import ComApplicationFeedbackProblem from "@/components/support/application-feedback/ComApplicationFeedbackProblem";
import ComApplicationFeedbackSuggestion from "@/components/support/application-feedback/ComApplicationFeedbackSuggestion";
import ComApplicationFeedbackCompliment from "@/components/support/application-feedback/ComApplicationFeedbackCompliment";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const initialFeedbackItems = [
  {
    id: "AFB-1001",
    userName: "Riley James",
    classification: "Problem",
    status: "Open",
    createdAt: "Apr 20, 2026",
    rating: 2,
    visibility: "Public",
    likes: 4,
    likedByMe: false,
    feedback:
      "Install stalled at 98% and forced a restart twice. The progress bar never completes.",
    images: [
      { id: "AFI-2001", name: "installer-stall-98.png" },
      { id: "AFI-2002", name: "restart-loop.png" },
    ],
    comments: [
      {
        id: "CMT-9001",
        name: "Maria Santos (Admin)",
        createdAt: "Apr 20, 2026",
        comment:
          "Thanks for the report. We are reviewing the installer logs and will update you.",
        likes: 2,
        likedByMe: false,
        replies: [
          {
            id: "CMT-9101",
            name: "Riley James",
            createdAt: "Apr 20, 2026",
            comment: "Happy to test the patch when it is ready.",
            likes: 1,
            likedByMe: true,
            replies: [],
          },
        ],
      },
      {
        id: "CMT-9002",
        name: "Luis Patel (Manager)",
        createdAt: "Apr 21, 2026",
        comment:
          "We reproduced the issue and are preparing a hotfix for the installer.",
        likes: 0,
        likedByMe: false,
        replies: [],
      },
    ],
  },
  {
    id: "AFB-1002",
    userName: "Kevin Lee",
    classification: "Suggestion",
    status: "In review",
    createdAt: "Apr 19, 2026",
    rating: 4,
    visibility: "Public",
    likes: 2,
    likedByMe: false,
    feedback:
      "A quick filter to show only my open tickets and a compact list view would save time.",
    images: [{ id: "AFI-2003", name: "filter-panel-mockup.png" }],
    comments: [
      {
        id: "CMT-9004",
        name: "Power Intake Team",
        createdAt: "Apr 19, 2026",
        comment:
          "We are exploring a compact view toggle and saved filters for this workflow.",
        likes: 1,
        likedByMe: false,
        replies: [],
      },
    ],
  },
  {
    id: "AFB-1003",
    userName: "Kara Chen",
    classification: "Compliment",
    status: "Resolved",
    createdAt: "Apr 18, 2026",
    rating: 5,
    visibility: "Public",
    likes: 6,
    likedByMe: false,
    feedback:
      "The new ticket board layout is much easier to scan. Great improvement!",
    images: [],
    comments: [
      {
        id: "CMT-9003",
        name: "Rene Wallace (Super Admin)",
        createdAt: "Apr 18, 2026",
        comment: "We appreciate the kind words. Thank you for sharing!",
        likes: 3,
        likedByMe: false,
        replies: [
          {
            id: "CMT-9102",
            name: "Kara Chen",
            createdAt: "Apr 18, 2026",
            comment: "Glad it helps the team. The layout feels much faster now.",
            likes: 0,
            likedByMe: false,
            replies: [],
          },
        ],
      },
    ],
  },
  {
    id: "AFB-1004",
    userName: "Tessa Morgan",
    classification: "Problem",
    status: "In review",
    createdAt: "Apr 17, 2026",
    rating: 3,
    visibility: "Private",
    likes: 1,
    likedByMe: false,
    feedback:
      "Notification badge stays at 0 until a hard refresh after new tickets arrive.",
    images: [{ id: "AFI-2004", name: "badge-stuck.png" }],
    comments: [
      {
        id: "CMT-9005",
        name: "Riley James (Support)",
        createdAt: "Apr 17, 2026",
        comment:
          "We traced this to websocket reconnects and are testing a fix this week.",
        likes: 1,
        likedByMe: false,
        replies: [
          {
            id: "CMT-9103",
            name: "Tessa Morgan",
            createdAt: "Apr 17, 2026",
            comment: "That makes sense. Thank you for the quick follow up.",
            likes: 0,
            likedByMe: false,
            replies: [],
          },
        ],
      },
    ],
  },
  {
    id: "AFB-1005",
    userName: "Ahmed Brooks",
    classification: "Suggestion",
    status: "Open",
    createdAt: "Apr 16, 2026",
    rating: 4,
    visibility: "Public",
    likes: 3,
    likedByMe: false,
    feedback:
      "Bulk assign from the table and a multi-select toolbar would save a lot of time.",
    images: [],
    comments: [
      {
        id: "CMT-9006",
        name: "Maria Santos (Admin)",
        createdAt: "Apr 16, 2026",
        comment: "We are prototyping bulk actions in the toolbar this sprint.",
        likes: 2,
        likedByMe: false,
        replies: [
          {
            id: "CMT-9104",
            name: "Ahmed Brooks",
            createdAt: "Apr 16, 2026",
            comment: "Awesome. Happy to try it when it lands.",
            likes: 1,
            likedByMe: false,
            replies: [],
          },
        ],
      },
    ],
  },
  {
    id: "AFB-1006",
    userName: "Natalie Price",
    classification: "Compliment",
    status: "Closed",
    createdAt: "Apr 15, 2026",
    rating: 5,
    visibility: "Public",
    likes: 5,
    likedByMe: false,
    feedback:
      "The contrast improvements made the dashboard easier to read during night shifts.",
    images: [],
    comments: [
      {
        id: "CMT-9007",
        name: "UX Team",
        createdAt: "Apr 15, 2026",
        comment: "Thanks for noticing the accessibility updates!",
        likes: 5,
        likedByMe: false,
        replies: [],
      },
    ],
  },
  {
    id: "AFB-1007",
    userName: "Dylan Ray",
    classification: "Problem",
    status: "Open",
    createdAt: "Apr 14, 2026",
    rating: 2,
    visibility: "Public",
    likes: 0,
    likedByMe: false,
    feedback:
      "Image uploads fail on Safari 17 with a timeout when attaching screenshots.",
    images: [{ id: "AFI-2005", name: "safari-timeout.png" }],
    comments: [
      {
        id: "CMT-9008",
        name: "Luis Patel (Manager)",
        createdAt: "Apr 14, 2026",
        comment: "We are testing the upload endpoint on Safari for a fix.",
        likes: 0,
        likedByMe: false,
        replies: [],
      },
    ],
  },
];

const formatShortDate = (date) =>
  date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const statusOptions = ["Open", "In review", "Resolved", "Closed"];

const addReplyToComments = (comments, parentId, newComment) => {
  let didUpdate = false;
  const updated = comments.map((comment) => {
    if (comment.id === parentId) {
      didUpdate = true;
      return {
        ...comment,
        replies: [...(comment.replies || []), newComment],
      };
    }

    if (!comment.replies || comment.replies.length === 0) {
      return comment;
    }

    const updatedReplies = addReplyToComments(
      comment.replies,
      parentId,
      newComment
    );

    if (updatedReplies !== comment.replies) {
      didUpdate = true;
      return {
        ...comment,
        replies: updatedReplies,
      };
    }

    return comment;
  });

  return didUpdate ? updated : comments;
};

const toggleLikeOnComments = (comments, commentId) => {
  let didUpdate = false;
  const updated = comments.map((comment) => {
    if (comment.id === commentId) {
      const likedByMe = !comment.likedByMe;
      const baseLikes = comment.likes ?? 0;
      didUpdate = true;
      return {
        ...comment,
        likedByMe,
        likes: Math.max(0, baseLikes + (likedByMe ? 1 : -1)),
      };
    }

    if (!comment.replies || comment.replies.length === 0) {
      return comment;
    }

    const updatedReplies = toggleLikeOnComments(comment.replies, commentId);
    if (updatedReplies !== comment.replies) {
      didUpdate = true;
      return {
        ...comment,
        replies: updatedReplies,
      };
    }

    return comment;
  });

  return didUpdate ? updated : comments;
};

export default function SupportFeedbackRoute() {
  const [createOpen, setCreateOpen] = useState(false);
  const [updateOpen, setUpdateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [feedbackItems, setFeedbackItems] = useState(initialFeedbackItems);
  const [activeTab, setActiveTab] = useState("All");
  const [showMineOnly, setShowMineOnly] = useState(false);

  const displayedItems = showMineOnly
    ? feedbackItems.filter((item) => item.userName === "You")
    : feedbackItems;

  const classificationCounts = displayedItems.reduce(
    (acc, item) => {
      if (acc[item.classification] !== undefined) {
        acc[item.classification] += 1;
      }
      return acc;
    },
    { Problem: 0, Suggestion: 0, Compliment: 0 }
  );

  const tabCounts = {
    All: displayedItems.length,
    ...classificationCounts,
  };

  const feedbackPanels = {
    All: ComApplicationFeedbackBoard,
    Problem: ComApplicationFeedbackProblem,
    Suggestion: ComApplicationFeedbackSuggestion,
    Compliment: ComApplicationFeedbackCompliment,
  };

  const ActivePanel = feedbackPanels[activeTab] ?? ComApplicationFeedbackBoard;

  const openCreateDialog = () => {
    setEditTarget(null);
    setCreateOpen(true);
  };

  const openEditDialog = (item) => {
    setEditTarget(item);
    setUpdateOpen(true);
  };

  const closeCreateDialog = () => {
    setCreateOpen(false);
  };

  const closeUpdateDialog = () => {
    setUpdateOpen(false);
    setEditTarget(null);
  };

  const handleCreateSubmit = (values) => {
    const createdAt = formatShortDate(new Date());
    const newItem = {
      id: `AFB-${Date.now()}`,
      userName: "You",
      classification: values.classification,
      status: "Open",
      createdAt,
      rating: values.rating,
      visibility: values.visibility ?? "Public",
      likes: 0,
      likedByMe: false,
      feedback: values.feedback,
      images: [],
      comments: [],
    };
    setFeedbackItems((prev) => [newItem, ...prev]);
  };

  const handleUpdateSubmit = (values) => {
    if (!editTarget) return;
    setFeedbackItems((prev) =>
      prev.map((item) =>
        item.id === editTarget.id
          ? {
              ...item,
              classification: values.classification,
              rating: values.rating,
              feedback: values.feedback,
              visibility: values.visibility ?? item.visibility ?? "Public",
            }
          : item
      )
    );
  };

  const handleStatusChange = (itemId, status) => {
    setFeedbackItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              status,
            }
          : item
      )
    );
  };

  const handleAddComment = (itemId, message, parentId) => {
    const trimmed = message.trim();
    if (!trimmed) return;
    const createdAt = formatShortDate(new Date());
    const newComment = {
      id: `CMT-${Date.now()}`,
      name: "You (Admin)",
      createdAt,
      comment: trimmed,
      likes: 0,
      likedByMe: false,
      replies: [],
    };

    setFeedbackItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              comments: parentId
                ? addReplyToComments(item.comments || [], parentId, newComment)
                : [...(item.comments || []), newComment],
            }
          : item
      )
    );
  };

  const handleToggleCommentLike = (itemId, commentId) => {
    setFeedbackItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              comments: toggleLikeOnComments(item.comments || [], commentId),
            }
          : item
      )
    );
  };

  const handleDeleteFeedback = (item) => {
    setFeedbackItems((prev) => prev.filter((entry) => entry.id !== item.id));
    if (editTarget?.id === item.id) {
      closeUpdateDialog();
    }
  };

  const handleToggleFeedbackLike = (itemId) => {
    setFeedbackItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const likedByMe = !item.likedByMe;
        const baseLikes = item.likes ?? 0;
        return {
          ...item,
          likedByMe,
          likes: Math.max(0, baseLikes + (likedByMe ? 1 : -1)),
        };
      })
    );
  };

  const handleEditComment = (itemId, comment) => {
    const newText = window.prompt("Edit comment:", comment.comment);
    if (!newText || !newText.trim()) return;

    setFeedbackItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;

        const updateComment = (comments) =>
          comments.map((c) => {
            if (c.id === comment.id) {
              return { ...c, comment: newText.trim() };
            }
            if (c.replies && c.replies.length > 0) {
              return { ...c, replies: updateComment(c.replies) };
            }
            return c;
          });

        return { ...item, comments: updateComment(item.comments || []) };
      })
    );
  };

  const handleDeleteComment = (itemId, commentId) => {
    if (!window.confirm("Are you sure you want to delete this comment?")) return;

    setFeedbackItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;

        const deleteComment = (comments) =>
          comments
            .filter((c) => c.id !== commentId)
            .map((c) => ({ ...c, replies: deleteComment(c.replies || []) }));

        return { ...item, comments: deleteComment(item.comments || []) };
      })
    );
  };

  return (
    <div className="min-h-[100dvh] flex flex-col p-4 pb-6">
      <ComApplicationFeedbackCreate
        open={createOpen}
        onClose={closeCreateDialog}
        onSubmit={handleCreateSubmit}
      />
      <ComApplicationFeedbackUpdate
        open={updateOpen}
        onClose={closeUpdateDialog}
        initialValues={editTarget}
        onSubmit={handleUpdateSubmit}
      />
      <div className="flex flex-col gap-4">
        <div className="px-4 bg-gradient-to-l from-pink-500 to-violet-800 rounded-xl py-5 flex-shrink-0 shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-inner">
                <Mail className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-black text-xl sm:text-2xl text-white tracking-tight">
                  Power Intake Help Center
                </h2>
                <p className="text-xs text-white/60 mt-0.5">
                  Improving Accessibility | Fostering Accountability |
                  Exceptional Service
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <Link
              href="/support"
              className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-sm transition hover:border-gray-300 hover:text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200"
              aria-label="Back to support"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                Feedback board
              </h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Review app feedback, ratings, attachments, and admin responses.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-row items-center gap-1 sm:gap-2 w-full px-4 py-3">
          <div className="relative flex-1 min-w-[100px] sm:min-w-[150px]">
            <Search className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <Input
              placeholder="Search..."
              className="pl-7 sm:pl-9 pr-8 w-full dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100 dark:placeholder:text-gray-500 text-xs sm:text-sm h-8 sm:h-10"
            />
          </div>
          
          <div className="flex items-center gap-2 px-1 sm:px-2">
            <span className="hidden sm:inline text-xs sm:text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
              My feedback
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={showMineOnly}
              onClick={() => setShowMineOnly((prev) => !prev)}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 ${
                showMineOnly ? "bg-violet-600" : "bg-gray-200 dark:bg-gray-700"
              }`}
            >
              <span
                aria-hidden="true"
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${showMineOnly ? "translate-x-4" : "translate-x-0"}`}
              />
            </button>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="relative gap-1 sm:gap-2 px-2 sm:px-3 h-8 sm:h-10 bg-white text-gray-900 border-gray-300 hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800 dark:text-gray-300 dark:bg-gray-900"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="text-xs sm:text-sm whitespace-nowrap">Filters</span>
          </Button>
          <Button
            size="sm"
            onClick={openCreateDialog}
            className="gap-1 sm:gap-2 px-3 sm:px-4 h-8 sm:h-10 bg-violet-600 text-white hover:bg-violet-700 dark:bg-violet-500 dark:hover:bg-violet-600"
          >
            <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="text-xs sm:text-sm whitespace-nowrap">Create feedback</span>
          </Button>
        </div>

        <ComApplicationFeedbackTabs
          activeTab={activeTab}
          counts={tabCounts}
          onChange={setActiveTab}
        />
        <ActivePanel
          items={displayedItems}
          statusOptions={statusOptions}
          onEdit={openEditDialog}
          onStatusChange={handleStatusChange}
          onAddComment={handleAddComment}
          onToggleCommentLike={handleToggleCommentLike}
          onToggleFeedbackLike={handleToggleFeedbackLike}
          onDelete={handleDeleteFeedback}
          onEditComment={handleEditComment}
          onDeleteComment={handleDeleteComment}
        />
      </div>
    </div>
  );
}
