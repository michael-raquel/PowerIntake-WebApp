"use client";

import React from 'react';

const getPriorityColor = (priority) => {
  switch (priority?.toLowerCase()) {
    case 'high':
      return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800/50';
    case 'medium':
      return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800/50';
    case 'low':
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800/50';
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-700';
  }
};

const getStatusClass = (status) => {
  switch (status) {
    case 'Submitted':
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800/50';
    case 'In Progress':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50';
    case 'Closed':
      return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-700';
    case 'Pending':
      return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800/50';
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-700';
  }
};

export default function ComCard({ ticket = {}, onClick }) {
  const ticketId = ticket?.v_ticketnumber || '—';
  const status = ticket?.v_status || '—';
  const priority = ticket?.v_priority || null;
  const client = ticket?.v_tenantname || '—';
  const username = ticket?.v_username || '—';
  const title = ticket?.v_title || '—';
  const category = ticket?.v_ticketcategory || '—';
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
      className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 hover:shadow-lg hover:border-purple-300 dark:hover:border-purple-700 transition-all duration-200 overflow-hidden cursor-pointer"
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
    >
      <div className="px-3 py-2.5 bg-gradient-to-r from-purple-50/80 to-indigo-50/80 dark:from-purple-950/20 dark:to-indigo-950/20 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400">Ticket</span>
            <span className="text-xs font-semibold text-gray-900 dark:text-white font-mono bg-white/50 dark:bg-gray-800/50 px-2 py-0.5 rounded">
              #{ticketId}
            </span>
          </div>
          <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${getStatusClass(status)}`}>
            {status}
          </span>
        </div>
      </div>

      <div className="p-3 space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-0.5 h-5 bg-purple-500 dark:bg-purple-600 rounded-full" />
          <div className="flex-1">
            <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Client</span>
            <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{client}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white font-semibold text-[10px] shadow-sm shrink-0">
            {userInitial}
          </div>
          <div className="flex-1">
            <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Requester</span>
            <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{username}</p>
          </div>
        </div>

        <div>
          <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Title</span>
          <p className="text-xs text-gray-800 dark:text-gray-200 mt-0.5 line-clamp-2">{title}</p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-gray-50/50 dark:bg-gray-800/20 p-2 rounded">
            <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Category</span>
            <p className="text-xs font-medium text-gray-900 dark:text-white truncate">{category}</p>
          </div>
          <div className="bg-gray-50/50 dark:bg-gray-800/20 p-2 rounded">
            <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Priority</span>
            {priority ? (
              <span className={`inline-block mt-1 px-2 py-0.5 text-[10px] font-medium rounded-full ${getPriorityColor(priority)}`}>
                {priority}
              </span>
            ) : (
              <p className="text-xs font-medium text-gray-900 dark:text-white mt-1">—</p>
            )}
          </div>
        </div>
      </div>

      <div className="px-3 py-2 bg-gray-50/80 dark:bg-gray-800/30 border-t border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-gray-500 dark:text-gray-400">Created</span>
            <span className="text-[10px] text-gray-600 dark:text-gray-300 font-mono">{created}</span>
          </div>
          <span className="text-[10px] text-gray-500 dark:text-gray-400 flex items-center gap-0.5">
            Details
            <span className="text-purple-500 dark:text-purple-400 text-[10px]">→</span>
          </span>
        </div>
      </div>
    </div>
  );
}