import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import ComCard from './ComCard';
import { useFetchTicket } from '@/hooks/UseFetchTicket';
import { useAuth } from '@/context/AuthContext';

const getPriorityColor = (priority) => {
  switch (priority?.toLowerCase()) {
    case 'high':   return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
    case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
    case 'low':    return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
    default:       return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
  }
};

const cardFields = [
  { key: 'v_username', label: 'User' },
  { key: 'v_title', label: 'Title' },
  { key: 'v_ticketcategory', label: 'Category' },
  { key: 'v_priority', label: 'Priority' },
  { key: 'v_createdat', label: 'Created' },
  { key: 'v_status', label: 'Status' },
  { key: 'v_technicianname', label: 'Technician' },
];

const COLUMNS = [
  'Ticket ID', 'User', 'Title', 'Category',
  'Priority', 'Created', 'Status', 'Technician',
];

export default function ComTableTeam({ currentPage, recordsPerPage, onTotalRecordsChange }) {
  const { tokenInfo } = useAuth();

  const { tickets, loading, error } = useFetchTicket({
    ticketuuid: null,
    entrauserid: tokenInfo?.account?.localAccountId ?? null,
  });

  const start = (currentPage - 1) * recordsPerPage;
  const paginatedData = tickets.slice(start, start + recordsPerPage);

  useEffect(() => {
    onTotalRecordsChange(tickets.length);
  }, [tickets.length, onTotalRecordsChange]);

  if (loading) return <p className="text-center py-6 text-sm text-gray-500 dark:text-gray-400">Loading...</p>;
  if (error)   return <p className="text-center py-6 text-sm text-red-500">{error}</p>;

  return (
    <>
      <div className="sm:hidden space-y-3 p-3">
        {paginatedData.length > 0 ? (
          paginatedData.map((ticket) => (
            <ComCard key={ticket.v_ticketid} ticket={ticket} fields={cardFields} />
          ))
        ) : (
          <p className="text-sm text-center text-gray-500 dark:text-gray-400 py-6">No tickets found.</p>
        )}
      </div>

      <div className="hidden sm:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              {COLUMNS.map((h) => (
                <th key={h} scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-black divide-y divide-gray-200 dark:divide-gray-800">
            {paginatedData.length > 0 ? (
              paginatedData.map((ticket) => (
                <tr key={ticket.v_ticketuuid} className="hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors duration-150">
                  <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{ticket.v_ticketnumber}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 max-w-[80px] truncate" title={ticket.v_username}>{ticket.v_username}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 max-w-[100px] truncate" title={ticket.v_title}>{ticket.v_title}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 max-w-[80px] truncate" title={ticket.v_ticketcategory}>{ticket.v_ticketcategory}</td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className={`px-1.5 py-0.5 inline-flex text-sm leading-3 font-semibold rounded-full ${getPriorityColor(ticket.v_priority)}`}>
                      {ticket.v_priority}
                    </span>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 max-w-[100px] truncate">{new Date(ticket.v_createdat).toLocaleDateString()}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 max-w-[70px] truncate">{ticket.v_status}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 max-w-[80px] truncate">{ticket.v_technicianname}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={COLUMNS.length} className="px-3 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                  No tickets found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

ComTableTeam.propTypes = {
  currentPage: PropTypes.number.isRequired,
  recordsPerPage: PropTypes.number.isRequired,
  onTotalRecordsChange: PropTypes.func.isRequired,
};