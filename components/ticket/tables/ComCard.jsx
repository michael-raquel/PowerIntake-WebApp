"use client";

import React from 'react';

const getPriorityColor = (priority) => {
  switch (priority?.toLowerCase()) {
    case 'high':
      return 'bg-red-50 text-red-700 border-l-2 border-red-500 dark:bg-red-900/30 dark:text-red-300 dark:border-red-500';
    case 'medium':
      return 'bg-yellow-50 text-yellow-700 border-l-2 border-yellow-500 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-500';
    case 'low':
      return 'bg-green-50 text-green-700 border-l-2 border-green-500 dark:bg-green-900/30 dark:text-green-300 dark:border-green-500';
    default:
      return 'bg-gray-50 text-gray-700 border-l-2 border-gray-400 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600';
  }
};

export default function ComCard({ ticket = {}, fields = [], onClick }) {
  const ticketId = ticket?.v_ticketnumber || '—';
  const priorityValue = ticket?.v_priority || ticket?.priority || null;

  const otherFields =
    fields?.filter(
      (f) => !['priority', 'v_priority', 'id', 'v_ticketid', 'v_ticketnumber'].includes(f.key)
    ) ?? [];

  const handleKeyDown = (e) => {
    if (!onClick) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      className={`bg-white dark:bg-black rounded-lg border border-gray-200 dark:border-gray-800 hover:shadow-md transition-all duration-300 overflow-hidden ${
        onClick ? 'cursor-pointer' : ''
      }`}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="px-4 py-2 bg-gray-50 dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-medium text-gray-500 dark:text-slate-400">Ticket</span>
          <span className="text-sm font-semibold text-gray-900 dark:text-white">{ticketId}</span>
        </div>
        {priorityValue && (
          <div className={`px-2 py-0.5 text-xs font-medium rounded ${getPriorityColor(priorityValue)}`}>
            {priorityValue}
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          {otherFields.map((field) => {
            const value = ticket?.[field.key];
            if (!value) return null;

            return (
              <div key={field.key} className="flex flex-col min-w-0">
                <span className="text-[10px] font-medium text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                  {field.label}
                </span>
                <span className="text-xs text-gray-700 dark:text-slate-300 truncate" title={String(value)}>
                  {String(value)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="px-4 py-1.5 bg-gray-50/50 dark:bg-slate-900/50 border-t border-gray-100 dark:border-slate-700 text-[10px] text-gray-400 dark:text-slate-500 flex justify-end">
        <span>Click to view details</span>
      </div>
    </div>
  );
}