import React from 'react';
import { format, differenceInCalendarDays, startOfDay } from 'date-fns';

export default function ComClosureDate({ ticket }) {
  const createdDateValue =
    ticket?.v_createddate ??
    ticket?.v_createdat ??
    ticket?.createddate ??
    ticket?.createdat ??
    null;

  const lastModifiedDateValue =
    ticket?.v_lastmodifieddate ??
    ticket?.v_lastmodifiedat ??
    ticket?.lastmodifieddate ??
    ticket?.lastmodifiedat ??
    null;

  const closureDateValue =
    ticket?.v_closuredate ??
    ticket?.closuredate ??
    null;

  const closureNote =
    ticket?.v_closurenote ??
    ticket?.closurenote ??
    '—';

  const toDate = (value) => {
    if (!value) return null;
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  };

  const formatDate = (value, withTime = false) => {
    const d = toDate(value);
    if (!d) return '—';
    return format(d, withTime ? 'MMM dd, yyyy • hh:mm a' : 'MMM dd, yyyy');
  };

  const createdDate = toDate(createdDateValue);
  const daysOpen =
    createdDate
      ? Math.max(0, differenceInCalendarDays(startOfDay(new Date()), startOfDay(createdDate)))
      : null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Created Date</p>
        <p className="text-sm font-medium text-gray-900 dark:text-white break-words">
          {formatDate(createdDateValue)}
        </p>
      </div>

      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Last Modified Date</p>
        <p className="text-sm font-medium text-gray-900 dark:text-white break-words">
          {formatDate(lastModifiedDateValue, true)}
        </p>
      </div>

      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Days Open</p>
        <p className="text-sm font-medium text-gray-900 dark:text-white break-words">
          {daysOpen !== null ? `${daysOpen} days` : '—'}
        </p>
      </div>

      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Closure Date</p>
        <p className="text-sm font-medium text-gray-900 dark:text-white break-words">
          {closureDateValue ? formatDate(closureDateValue) : 'Not closed yet'}
        </p>
      </div>

      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 sm:col-span-2">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Closure Note</p>
        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">
          {closureNote}
        </p>
      </div>
    </div>
  );
}