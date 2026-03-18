"use client";

import React from 'react';

const getPriorityColor = (priority) => {
  switch (priority?.toLowerCase()) {
    case 'high':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    case 'low':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
  }
};

const getStatusClass = (status) => {
  switch (status) {
    case 'Submitted':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    case 'In Progress':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
    case 'Closed':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
    case 'Pending':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
  }
};

export default function ComCard({ ticket = {}, onClick }) {
  const ticketId = ticket?.v_ticketnumber || '—';
  const status = ticket?.v_status || '—';
  const priority = ticket?.v_priority || null;
  const client = ticket?.v_tenantname || '—';
  const username = ticket?.v_username || '—';
  const title = ticket?.v_title || '—';
  const created = ticket?.v_createdat ? new Date(ticket.v_createdat).toLocaleString() : '—';
  const userInitial = username?.charAt(0).toUpperCase() || '?';

  const handleKeyDown = (e) => {
    if (!onClick) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-purple-200 dark:hover:border-purple-800 transition-all duration-200 overflow-hidden cursor-pointer"
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
    >
      <div className="px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center gap-2">
        <div className="flex items-center gap-1 sm:gap-2 min-w-0">
          <span className="text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 shrink-0">Ticket</span>
          <span className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white font-mono truncate">
            #{ticketId}
          </span>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {priority && (
            <span className={`px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-medium rounded-full whitespace-nowrap ${getPriorityColor(priority)}`}>
              {priority}
            </span>
          )}
          <span className={`px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-medium rounded-full whitespace-nowrap ${getStatusClass(status)}`}>
            {status}
          </span>
        </div>
      </div>

      <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
        <div className="min-w-0">
          <span className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500">Client</span>
          <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white mt-0.5 truncate">{client}</p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white font-semibold text-xs sm:text-sm shadow-sm shrink-0">
            {userInitial}
          </div>
          <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate">{username}</p>
        </div>

        <div className="min-w-0">
          <span className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500">Title</span>
          <p className="text-xs sm:text-sm text-gray-900 dark:text-white mt-0.5 line-clamp-2 break-words">
            {title}
          </p>
        </div>

        <div className="min-w-0">
          <span className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500">Created</span>
          <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-mono truncate">{created}</p>
        </div>
      </div>

      <div className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-50/80 dark:bg-gray-800/30 border-t border-gray-100 dark:border-gray-800 text-[8px] sm:text-[10px] text-gray-400 dark:text-gray-500 flex justify-end">
        <span>Click to view details</span>
      </div>
    </div>
  );
}