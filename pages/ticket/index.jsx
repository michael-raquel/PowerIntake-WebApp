"use client";

import { useState, useEffect } from 'react';
import ComFilters from '@/components/ticket/ComFilters';
import ComTicketTable from '@/components/ticket/ComTicketTable';
import ComCreateTicket from '@/components/ticket/ComCreateTicket';
import { useAuth } from '@/context/AuthContext';
import { useFetchTeamTickets } from '@/hooks/UseFetchTeamTickets';

const RECORDS_PER_PAGE = 10;

export default function TicketPage() {
  const { tokenInfo } = useAuth();
  const roles = tokenInfo?.account?.roles || [];
  const isSuperAdmin = roles.includes('SuperAdmin');
  const isAdmin = roles.includes('Admin');

  const [activeTab, setActiveTab] = useState('my-ticket');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [showCreateTicket, setShowCreateTicket] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [selectedFilters, setSelectedFilters] = useState({});
  const [filterOptions, setFilterOptions] = useState({});
  const [refreshKey, setRefreshKey] = useState(0);

  const { teamTickets } = useFetchTeamTickets({
    managerid: tokenInfo?.account?.localAccountId,
    refreshKey,
  });

  const showTeamTab = (isSuperAdmin || isAdmin) && teamTickets.length > 0;

  const tabs = [];
  if (isSuperAdmin) {
    tabs.push({ id: 'my-client', label: 'My Client' });
    tabs.push({ id: 'my-company', label: 'My Company' });
  } else if (isAdmin) {
    tabs.push({ id: 'my-company', label: 'My Company' });
  }
  if (showTeamTab) {
    tabs.push({ id: 'my-team', label: 'My Team' });
  }
  tabs.push({ id: 'my-ticket', label: 'My Ticket' });

  useEffect(() => {
    const tabIds = tabs.map(t => t.id);
    if (!tabIds.includes(activeTab)) {
      setActiveTab('my-ticket');
    }
  }, [tabs, activeTab]);

  const totalPages = Math.ceil(totalRecords / RECORDS_PER_PAGE);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setCurrentPage(1);
    setSearchValue('');
    setSelectedFilters({});
    setFilterOptions({});
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const handleFilterChange = (filters) => {
    setSelectedFilters(filters);
    setCurrentPage(1);
  };

  const getPaginationText = () => {
    if (!totalRecords) return null;
    const start = (currentPage - 1) * RECORDS_PER_PAGE + 1;
    const end = Math.min(currentPage * RECORDS_PER_PAGE, totalRecords);
    return `Showing ${start} to ${end} of ${totalRecords} records`;
  };

  if (showCreateTicket) {
    return <ComCreateTicket onClose={() => setShowCreateTicket(false)} />;
  }

  return (
    <div className="flex-1 bg-gray-50 dark:bg-black min-h-screen p-4 sm:p-6">
      <div className="mb-4">
        <h2 className="font-bold text-sm sm:text-lg">Tickets</h2>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
          Create and manage support tickets
        </p>
      </div>

      <div className="border-b border-gray-200 dark:border-gray-800 mb-4">
        <nav className="flex gap-x-6">
          {tabs.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => handleTabChange(id)}
              className={`pb-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                activeTab === id
                  ? 'border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
      </div>

      <div className="mb-4">
        <ComFilters
          onCreateTicket={() => setShowCreateTicket(true)}
          activeTab={activeTab}
          searchValue={searchValue}
          onSearch={setSearchValue}
          selectedFilters={selectedFilters}
          onFiltersChange={handleFilterChange}
          filterOptions={filterOptions}
        />
      </div>

      <ComTicketTable
        activeTab={activeTab}
        currentPage={currentPage}
        recordsPerPage={RECORDS_PER_PAGE}
        onTotalRecordsChange={setTotalRecords}
        onFilterOptionsChange={setFilterOptions}
        searchValue={searchValue}
        filters={selectedFilters}
        refreshKey={refreshKey}
        onTicketUpdated={() => setRefreshKey(k => k + 1)}
      />

      {totalRecords > 0 && (
        <div className="mt-4 bg-white dark:bg-gray-900 px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {getPaginationText()}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                currentPage === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600'
                  : 'bg-white border border-gray-200 hover:bg-gray-50 dark:bg-gray-900 dark:border-gray-700 dark:hover:bg-gray-800 dark:text-gray-300'
              }`}
            >
              Previous
            </button>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                currentPage === totalPages
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600'
                  : 'bg-white border border-gray-200 hover:bg-gray-50 dark:bg-gray-900 dark:border-gray-700 dark:hover:bg-gray-800 dark:text-gray-300'
              }`}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}