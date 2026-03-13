import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import ComCard from './ComCard';
import { useFetchTicket } from '@/hooks/UseFetchTicket';
import { useAuth } from '@/context/AuthContext';
import ComUpdateForm from '../ComUpdateForm';

const getPriorityColor = (priority) => {
  switch (priority?.toLowerCase()) {
    case 'high':   return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
    case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
    case 'low':    return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
    default:       return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
  }
};

const cardFields = [
  { key: 'v_tenantname', label: 'Client' },
  { key: 'v_username', label: 'User' },
  { key: 'v_title', label: 'Title' },
  { key: 'v_ticketcategory', label: 'Category' },
  { key: 'v_priority', label: 'Priority' },
  { key: 'v_createdat', label: 'Created' },
  { key: 'v_status', label: 'Status' },
  { key: 'v_technicianname', label: 'Technician' },
];

const COLUMNS = [
  'Ticket ID', 'Client', 'User',
  'Title', 'Category', 'Priority', 'Created',
  'Status', 'Technician',
];

const normalize = (v) => String(v ?? '').trim().toLowerCase();
const unique = (arr = []) => [...new Set(arr.map((v) => String(v ?? '').trim()).filter(Boolean))];

export default function ComTableClients({
  currentPage,
  recordsPerPage,
  onTotalRecordsChange,
  onFilterOptionsChange,
  searchValue = '',
  filters = {},
}) {
  const { tokenInfo } = useAuth();
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const { tickets, loading, error } = useFetchTicket({
    ticketuuid: null,
    entrauserid: null,
    entratenantid: null,
    refreshKey,
  });

  useEffect(() => {
    onFilterOptionsChange?.({
      Client: unique(tickets.map((t) => t.v_tenantname)),
      Manager: unique(tickets.map((t) => t.v_managername || t.v_technicianname)),
      Priority: unique(tickets.map((t) => t.v_priority)),
      Category: unique(tickets.map((t) => t.v_ticketcategory)),
      Status: unique(tickets.map((t) => t.v_status)),
    });
  }, [tickets, onFilterOptionsChange]);

  const filteredTickets = tickets.filter((t) => {
    const q = normalize(searchValue);
    const managerValue = t.v_managername || t.v_technicianname;

    const searchOk =
      !q ||
      normalize(t.v_ticketnumber).includes(q) ||
      normalize(t.v_tenantname).includes(q) ||
      normalize(t.v_username).includes(q) ||
      normalize(t.v_title).includes(q) ||
      normalize(t.v_ticketcategory).includes(q);

    const clientOk = !filters.Client || normalize(t.v_tenantname) === normalize(filters.Client);
    const managerOk = !filters.Manager || normalize(managerValue) === normalize(filters.Manager);
    const priorityOk = !filters.Priority || normalize(t.v_priority) === normalize(filters.Priority);
    const categoryOk = !filters.Category || normalize(t.v_ticketcategory) === normalize(filters.Category);
    const statusOk = !filters.Status || normalize(t.v_status) === normalize(filters.Status);

    return searchOk && clientOk && managerOk && priorityOk && categoryOk && statusOk;
  });

  const start = (currentPage - 1) * recordsPerPage;
  const paginatedData = filteredTickets.slice(start, start + recordsPerPage);

  useEffect(() => {
    onTotalRecordsChange(filteredTickets.length);
  }, [filteredTickets.length, onTotalRecordsChange]);

  if (loading) return <p className="text-center py-6 text-sm text-gray-500 dark:text-gray-400">Loading...</p>;
  if (error)   return <p className="text-center py-6 text-sm text-red-500">{error}</p>;

  return (
    <>
      <div className="sm:hidden space-y-3 p-3">
        {paginatedData.length > 0 ? (
          paginatedData.map((ticket) => (
            <ComCard
              key={ticket.v_ticketid}
              ticket={ticket}
              fields={cardFields}
              onClick={() => setSelectedTicket(ticket)}
            />
          ))
        ) : (
          <p className="text-sm text-center text-gray-500 dark:text-gray-400 py-6">No tickets found.</p>
        )}
      </div>

      <div className="hidden sm:block overflow-x-auto">
        <div className="inline-block min-w-full align-middle">
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-black">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800 text-sm">
              <thead className="bg-gray-50/90 dark:bg-gray-900 border-b border-gray-200/80 dark:border-gray-800">
            <tr>
              {COLUMNS.map((h) => (
                <th
                  key={h}
                  scope="col"
                  className="px-4 py-3.5 text-left text-[11px] font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
              <tbody className="bg-white dark:bg-black divide-y divide-gray-100 dark:divide-gray-800">
            {paginatedData.length > 0 ? (
              paginatedData.map((ticket) => (
                <tr
                  key={ticket.v_ticketuuid}
                  onClick={() => setSelectedTicket(ticket)}
                    className="odd:bg-white even:bg-gray-50/70 hover:bg-gray-100 dark:odd:bg-black dark:even:bg-gray-900/40 dark:hover:bg-gray-900 transition-colors duration-150 cursor-pointer"
                >
                    <td className="px-4 py-3.5 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white align-middle">{ticket.v_ticketnumber}</td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400 max-w-[140px] truncate align-middle" title={ticket.v_tenantname}>{ticket.v_tenantname}</td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400 max-w-[110px] truncate align-middle"  title={ticket.v_username}>{ticket.v_username}</td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400 max-w-[160px] truncate align-middle" title={ticket.v_title}>{ticket.v_title}</td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400 max-w-[120px] truncate align-middle"  title={ticket.v_ticketcategory}>{ticket.v_ticketcategory}</td>
                    <td className="px-4 py-3.5 whitespace-nowrap align-middle">
                    <span className={`px-1.5 py-0.5 inline-flex text-sm leading-3 font-semibold rounded-full ${getPriorityColor(ticket.v_priority)}`}>
                      {ticket.v_priority}
                    </span>
                  </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400 align-middle">{new Date(ticket.v_createdat).toLocaleDateString()}</td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400 align-middle">{ticket.v_status}</td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400 max-w-[110px] truncate align-middle">{ticket.v_technicianname}</td>
                </tr>
              ))
            ) : (
              <tr>
                  <td colSpan={COLUMNS.length} className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                  No tickets found.
                </td>
              </tr>
            )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {selectedTicket && (
        <ComUpdateForm
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onUpdated={() => setRefreshKey((k) => k + 1)}
        />
      )}
    </>
  );
}

ComTableClients.propTypes = {
  currentPage: PropTypes.number.isRequired,
  recordsPerPage: PropTypes.number.isRequired,
  onTotalRecordsChange: PropTypes.func.isRequired,
  onFilterOptionsChange: PropTypes.func,
  searchValue: PropTypes.string,
  filters: PropTypes.object,
};