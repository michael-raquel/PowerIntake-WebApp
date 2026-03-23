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
  'Assigned':               'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900',
  'Information Provided':   'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900',
  'Escalate to Onsite':     'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900',
  'Client Responded':       'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900',
  'Rescheduled':            'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900',
  'Scheduling Required':    'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900',
  'Working Issue Now':      'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900',
  'Waiting':                'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900',
  'Waiting for Approval':   'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900',
  'Work Completed':  'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-900',
  'Problem Solved':  'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-900',
  'Cancelled':           'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900',
  'Technician Rejected': 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900',
  'Merged':              'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900',
};

const PRIORITY_COLORS = {
  High: 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400',
  Medium: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400',
  Low: 'bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400',
};

export default function ComUpdateForm({ ticket, onClose, onUpdated }) {
  const { account } = useAuth();
  const { updateTicket, loading } = useUpdateTicket({ account });
  const [activeTab, setActiveTab] = useState(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [title, setTitle] = useState(ticket?.v_title || '');
  const [description, setDescription] = useState(ticket?.v_description || '');
  const [attachments, setAttachments] = useState(
    Array.isArray(ticket?.v_attachments)
      ? ticket.v_attachments.map(a => ({ name: a.v_attachment, createdAt: a.v_createdat }))
      : []
  );
  const [supportCalls, setSupportCalls] = useState(() => {
    if (!ticket || !Array.isArray(ticket.v_supportcalls)) return [];
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
      supportCalls: Array.isArray(ticket.v_supportcalls)
        ? ticket.v_supportcalls.map(call => ({
            date: call.v_date ? new Date(call.v_date).toISOString() : null,
            fromTime: call.v_starttime?.slice(0, 5) || '09:00',
            toTime: call.v_endtime?.slice(0, 5) || '17:00',
          }))
        : [],
    };
  }, [ticket]);

  const hasChanges = useMemo(() => {
    if (!original) return false;
    if (title !== original.title || description !== original.description) return true;
    if (supportCalls.length !== original.supportCalls.length) return true;
    for (let i = 0; i < supportCalls.length; i++) {
      const c = supportCalls[i];
      const oc = original.supportCalls[i];
      if ((c.date ? new Date(c.date).toISOString() : null) !== oc.date) return true;
      if (c.fromTime !== oc.fromTime || c.toTime !== oc.toTime) return true;
    }
    return false;
  }, [title, description, supportCalls, original]);

  if (!ticket) return null;

  const isEditableStatus = ticket.v_status === 'New';
  const canEdit = ticket.v_entrauserid === account?.localAccountId && isEditableStatus;

  const getSelectedDates = () =>
    supportCalls.map(call => call.date ? new Date(call.date).toDateString() : null).filter(Boolean);

  const handleAddCall = () => {
    if (!canEdit) return;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const selectedDates = getSelectedDates();
    let newDate = new Date(today);
    while (selectedDates.includes(newDate.toDateString())) newDate.setDate(newDate.getDate() + 1);
    const h = new Date().getHours();
    const startTime = `${String(h).padStart(2, '0')}:00`;
    const endTime = `${String(Math.min(h + 2, 23)).padStart(2, '0')}:00`;
    setSupportCalls(prev => [...prev, { id: Date.now(), date: newDate, fromTime: startTime, toTime: endTime }]);
    toast.success("Support call added", { description: `Scheduled for ${format(newDate, 'MMM d, yyyy')} at ${startTime} - ${endTime}` });
  };

  const handleRemoveCall = (id) => {
    if (!canEdit) return;
    setSupportCalls(prev => prev.filter(call => call.id !== id));
  };

  const handleCallChange = (id, field, value) => {
    if (!canEdit) return;
    setSupportCalls(prev => {
      const callIndex = prev.findIndex(call => call.id === id);
      if (callIndex === -1) return prev;
      const updatedCall = { ...prev[callIndex], [field]: value };
      if (field === 'date' && value) {
        const dateStr = new Date(value).toDateString();
        if (prev.some((call, idx) => idx !== callIndex && call.date && new Date(call.date).toDateString() === dateStr)) {
          toast.error("Date already selected", { description: "You can only have one support call per day" });
          return prev;
        }
      }
      if (field === 'fromTime' || field === 'toTime') {
        const fromTime = field === 'fromTime' ? value : updatedCall.fromTime;
        const toTime = field === 'toTime' ? value : updatedCall.toTime;
        if (fromTime && toTime && fromTime >= toTime) {
          toast.error("Invalid time range", { description: "End time must be after start time" });
          return prev;
        }
      }
      const newCalls = [...prev];
      newCalls[callIndex] = updatedCall;
      return newCalls;
    });
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

  const handleTabClick = (tabId) => {
    if (activeTab === tabId) { setPanelOpen(false); setTimeout(() => setActiveTab(null), 200); }
    else { setActiveTab(tabId); setPanelOpen(true); }
  };

  const closePanel = () => { setPanelOpen(false); setTimeout(() => setActiveTab(null), 200); };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'notes': return <ComNotes ticket={ticket} ticketUuid={ticket.v_ticketuuid} canEdit={isEditableStatus} />;
      case 'user': return <ComUserInformation ticket={ticket} />;
      case 'closure': return <ComClosureDate ticket={ticket} />;
      case 'attachments': return (
        <ComAttachment ticketuuid={ticket.v_ticketuuid} attachments={attachments} onChange={setAttachments}
          canEdit={isEditableStatus} createdby={ticket.v_entrauserid} modifiedby={account?.localAccountId} />
      );
      case 'timeline': return <ComTimelineView ticket={ticket} />;
      default: return null;
    }
  };

  const selectedDates = getSelectedDates();
  const formatTime = (t) => {
    if (!t) return '—';
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`;
  };
  const inputClass = "text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:border-purple-500 dark:focus-visible:ring-purple-400 dark:focus-visible:border-purple-400 transition-colors";
  const readonlyClass = "bg-gray-50 dark:bg-gray-800/50 rounded-md px-3 py-2 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white";

  return (

    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70"
      style={{ padding: 'env(safe-area-inset-top, 16px) env(safe-area-inset-right, 16px) env(safe-area-inset-bottom, 16px) env(safe-area-inset-left, 16px)' }}>
      <div
        className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-[95vw] lg:max-w-[75vw] flex flex-col overflow-hidden relative"
        style={{ height: 'min(95dvh, 95vh)', maxHeight: 'min(95dvh, 95vh)' }}>

        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-gray-800 shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 shrink-0">Ticket</span>
            <span className="text-xs font-semibold text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-md shrink-0">
              #{ticket.v_ticketnumber}
            </span>
            <span className={cn('text-xs font-medium px-2.5 py-1 rounded-md border shrink-0', STATUS_COLORS[ticket.v_status])}>
              {ticket.v_status}
            </span>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0 ml-2">
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 space-y-5 sm:space-y-6">

            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700 flex items-center gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700 flex items-center justify-center text-white font-semibold text-sm sm:text-base shrink-0">
                {ticket.v_username?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?'}
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500 dark:text-gray-400">Requester</p>
                <p className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white truncate">{ticket.v_username}</p>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">{ticket.v_useremail}</p>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400">Ticket Details</h3>
              <div className="grid grid-cols-2 gap-2 md:flex md:flex-wrap md:gap-3">
                {[
                  { label: 'Source', value: ticket.v_source },
                  { label: 'Category', value: ticket.v_ticketcategory },
                  { label: 'Lifecycle', value: ticket.v_ticketlifecycle },
                  { label: 'Technician', value: ticket.v_technicianname },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-gray-50 dark:bg-gray-800/50 rounded-lg px-3 py-2.5 border border-gray-200 dark:border-gray-700 md:flex-1 md:min-w-[160px]">
                    <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{value || '—'}</p>
                  </div>
                ))}
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg px-3 py-2.5 border border-gray-200 dark:border-gray-700 md:flex-1 md:min-w-[160px]">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Priority</p>
                  <span className={cn('text-xs font-medium px-2 py-0.5 rounded inline-block mt-0.5', PRIORITY_COLORS[ticket.v_priority])}>
                    {ticket.v_priority || '—'}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400">Issue Details</h3>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Title</label>
                  {canEdit
                    ? <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Enter ticket title" className={cn("font-medium", inputClass)} />
                    : <div className={readonlyClass}><p className="font-medium break-words">{title}</p></div>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Description</label>
                  {canEdit
                    ? <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Enter ticket description"
                        rows={4} className={cn("resize-none max-h-[220px] overflow-y-auto", inputClass)} />
                    : <div className={readonlyClass}><p className="whitespace-pre-wrap break-words max-h-[220px] overflow-y-auto">{description}</p></div>}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400">Support Calls</h3>
                {canEdit && (
                  <Button variant="outline" size="sm" onClick={handleAddCall} className="gap-1 h-8">
                    <Plus className="w-3.5 h-3.5" /> Add
                  </Button>
                )}
              </div>
              <div className="space-y-3">
                {supportCalls.map(call => (
                  <div key={call.id} className="relative bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    {canEdit && supportCalls.length > 1 && (
                      <Button variant="ghost" size="icon" onClick={() => handleRemoveCall(call.id)}
                        className="absolute top-2 right-2 h-6 w-6 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300">
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Date</p>
                        {canEdit ? (
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" size="sm" className="w-full justify-start text-left font-normal h-8 text-sm">
                                <CalendarIcon className="mr-2 h-3.5 w-3.5 shrink-0" />
                                <span className="truncate">{call.date ? format(call.date, "PPP") : "Select date"}</span>
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar mode="single" selected={call.date}
                                onSelect={date => { if (date) handleCallChange(call.id, 'date', date); }}
                                disabled={date => {
                                  const today = new Date(); today.setHours(0, 0, 0, 0);
                                  return date < today || selectedDates.includes(date.toDateString());
                                }}
                                initialFocus />
                            </PopoverContent>
                          </Popover>
                        ) : (
                          <p className="text-sm text-gray-900 dark:text-white">{call.date ? format(call.date, "PPP") : '—'}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Start</p>
                        {canEdit
                          ? <Input type="time" value={call.fromTime} onChange={e => handleCallChange(call.id, 'fromTime', e.target.value)} className="h-8 text-sm w-full" />
                          : <p className="text-sm text-gray-900 dark:text-white">{formatTime(call.fromTime)}</p>}
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">End</p>
                        {canEdit
                          ? <Input type="time" value={call.toTime} onChange={e => handleCallChange(call.id, 'toTime', e.target.value)} className="h-8 text-sm w-full" />
                          : <p className="text-sm text-gray-900 dark:text-white">{formatTime(call.toTime)}</p>}
                      </div>
                    </div>
                  </div>
                ))}
                {!supportCalls.length && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 italic text-center py-4">No support calls scheduled.</p>
                )}
              </div>
            </div>

            {canEdit && (
              <div className="flex justify-end pt-2 pb-2">
                <Button onClick={handleUpdate} disabled={loading || !hasChanges}
                  className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 dark:bg-purple-600 dark:hover:bg-purple-700 text-white px-8">
                  {loading ? 'Updating...' : 'Update'}
                </Button>
              </div>
            )}
          </div>

          <div className="w-12 sm:w-14 border-l border-gray-200 dark:border-gray-800 flex flex-col items-center py-4 sm:py-5 gap-2 shrink-0 bg-gray-50/50 dark:bg-gray-900/50">
            {TABS.map(({ id, icon: Icon, label }) => (
              <button key={id} onClick={() => handleTabClick(id)} title={label}
                className={cn('w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center transition-all',
                  activeTab === id ? 'bg-purple-600 text-white shadow-md' : 'text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-gray-800 dark:hover:text-gray-300')}>
                <Icon className="w-4 h-4" />
              </button>
            ))}
          </div>
        </div>

        <div className={cn('absolute top-0 left-0 h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 shadow-xl transition-all duration-300 overflow-hidden z-30',
          panelOpen ? 'w-[85vw] sm:w-80 md:w-1/2' : 'w-0')}>
          {panelOpen && (
            <div className="w-full h-full flex flex-col">
              <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200 dark:border-gray-800">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{TABS.find(t => t.id === activeTab)?.label}</h3>
                <Button variant="ghost" size="icon" onClick={closePanel} className="h-7 w-7">
                  <ChevronLeft className="w-3.5 h-3.5" />
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">{renderTabContent()}</div>
            </div>
          )}
        </div>
        {panelOpen && <div className="absolute inset-y-0 left-0 right-[85vw] sm:right-80 md:right-1/2 bg-transparent z-20" onClick={closePanel} />}
      </div>
    </div>
  );
}