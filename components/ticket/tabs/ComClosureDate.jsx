import { format, differenceInCalendarDays } from 'date-fns';

export default function ComClosureDate({ ticket }) {
  const created = ticket?.v_createdat ? new Date(ticket.v_createdat) : null;
  const modified = ticket?.v_modifiedat ? new Date(ticket.v_modifiedat) : null;
  const closed = ticket?.v_closuredate ? new Date(ticket.v_closuredate) : null;
  const note = ticket?.v_closurenote || '—';

  const daysOpen = created ? Math.max(0, differenceInCalendarDays(new Date(), created)) : null;

  const formatDate = (date, withTime = false) => {
    if (!date) return '—';
    return format(date, withTime ? 'MMM dd, yyyy • hh:mm a' : 'MMM dd, yyyy');
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 sm:p-4">
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Created Date</p>
        <p className="text-sm font-medium text-gray-900 dark:text-white break-words">
          {formatDate(created)}
        </p>
      </div>
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 sm:p-4">
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Last Modified</p>
        <p className="text-sm font-medium text-gray-900 dark:text-white break-words">
          {formatDate(modified, true)}
        </p>
      </div>
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 sm:p-4">
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Days Open</p>
        <p className="text-sm font-medium text-gray-900 dark:text-white break-words">
          {daysOpen !== null ? `${daysOpen} days` : '—'}
        </p>
      </div>
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 sm:p-4">
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Closure Date</p>
        <p className="text-sm font-medium text-gray-900 dark:text-white break-words">
          {closed ? formatDate(closed) : 'Not closed'}
        </p>
      </div>
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 sm:p-4 col-span-1 sm:col-span-2">
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Closure Note</p>
        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">
          {note}
        </p>
      </div>
    </div>
  );
}