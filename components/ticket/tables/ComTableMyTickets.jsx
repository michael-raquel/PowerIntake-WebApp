import { useEffect, useState, useRef, useMemo } from 'react';
import { useFetchTicket } from '@/hooks/UseFetchTicket';
import { useAuth } from '@/context/AuthContext';
import ComUpdateForm from '../ComUpdateForm';
import ComCard from './ComCard';
import ComTableDesign from './ComTableDesign';
import useAutoSyncDynamics from "@/hooks/UseSyncTickets";
import { RefreshCw } from "lucide-react";
import socket from "@/lib/socket";


const CARD_FIELDS = [
  { key: 'v_source',         label: 'Source'     },
  { key: 'v_title',          label: 'Title'      },
  { key: 'v_ticketcategory', label: 'Category'   },
  { key: 'v_createdat',      label: 'Created At' },
  { key: 'v_target',         label: 'Target'     },
  { key: 'v_status',         label: 'Status'     },
  { key: 'v_ticketstatus',   label: 'Ticket Status' },
];

const FIELD_LABELS = {
  Source:   { key: 'v_source',         label: 'Source'   },
  Priority: { key: 'v_priority',       label: 'Priority' },
  Category: { key: 'v_ticketcategory', label: 'Category' },
  'Ticket Status': { key: 'v_status',         label: 'Ticket Status' },
};

const getPriorityClass = (p) => {
  switch (p?.toLowerCase()) {
    case 'high':   return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    case 'low':    return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    default:       return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
  }
};

const COLUMNS = [
  {
    key: 'ticketId', label: 'Ticket ID', defaultWidth: 140, minWidth: 100,
    sortValue: (t) => t.v_ticketnumber ?? '',
    render: (t) => t.v_ticketnumber,
  },
  {
    key: 'source', label: 'Source', defaultWidth: 120, minWidth: 80,
    sortValue: (t) => t.v_source ?? '',
    render: (t) => t.v_source || '—',
  },
  {
    key: 'title', label: 'Title', defaultWidth: 200, minWidth: 100, cellClass: 'max-w-[200px]',
    sortValue: (t) => t.v_title ?? '',
    render: (t) => t.v_title || '—',
  },
  {
    key: 'category', label: 'Category', defaultWidth: 140, minWidth: 80, cellClass: 'max-w-[140px]',
    sortValue: (t) => t.v_ticketcategory ?? '',
    render: (t) => t.v_ticketcategory || '—',
  },
  {
    key: 'priority', label: 'Priority', defaultWidth: 110, minWidth: 80,
    sortValue: (t) => t.v_priority ?? '',
    render: (t) => (
      <span className={`px-1.5 py-0.5 text-xs rounded-full ${getPriorityClass(t.v_priority)}`}>
        {t.v_priority || '—'}
      </span>
    ),
  },
  {
    key: 'createdAt', label: 'Created At', defaultWidth: 160, minWidth: 120,
    sortValue: (t) => t.v_createdat ?? '',
    render: (t) => t.v_createdat ? new Date(t.v_createdat).toLocaleString() : '—',
  },
  {
    key: 'target', label: 'Target', defaultWidth: 160, minWidth: 120,
    sortValue: (t) => t.v_target ?? '',
    render: (t) => t.v_target ? new Date(t.v_target).toLocaleString() : '—',
  },
  {
    key: 'status', label: 'Ticket Status', defaultWidth: 130, minWidth: 90,
    sortValue: (t) => t.v_status ?? '',
    render: (t) => t.v_status || '—',
  },
  //  {
  //   key: 'ticketstatus', label: 'Status', defaultWidth: 130, minWidth: 90,
  //   sortValue: (t) => t.v_ticketstatus ?? '',
  //   render: (t) => t.v_ticketstatus || '—',
  // },
  {
    key: 'technician', label: 'Technician', defaultWidth: 140, minWidth: 100,
    sortValue: (t) => t.v_technicianname ?? '',
    render: (t) => t.v_technicianname || '—',
  },
];


const matchesFilter = (val, ticketVal, fieldLabel) => {
  if (!val) return true;
  const sentinel = `(No ${fieldLabel})`;
  const normalized = ticketVal == null || String(ticketVal) === '' ? sentinel : String(ticketVal).trim();
  if (Array.isArray(val)) return val.length === 0 || val.includes(normalized);
  return normalized.toLowerCase().includes(String(val).toLowerCase().trim());
};


export default function ComTableMyTickets({
  currentPage,
  recordsPerPage,
  onTotalRecordsChange,
  onFilterOptionsChange,
  searchValue = '',
  filters = {},
  refreshKey,
  onTicketUpdated,
  pendingSyncUuid,
  onSynced,
  onSyncFailed,
  onDeleted,
  onUpdated,
  hideCompleted = false,
}) {
  const { tokenInfo } = useAuth();
  const [selectedTicket, setSelectedTicket] = useState(null);
  const { tickets, loading, error, setTickets } = useFetchTicket({
    entrauserid: tokenInfo?.account?.localAccountId,
    refreshKey,
  });
  const { runSync, loading: syncing } = useAutoSyncDynamics();
  const prevTicketsRef = useRef();
  const prevFilteredLengthRef = useRef();

  const myTickets = useMemo(
    () => tickets.filter((t) => t.v_entrauserid === tokenInfo?.account?.localAccountId),
    [tickets, tokenInfo?.account?.localAccountId]
  );

  useEffect(() => {
    const onSyncedWS = ({ ticketuuid, ticket }) => {
      if (!ticket) return;
      setTickets((prev) =>
        prev.some((t) => t.v_ticketuuid === ticketuuid)
          ? prev.map((t) => (t.v_ticketuuid === ticketuuid ? { ...t, ...ticket } : t))
          : [ticket, ...prev]
      );
      onSynced?.();
    };

    const onFailedWS = ({ ticketuuid }) => {
      console.warn('[WS] Dynamics sync failed for ticket:', ticketuuid);
      onSyncFailed?.();
    };

    const onDeletedWS = ({ ticketuuid }) => {
      setTickets((prev) => prev.filter((t) => t.v_ticketuuid !== ticketuuid));
      if (selectedTicket && String(selectedTicket.v_ticketuuid) === String(ticketuuid))
        setSelectedTicket(null);
      onDeleted?.();
    };

    const onUpdatedWS = ({ ticketuuid, ticket }) => {
      if (!ticket) return;
      setTickets((prev) =>
        prev.map((t) => String(t.v_ticketuuid) === String(ticketuuid) ? { ...t, ...ticket } : t)
      );
      setSelectedTicket((prev) =>
        prev && String(prev.v_ticketuuid) === String(ticketuuid) ? { ...prev, ...ticket } : prev
      );
      onUpdated?.();
    };

    const onReactivatedWS = ({ ticketuuid, ticket }) => {
      if (!ticket) return;
      setTickets((prev) =>
          prev.map((t) => String(t.v_ticketuuid) === String(ticketuuid) ? { ...t, ...ticket } : t)
      );
      setSelectedTicket((prev) =>
          prev && String(prev.v_ticketuuid) === String(ticketuuid) ? { ...prev, ...ticket } : prev
      );
      onUpdated?.();
  };

    socket.on('ticket:synced',      onSyncedWS);
    socket.on('ticket:sync_failed', onFailedWS);
    socket.on('ticket:deleted',     onDeletedWS);
    socket.on('ticket:updated',     onUpdatedWS);
    socket.on('ticket:reactivated', onReactivatedWS);
    return () => {
      socket.off('ticket:synced',      onSyncedWS);
      socket.off('ticket:sync_failed', onFailedWS);
      socket.off('ticket:deleted',     onDeletedWS);
      socket.off('ticket:updated',     onUpdatedWS);
      socket.off('ticket:reactivated', onReactivatedWS);
    };
  }, [setTickets, onSynced, onSyncFailed, onDeleted, onUpdated, selectedTicket]);

  const filteredTickets = useMemo(
    () =>
      myTickets.filter((t) => {
        const s = searchValue.toLowerCase().trim();
        return (
          (!s ||
            t.v_title?.toLowerCase().includes(s) ||
            t.v_ticketnumber?.toLowerCase().includes(s) ||
            t.v_ticketcategory?.toLowerCase().includes(s)) &&
          matchesFilter(filters.Source,   t.v_source,         'Source') &&
          matchesFilter(filters.Priority, t.v_priority,       'Priority') &&
          matchesFilter(filters.Category, t.v_ticketcategory, 'Category') &&
          matchesFilter(filters['Ticket Status'], t.v_status,         'Ticket Status') &&
          (!hideCompleted ||
            (t.v_ticketstatus !== 'Cancelled' && t.v_ticketstatus !== 'Resolved'))
        );
      }),
    [myTickets, searchValue, filters, hideCompleted]
  );

  const paginated = useMemo(
    () => filteredTickets.slice((currentPage - 1) * recordsPerPage, currentPage * recordsPerPage),
    [filteredTickets, currentPage, recordsPerPage]
  );

  useEffect(() => {
    if (JSON.stringify(prevTicketsRef.current) === JSON.stringify(myTickets)) return;
    prevTicketsRef.current = myTickets;
    const options = {};
    for (const [name, { key, label }] of Object.entries(FIELD_LABELS)) {
      const values = myTickets.map((t) => t[key]);
      const hasNull = values.some((v) => v == null || String(v).trim() === '');
      const unique = [
        ...new Set(values.filter((v) => v != null && String(v).trim() !== '').map((v) => String(v).trim())),
      ];
      options[name] = hasNull ? [...unique, `(No ${label})`] : unique;
    }
    onFilterOptionsChange?.(options);
  }, [myTickets, onFilterOptionsChange]);

  useEffect(() => {
    if (prevFilteredLengthRef.current !== filteredTickets.length) {
      prevFilteredLengthRef.current = filteredTickets.length;
      onTotalRecordsChange(filteredTickets.length);
    }
  }, [filteredTickets.length, onTotalRecordsChange]);

  const syncButton = (
    <button
      onClick={async () => { await runSync(); onTicketUpdated?.(); }}
      disabled={loading || syncing}
      className="p-1.5 rounded-lg text-violet-500 hover:text-violet-700 hover:bg-violet-100 dark:text-violet-400 dark:hover:text-violet-300 dark:hover:bg-violet-900/30 transition-colors disabled:opacity-50"
    >
      <RefreshCw className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`} />
    </button>
  );

  return (
    <>
      {/* ── Mobile cards ─────────────────────────────────────────────────────── */}
      <div className="md:hidden">
        <div className="sticky top-0 z-10 flex justify-between items-center px-0 py-2 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {filteredTickets.length} Total Records
          </span>
         {/* {syncButton} */}
        </div>
      <div className="space-y-3 p-3">
          {loading ? (
            <p className="text-sm text-center text-gray-500 dark:text-gray-400 py-6">Loading...</p>
          ) : error ? (
            <p className="text-sm text-center text-red-500 dark:text-red-400 py-6">{error}</p>
          ) : !paginated.length ? (
            <p className="text-sm text-center text-gray-500 dark:text-gray-400 py-6">No tickets found.</p>
          ) : (
            paginated.map((ticket) => (
              <ComCard
                key={ticket.v_ticketuuid}
                ticket={ticket}
                fields={CARD_FIELDS}
                onClick={() => setSelectedTicket(ticket)}
                priorityClass={getPriorityClass(ticket.v_priority)}
                isSyncing={pendingSyncUuid === ticket.v_ticketuuid}
              />
            ))
          )}
            {!paginated.length && (
                    <p className="text-sm text-center text-gray-500 dark:text-gray-400 py-6">No tickets found.</p>
                  )}
        </div>
      </div>

      <ComTableDesign
        
        columns={COLUMNS}
        data={paginated}
        loading={loading}
        emptyText="No tickets found."
        totalRecords={filteredTickets.length}
        onRowClick={setSelectedTicket}
        isSyncing={(row) => pendingSyncUuid === row.v_ticketuuid}
       // actions={syncButton}
      />

      {selectedTicket && (
        <ComUpdateForm
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onUpdated={onTicketUpdated}
        />
      )}
    </>
  );
}