"use client";

import { useState } from 'react';
import { X, StickyNote, ChevronLeft, User, CalendarCheck, Paperclip, GitBranch } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
  Submitted: 'bg-green-50 text-green-700 border-green-200',
  'In Progress': 'bg-blue-50 text-blue-700 border-blue-200',
  Closed: 'bg-gray-50 text-gray-600 border-gray-200',
  Pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
};

const PRIORITY_COLORS = {
  High: 'bg-red-50 text-red-700',
  Medium: 'bg-yellow-50 text-yellow-700',
  Low: 'bg-green-50 text-green-700',
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

  if (!ticket) return null;

  const isEditable = ticket.v_status === 'Submitted';

  const supportCalls = Array.isArray(ticket.v_supportcalls)
    ? ticket.v_supportcalls.map(c => ({
        date: new Date(c.v_date),
        fromTime: c.v_starttime,
        toTime: c.v_endtime,
      }))
    : null;

  const handleUpdate = async () => {
    if (!ticket.v_ticketuuid) return;
    await updateTicket({
      ticketuuid: ticket.v_ticketuuid,
      formData: { title, description, timezone: ticket.v_usertimezone, location: ticket.v_officelocation },
      supportCalls,
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
      case 'notes': return <ComNotes ticket={ticket} ticketUuid={ticket.v_ticketuuid} />;
      case 'user': return <ComUserInformation ticket={ticket} />;
      case 'closure': return <ComClosureDate ticket={ticket} />;
      case 'attachments': return <ComAttachment attachments={attachments} onChange={setAttachments} />;
      case 'timeline': return <ComTimelineView ticket={ticket} />;
      default: return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden relative">
        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-gray-500">Ticket</span>
            <span className="text-xs font-semibold text-gray-900 bg-gray-100 px-2.5 py-1 rounded-md">
              #{ticket.v_ticketnumber}
            </span>
            <span className={cn('text-xs font-medium px-2.5 py-1 rounded-md', STATUS_COLORS[ticket.v_status])}>
              {ticket.v_status}
            </span>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <div className="px-6 py-5 border-b">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-semibold text-base shrink-0">
                  {ticket.v_username?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?'}
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase">Requester</p>
                  <p className="text-base font-semibold text-gray-900">{ticket.v_username}</p>
                  <p className="text-sm text-gray-500">{ticket.v_useremail}</p>
                </div>
              </div>
              <Button
                className="bg-purple-600 hover:bg-purple-700 text-white shadow-sm px-5 w-full sm:w-auto mt-4"
                onClick={handleUpdate}
                disabled={loading || !isEditable}
              >
                {loading ? 'Updating...' : 'Update'}
              </Button>
            </div>

            <div className="px-6 py-5 space-y-6">
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3">Issue Details</h3>
                <div className="space-y-3">
                  <div className="bg-gray-50 rounded-lg p-4 border">
                    <p className="text-xs text-gray-500 mb-1">Title</p>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      disabled={!isEditable}
                      className="text-sm font-medium text-gray-900 bg-transparent border-none px-0 shadow-none focus-visible:ring-0"
                    />
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 border">
                    <p className="text-xs text-gray-500 mb-1">Description</p>
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={4}
                      disabled={!isEditable}
                      className="text-sm text-gray-900 bg-transparent border-none px-0 shadow-none focus-visible:ring-0 resize-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3">Ticket Details</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-lg p-4 border">
                    <p className="text-xs text-gray-500 mb-1">Type</p>
                    <p className="text-sm font-medium text-gray-900">{ticket.v_ticketcategory || '—'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 border">
                    <p className="text-xs text-gray-500 mb-1">Lifecycle</p>
                    <p className="text-sm font-medium text-gray-900">{ticket.v_ticketlifecycle || '—'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 border">
                    <p className="text-xs text-gray-500 mb-1">Priority</p>
                    <span className={cn('text-xs font-medium px-2 py-0.5 rounded', PRIORITY_COLORS[ticket.v_priority])}>
                      {ticket.v_priority || '—'}
                    </span>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 border">
                    <p className="text-xs text-gray-500 mb-1">Technician</p>
                    <p className="text-sm font-medium text-gray-900">{ticket.v_technicianname || '—'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="w-14 border-l flex flex-col items-center py-5 gap-2 shrink-0 bg-gray-50">
            {TABS.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => handleTabClick(id)}
                title={label}
                className={cn(
                  'w-9 h-9 rounded-lg flex items-center justify-center transition-all',
                  activeTab === id
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-gray-400 hover:bg-gray-200 hover:text-gray-600'
                )}
              >
                <Icon className="w-4 h-4" />
              </button>
            ))}
          </div>
        </div>

        <div
          className={cn(
            'absolute top-0 left-0 h-full bg-white border-r shadow-xl transition-all duration-300 overflow-hidden z-30',
            panelOpen ? 'w-80' : 'w-0'
          )}
        >
          {panelOpen && (
            <div className="w-80 h-full flex flex-col">
              <div className="flex items-center justify-between px-4 py-4 border-b shrink-0">
                <h3 className="text-sm font-semibold text-gray-900">
                  {TABS.find(t => t.id === activeTab)?.label}
                </h3>
                <Button variant="ghost" size="icon" onClick={closePanel} className="h-7 w-7">
                  <ChevronLeft className="w-3.5 h-3.5" />
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                {renderTabContent()}
              </div>
            </div>
          )}
        </div>

        {panelOpen && <div className="absolute inset-y-0 left-0 right-80 bg-transparent z-20" onClick={closePanel} />}
      </div>
    </div>
  );
}