"use client";

import { useState, useMemo, useEffect, useCallback } from 'react';
import { X, StickyNote, ChevronLeft, User, CalendarCheck, Paperclip, GitBranch, Plus, Calendar as CalendarIcon, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { useAuth } from '@/context/AuthContext';
import { useUpdateTicket } from '@/hooks/UseUpdateTicket';
import { useReactivateTicket } from '@/hooks/UseReactivateTicket';
import { toast } from "sonner";
import ComNotes from './tabs/ComNotes';
import ComUserInformation from './tabs/ComUserInformtaion';
import ComClosureDate from './tabs/ComClosureDate';
import ComAttachment from './tabs/ComAttachment';
import ComTimelineView from './tabs/ComTimelineView';
import socket from "@/lib/socket";

const TABS = [
  { id: 'notes', icon: StickyNote, label: 'Notes' },
  { id: 'user', icon: User, label: 'User Information' },
  { id: 'closure', icon: CalendarCheck, label: 'Resolution' },
  { id: 'attachments', icon: Paperclip, label: 'Attachments' },
  { id: 'timeline', icon: GitBranch, label: 'Timeline' },
];

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

const PRIORITY_COLORS = {
  High: 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400',
  Medium: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400',
  Low: 'bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400',
};

const CALL_DURATION_MS = 2 * 60 * 60 * 1000;
const CLOSED_STATUSES = ['Work Completed', 'Problem Solved', 'Technician Rejected', 'Cancelled', 'Merged'];
const REACTIVATABLE_STATUSES = ['Resolved', 'Cancelled'];

const toHHMM = (date) => `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;

const formatTo12Hour = (time24) => {
  if (!time24) return '';
  const [hours, minutes] = time24.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;
  return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
};

const getNextStartTime = () => {
  const now = new Date();
  now.setMinutes(now.getMinutes() + 30);
  const minutes = now.getMinutes();
  if (minutes % 30 !== 0) now.setMinutes(Math.ceil(minutes / 30) * 30);
  now.setSeconds(0, 0);
  if (now.getMinutes() === 60) {
    now.setHours(now.getHours() + 1);
    now.setMinutes(0);
  }
  if (now.getHours() > 23 || (now.getHours() === 23 && now.getMinutes() > 30)) return null;
  return now;
};

const calcEndTime = (date, startTime) => {
  if (!date || !startTime) return '';
  const [h, m] = startTime.split(':').map(Number);
  const end = new Date(date);
  end.setHours(h, m, 0, 0);
  end.setTime(end.getTime() + CALL_DURATION_MS);
  if (end.getDate() > new Date(date).getDate()) return '23:59';
  if (end.getHours() > 23 || (end.getHours() === 23 && end.getMinutes() > 30)) return '23:30';
  return toHHMM(end);
};

const stripScheduleFromDescription = (description) => {
  if (!description) return "";
  const marker = "\n\nAvailable Date and Time for Support Call:";
  const index = description.indexOf(marker);
  return index !== -1 ? description.slice(0, index) : description;
};

export default function ComUpdateForm({ ticket, onClose, onUpdated }) {
  const { account } = useAuth();
  const { updateTicket, loading: updateLoading } = useUpdateTicket({ account });
  const { reactivateTicket, loading: reactivateLoading } = useReactivateTicket();

  const [noteRefreshKey, setNoteRefreshKey]           = useState(0);
  const [attachmentRefreshKey, setAttachmentRefreshKey] = useState(0);
  
  const [liveTicket, setLiveTicket] = useState(ticket);
  useEffect(() => { setLiveTicket(ticket); }, [ticket]);

  const [activeTab, setActiveTab] = useState(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [openPopovers, setOpenPopovers] = useState({});
  const [title, setTitle] = useState(ticket?.v_title || '');
  // const [description, setDescription] = useState(ticket?.v_description || '');
  const [description, setDescription] = useState(
    stripScheduleFromDescription(ticket?.v_description || '')
  );
  const [attachments, setAttachments] = useState(
    Array.isArray(ticket?.v_attachments) ? ticket.v_attachments.map(a => ({ name: a.v_attachment, createdAt: a.v_createdat })) : []
  );
  const [supportCalls, setSupportCalls] = useState(() => {
    if (!ticket?.v_supportcalls?.length) return [];
    return ticket.v_supportcalls.map(call => ({
      id: call.v_supportcallid || Date.now() + Math.random(),
      date: call.v_date ? new Date(call.v_date) : null,
      fromTime: call.v_starttime?.slice(0, 5) || '09:00',
      toTime: call.v_endtime?.slice(0, 5) || '17:00',
    }));
  });

  const original = useMemo(() => {
    if (!ticket) return null;
    return {
      title: ticket.v_title || '',
      description: ticket.v_description || '',
      supportCalls: ticket.v_supportcalls?.map(call => ({
        date: call.v_date ? new Date(call.v_date).toISOString() : null,
        fromTime: call.v_starttime?.slice(0, 5) || '09:00',
        toTime: call.v_endtime?.slice(0, 5) || '17:00',
      })) || [],
    };
  }, [ticket]);

  const hasChanges = useMemo(() => {
    if (!original) return false;
    if (title !== original.title || description !== original.description) return true;
    if (supportCalls.length !== original.supportCalls.length) return true;
    for (let i = 0; i < supportCalls.length; i++) {
      const c = supportCalls[i], oc = original.supportCalls[i];
      if ((c.date ? new Date(c.date).toISOString() : null) !== oc.date) return true;
      if (c.fromTime !== oc.fromTime || c.toTime !== oc.toTime) return true;
    }
    return false;
  }, [title, description, supportCalls, original]);

  const isEditableStatus = liveTicket ? !CLOSED_STATUSES.includes(liveTicket.v_status) : false;
  const canEdit = ticket ? (liveTicket.v_status === 'New') : false;
  const canEditAttachments = isEditableStatus;
 const canReactivate = liveTicket 
  ? REACTIVATABLE_STATUSES.includes(liveTicket.v_ticketstatus)
  : false;

  const selectedDates = useMemo(() => supportCalls.map(c => c.date?.toDateString()).filter(Boolean), [supportCalls]);

  const handleTicketUpdated = useCallback(({ ticketuuid, ticket: updated }) => {
    if (!updated || String(updated.v_ticketuuid) !== String(ticket?.v_ticketuuid)) return;

    setLiveTicket(updated);
    setTitle(prev => prev === (ticket?.v_title || '') ? (updated.v_title || '') : prev);
    setDescription(prev =>
      prev === stripScheduleFromDescription(ticket?.v_description || '')
        ? stripScheduleFromDescription(updated.v_description || '')
        : prev
    );

    if (liveTicket?.v_status !== updated.v_status) {
      toast.info("Ticket Updated", { description: `Status changed to ${updated.v_status}` });
    }
  }, [ticket?.v_ticketuuid, ticket?.v_title, ticket?.v_description, liveTicket?.v_status]);

  useEffect(() => {
    socket.on("ticket:updated", handleTicketUpdated);
    return () => socket.off("ticket:updated", handleTicketUpdated);
  }, [handleTicketUpdated]);

  

  const isToday = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(date).toDateString() === today.toDateString();
  };

  const handleCallChange = (id, field, value) => {
    if (!canEdit) return;
    setSupportCalls(prev => {
      const call = prev.find(c => c.id === id);
      if (!call) return prev;

      if (field === 'date') {
        if (prev.some(c => c.id !== id && c.date?.toDateString() === new Date(value).toDateString())) {
          toast.error("Date already selected", { description: "Only one support call per day." });
          return prev;
        }
        const newDate = new Date(value);
        let fromTime = call.fromTime;
        let toTime = call.toTime;
        if (isToday(newDate)) {
          const nextStart = getNextStartTime();
          if (nextStart) {
            fromTime = toHHMM(nextStart);
            toTime = calcEndTime(newDate, fromTime);
          }
        }
        return prev.map(c => c.id === id ? { ...c, date: value, fromTime, toTime } : c);
      }

      if (field === 'fromTime') {
        const currentTime = toHHMM(new Date());
        if (isToday(call.date) && value < currentTime) {
          toast.error('Invalid start time', { description: `Start time cannot be in the past. Current time is ${formatTo12Hour(currentTime)}` });
          return prev;
        }
        return prev.map(c => c.id === id ? { ...c, fromTime: value, toTime: calcEndTime(call.date, value) } : c);
      }

      if (field === 'toTime') {
        const currentTime = toHHMM(new Date());
        if (isToday(call.date) && value < currentTime) {
          toast.error('Invalid end time', { description: `End time cannot be in the past. Current time is ${formatTo12Hour(currentTime)}` });
          return prev;
        }
        if (value <= call.fromTime && value !== '23:59') {
          toast.error('Start time must be earlier than end time');
          return prev;
        }
        return prev.map(c => c.id === id ? { ...c, toTime: value } : c);
      }

      return prev.map(c => c.id === id ? { ...c, [field]: value } : c);
    });
  };

  const handleAddCall = () => {
    if (!canEdit) return;
    let newDate = new Date();
    newDate.setHours(0, 0, 0, 0);
    while (selectedDates.includes(newDate.toDateString())) newDate.setDate(newDate.getDate() + 1);
    const nextStart = getNextStartTime();
    const fromTime = nextStart ? toHHMM(nextStart) : '09:00';
    const toTime = nextStart ? calcEndTime(newDate, fromTime) : '17:00';
    setSupportCalls(prev => [...prev, { id: Date.now(), date: newDate, fromTime, toTime }]);
    toast.success("Support call added", { description: `Scheduled for ${format(newDate, 'MMM d, yyyy')}` });
  };

  const handleUpdate = async () => {
    if (!ticket.v_ticketuuid || !canEdit || !hasChanges) return;

    const currentTime = toHHMM(new Date());
    for (const call of supportCalls) {
      if (isToday(call.date) && call.fromTime < currentTime) {
        toast.error('Invalid start time', { description: `Start time cannot be in the past. Current time is ${formatTo12Hour(currentTime)}` });
        return;
      }
      if (call.fromTime >= call.toTime && call.toTime !== '23:59') {
        toast.error('Start time must be earlier than end time');
        return;
      }
    }

    await updateTicket({
      ticketuuid: ticket.v_ticketuuid,
      formData: { title, description, timezone: ticket.v_usertimezone, location: ticket.v_officelocation },
      supportCalls: supportCalls.map(c => ({ date: c.date, fromTime: c.fromTime, toTime: c.toTime })),
    });

    onUpdated?.(ticket.v_ticketuuid);
    onClose?.();
  };

const handleReactivate = async () => {
    if (!ticket.v_ticketuuid || !canReactivate) return;

    try {
        await reactivateTicket({ ticketuuid: ticket.v_ticketuuid, createdby: account?.localAccountId });
        toast.success("Ticket Reactivated", {
            description: `Ticket ${liveTicket.v_ticketnumber} has been reactivated successfully`
        });
        onUpdated?.(ticket.v_ticketuuid ); 
        onClose?.();
    } catch (error) {
        toast.error("Reactivation Failed", {
            description: error.message || "Unable to reactivate ticket. Please try again."
        });
    }
};

useEffect(() => {
    const handleNoteSynced = ({ ticketuuid }) => {
        if (String(ticketuuid) !== String(ticket?.v_ticketuuid)) return;
        setNoteRefreshKey(k => k + 1);
    };

    const handleAttachmentSynced = ({ ticketuuid }) => {
        if (String(ticketuuid) !== String(ticket?.v_ticketuuid)) return;
        setAttachmentRefreshKey(k => k + 1);
    };

    const handleNoteDeleted = ({ ticketuuid }) => {
        if (String(ticketuuid) !== String(ticket?.v_ticketuuid)) return;
        setNoteRefreshKey(k => k + 1);
    };

    const handleAttachmentDeleted = ({ ticketuuid }) => {
        if (String(ticketuuid) !== String(ticket?.v_ticketuuid)) return;
        setAttachmentRefreshKey(k => k + 1);
    };

    socket.on("note:synced",        handleNoteSynced);
    socket.on("attachment:synced",  handleAttachmentSynced);
    socket.on("note:deleted",       handleNoteDeleted);      
    socket.on("attachment:deleted", handleAttachmentDeleted); 

    return () => {
        socket.off("note:synced",        handleNoteSynced);
        socket.off("attachment:synced",  handleAttachmentSynced);
        socket.off("note:deleted",       handleNoteDeleted);       
        socket.off("attachment:deleted", handleAttachmentDeleted); 
    };
}, [ticket?.v_ticketuuid]);

if (!ticket) return null;

  const formatTime = (t) => {
    if (!t) return '—';
    const [h, m] = t.split(':').map(Number);
    return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
  };

  const inputClass = "text-sm lg:text-base bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:border-purple-500 px-3 py-2 lg:px-4 lg:py-3";
  const readonlyClass = "bg-gray-50 dark:bg-gray-800/50 rounded-md border border-gray-200 dark:border-gray-700 text-sm lg:text-base text-gray-900 dark:text-white px-3 py-2 lg:px-4 lg:py-3";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70"
      style={{ padding: 'env(safe-area-inset-top, 16px) env(safe-area-inset-right, 16px) env(safe-area-inset-bottom, 16px) env(safe-area-inset-left, 16px)' }}>
      <div
        className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-[95vw] lg:max-w-[75vw] xl:max-w-[65vw] 2xl:max-w-[55vw] flex flex-col overflow-hidden relative"
        style={{ height: 'min(95dvh, 95vh)', maxHeight: 'min(95dvh, 95vh)' }}>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-gray-800 shrink-0 gap-2 sm:gap-0">
  <div className="flex items-center justify-between sm:justify-start gap-2 sm:gap-3">
    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
  <span className="text-xs lg:text-sm font-medium text-gray-500 dark:text-gray-400 shrink-0">Ticket</span>
  <span className="text-xs lg:text-sm font-semibold text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-md shrink-0">#{liveTicket.v_ticketnumber}</span>
  <span className={cn('text-xs lg:text-sm font-medium px-2.5 py-1 rounded-md border truncate min-w-0', STATUS_COLORS[liveTicket.v_status])}>{liveTicket.v_status}</span>
</div>
    <Button variant="ghost" size="icon" onClick={onClose} className="sm:hidden text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
      <X className="w-4 h-4" />
    </Button>
  </div>

  <div className="flex items-center justify-start sm:justify-end gap-2">
    {canReactivate && (
      <Button
        variant="outline"
        size="sm"
        onClick={handleReactivate}
        disabled={reactivateLoading && liveTicket.v_ticketstatus !== 'Cancelled' && liveTicket.v_ticketstatus !== 'Resolved'}
        className="gap-2 border-amber-500 text-amber-600 hover:bg-amber-50 dark:border-amber-400 dark:text-amber-400 dark:hover:bg-amber-950/30"
      >
        <RefreshCw className={cn("w-3.5 h-3.5", reactivateLoading && "animate-spin")} />
        {reactivateLoading ? 'Reactivating...' : 'Reactivate'}
      </Button>
    )}
    <Button variant="ghost" size="icon" onClick={onClose} className="hidden sm:flex text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
      <X className="w-4 h-4 lg:w-5 lg:h-5" />
    </Button>
  </div>
</div>

        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-5 sm:space-y-6 lg:space-y-8">

            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 lg:p-5 border border-gray-200 dark:border-gray-700 flex items-center gap-4 lg:gap-6">
              <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm lg:text-base">
                {liveTicket.v_username?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?'}
              </div>
              <div>
                <p className="text-xs lg:text-sm text-gray-500 dark:text-gray-400">Requester</p>
                <p className="text-sm lg:text-base font-semibold text-gray-900 dark:text-white">{liveTicket.v_username}</p>
                <p className="text-xs lg:text-sm text-gray-500 dark:text-gray-400">{liveTicket.v_useremail}</p>
              </div>
            </div>

            <div className="space-y-3 lg:space-y-4">
              <h3 className="text-xs lg:text-sm font-semibold text-gray-500 dark:text-gray-400">Ticket Details</h3>
              <div className="grid grid-cols-2 gap-2 lg:gap-3 md:flex md:flex-wrap md:gap-3 lg:gap-4 sm:space-y-0">
                {[
                  { label: 'Source',     value: liveTicket.v_source },
                  { label: 'Category',   value: liveTicket.v_ticketcategory },
                  { label: 'Lifecycle',  value: liveTicket.v_ticketlifecycle },
                  { label: 'Technician', value: liveTicket.v_technicianname },
                  { label: 'Status', value: liveTicket.v_status },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-gray-50 dark:bg-gray-800/50 rounded-lg px-3 py-2.5 lg:px-4 lg:py-3 border border-gray-200 dark:border-gray-700 md:flex-1">
                    <p className="text-xs lg:text-sm text-gray-500 dark:text-gray-400">{label}</p>
                    <p className="text-sm lg:text-base font-medium text-gray-900 dark:text-white truncate">{value || '—'}</p>
                  </div>
                ))}
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg px-3 py-2.5 lg:px-4 lg:py-3 border border-gray-200 dark:border-gray-700 md:flex-1">
                  <p className="text-xs lg:text-sm text-gray-500 dark:text-gray-400">Priority</p>
                  <span className={cn('text-xs lg:text-sm font-medium px-2 py-0.5 rounded inline-block mt-0.5', PRIORITY_COLORS[liveTicket.v_priority])}>
                    {liveTicket.v_priority || '—'}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3 lg:space-y-4">
              <h3 className="text-xs lg:text-sm font-semibold text-gray-500 dark:text-gray-400">Issue Details</h3>
              <div className="space-y-3 lg:space-y-4">
                <div className="space-y-1.5 lg:space-y-2">
                  <label className="text-xs lg:text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1 lg:mb-2">Title</label>
                  {canEdit ? (
                    <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Enter ticket title" className={cn("font-medium", inputClass)} />
                  ) : (
                    <div className={readonlyClass}>{title}</div>
                  )}
                </div>
                <div className="space-y-1.5 lg:space-y-2">
                  <label className="text-xs lg:text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1 lg:mb-2">Description</label>
                  {canEdit ? (
                    <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Enter ticket description" rows={4}
                      className={cn("resize-none max-h-[220px] lg:max-h-[280px] overflow-y-auto", inputClass)} />
                  ) : (
                    <div className={cn(readonlyClass, "max-h-[220px] lg:max-h-[280px] overflow-y-auto")}>{description}</div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-3 lg:space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs lg:text-sm font-semibold text-gray-500 dark:text-gray-400">Support Calls</h3>
                {canEdit && (
                  <Button variant="outline" size="sm" onClick={handleAddCall}
                    className="gap-1 h-8 lg:h-9 border-gray-300 bg-white text-gray-900 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-800">
                    <Plus className="w-3.5 h-3.5 lg:w-4 lg:h-4" /> Add
                  </Button>
                )}
              </div>
              <div className="space-y-3 lg:space-y-4">
                {supportCalls.map(call => (
                  <div key={call.id} className="relative bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 lg:p-5 border border-gray-200 dark:border-gray-700">
                    {canEdit && supportCalls.length > 1 && (
                      <Button variant="ghost" size="icon" onClick={() => setSupportCalls(prev => prev.filter(c => c.id !== call.id))}
                        className="absolute top-2 right-2 h-6 w-6 lg:h-7 lg:w-7 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700">
                        <X className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                      </Button>
                    )}
                    <div className="flex flex-col space-y-3 sm:grid sm:grid-cols-3 sm:gap-3 lg:gap-4 sm:space-y-0">
                      <div className="w-full">
                        <p className="text-xs lg:text-sm text-gray-500 dark:text-gray-400 mb-1">Date</p>
                        {canEdit ? (
                          <Popover open={openPopovers[call.id] || false} onOpenChange={(open) => setOpenPopovers(prev => ({ ...prev, [call.id]: open }))}>
                            <PopoverTrigger asChild>
                              <Button variant="outline" size="sm"
                                className="w-full justify-start text-left font-normal h-9 text-sm px-2 bg-white text-gray-900 border-gray-300 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-800 hover:bg-gray-100 appearance-none">
                                <CalendarIcon className="mr-2 h-3.5 w-3.5 shrink-0" />
                                <span className="truncate flex-1">{call.date ? format(call.date, "MMM d, yyyy") : "Select date"}</span>
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar mode="single" selected={call.date}
                                onSelect={(date) => { if (date) { handleCallChange(call.id, 'date', date); setOpenPopovers(prev => ({ ...prev, [call.id]: false })); } }}
                                disabled={date => { const today = new Date(); today.setHours(0, 0, 0, 0); return date < today || selectedDates.includes(date.toDateString()); }}
                                initialFocus />
                            </PopoverContent>
                          </Popover>
                        ) : (
                          <span className="truncate block w-full text-sm lg:text-base text-gray-900 dark:text-white">{call.date ? format(call.date, "MMM d, yyyy") : '—'}</span>
                        )}
                      </div>
                      <div className="w-full">
                        <p className="text-xs lg:text-sm text-gray-500 dark:text-gray-400 mb-1">Start</p>
                        {canEdit ? (
                          <Input type="time" value={call.fromTime} onChange={e => handleCallChange(call.id, 'fromTime', e.target.value)}
                            className="h-9 text-sm w-full min-w-0 max-w-full truncate bg-white text-gray-900 border border-gray-300 dark:bg-gray-800 dark:text-white dark:border-gray-600 focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:border-purple-500 px-3 py-2 lg:px-4 lg:py-3 appearance-none" />
                        ) : (
                          <span className="truncate block w-full text-sm lg:text-base text-gray-900 dark:text-white">{formatTime(call.fromTime)}</span>
                        )}
                      </div>
                      <div className="w-full">
                        <p className="text-xs lg:text-sm text-gray-500 dark:text-gray-400 mb-1">End</p>
                        {canEdit ? (
                          <Input type="time" value={call.toTime} onChange={e => handleCallChange(call.id, 'toTime', e.target.value)}
                            className="h-9 text-sm w-full min-w-0 max-w-full truncate bg-white text-gray-900 border border-gray-300 dark:bg-gray-800 dark:text-white dark:border-gray-600 focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:border-purple-500 px-3 py-2 lg:px-4 lg:py-3 appearance-none" />
                        ) : (
                          <span className="truncate block w-full text-sm lg:text-base text-gray-900 dark:text-white">{formatTime(call.toTime)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {!supportCalls.length && <p className="text-sm lg:text-base text-gray-500 dark:text-gray-400 italic text-center py-4">No support calls scheduled.</p>}
              </div>
            </div>

            {canEdit && (
              <div className="flex justify-end pt-2">
                <Button onClick={handleUpdate} disabled={updateLoading || !hasChanges}
                  className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white px-8 py-2 lg:py-2.5 text-sm lg:text-base">
                  {updateLoading ? 'Updating...' : 'Update'}
                </Button>
              </div>
            )}
          </div>

          <div className="w-12 sm:w-14 lg:w-16 border-l border-gray-200 dark:border-gray-800 flex flex-col items-center py-4 gap-2 shrink-0 bg-gray-50/50 dark:bg-gray-800/50">
            {TABS.map(({ id, icon: Icon, label }) => (
              <button key={id}
                onClick={() => { if (activeTab === id) { setPanelOpen(false); setTimeout(() => setActiveTab(null), 200); } else { setActiveTab(id); setPanelOpen(true); } }}
                title={label}
                className={cn('w-8 h-8 lg:w-10 lg:h-10 rounded-lg flex items-center justify-center transition-all',
                  activeTab === id ? 'bg-purple-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-200 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200')}>
                <Icon className="w-4 h-4 lg:w-5 lg:h-5" />
              </button>
            ))}
          </div>
        </div>

        <div className={cn('absolute top-0 left-0 h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 shadow-xl transition-all duration-300 overflow-hidden z-30',
          panelOpen ? 'w-[83vw] sm:w-80 md:w-96 lg:w-1/2' : 'w-0')}>
          {panelOpen && (
            <div className="w-full h-full flex flex-col">
              <div className="flex items-center justify-between px-4 py-4 lg:px-5 lg:py-5 border-b border-gray-200 dark:border-gray-800">
                <h3 className="text-sm lg:text-base font-semibold text-gray-900 dark:text-white">{TABS.find(t => t.id === activeTab)?.label}</h3>
                <Button variant="ghost" size="icon"
                  onClick={() => { setPanelOpen(false); setTimeout(() => setActiveTab(null), 200); }}
                  className="h-7 w-7 lg:h-8 lg:w-8 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800">
                  <ChevronLeft className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 lg:p-5">
                {activeTab === 'notes'       && <ComNotes ticket={liveTicket} ticketUuid={ticket.v_ticketuuid} canEdit={isEditableStatus}  refreshKey={noteRefreshKey} />}
                {activeTab === 'user'        && <ComUserInformation ticket={liveTicket} />}
                {activeTab === 'closure'     && <ComClosureDate ticket={liveTicket} />}
                {activeTab === 'attachments' && (
                  <ComAttachment ticketuuid={ticket.v_ticketuuid} ticket={liveTicket} attachments={attachments}
                    onChange={setAttachments} canEdit={canEditAttachments} createdby={ticket.v_entrauserid} modifiedby={account?.localAccountId} refreshKey={attachmentRefreshKey} />
                )}
                {activeTab === 'timeline' && <ComTimelineView ticket={liveTicket} />}
              </div>
            </div>
          )}
        </div>

        {panelOpen && (
          <div className="absolute inset-y-0 left-0 right-[85vw] sm:right-80 lg:right-96 xl:right-[400px] bg-transparent z-20"
            onClick={() => { setPanelOpen(false); setTimeout(() => setActiveTab(null), 200); }} />
        )}
      </div>
    </div>
  );
}