import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { CheckCircle2, Clock, Loader2, XCircle } from 'lucide-react';

const STATUS_STYLES = {
  'New': {
    icon: CheckCircle2,
    color: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-50 dark:bg-green-950/30',
    border: 'border-green-200 dark:border-green-800',
  },
  'Assigned':             { icon: Loader2, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/30', border: 'border-blue-200 dark:border-blue-800' },
  'Information Provided': { icon: Loader2, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/30', border: 'border-blue-200 dark:border-blue-800' },
  'Escalate to Onsite':   { icon: Loader2, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/30', border: 'border-blue-200 dark:border-blue-800' },
  'Client Responded':     { icon: Loader2, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/30', border: 'border-blue-200 dark:border-blue-800' },
  'Rescheduled':          { icon: Loader2, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/30', border: 'border-blue-200 dark:border-blue-800' },
  'Scheduling Required':  { icon: Loader2, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/30', border: 'border-blue-200 dark:border-blue-800' },
  'Working Issue Now':    { icon: Loader2, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/30', border: 'border-blue-200 dark:border-blue-800' },
  'Waiting':              { icon: Loader2, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/30', border: 'border-blue-200 dark:border-blue-800' },
  'Waiting for Approval': { icon: Loader2, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/30', border: 'border-blue-200 dark:border-blue-800' },
  'Work Completed': { icon: CheckCircle2, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-950/30', border: 'border-purple-200 dark:border-purple-800' },
  'Problem Solved': { icon: CheckCircle2, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-950/30', border: 'border-purple-200 dark:border-purple-800' },
  'Cancelled':           { icon: XCircle, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/30', border: 'border-rose-200 dark:border-rose-800' },
  'Technician Rejected': { icon: XCircle, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/30', border: 'border-rose-200 dark:border-rose-800' },
  'Merged':              { icon: XCircle, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/30', border: 'border-rose-200 dark:border-rose-800' },
};

const defaultStyle = {
  icon: Clock,
  color: 'text-gray-600 dark:text-gray-400',
  bg: 'bg-gray-50 dark:bg-gray-800/50',
  border: 'border-gray-200 dark:border-gray-700',
};

export default function ComTimelineView({ ticket }) {
  const statuses = ticket?.v_ticketstatuses || [];

  if (!statuses.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-full mb-3">
          <Clock className="w-6 h-6 text-gray-400 dark:text-gray-500" />
        </div>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">No timeline entries</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Status updates will appear here</p>
      </div>
    );
  }

  console.log('Ticket statuses:', statuses);
  return (
    <div className="relative">
      <div className="absolute left-[19px] top-3 bottom-3 w-0.5 bg-gradient-to-b from-purple-300 via-purple-400 to-purple-300 dark:from-purple-600 dark:via-purple-700 dark:to-purple-600 rounded-full opacity-50" />

      <div className="space-y-3">
        {statuses.map((s, index) => {
          const style = STATUS_STYLES[s.v_status] || defaultStyle;
          const Icon = style.icon;
          const isLast = index === statuses.length - 1;

          return (
            <div key={s.v_ticketstatusid} className="relative flex items-start gap-3 group">
              <div className="relative shrink-0">
                <div className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 group-hover:scale-110 border-2',
                  style.bg, style.border
                )}>
                  <Icon className={cn('w-4 h-4', style.color,
                    style.icon === Loader2 && 'animate-[spin_3s_linear_infinite]'
                  )} />
                </div>
                {!isLast && (
                  <div className="absolute top-10 left-4 w-0.5 h-6 bg-gradient-to-b from-gray-200 to-transparent dark:from-gray-700 dark:to-transparent" />
                )}
              </div>

              <div className={cn(
                'flex-1 min-w-0 rounded-xl p-3 transition-all duration-200 group-hover:shadow-md border',
                style.bg, style.border
              )}>
                <div className="flex items-center justify-between gap-2">
                  <p className={cn('text-sm font-semibold', style.color)}>{s.v_status}</p>
                  <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 bg-white/50 dark:bg-gray-900/50 px-2 py-1 rounded-full">
                    {format(new Date(s.v_createdat), 'MMM d')}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <Clock className="w-3 h-3 text-gray-400 dark:text-gray-500" />
                  <p className="text-xs text-gray-500 dark:text-gray-400">{format(new Date(s.v_createdat), 'hh:mm a')}</p>
                </div>
                {s.v_note && (
                  <p className="text-xs text-gray-600 dark:text-gray-300 mt-2 pl-2 border-l-2 border-gray-200 dark:border-gray-700">
                    {s.v_note}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}