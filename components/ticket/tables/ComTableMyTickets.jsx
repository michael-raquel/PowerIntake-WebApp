import { useEffect, useState, useRef, useMemo } from 'react';
import { useFetchTicket } from '@/hooks/UseFetchTicket';
import { useAuth } from '@/context/AuthContext';
import ComUpdateForm from '../ComUpdateForm';
import ComCard from './ComCard';

const cardFields = [
  { key: 'v_title',          label: 'Title'    },
  { key: 'v_ticketcategory', label: 'Category' },
  { key: 'v_createdat',      label: 'Created'  },
  { key: 'v_status',         label: 'Status'   },
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

  const prevMyTicketsRef      = useRef();
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

        const matchesPriority = !filters.Priority || t.v_priority       === filters.Priority;
        const matchesCategory = !filters.Category || t.v_ticketcategory === filters.Category;
        const matchesStatus   = !filters.Status   || t.v_status         === filters.Status;

        return matchesSearch && matchesPriority && matchesCategory && matchesStatus;
      }),
    [myTickets, searchValue, filters.Priority, filters.Category, filters.Status]
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
        Category: [...new Set(myTickets.map(t => t.v_ticketcategory).filter(Boolean))],
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

  if (loading) return <div className="p-6 text-center">Loading...</div>;
  if (error)   return <div className="p-6 text-center text-red-500">{error}</div>;

  const priorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high':   return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low':    return 'bg-green-100 text-green-800';
      default:       return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <>
      {/* Mobile View */}
      <div className="sm:hidden space-y-3 p-3">
        {paginated.map(ticket => (
          <ComCard
            key={ticket.v_ticketuuid}
            ticket={ticket}
            fields={cardFields}
            onClick={() => setSelectedTicket(ticket)}
          />
        ))}
        {!paginated.length && (
          <p className="text-sm text-center text-gray-500 py-6">No tickets found.</p>
        )}
      </div>

      {/* Desktop Table */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {['Ticket ID', 'Title', 'Category', 'Priority', 'Created', 'Status'].map(h => (
                <th key={h} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginated.map(t => (
              <tr
                key={t.v_ticketuuid}
                onClick={() => setSelectedTicket(t)}
                className="hover:bg-gray-50 cursor-pointer"
              >
                <td className="px-3 py-2 text-sm font-medium">{t.v_ticketnumber}</td>
                <td className="px-3 py-2 text-sm text-gray-500 max-w-[100px] truncate">{t.v_title}</td>
                <td className="px-3 py-2 text-sm text-gray-500 max-w-[80px]  truncate">{t.v_ticketcategory}</td>
                <td className="px-3 py-2">
                  <span className={`px-1.5 py-0.5 text-xs rounded-full ${priorityColor(t.v_priority)}`}>
                    {t.v_priority}
                  </span>
                </td>
                <td className="px-3 py-2 text-sm text-gray-500">{new Date(t.v_createdat).toLocaleDateString()}</td>
                <td className="px-3 py-2 text-sm text-gray-500">{t.v_status}</td>
              </tr>
            ))}
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