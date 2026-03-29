"use client";
import React from 'react';
import { RefreshCw } from 'lucide-react';

const getPriorityColor = (priority) => {
  switch (priority?.toLowerCase()) {
    case 'high':   return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    case 'medium': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
    case 'low':    return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    default:       return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
  }
};

const STATUS_COLORS = {
  'New': 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-900',
  'Assigned': 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900',
  'Information Provided': 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900',
  'Escalate To Onsite': 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900',
  'Client Responded': 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900',
  'Rescheduled': 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900',
  'Scheduling Required': 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900',
  'Working Issue Now': 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900',
  'Waiting': 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900',
  'Waiting for Approval': 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900',
  'Work Completed': 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-900',
  'Problem Solved': 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-900',
  'Cancelled': 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900',
  'Technician Rejected': 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900',
  'Merged': 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900',
};

const getStatusColor = (status) => {
  return STATUS_COLORS[status] || 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
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
  const ticketId   = ticket?.v_ticketnumber    || '—';
  const status     = ticket?.v_status          || '—';
  const priority   = ticket?.v_priority        || null;
  const client     = ticket?.v_tenantname      || '—';
  const username   = ticket?.v_username        || '—';
  const title      = ticket?.v_title           || '—';
  const category   = ticket?.v_ticketcategory  || '—';
  const source     = ticket?.v_source          || '—';
  const technician = ticket?.v_technicianname  || '—';
  const department = ticket?.v_department      || '—';
  const createdAt  = ticket?.v_createdat       || null;
  const target     = ticket?.v_target          || null;

  const handleKeyDown = (e) => {
    if (!onClick || isSyncing) return;
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); }
  };

  const fields = [
    { label: 'Client',     value: client },
    { label: 'Department', value: department },
    { label: 'Category',   value: category },
    { label: 'Requester',  value: username },
    { label: 'Technician', value: technician },
    { label: 'Source',     value: source },
    { label: 'Target',     value: formatDate(target) },
  ];

  return (
    <div
      onClick={isSyncing ? undefined : onClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={isSyncing ? -1 : 0}
      className={`bg-white dark:bg-gray-900 rounded-xl border transition-all duration-200 overflow-hidden w-full ${
        isSyncing
          ? 'border-violet-300 dark:border-violet-700 cursor-wait opacity-80'
          : 'border-gray-200 dark:border-gray-800 hover:border-violet-300 dark:hover:border-violet-700 hover:shadow-md cursor-pointer'
      }`}
    >
     
      <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 border-b border-gray-100 dark:border-gray-800 gap-2">
        {isSyncing ? (
          <span className="inline-flex items-center gap-1.5 text-violet-500 dark:text-violet-400 text-xs font-medium">
            <RefreshCw className="w-3 h-3 animate-spin" />
            Finalizing...
          </span>
        ) : (
          <span className="text-[11px] sm:text-xs font-mono font-semibold text-violet-600 dark:text-violet-400 shrink-0">
            #{ticketId}
          </span>
        )}
        <div className="flex items-center gap-1.5 flex-wrap justify-end">
          {isSyncing ? (
            <>
              <div className="h-4 w-12 rounded-full bg-violet-100 dark:bg-violet-900/30 animate-pulse" />
              <div className="h-4 w-16 rounded-full bg-violet-100 dark:bg-violet-900/30 animate-pulse" />
            </>
          ) : (
            <>
              {priority && (
                <span className={`text-[9px] sm:text-[10px] font-medium px-1.5 sm:px-2 py-0.5 rounded-full whitespace-nowrap ${getPriorityColor(priority)}`}>
                  {priority}
                </span>
              )}
              <span className={`text-[9px] sm:text-[10px] font-medium px-1.5 sm:px-2 py-0.5 rounded-full whitespace-nowrap ${getStatusColor(status)}`}>
                {status}
              </span>
            </>
          )}
        </div>
      </div>

      <div className="px-3 sm:px-4 pt-2.5 sm:pt-3 pb-2">
        {isSyncing ? (
          <div className="space-y-1.5">
            <div className="h-3.5 w-3/4 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
            <div className="h-3.5 w-1/2 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
          </div>
        ) : (
          <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white line-clamp-2 leading-snug">
            {title}
          </p>
        )}
      </div>
      <div className="px-3 sm:px-4 pb-3 grid grid-cols-2 gap-x-3 sm:gap-x-4 gap-y-2 sm:gap-y-2.5">
        {fields.map(({ label, value }, i) => (
          <div key={label} className="min-w-0">
            <p className="text-[9px] sm:text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500">
              {label}
            </p>
            {isSyncing ? (
              <div className={`h-3 mt-1 rounded ${SKELETON_WIDTHS[i]} bg-gray-200 dark:bg-gray-700 animate-pulse`} />
            ) : (
              <p className="text-[11px] sm:text-xs font-medium text-gray-800 dark:text-gray-200 truncate">
                {value}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-2.5 bg-gray-50 dark:bg-gray-800/40 border-t border-gray-100 dark:border-gray-800 gap-2">
        {isSyncing ? (
          <div className="h-3 w-28 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
        ) : (
          <span className="text-[9px] sm:text-[10px] text-gray-400 dark:text-gray-500 truncate">
            {formatDate(createdAt)} · {formatTime(createdAt)}
          </span>
        )}
        <span className={`text-[9px] sm:text-[10px] font-medium whitespace-nowrap shrink-0 ${
          isSyncing ? 'text-violet-400 dark:text-violet-500' : 'text-violet-500 dark:text-violet-400'
        }`}>
          {isSyncing ? 'Please wait...' : 'View details →'}
        </span>
      </div>
    </div>
  );
}