"use client";
import React from 'react';
import { RefreshCw } from 'lucide-react';

const STATUS_COLORS = {
  'New': 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800/40',
  'Assigned': 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/40',
  'Information Provided': 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/40',
  'Escalate To Onsite': 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/40',
  'Client Responded': 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/40',
  'Rescheduled': 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/40',
  'Scheduling Required': 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/40',
  'Working Issue Now': 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/40',
  'Waiting': 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/40',
  'Waiting for Approval': 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/40',
  'Work Completed': 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800/40',
  'Problem Solved': 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800/40',
  'Cancelled': 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800/40',
  'Technician Rejected': 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800/40',
  'Merged': 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800/40',
};

const getStatusColor = (status) =>
  STATUS_COLORS[status] || 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700';

const getPriorityTextColor = (priority) => {
  switch (priority?.toLowerCase()) {
    case 'high': return 'text-red-600 dark:text-red-400';
    case 'medium': return 'text-yellow-600 dark:text-yellow-400';
    case 'low': return 'text-green-600 dark:text-green-400';
    default: return 'text-gray-800 dark:text-gray-200';
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

const SKELETON_WIDTHS = ['w-16', 'w-20', 'w-14', 'w-18', 'w-16', 'w-12', 'w-14'];

export default function ComCard({ ticket = {}, onClick, isSyncing = false }) {
  const ticketId = ticket?.v_ticketnumber || '—';
  const status = ticket?.v_status || '—';
  const priority = ticket?.v_priority || '—';
  const client = ticket?.v_tenantname || '—';
  const username = ticket?.v_username || '—';
  const title = ticket?.v_title || '—';
  const category = ticket?.v_ticketcategory || '—';
  const source = ticket?.v_source || '—';
  const technician = ticket?.v_technicianname || '—';
  const department = ticket?.v_department || '—';
  const createdAt = ticket?.v_createdat || null;
  const target = ticket?.v_target || null;

  const handleKeyDown = (e) => {
    if (!onClick || isSyncing) return;
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); }
  };

  const clientInitial = client !== '—' ? client.charAt(0).toUpperCase() : '?';

  const gridFields = [
    { label: 'Requester', value: username, skeletonIdx: 0 },
    { label: 'Technician', value: technician, skeletonIdx: 1 },
    { label: 'Department', value: department, skeletonIdx: 2 },
    { label: 'Category', value: category, skeletonIdx: 3 },
    { label: 'Priority', value: priority, skeletonIdx: 4, priorityColored: true },
    { label: 'Source', value: source, skeletonIdx: 5 },
    { label: 'Target', value: formatDate(target), skeletonIdx: 6 },
  ];

  return (
    <div
      onClick={isSyncing ? undefined : onClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={isSyncing ? -1 : 0}
      className={`rounded-xl border overflow-hidden w-full transition-all duration-200 ${isSyncing
        ? 'border-violet-300 dark:border-violet-800 cursor-wait opacity-80 bg-white dark:bg-gray-800'
        : 'border-gray-200 dark:border-gray-700 hover:border-violet-300 dark:hover:border-violet-700 hover:shadow-md cursor-pointer bg-white dark:bg-gray-800'
        }`}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 bg-violet-50 dark:bg-violet-900/20 border-b border-violet-100 dark:border-violet-800/40">
        {isSyncing ? (
          <div className="w-6 h-6 rounded-md bg-violet-200 dark:bg-violet-800/50 animate-pulse shrink-0" />
        ) : (
          <div className="w-6 h-6 rounded-md bg-violet-600 dark:bg-violet-500 flex items-center justify-center text-white text-xs font-bold shrink-0 select-none">
            {clientInitial}
          </div>
        )}
        <div className="flex-1 min-w-0">
          {isSyncing ? (
            <div className="h-3.5 w-24 rounded bg-violet-200 dark:bg-violet-800/50 animate-pulse" />
          ) : (
            <span className="text-sm font-semibold text-violet-600 dark:text-violet-300 leading-snug break-words">
              {client}
            </span>
          )}
        </div>
        {isSyncing && (
          <span className="inline-flex items-center gap-1 text-violet-500 dark:text-violet-400 text-[10px] font-medium shrink-0">
            <RefreshCw className="w-3 h-3 animate-spin" />
            Finalizing...
          </span>
        )}
      </div>

      {/* Body */}
      <div className="px-3 pt-2.5 pb-0">
        {/* Ticket ID + Status row */}
        <div className="flex items-center justify-between gap-2 mb-2">
          {isSyncing ? (
            <div className="h-3 w-28 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
          ) : (
            <span className="text-[11px] font-mono font-bold text-violet-600 dark:text-violet-400">
              #{ticketId}
            </span>
          )}
          {isSyncing ? (
            <div className="h-5 w-16 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse shrink-0" />
          ) : (
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border shrink-0 ${getStatusColor(status)}`}>
              {status}
            </span>
          )}
        </div>

        {/* Title */}
        {isSyncing ? (
          <div className="space-y-1.5 mb-3">
            <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
            <div className="h-4 w-1/2 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
          </div>
        ) : (
          <p className="text-sm font-medium text-gray-800 dark:text-gray-200 line-clamp-2 leading-relaxed mb-3">
            {title}
          </p>
        )}

        <div className="border-t border-gray-100 dark:border-gray-700/60 mb-2.5" />

        {/* Grid: 2 columns */}
        <div className="grid grid-cols-2 gap-1.5 mb-2.5">
          {gridFields.map(({ label, value, skeletonIdx, priorityColored }) => (
            <div
              key={label}
              className="bg-gray-50 dark:bg-gray-900/60 rounded-md px-2.5 py-1.5 min-w-0 border border-gray-100 dark:border-gray-700/50"
            >
              <p className="text-[9px] text-gray-400 dark:text-gray-500 mb-0.5 uppercase tracking-wider">
                {label}
              </p>
              {isSyncing ? (
                <div className={`h-3 rounded ${SKELETON_WIDTHS[skeletonIdx]} bg-gray-200 dark:bg-gray-700 animate-pulse`} />
              ) : (
                <p className={`text-[11px] font-medium truncate ${priorityColored ? getPriorityTextColor(value) : 'text-gray-800 dark:text-gray-200'}`}>
                  {value}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-50/70 dark:bg-gray-800/40 border-t border-gray-100/80 dark:border-gray-700/40 gap-2">
        {isSyncing ? (
          <div className="h-3 w-28 rounded bg-gray-200/70 dark:bg-gray-700/50 animate-pulse" />
        ) : (
          <span className="text-[9px] text-gray-400 dark:text-gray-500 truncate">
            {formatDate(createdAt)} · {formatTime(createdAt)}
          </span>
        )}
        <span className={`text-[9px] font-semibold whitespace-nowrap shrink-0 ${isSyncing ? 'text-violet-300 dark:text-violet-500' : 'text-violet-500 dark:text-violet-400'}`}>
          {isSyncing ? 'Please wait...' : 'View details →'}
        </span>
      </div>
    </div>
  );
}