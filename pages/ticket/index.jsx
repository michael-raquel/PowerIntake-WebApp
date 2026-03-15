"use client";

import { useState } from 'react';
import ComFilters from '@/components/ticket/ComFilters';
import ComTicketTable from '@/components/ticket/ComTicketTable';
import ComCreateTicket from '@/components/ticket/ComCreateTicket';

const TABS = [
  { id: 'my-client', label: 'My Client' },
  { id: 'my-company', label: 'My Company' },
  { id: 'my-team', label: 'My Team' },
  { id: 'my-ticket', label: 'My Ticket' },
];

const RECORDS_PER_PAGE = 10;

export default function TicketPage() {
  const [activeTab, setActiveTab] = useState('my-ticket');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [showCreateTicket, setShowCreateTicket] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [selectedFilters, setSelectedFilters] = useState({});
  const [filterOptions, setFilterOptions] = useState({});
  const [refreshKey, setRefreshKey] = useState(0);
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div className="border-b border-gray-200 dark:border-gray-800 sm:flex-1">
          <nav className="flex gap-x-6">
            {TABS.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => handleTabChange(id)}
                className={`pb-3 text-sm font-medium border-b-2 whitespace-nowrap ${
                  activeTab === id
                    ? 'border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                }`}
              >
                {label}
              </button>
            ))}
          </nav>
        </div>

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
        <div className="mt-4 bg-white dark:bg-gray-900 px-4 py-3 rounded-lg border flex items-center justify-between">
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {getPaginationText()}
          </span>
          
          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                currentPage === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white border hover:bg-gray-50'
              }`}
            >
              Previous
            </button>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                currentPage === totalPages
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white border hover:bg-gray-50'
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