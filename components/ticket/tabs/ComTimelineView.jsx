import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const STATUS_STYLES = {
  Submitted: {
    dot: 'bg-green-500 ring-green-200 dark:ring-green-900/30',
    bg: 'bg-green-50 dark:bg-green-950/20',
    text: 'text-green-700 dark:text-green-400',
  },
  Open: {
    dot: 'bg-green-500 ring-green-200 dark:ring-green-900/30',
    bg: 'bg-green-50 dark:bg-green-950/20',
    text: 'text-green-700 dark:text-green-400',
  },
  'In Progress': {
    dot: 'bg-blue-500 ring-blue-200 dark:ring-blue-900/30',
    bg: 'bg-blue-50 dark:bg-blue-950/20',
    text: 'text-blue-700 dark:text-blue-400',
  },
  Closed: {
    dot: 'bg-gray-400 ring-gray-200 dark:ring-gray-800',
    bg: 'bg-gray-50 dark:bg-gray-800/50',
    text: 'text-gray-600 dark:text-gray-400',
  },
  Pending: {
    dot: 'bg-yellow-500 ring-yellow-200 dark:ring-yellow-900/30',
    bg: 'bg-yellow-50 dark:bg-yellow-950/20',
    text: 'text-yellow-700 dark:text-yellow-400',
  },
};

const defaultStyle = {
  dot: 'bg-gray-400 ring-gray-200 dark:ring-gray-800',
  bg: 'bg-gray-50 dark:bg-gray-800/50',
  text: 'text-gray-600 dark:text-gray-400',
};

export default function ComTimelineView({ ticket }) {
  const statuses = ticket?.v_ticketstatuses || [];

  if (!statuses.length) {
    return (
      <p className="text-sm text-gray-400 dark:text-gray-500 py-4 text-center">
        No timeline entries.
      </p>
    );
  }

  return (
    <div className="relative pl-4">
      <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-purple-300 via-purple-200 to-purple-300 dark:from-purple-700 dark:via-purple-800 dark:to-purple-700 rounded-full" />

      <div className="space-y-4">
        {statuses.map((s) => {
          const style = STATUS_STYLES[s.v_status] || defaultStyle;
          return (
            <div key={s.v_ticketstatusid} className="relative flex gap-4">
              <div
                className={cn(
                  'w-5 h-5 rounded-full border-2 border-white dark:border-gray-900 shrink-0 mt-1 z-10 ring-4',
                  style.dot
                )}
              />

              <div className={cn('flex-1 min-w-0 rounded-lg p-3', style.bg)}>
                <p className={cn('text-sm font-semibold', style.text)}>
                  {s.v_status}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {format(new Date(s.v_createdat), 'MMM dd, yyyy • hh:mm a')}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}