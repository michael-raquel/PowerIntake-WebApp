import { useEffect, useState, useRef, useMemo } from 'react';
import { useFetchTicket } from '@/hooks/UseFetchTicket';
import { useAuth } from '@/context/AuthContext';
import ComUpdateForm from '../ComUpdateForm';
import ComCard from './ComCard';

const cardFields = [
  { key: 'v_source',         label: 'Source'     },
  { key: 'v_title',          label: 'Title'      },
  { key: 'v_ticketcategory', label: 'Category'   },
  { key: 'v_createdat',      label: 'Created At' },
  { key: 'v_target',         label: 'Target'     },
  { key: 'v_status',         label: 'Status'     },
];

export default function ComTableMyTickets({
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
    entrauserid: tokenInfo?.account?.localAccountId,
    refreshKey,
  });

  const prevMyTicketsRef = useRef();
  const prevFilteredLengthRef = useRef();

  const myTickets = useMemo(
    () => tickets.filter(t => t.v_entrauserid === tokenInfo?.account?.localAccountId),
    [tickets, tokenInfo?.account?.localAccountId]
  );

  const filteredTickets = useMemo(
  () =>
    myTickets.filter(t => {
      const s = searchValue.toLowerCase().trim();
      const matchesSearch =
        !s ||
        t.v_title?.toLowerCase().includes(s) ||
        t.v_ticketnumber?.toLowerCase().includes(s) ||
        t.v_ticketcategory?.toLowerCase().includes(s);

      const matchesSource   = !filters.Source   || t.v_source === filters.Source;
      const matchesPriority = !filters.Priority || t.v_priority === filters.Priority;
      const matchesCategory = !filters.Category || t.v_ticketcategory === filters.Category;
      const matchesStatus   = !filters.Status   || t.v_status === filters.Status;

      return matchesSearch && matchesSource && matchesPriority && matchesCategory && matchesStatus;
    }),
  [myTickets, searchValue, filters.Source, filters.Priority, filters.Category, filters.Status]
);

  const paginated = useMemo(
    () => filteredTickets.slice((currentPage - 1) * recordsPerPage, currentPage * recordsPerPage),
    [filteredTickets, currentPage, recordsPerPage]
  );

  useEffect(() => {
    const myTicketsChanged = JSON.stringify(prevMyTicketsRef.current) !== JSON.stringify(myTickets);
    if (myTicketsChanged) {
      prevMyTicketsRef.current = myTickets;
      onFilterOptionsChange?.({
        Source:   [...new Set(myTickets.map(t => t.v_source).filter(Boolean))],
        Category: [...new Set(myTickets.map(t => t.v_ticketcategory).filter(Boolean))],
        Priority:  [...new Set(myTickets.map(t => t.v_priority).filter(Boolean))],
        Status:   [...new Set(myTickets.map(t => t.v_status).filter(Boolean))],
      });
    }
  }, [myTickets, onFilterOptionsChange]);

  useEffect(() => {
    if (prevFilteredLengthRef.current !== filteredTickets.length) {
      prevFilteredLengthRef.current = filteredTickets.length;
      onTotalRecordsChange(filteredTickets.length);
    }
  }, [filteredTickets.length, onTotalRecordsChange]);

  const getPriorityClass = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high':   return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'low':    return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      default:       return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  if (loading) return <div className="p-6 text-center text-gray-500 dark:text-gray-400">Loading...</div>;
  if (error)   return <div className="p-6 text-center text-red-500 dark:text-red-400">{error}</div>;

  return (
    <>
      {/* Mobile */}
      <div className="sm:hidden space-y-3 p-3">
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

      {/* Desktop */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-800">
              {[
                'SOURCE',
                'TICKET ID',
                'TITLE',
                'CATEGORY',
                'PRIORITY',
                'CREATED AT',
                'TARGET',
                'STATUS',
                'TECHNICIAN',
              ].map(header => (
                <th
                  key={header}
                  className="px-4 py-3 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
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
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300 max-w-[100px] truncate">
                    {t.v_title}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300 max-w-[80px] truncate">
                    {t.v_ticketcategory}
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
                    {t.v_status}
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