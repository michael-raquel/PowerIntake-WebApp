import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { CheckCircle2, Clock, Loader2, XCircle, AlertCircle, ArrowRight } from 'lucide-react';

const STATUS_STYLES = {
  Submitted: {
    icon: CheckCircle2,
    color: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-100 dark:bg-green-900/30',
    border: 'border-green-200 dark:border-green-800',
    dot: 'bg-green-500 ring-4 ring-green-100 dark:ring-green-900/20',
  },
  Open: {
    icon: CheckCircle2,
    color: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-100 dark:bg-green-900/30',
    border: 'border-green-200 dark:border-green-800',
    dot: 'bg-green-500 ring-4 ring-green-100 dark:ring-green-900/20',
  },
  'In Progress': {
    icon: Loader2,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    border: 'border-blue-200 dark:border-blue-800',
    dot: 'bg-blue-500 ring-4 ring-blue-100 dark:ring-blue-900/20',
  },
  Closed: {
    icon: XCircle,
    color: 'text-gray-600 dark:text-gray-400',
    bg: 'bg-gray-100 dark:bg-gray-800/50',
    border: 'border-gray-200 dark:border-gray-700',
    dot: 'bg-gray-400 ring-4 ring-gray-100 dark:ring-gray-800',
  },
  Pending: {
    icon: AlertCircle,
    color: 'text-yellow-600 dark:text-yellow-400',
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    border: 'border-yellow-200 dark:border-yellow-800',
    dot: 'bg-yellow-500 ring-4 ring-yellow-100 dark:ring-yellow-900/20',
  },
};

const defaultStyle = {
  icon: Clock,
  color: 'text-gray-600 dark:text-gray-400',
  bg: 'bg-gray-100 dark:bg-gray-800/50',
  border: 'border-gray-200 dark:border-gray-700',
  dot: 'bg-gray-400 ring-4 ring-gray-100 dark:ring-gray-800',
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
                  'w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 group-hover:scale-110',
                  style.bg,
                  style.border,
                  'border-2'
                )}>
                  <Icon className={cn('w-4 h-4 animate-[spin_3s_linear_infinite]', style.color)} />
                </div>
                {!isLast && (
                  <div className="absolute top-10 left-4 w-0.5 h-6 bg-gradient-to-b from-gray-200 to-transparent dark:from-gray-700 dark:to-transparent" />
                )}
              </div>

              <div className={cn(
                'flex-1 min-w-0 rounded-xl p-3 transition-all duration-200 group-hover:shadow-md',
                style.bg,
                'border',
                style.border
              )}>
                <div className="flex items-center justify-between gap-2">
                  <p className={cn('text-sm font-semibold', style.color)}>
                    {s.v_status}
                  </p>
                  <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 bg-white/50 dark:bg-gray-900/50 px-2 py-1 rounded-full">
                    {format(new Date(s.v_createdat), 'MMM d')}
                  </span>
                </div>
                
                <div className="flex items-center gap-1.5 mt-1.5">
                  <Clock className="w-3 h-3 text-gray-400 dark:text-gray-500" />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {format(new Date(s.v_createdat), 'hh:mm a')}
                  </p>
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