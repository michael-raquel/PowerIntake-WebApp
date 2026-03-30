import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { CheckCircle2, Clock, Loader2, XCircle, User, UserCog } from 'lucide-react';
import { useEffect, useState } from 'react';
import socket from "@/lib/socket";

const STATUS_STYLES = {
  'New': {
    icon: CheckCircle2,
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    border: 'border-emerald-200 dark:border-emerald-800/50',
  },
  'Assigned': { 
    icon: Clock, 
    color: 'text-blue-600 dark:text-blue-400', 
    bg: 'bg-blue-50 dark:bg-blue-950/30', 
    border: 'border-blue-200 dark:border-blue-800/50',
  },
  'Information Provided': { 
    icon: Clock, 
    color: 'text-blue-600 dark:text-blue-400', 
    bg: 'bg-blue-50 dark:bg-blue-950/30', 
    border: 'border-blue-200 dark:border-blue-800/50',
  },
  'Escalate to Onsite': { 
    icon: Clock, 
    color: 'text-blue-600 dark:text-blue-400', 
    bg: 'bg-blue-50 dark:bg-blue-950/30', 
    border: 'border-blue-200 dark:border-blue-800/50',
  },
  'Client Responded': { 
    icon: Clock, 
    color: 'text-blue-600 dark:text-blue-400', 
    bg: 'bg-blue-50 dark:bg-blue-950/30', 
    border: 'border-blue-200 dark:border-blue-800/50',
  },
  'Rescheduled': { 
    icon: Clock, 
    color: 'text-blue-600 dark:text-blue-400', 
    bg: 'bg-blue-50 dark:bg-blue-950/30', 
    border: 'border-blue-200 dark:border-blue-800/50',
  },
  'Scheduling Required': { 
    icon: Clock, 
    color: 'text-blue-600 dark:text-blue-400', 
    bg: 'bg-blue-50 dark:bg-blue-950/30', 
    border: 'border-blue-200 dark:border-blue-800/50',
  },
  'Working Issue Now': { 
    icon: Clock, 
    color: 'text-blue-600 dark:text-blue-400', 
    bg: 'bg-blue-50 dark:bg-blue-950/30', 
    border: 'border-blue-200 dark:border-blue-800/50',
  },
  'Waiting': { 
    icon: Clock, 
    color: 'text-blue-600 dark:text-blue-400', 
    bg: 'bg-blue-50 dark:bg-blue-950/30', 
    border: 'border-blue-200 dark:border-blue-800/50',
  },
  'Waiting for Approval': { 
    icon: Clock, 
    color: 'text-blue-600 dark:text-blue-400', 
    bg: 'bg-blue-50 dark:bg-blue-950/30', 
    border: 'border-blue-200 dark:border-blue-800/50',
  },
  'Work Completed': { 
    icon: CheckCircle2, 
    color: 'text-purple-600 dark:text-purple-400', 
    bg: 'bg-purple-50 dark:bg-purple-950/30', 
    border: 'border-purple-200 dark:border-purple-800/50',
  },
  'Problem Solved': { 
    icon: CheckCircle2, 
    color: 'text-purple-600 dark:text-purple-400', 
    bg: 'bg-purple-50 dark:bg-purple-950/30', 
    border: 'border-purple-200 dark:border-purple-800/50',
  },
  'Cancelled': { 
    icon: XCircle, 
    color: 'text-rose-600 dark:text-rose-400', 
    bg: 'bg-rose-50 dark:bg-rose-950/30', 
    border: 'border-rose-200 dark:border-rose-800/50',
  },
  'Technician Rejected': { 
    icon: XCircle, 
    color: 'text-rose-600 dark:text-rose-400', 
    bg: 'bg-rose-50 dark:bg-rose-950/30', 
    border: 'border-rose-200 dark:border-rose-800/50',
  },
  'Merged': { 
    icon: XCircle, 
    color: 'text-rose-600 dark:text-rose-400', 
    bg: 'bg-rose-50 dark:bg-rose-950/30', 
    border: 'border-rose-200 dark:border-rose-800/50',
  },
};

const defaultStyle = {
  icon: Clock,
  color: 'text-gray-500 dark:text-gray-400',
  bg: 'bg-gray-50 dark:bg-gray-800/30',
  border: 'border-gray-200 dark:border-gray-700/50',
};

export default function ComTimelineView({ ticket }) {
  const [statuses, setStatuses] = useState(ticket?.v_ticketstatuses || []);

  useEffect(() => {

  setStatuses(ticket?.v_ticketstatuses || []);
}, [ticket?.v_ticketstatuses]);

useEffect(() => {
  const handleTicketUpdated = ({ ticketuuid, ticket: updated }) => {
    if (!updated) return;

    if (String(updated.v_ticketuuid) !== String(ticket?.v_ticketuuid)) return;

    if (updated.v_ticketstatuses) {
      setStatuses(updated.v_ticketstatuses);
    }
  };

  socket.on("ticket:updated", handleTicketUpdated);

  return () => {
    socket.off("ticket:updated", handleTicketUpdated);
  };
}, [ticket?.v_ticketuuid]);

  if (!statuses.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
          <Clock className="w-6 h-6 text-gray-400 dark:text-gray-500" />
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">No timeline entries</p>
      </div>
    );
  }

  return (
    <div className="relative pl-2">
      {statuses.map((s, idx) => {
        const style = STATUS_STYLES[s.v_status] || defaultStyle;
        const Icon = style.icon;
        const isLast = idx === statuses.length - 1;
        const isNew = s.v_status === 'New';
        
        let person = null;
        if (isNew) {
          person = ticket?.v_username;
        } else {
          person = s.v_technicianname || ticket?.v_technicianname;
        }

        return (
          <div key={s.v_ticketstatusid} className="relative flex gap-4 pb-8 last:pb-0">
            {!isLast && (
              <div className="absolute left-5 top-10 bottom-0 w-px bg-gradient-to-b from-gray-200 via-gray-300 to-transparent dark:from-gray-700 dark:via-gray-600 dark:to-transparent" />
            )}

            <div className="relative z-10">
              <div className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center shadow-sm transition-all duration-200 group-hover:scale-105 border-2',
                style.bg,
                style.border
              )}>
                <Icon className={cn(
                  'w-4 h-4', 
                  style.color,
                  style.icon
                )} />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="bg-white dark:bg-gray-900/50 rounded-xl p-4 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-all duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className={cn('text-sm font-semibold', style.color)}>
                      {s.v_status}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {format(new Date(s.v_createdat), 'MMM d, yyyy')}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                    <Clock className="w-3 h-3" />
                    <span>{format(new Date(s.v_createdat), 'hh:mm a')}</span>
                  </div>
                </div>

                {person && (
                  <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                    {isNew ? (
                      <User className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                    ) : (
                      <UserCog className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                    )}
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {isNew ? 'Created by' : 'Technician'}:
                    </span>
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      {person}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}