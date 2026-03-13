import React, { useState } from 'react';
import { X, StickyNote, ChevronLeft, User, CalendarCheck, Paperclip, GitBranch } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import ComNotes from './tabs/ComNotes';
import ComUserInformation from './tabs/ComUserInformtaion';
import ComClosureDate from './tabs/ComClosureDate';
import ComAttachment from './tabs/ComAttachment';
import ComTimelineView from './tabs/ComTimelineView';

const TABS = [
  { id: 'notes',       icon: StickyNote,    label: 'Notes'            },
  { id: 'user',        icon: User,          label: 'User Information' },
  { id: 'closure',     icon: CalendarCheck, label: 'Closure Date'     },
  { id: 'attachments', icon: Paperclip,     label: 'Attachments'      },
  { id: 'timeline',    icon: GitBranch,     label: 'Timeline'         },
];

const STATUS_COLORS = {
  Submitted:   'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-900',
  'In Progress':'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900',
  Closed:      'bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700',
  Pending:     'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/30 dark:text-yellow-400 dark:border-yellow-900',
};

const PRIORITY_COLORS = {
  High:   'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400',
  Medium: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400',
  Low:    'bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400',
};

export default function ComUpdateForm({ ticket, onClose }) {
  const [activeTab, setActiveTab] = useState(null);
  const [panelOpen, setPanelOpen] = useState(false);

  if (!ticket) return null;

  const getInitials = (name) => 
    name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';

  const handleTabClick = (tabId) => {
    if (activeTab === tabId) {
      setPanelOpen(false);
      setTimeout(() => setActiveTab(null), 200);
    } else {
      setActiveTab(tabId);
      setPanelOpen(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden relative">
        
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Ticket</span>
                <span className="text-xs font-semibold text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-md">
                  #{ticket.v_ticketnumber}
                </span>
              </div>
              <span className={cn(
                'text-xs font-medium px-2.5 py-1 rounded-md',
                STATUS_COLORS[ticket.v_status] ?? STATUS_COLORS.Submitted
              )}>
                {ticket.v_status}
              </span>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-gray-100 dark:hover:bg-gray-800">
              <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </Button>
          </div>

          <div className="flex flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto">
              <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-800">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700 flex items-center justify-center text-white font-semibold text-base shadow-sm shrink-0">
                      {getInitials(ticket.v_username)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-0.5">Requester</p>
                      <p className="text-base font-semibold text-gray-900 dark:text-white truncate">{ticket.v_username}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{ticket.v_useremail}</p>
                    </div>
                  </div>
                  <Button className="bg-purple-600 hover:bg-purple-700 dark:bg-purple-600 dark:hover:bg-purple-700 text-white shadow-sm px-5 w-full sm:w-auto">
                    Update
                  </Button>
                </div>
              </div>

              <div className="px-6 py-5 space-y-6">
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Issue Details</h3>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-800">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Title</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white break-words">{ticket.v_title || '—'}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-800">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Description</p>
                      <p className="text-sm text-gray-900 dark:text-gray-200 whitespace-pre-wrap leading-relaxed break-words">{ticket.v_description || '—'}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Ticket Details</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-800">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Type</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white break-words">{ticket.v_ticketcategory || '—'}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-800">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Lifecycle</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white break-words">{ticket.v_ticketlifecycle || '—'}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-800">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Priority</p>
                      <span className={cn('text-xs font-medium px-2 py-0.5 rounded inline-block', PRIORITY_COLORS[ticket.v_priority])}>
                        {ticket.v_priority}
                      </span>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-800">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Technician</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white break-words">{ticket.v_technicianname || '—'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="w-14 border-l border-gray-200 dark:border-gray-800 flex flex-col items-center py-5 gap-2 shrink-0 bg-gray-50/50 dark:bg-gray-900">
              {TABS.map(({ id, icon: Icon, label }) => (
                <button
                  key={id}
                  onClick={() => handleTabClick(id)}
                  title={label}
                  className={cn(
                    'w-9 h-9 rounded-lg flex items-center justify-center transition-all relative',
                    activeTab === id
                      ? 'bg-purple-600 text-white shadow-md dark:bg-purple-600'
                      : 'text-gray-400 hover:bg-gray-200 dark:text-gray-500 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-300'
                  )}
                >
                  <Icon className="w-4.5 h-4.5" />
                </button>
              ))}
            </div>
          </div>
        </div>

    <div
          className={cn(
            'absolute top-0 left-0 h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 shadow-xl transition-all duration-300 ease-in-out overflow-hidden z-30',
            panelOpen ? 'w-80' : 'w-0'
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-80 h-full flex flex-col">
            <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200 dark:border-gray-800 shrink-0">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                {TABS.find(t => t.id === activeTab)?.label}
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setPanelOpen(false);
                  setTimeout(() => setActiveTab(null), 200);
                }}
                className="h-7 w-7 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <ChevronLeft className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
              </Button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              {activeTab === 'notes' && <ComNotes ticket={ticket} ticketUuid={ticket?.v_ticketuuid} />}
              {activeTab === 'user' && <ComUserInformation ticket={ticket} />}
              {activeTab === 'closure' && <ComClosureDate ticket={ticket} />}
              {activeTab === 'attachments' && <ComAttachment ticket={ticket} />}
              {activeTab === 'timeline' && <ComTimelineView ticket={ticket} />}
            </div>
          </div>
        </div>

        {panelOpen && (
          <div
            className="absolute inset-y-0 left-0 right-80 bg-transparent z-20"
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