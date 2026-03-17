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
  Submitted: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-900',
  'In Progress': 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900',
  Closed: 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700',
  Pending: 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/30 dark:text-yellow-400 dark:border-yellow-900',
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
      ? ticket.v_attachments.map(a => ({
        name: a.v_attachment,
        createdAt: a.v_createdat,
      }))
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
      attachments: Array.isArray(ticket.v_attachments)
        ? ticket.v_attachments.map(a => ({
          name: a.v_attachment,
          createdAt: a.v_createdat,
        }))
        : [],
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
    if (title !== original.title) return true;
    if (description !== original.description) return true;
    if (attachments.length !== original.attachments.length) return true;
    for (let i = 0; i < attachments.length; i++) {
      const a = attachments[i];
      const oa = original.attachments[i];
      if (a.name !== oa.name || a.createdAt !== oa.createdAt) return true;
    }
    if (supportCalls.length !== original.supportCalls.length) return true;
    for (let i = 0; i < supportCalls.length; i++) {
      const c = supportCalls[i];
      const oc = original.supportCalls[i];
      const currentDateStr = c.date ? new Date(c.date).toISOString() : null;
      if (currentDateStr !== oc.date) return true;
      if (c.fromTime !== oc.fromTime) return true;
      if (c.toTime !== oc.toTime) return true;
    }
    return false;
  }, [title, description, attachments, supportCalls, original]);

  if (!ticket) return null;

  const currentUserId = account?.localAccountId;
  const isOwner = ticket.v_entrauserid === currentUserId;
  const isEditableStatus = ticket.v_status === 'Submitted';
  const canEdit = isOwner && isEditableStatus;

  const handleAddCall = () => {
    if (!canEdit) return;
    setSupportCalls(prev => [...prev, { id: Date.now(), date: new Date(), fromTime: '09:00', toTime: '17:00' }]);
  };

  const handleRemoveCall = (id) => {
    if (!canEdit) return;
    setSupportCalls(prev => prev.filter(call => call.id !== id));
  };

  const handleCallChange = (id, field, value) => {
    if (!canEdit) return;
    setSupportCalls(prev => prev.map(call => (call.id === id ? { ...call, [field]: value } : call)));
  };

  const handleUpdate = async () => {
    if (!ticket.v_ticketuuid || !canEdit || !hasChanges) return;
    await updateTicket({
      ticketuuid: ticket.v_ticketuuid,
      formData: { title, description, timezone: ticket.v_usertimezone, location: ticket.v_officelocation },
      supportCalls: supportCalls.map(c => ({ date: c.date, fromTime: c.fromTime, toTime: c.toTime })),
      attachments,
    });
    onUpdated?.(ticket.v_ticketuuid);
    onClose?.();
  };

  const handleTabClick = (tabId) => {
    if (activeTab === tabId) {
      setPanelOpen(false);
      setTimeout(() => setActiveTab(null), 200);
    } else {
      setActiveTab(tabId);
      setPanelOpen(true);
    }
  };

  const closePanel = () => {
    setPanelOpen(false);
    setTimeout(() => setActiveTab(null), 200);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'notes': return <ComNotes ticket={ticket} ticketUuid={ticket.v_ticketuuid} canEdit={isEditableStatus} />;
      case 'user': return <ComUserInformation ticket={ticket} />;
      case 'closure': return <ComClosureDate ticket={ticket} />;
      case 'attachments': return <ComAttachment attachments={attachments} onChange={setAttachments} canEdit={canEdit} />;
      case 'timeline': return <ComTimelineView ticket={ticket} />;
      default: return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-[95vw] lg:w-[75vw] h-[95vh] flex flex-col overflow-hidden relative">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Ticket</span>
            <span className="text-xs font-semibold text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-md">
              #{ticket.v_ticketnumber}
            </span>
            <span className={cn('text-xs font-medium px-2.5 py-1 rounded-md', STATUS_COLORS[ticket.v_status])}>
              {ticket.v_status}
            </span>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 space-y-6">
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700 flex items-center justify-center text-white font-semibold text-base shrink-0">
                    {ticket.v_username?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Requester</p>
                    <p className="text-base font-semibold text-gray-900 dark:text-white truncate">{ticket.v_username}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{ticket.v_useremail}</p>
                  </div>
                </div>
                {canEdit && (
                  <Button onClick={handleUpdate} disabled={loading || !hasChanges}
                    className="bg-purple-600 hover:bg-purple-700 dark:bg-purple-600 dark:hover:bg-purple-700 text-white px-5 shrink-0">
                    {loading ? 'Updating...' : 'Update'}
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400">Issue Details</h3>
              <div className="space-y-3">
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Title</p>
                  {canEdit ? (
                    <Input value={title} onChange={e => setTitle(e.target.value)}
                      className="text-sm font-medium text-gray-900 dark:text-white bg-transparent border-none px-0 shadow-none focus-visible:ring-0" />
                  ) : (
                    <p className="text-sm text-gray-900 dark:text-white font-medium break-words">{title}</p>
                  )}
                </div>
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Description</p>
                  {canEdit ? (
                    <Textarea value={description} onChange={e => setDescription(e.target.value)}
                      rows={4} className="text-sm text-gray-900 dark:text-white bg-transparent border-none px-0 shadow-none focus-visible:ring-0 resize-none max-h-[96px] overflow-y-auto" />
                  ) : (
                    <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap break-words max-h-[96px] overflow-y-auto">{description}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400">Ticket Details</h3>
              <div className="grid grid-cols-2 md:flex md:flex-wrap md:gap-3">
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg px-4 py-2 border border-gray-200 dark:border-gray-700 md:flex-1 md:min-w-[180px]">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Type</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{ticket.v_ticketcategory || '—'}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg px-4 py-2 border border-gray-200 dark:border-gray-700 md:flex-1 md:min-w-[180px]">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Lifecycle</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{ticket.v_ticketlifecycle || '—'}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg px-4 py-2 border border-gray-200 dark:border-gray-700 md:flex-1 md:min-w-[180px]">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Priority</p>
                  <span className={cn('text-xs font-medium px-2 py-1 rounded inline-block', PRIORITY_COLORS[ticket.v_priority])}>
                    {ticket.v_priority || '—'}
                  </span>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg px-4 py-2 border border-gray-200 dark:border-gray-700 md:flex-1 md:min-w-[180px]">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Technician</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{ticket.v_technicianname || '—'}</p>
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
                            <PopoverContent className="w-auto p-0">
                              <Calendar mode="single" selected={call.date} onSelect={date => handleCallChange(call.id, 'date', date)}
                                disabled={date => date < new Date()} initialFocus />
                            </PopoverContent>
                          </Popover>
                        ) : (
                          <p className="text-sm text-gray-900 dark:text-white">{call.date ? format(call.date, "PPP") : '—'}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Start</p>
                        {canEdit ? (
                          <Input type="time" value={call.fromTime} onChange={e => handleCallChange(call.id, 'fromTime', e.target.value)}
                            className="h-8 text-sm w-full" />
                        ) : (
                          <p className="text-sm text-gray-900 dark:text-white">{call.fromTime}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">End</p>
                        {canEdit ? (
                          <Input type="time" value={call.toTime} onChange={e => handleCallChange(call.id, 'toTime', e.target.value)}
                            className="h-8 text-sm w-full" />
                        ) : (
                          <p className="text-sm text-gray-900 dark:text-white">{call.toTime}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {!supportCalls.length && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 italic text-center py-4">No support calls scheduled.</p>
                )}
              </div>
            </div>
          </div>

          <div className="w-14 border-l border-gray-200 dark:border-gray-800 flex flex-col items-center py-5 gap-2 shrink-0 bg-gray-50/50 dark:bg-gray-900/50">
            {TABS.map(({ id, icon: Icon, label }) => (
              <button key={id} onClick={() => handleTabClick(id)} title={label}
                className={cn('w-9 h-9 rounded-lg flex items-center justify-center transition-all',
                  activeTab === id ? 'bg-purple-600 text-white shadow-md' : 'text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-gray-800 dark:hover:text-gray-300')}>
                <Icon className="w-4 h-4" />
              </button>
            ))}
          </div>
        </div>

        <div className={cn('absolute top-0 left-0 h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 shadow-xl transition-all duration-300 overflow-hidden z-30',
          panelOpen ? 'w-80 md:w-1/2' : 'w-0')}>
          {panelOpen && (
            <div className="w-80 md:w-full h-full flex flex-col">
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
        {panelOpen && <div className="absolute inset-y-0 left-0 right-80 md:right-1/2 bg-transparent z-20" onClick={closePanel} />}
      </div>
    </div>
  );
}