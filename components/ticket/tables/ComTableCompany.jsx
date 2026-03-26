import { useEffect, useState, useRef, useMemo } from 'react';
import { useFetchTicket } from '@/hooks/UseFetchTicket';
import { useAuth } from '@/context/AuthContext';
import ComUpdateForm from '../ComUpdateForm';
import ComCard from './ComCard';
import useAutoSyncDynamics from "@/hooks/UseSyncTickets";
import { RefreshCw } from "lucide-react";

const cardFields = [
  { key: 'v_department',     label: 'Dept'     },
  { key: 'v_username',       label: 'User'     },
  { key: 'v_title',          label: 'Title'    },
  { key: 'v_ticketcategory', label: 'Category' },
  { key: 'v_target',         label: 'Target'  },
  { key: 'v_status',         label: 'Status'   },
];

export default function ComTableCompany({
  currentPage,
  recordsPerPage,
  onTotalRecordsChange,
  onFilterOptionsChange,
  searchValue = '',
  filters = {},
  refreshKey,
  onTicketUpdated,
}) {
  const { tokenInfo } = useAuth();
  const [selectedTicket, setSelectedTicket] = useState(null);
  const { tickets, loading, error } = useFetchTicket({
    entratenantid: tokenInfo?.account?.tenantId,
    refreshKey,
  });

  const prevTicketsRef = useRef();
  const prevFilteredLengthRef = useRef();
  
  const { runSync, loading: syncing, error: syncError } = useAutoSyncDynamics();

 const filteredTickets = useMemo(
  () =>
    tickets.filter(t => {
      const search = searchValue.toLowerCase().trim();
      const matchesSearch =
        !search ||
        t.v_ticketnumber?.toLowerCase().includes(search) ||
        t.v_department?.toLowerCase().includes(search) ||
        t.v_username?.toLowerCase().includes(search) ||
        t.v_title?.toLowerCase().includes(search) ||
        t.v_ticketcategory?.toLowerCase().includes(search);

      const matchesDepartment = !filters.Department || t.v_department === filters.Department;
      const matchesSource     = !filters.Source     || t.v_source === filters.Source;
      const matchesPriority   = !filters.Priority   || t.v_priority === filters.Priority;
      const matchesCategory   = !filters.Category   || t.v_ticketcategory === filters.Category;
      const matchesStatus     = !filters.Status     || t.v_status === filters.Status;

      return matchesSearch && matchesDepartment && matchesSource && matchesPriority && matchesCategory && matchesStatus;
    }),
  [tickets, searchValue, filters.Department, filters.Source, filters.Priority, filters.Category, filters.Status]
);

  const paginated = useMemo(
    () => filteredTickets.slice((currentPage - 1) * recordsPerPage, currentPage * recordsPerPage),
    [filteredTickets, currentPage, recordsPerPage]
  );

 useEffect(() => {
  const ticketsChanged = JSON.stringify(prevTicketsRef.current) !== JSON.stringify(tickets);
  if (ticketsChanged) {
    prevTicketsRef.current = tickets;
    onFilterOptionsChange?.({
      Department: [...new Set(tickets.map(t => t.v_department).filter(Boolean))],
      Source:     [...new Set(tickets.map(t => t.v_source).filter(Boolean))],
      Priority:   [...new Set(tickets.map(t => t.v_priority).filter(Boolean))],
      Category:   [...new Set(tickets.map(t => t.v_ticketcategory).filter(Boolean))],
      Status:     [...new Set(tickets.map(t => t.v_status).filter(Boolean))],
    });
  }
}, [tickets, onFilterOptionsChange]);

  useEffect(() => {
    if (prevFilteredLengthRef.current !== filteredTickets.length) {
      prevFilteredLengthRef.current = filteredTickets.length;
      onTotalRecordsChange(filteredTickets.length);
    }
  }, [filteredTickets.length, onTotalRecordsChange]);

  const handleSync = async () => {
    await runSync();

    onTicketUpdated?.(); 
  };

  if (loading) return <div className="text-center py-6 text-gray-500 dark:text-gray-400">Loading...</div>;
  if (error) return <div className="text-center py-6 text-red-500 dark:text-red-400">{error}</div>;

  const getPriorityClass = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  return (
    <>
      {/* Mobile View */}
      <div className="sm:hidden">
        <div className="flex justify-between items-center px-3 py-2 border-b border-gray-200 dark:border-gray-800">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {filteredTickets.length} Total Records
          </span>
          <button
            onClick={handleSync}
            disabled={loading || syncing}
            className="p-1.5 rounded-lg text-violet-500 font-bold hover:text-violet-700 hover:bg-violet-100 dark:text-violet-400 dark:hover:text-violet-300 dark:hover:bg-violet-900/30 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${loading || syncing ? "animate-spin" : ""}`} />
          </button>
        </div>
        <div className="space-y-3 p-3">
          {paginated.map(ticket => (
            <ComCard
              key={ticket.v_ticketuuid}
              ticket={ticket}
              fields={cardFields}
              onClick={() => setSelectedTicket(ticket)}
              priorityClass={getPriorityClass(ticket.v_priority)}
            />
          ))}
          {!paginated.length && (
            <p className="text-sm text-center text-gray-500 dark:text-gray-400 py-6">No tickets found.</p>
          )}
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden sm:block overflow-x-auto">
        <div className="flex justify-between items-center mb-2 border-b py-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {filteredTickets.length} Total Records
          </span>
          <button
            onClick={handleSync}
            disabled={loading || syncing}
            className="p-1.5 rounded-lg text-violet-500 font-bold hover:text-violet-700 hover:bg-violet-100 dark:text-violet-400 dark:hover:text-violet-300 dark:hover:bg-violet-900/30 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${loading || syncing ? "animate-spin" : ""}`} />
          </button>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-800">
              {['Source', 'TICKET ID', 'DEPARTMENT', 'USER NAME', 'TITLE', 'CATEGORY', 'PRIORITY', 'CREATED AT', 'TARGET', 'STATUS', 'TECHNICIAN'].map(header => (
                <th
                  key={header}
                  className="px-4 py-3 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap"
                >
                  {header}
                </th>
              ))}
              </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-center">
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                  No tickets found.
                </td>
              </tr>
            ) : (
              paginated.map(t => (
                <tr
                  key={t.v_ticketuuid}
                  onClick={() => setSelectedTicket(t)}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors text-center"
                >
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                    {t.v_source || '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-900 dark:text-white whitespace-nowrap">
                    {t.v_ticketnumber}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                    {t.v_department || '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                    {t.v_username || '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300 max-w-[100px] truncate">
                    {t.v_title || '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300 max-w-[80px] truncate">
                    {t.v_ticketcategory || '—'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-1.5 py-0.5 text-xs rounded-full ${getPriorityClass(t.v_priority)}`}>
                      {t.v_priority || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                    {t.v_createdat ? new Date(t.v_createdat).toLocaleString() : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                    {t.v_target ? new Date(t.v_target).toLocaleString() : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                    {t.v_status || '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                    {t.v_technicianname || '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

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