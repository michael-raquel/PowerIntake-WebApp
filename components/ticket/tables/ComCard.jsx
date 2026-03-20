"use client";
import React from 'react';

const getPriorityColor = (priority) => {
  switch (priority?.toLowerCase()) {
    case 'high':   return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    case 'medium': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
    case 'low':    return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    default:       return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
  }
};

const getStatusColor = (status) => {
  switch (status) {
    case 'Submitted':   return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    case 'In Progress': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    case 'Pending':     return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
    case 'Closed':      return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
    default:            return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
  }
};

const formatDate = (val) => {
  if (!val) return '—';
  return new Date(val).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatTime = (val) => {
  if (!val) return '';
  return new Date(val).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: true });
};

export default function ComCard({ ticket = {}, onClick }) {
  const ticketId   = ticket?.v_ticketnumber    || '—';
  const status     = ticket?.v_status          || '—';
  const priority   = ticket?.v_priority        || null;
  const client     = ticket?.v_tenantname      || '—';
  const username   = ticket?.v_username        || '—';
  const title      = ticket?.v_title           || '—';
  const category   = ticket?.v_ticketcategory  || '—';
  const source     = ticket?.v_source          || '—';
  const technician = ticket?.v_technicianname  || '—';
  const department = ticket?.v_department || '—';
  const createdAt  = ticket?.v_createdat       || null;
  const target     = ticket?.v_target          || null;

  const handleKeyDown = (e) => {
    if (!onClick) return;
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); }
  };

  return (
    <div
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-violet-300 dark:hover:border-violet-700 hover:shadow-md transition-all duration-200 overflow-hidden cursor-pointer w-full"
    >
      <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 border-b border-gray-100 dark:border-gray-800 gap-2">
        <span className="text-[11px] sm:text-xs font-mono font-semibold text-violet-600 dark:text-violet-400 shrink-0">
          #{ticketId}
        </span>
        <div className="flex items-center gap-1.5 flex-wrap justify-end">
          {priority && (
            <span className={`text-[9px] sm:text-[10px] font-medium px-1.5 sm:px-2 py-0.5 rounded-full whitespace-nowrap ${getPriorityColor(priority)}`}>
              {priority}
            </span>
          )}
          <span className={`text-[9px] sm:text-[10px] font-medium px-1.5 sm:px-2 py-0.5 rounded-full whitespace-nowrap ${getStatusColor(status)}`}>
            {status}
          </span>
        </div>
      </div>

      <div className="px-3 sm:px-4 pt-2.5 sm:pt-3 pb-2">
        <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white line-clamp-2 leading-snug">
          {title}
        </p>
      </div>

      <div className="px-3 sm:px-4 pb-3 grid grid-cols-2 gap-x-3 sm:gap-x-4 gap-y-2 sm:gap-y-2.5">
       {[
  { label: 'Client',     value: client },
  { label: 'Department', value: department },
  { label: 'Category',   value: category },
  { label: 'Requester',  value: username },
  { label: 'Technician', value: technician },
  { label: 'Source',     value: source },
  { label: 'Target',     value: formatDate(target) },
].map(({ label, value }) => (
  <div key={label} className="min-w-0">
    <p className="text-[9px] sm:text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500">
      {label}
    </p>
    <p className="text-[11px] sm:text-xs font-medium text-gray-800 dark:text-gray-200 truncate">
      {value}
    </p>
  </div>
))}
      </div>

      <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-2.5 bg-gray-50 dark:bg-gray-800/40 border-t border-gray-100 dark:border-gray-800 gap-2">
        <span className="text-[9px] sm:text-[10px] text-gray-400 dark:text-gray-500 truncate">
          {formatDate(createdAt)} · {formatTime(createdAt)}
        </span>
        <span className="text-[9px] sm:text-[10px] text-violet-500 dark:text-violet-400 font-medium whitespace-nowrap shrink-0">
          View details →
        </span>
      </div>
    </div>
  );
}