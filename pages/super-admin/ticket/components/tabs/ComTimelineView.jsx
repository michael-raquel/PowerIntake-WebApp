import React from 'react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const STATUS_DOT = {
  Submitted:    'bg-green-500',
  'In Progress':'bg-blue-500',
  Closed:       'bg-gray-400',
  Pending:      'bg-yellow-500',
};

export default function ComTimelineView({ ticket }) {
  const statuses = ticket?.v_ticketstatuses ?? [];

  if (!statuses.length) {
    return <p className="text-sm text-gray-400 py-4 text-center">No timeline entries.</p>;
  }

  return (
    <div className="relative pl-4">
      <div className="absolute left-[7px] top-2 bottom-2 w-px bg-gray-200 dark:bg-gray-700" />
      <div className="space-y-5">
        {statuses.map((s, i) => (
          <div key={s.v_ticketstatusid} className="relative flex gap-3">
            <div className={cn('w-3.5 h-3.5 rounded-full border-2 border-white dark:border-gray-900 shrink-0 mt-0.5 z-10', STATUS_DOT[s.v_status] ?? 'bg-gray-400')} />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{s.v_status}</p>
              <p className="text-xs text-gray-400">{format(new Date(s.v_createdat), 'MMM dd, yyyy • hh:mm a')}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}