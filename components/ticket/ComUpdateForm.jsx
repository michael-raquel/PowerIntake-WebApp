"use client";

import { useState, useMemo } from 'react';
import { X, StickyNote, ChevronLeft, User, CalendarCheck, Paperclip, GitBranch, Plus, Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { useAuth } from '@/context/AuthContext';
import { useUpdateTicket } from '@/hooks/UseUpdateTicket';
import { toast } from "sonner";
import ComNotes from './tabs/ComNotes';
import ComUserInformation from './tabs/ComUserInformtaion';
import ComClosureDate from './tabs/ComClosureDate';
import ComAttachment from './tabs/ComAttachment';
import ComTimelineView from './tabs/ComTimelineView';

const TABS = [
  { id: 'notes', icon: StickyNote, label: 'Notes' },
  { id: 'user', icon: User, label: 'User Information' },
  { id: 'closure', icon: CalendarCheck, label: 'Closure Date' },
  { id: 'attachments', icon: Paperclip, label: 'Attachments' },
  { id: 'timeline', icon: GitBranch, label: 'Timeline' },
];

const STATUS_COLORS = {
  'New': 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-900',
  'Assigned': 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900',
  'Information Provided': 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900',
  'Escalate to Onsite': 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900',
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


const SLOT_MINUTES = 30;
const CALL_DURATION_MS = 2 * 60 * 60 * 1000;

const toHHMM = (date) => `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;

const roundToNextSlot = (date) => {
  const minutes = date.getMinutes();
  const remainder = minutes % SLOT_MINUTES;

  if (remainder === 0) {
    return new Date(date.getTime() + SLOT_MINUTES * 60 * 1000);
  } else {
    const minutesToAdd = SLOT_MINUTES - remainder;
    return new Date(date.getTime() + minutesToAdd * 60 * 1000);
  }
};

const getNextStartTime = () => {
  const now = new Date();
  const futureTime = new Date(now.getTime() + 30 * 60 * 1000);
  const roundedTime = roundToNextSlot(futureTime);
  return roundedTime;
};

const addDuration = (date) => {
  const endDate = new Date(date.getTime() + CALL_DURATION_MS);
  return toHHMM(endDate);
};

const minTimeForDate = (date) => {
  if (!date) return '';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);

  if (d.getTime() === today.getTime()) {
    const nextStart = getNextStartTime();
    return toHHMM(nextStart);
  }
  return '';
};

export default function ComUpdateForm({ ticket, onClose, onUpdated }) {
  const { account } = useAuth();
  const { updateTicket, loading } = useUpdateTicket({ account });
  const [activeTab, setActiveTab] = useState(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [title, setTitle] = useState(ticket?.v_title || '');
  const [description, setDescription] = useState(ticket?.v_description || '');
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

  if (!ticket) return null;

  const isEditableStatus = ticket.v_status !== 'Work Completed' && ticket.v_status !== 'Problem Solved' && ticket.v_status !== 'Technician Rejected' && ticket.v_status !== 'Cancelled' && ticket.v_status !== 'Merged';
  const canEdit = ticket.v_entrauserid === account?.localAccountId && isEditableStatus;
  const selectedDates = supportCalls.map(c => c.date?.toDateString()).filter(Boolean);
  const canEditAttachments = isEditableStatus;

  const handleCallChange = (id, field, value) => {
    if (!canEdit) return;
    setSupportCalls(prev => {
      const call = prev.find(c => c.id === id);
      if (!call) return prev;

      if (field === 'date' && value) {
        if (prev.some(c => c.id !== id && c.date?.toDateString() === new Date(value).toDateString())) {
          toast.error("Date already selected", { description: "Only one support call per day." });
          return prev;
        }

        const newDate = new Date(value);
        let fromTime = call.fromTime;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const isToday = newDate.toDateString() === today.toDateString();

        if (isToday) {
          const nextStart = getNextStartTime();
          fromTime = toHHMM(nextStart);
        }

        const [hours, minutes] = fromTime.split(':').map(Number);
        const startDateObj = new Date(newDate);
        startDateObj.setHours(hours, minutes, 0, 0);
        const toTime = addDuration(startDateObj);

        return prev.map(c => c.id === id ? { ...c, date: value, fromTime, toTime } : c);
      }

      if (field === 'fromTime') {
        const min = minTimeForDate(call.date);
        if (min && value < min) {
          toast.error('Cannot select a past time.', { description: `Earliest slot is ${min}.` });
          return prev;
        }

        const [hours, minutes] = value.split(':').map(Number);
        const startDateObj = new Date(call.date);
        startDateObj.setHours(hours, minutes, 0, 0);
        const newToTime = addDuration(startDateObj);

        return prev.map(c => c.id === id ? { ...c, fromTime: value, toTime: newToTime } : c);
      }

      if (field === 'toTime') {
        const min = minTimeForDate(call.date);
        if (min && value < min) {
          toast.error('Cannot select a past time.', { description: `Earliest slot is ${min}.` });
          return prev;
        }
        if (value <= call.fromTime) {
          toast.error('End time must be after start time.');
          return prev;
        }
        return prev.map(c => c.id === id ? { ...c, toTime: value } : c);
      }

      return prev.map(c => c.id === id ? { ...c, [field]: value } : c);
    });
  };

  const handleAddCall = () => {
    if (!canEdit) return;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let newDate = new Date(today);
    while (selectedDates.includes(newDate.toDateString())) newDate.setDate(newDate.getDate() + 1);

    const startDateObj = getNextStartTime();
    const fromTime = toHHMM(startDateObj);
    const toTime = addDuration(startDateObj);

    setSupportCalls(prev => [...prev, {
      id: Date.now(),
      date: newDate,
      fromTime,
      toTime
    }]);

    toast.success("Support call added", { description: `Scheduled for ${format(newDate, 'MMM d, yyyy')}` });
  };


  const handleUpdate = async () => {
    if (!ticket.v_ticketuuid || !canEdit || !hasChanges) return;
    await updateTicket({
      ticketuuid: ticket.v_ticketuuid,
      formData: { title, description, timezone: ticket.v_usertimezone, location: ticket.v_officelocation },
      supportCalls: supportCalls.map(c => ({ date: c.date, fromTime: c.fromTime, toTime: c.toTime })),
    });
    onUpdated?.(ticket.v_ticketuuid);
    onClose?.();
  };

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
        className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-[95vw] lg:max-w-[70vw] xl:max-w-[60vw] 2xl:max-w-[50vw] flex flex-col overflow-hidden relative"
        style={{ height: 'min(95dvh, 95vh)', maxHeight: 'min(95dvh, 95vh)' }}>

        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-gray-800 shrink-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-xs lg:text-sm font-medium text-gray-500 dark:text-gray-400">Ticket</span>
            <span className="text-xs lg:text-sm font-semibold text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-md">#{ticket.v_ticketnumber}</span>
            <span className={cn('text-xs lg:text-sm font-medium px-2.5 py-1 rounded-md border', STATUS_COLORS[ticket.v_status])}>{ticket.v_status}</span>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="w-4 h-4 lg:w-5 lg:h-5" />
          </Button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-5 sm:space-y-6 lg:space-y-8">
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 lg:p-5 border border-gray-200 dark:border-gray-700 flex items-center gap-4 lg:gap-6">
              <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm lg:text-base">
                {ticket.v_username?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?'}
              </div>
              <div>
                <p className="text-xs lg:text-sm text-gray-500 dark:text-gray-400">Requester</p>
                <p className="text-sm lg:text-base font-semibold text-gray-900 dark:text-white">{ticket.v_username}</p>
                <p className="text-xs lg:text-sm text-gray-500 dark:text-gray-400">{ticket.v_useremail}</p>
              </div>
            </div>

            <div className="space-y-3 lg:space-y-4">
              <h3 className="text-xs lg:text-sm font-semibold text-gray-500 dark:text-gray-400">Ticket Details</h3>
              <div className="grid grid-cols-2 gap-2 lg:gap-3 md:flex md:flex-wrap md:gap-3 lg:gap-4">
                {[
                  { label: 'Source', value: ticket.v_source },
                  { label: 'Category', value: ticket.v_ticketcategory },
                  { label: 'Lifecycle', value: ticket.v_ticketlifecycle },
                  { label: 'Technician', value: ticket.v_technicianname },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-gray-50 dark:bg-gray-800/50 rounded-lg px-3 py-2.5 lg:px-4 lg:py-3 border border-gray-200 dark:border-gray-700 md:flex-1">
                    <p className="text-xs lg:text-sm text-gray-500 dark:text-gray-400">{label}</p>
                    <p className="text-sm lg:text-base font-medium text-gray-900 dark:text-white truncate">{value || '—'}</p>
                  </div>
                ))}
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg px-3 py-2.5 lg:px-4 lg:py-3 border border-gray-200 dark:border-gray-700 md:flex-1">
                  <p className="text-xs lg:text-sm text-gray-500 dark:text-gray-400">Priority</p>
                  <span className={cn('text-xs lg:text-sm font-medium px-2 py-0.5 rounded inline-block mt-0.5', PRIORITY_COLORS[ticket.v_priority])}>
                    {ticket.v_priority || '—'}
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
                    <Textarea
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      placeholder="Enter ticket description"
                      rows={4}
                      className={cn("resize-none max-h-[220px] lg:max-h-[280px] overflow-y-auto", inputClass)}
                    />
                  ) : (
                    <div className={cn(readonlyClass, "max-h-[220px] lg:max-h-[280px] overflow-y-auto")}>
                      {description}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-3 lg:space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs lg:text-sm font-semibold text-gray-500 dark:text-gray-400">Support Calls</h3>
                {canEdit && <Button variant="outline" size="sm" onClick={handleAddCall} className="gap-1 h-8 lg:h-9 dark:border-gray-600 dark:hover:bg-gray-800"><Plus className="w-3.5 h-3.5 lg:w-4 lg:h-4" /> Add</Button>}
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
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4">
                      <div>
                        <p className="text-xs lg:text-sm text-gray-500 dark:text-gray-400 mb-1">Date</p>
                        {canEdit ? (
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" size="sm" className="w-full justify-start text-left font-normal h-8 lg:h-9 text-sm lg:text-base dark:border-gray-600 dark:hover:bg-gray-800">
                                <CalendarIcon className="mr-2 h-3.5 w-3.5 lg:h-4 lg:w-4" />
                                <span>{call.date ? format(call.date, "PPP") : "Select date"}</span>
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar mode="single" selected={call.date} onSelect={date => date && handleCallChange(call.id, 'date', date)}
                                disabled={date => {
                                  const today = new Date(); today.setHours(0, 0, 0, 0);
                                  return date < today || selectedDates.includes(date.toDateString());
                                }} initialFocus />
                            </PopoverContent>
                          </Popover>
                        ) : (
                          <p className="text-sm lg:text-base text-gray-900 dark:text-white">{call.date ? format(call.date, "PPP") : '—'}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-xs lg:text-sm text-gray-500 dark:text-gray-400 mb-1">Start</p>
                        {canEdit ? (
                          <Input type="time" value={call.fromTime} min={minTimeForDate(call.date) || undefined}
                            onChange={e => handleCallChange(call.id, 'fromTime', e.target.value)} className="h-8 lg:h-9 text-sm lg:text-base" />
                        ) : (
                          <p className="text-sm lg:text-base text-gray-900 dark:text-white">{formatTime(call.fromTime)}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-xs lg:text-sm text-gray-500 dark:text-gray-400 mb-1">End</p>
                        {canEdit ? (
                          <Input type="time" value={call.toTime} min={minTimeForDate(call.date) || undefined}
                            onChange={e => handleCallChange(call.id, 'toTime', e.target.value)} className="h-8 lg:h-9 text-sm lg:text-base" />
                        ) : (
                          <p className="text-sm lg:text-base text-gray-900 dark:text-white">{formatTime(call.toTime)}</p>
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
                <Button onClick={handleUpdate} disabled={loading || !hasChanges} className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white px-8 py-2 lg:py-2.5 text-sm lg:text-base">
                  {loading ? 'Updating...' : 'Update'}
                </Button>
              </div>
            )}
          </div>

          <div className="w-12 sm:w-14 lg:w-16 border-l border-gray-200 dark:border-gray-800 flex flex-col items-center py-4 gap-2 shrink-0 bg-gray-50/50 dark:bg-gray-800/50">
            {TABS.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => {
                  if (activeTab === id) {
                    setPanelOpen(false);
                    setTimeout(() => setActiveTab(null), 200);
                  } else {
                    setActiveTab(id);
                    setPanelOpen(true);
                  }
                }}
                title={label}
                className={cn(
                  'w-8 h-8 lg:w-10 lg:h-10 rounded-lg flex items-center justify-center transition-all',
                  activeTab === id
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-gray-500 hover:bg-gray-200 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200'
                )}
              >
                <Icon className="w-4 h-4 lg:w-5 lg:h-5" />
              </button>
            ))}
          </div>
        </div>

        <div className={cn(
          'absolute top-0 left-0 h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 shadow-xl transition-all duration-300 overflow-hidden z-30',
          panelOpen ? 'w-[85vw] sm:w-80 lg:w-1/2' : 'w-0'
        )}>
          {panelOpen && (
            <div className="w-full h-full flex flex-col">
              <div className="flex items-center justify-between px-4 py-4 lg:px-5 lg:py-5 border-b border-gray-200 dark:border-gray-800">
                <h3 className="text-sm lg:text-base font-semibold text-gray-900 dark:text-white">
                  {TABS.find(t => t.id === activeTab)?.label}
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setPanelOpen(false);
                    setTimeout(() => setActiveTab(null), 200);
                  }}
                  className="h-7 w-7 lg:h-8 lg:w-8 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                >
                  <ChevronLeft className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 lg:p-5">
                {activeTab === 'notes' && <ComNotes ticket={ticket} ticketUuid={ticket.v_ticketuuid} canEdit={isEditableStatus} />}
                {activeTab === 'user' && <ComUserInformation ticket={ticket} />}
                {activeTab === 'closure' && <ComClosureDate ticket={ticket} />}
                {activeTab === 'attachments' && (
                  <ComAttachment
                    ticketuuid={ticket.v_ticketuuid}
                    ticket={ticket}
                    attachments={attachments}
                    onChange={setAttachments}
                    canEdit={canEditAttachments}
                    createdby={ticket.v_entrauserid}
                    modifiedby={account?.localAccountId}
                  />
                )}
                {activeTab === 'timeline' && <ComTimelineView ticket={ticket} />}
              </div>
            </div>
          )}
        </div>

        {panelOpen && (
          <div
            className="absolute inset-y-0 left-0 right-[85vw] sm:right-80 lg:right-96 xl:right-[400px] bg-transparent z-20"
            onClick={() => {
              setPanelOpen(false);
              setTimeout(() => setActiveTab(null), 200);
            }}
          />
        )}
      </div>
    </div>
  );
}