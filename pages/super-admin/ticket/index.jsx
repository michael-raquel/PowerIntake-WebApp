import React, { useState, useCallback, useMemo, useEffect } from 'react';
import ComFilters from './components/ComFilters';
import ComTicketTable from './components/ComTicketTable';
import ComCreateTicket from './components/ComCreateTicket';
import { useAuth } from '@/context/AuthContext';
import { useFetchTicketManagerTeam } from '@/hooks/UseFetchTicketManagerTeam';

const TABS = [
  { id: 'my-client', label: 'My Client' },
  { id: 'my-company', label: 'My Company' },
  { id: 'my-team', label: 'My Team' },
  { id: 'my-ticket', label: 'My Ticket' },
];

const RECORDS_PER_PAGE = 10;

export default function TicketPage() {
  const { tokenInfo } = useAuth();
  const managerId = tokenInfo?.account?.localAccountId ?? null;

  const [activeTab, setActiveTab] = useState('my-ticket');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [showCreateTicket, setShowCreateTicket] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [selectedFilters, setSelectedFilters] = useState({});
  const [filterOptions, setFilterOptions] = useState({});

  const { tickets: teamTickets } = useFetchTicketManagerTeam({
    managerid: managerId,
  });

  const hasTeamTickets = (teamTickets?.length ?? 0) > 0;

  const visibleTabs = useMemo(
    () => (hasTeamTickets ? TABS : TABS.filter((t) => t.id !== 'my-team')),
    [hasTeamTickets]
  );

  useEffect(() => {
    if (!hasTeamTickets && activeTab === 'my-team') {
      setActiveTab('my-ticket');
    }
  }, [hasTeamTickets, activeTab]);

  const totalPages = Math.max(1, Math.ceil(totalRecords / RECORDS_PER_PAGE));

  const handleTabChange = useCallback((tabId) => {
    setActiveTab(tabId);
    setCurrentPage(1);
    setSearchValue('');
    setSelectedFilters({});
    setFilterOptions({});
  }, []);

  const handlePageChange = useCallback((page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  }, [totalPages]);

  const handleFilterOptionsChange = useCallback((options) => {
    setFilterOptions(prev => ({ ...prev, ...options }));
  }, []);

  const handleFiltersChange = useCallback((filters) => {
    setSelectedFilters(filters);
    setCurrentPage(1); 
  }, []);

  const handleSearch = useCallback((value) => {
    setSearchValue(value);
    setCurrentPage(1); 
  }, []);

  const paginationInfo = useMemo(() => {
    if (totalRecords === 0) return null;
    
    const start = (currentPage - 1) * RECORDS_PER_PAGE + 1;
    const end = Math.min(currentPage * RECORDS_PER_PAGE, totalRecords);
    
    return { start, end };
  }, [currentPage, totalRecords]);

  if (showCreateTicket) {
    return <ComCreateTicket onClose={() => setShowCreateTicket(false)} />;
  }

  return (
    <div className="flex-1 bg-gray-50 dark:bg-black min-h-screen transition-colors duration-300">
      <div className="p-4 sm:p-6 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
          <div className="border-b border-gray-200 dark:border-gray-800 sm:flex-1">
            <nav className="flex flex-wrap gap-x-6 gap-y-2">
              {visibleTabs.map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => handleTabChange(id)}
                  className={`
                    pb-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
                    ${activeTab === id
                      ? 'border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-700'
                    }
                  `}
                >
                  {label}
                </button>
              ))}
            </nav>
          </div>

          <div className="w-full sm:w-auto">
            <ComFilters
              onCreateTicket={() => setShowCreateTicket(true)}
              activeTab={activeTab}
              onSearch={handleSearch}
              searchValue={searchValue}
              selectedFilters={selectedFilters}
              onFiltersChange={handleFiltersChange}
              filterOptions={filterOptions}
            />
          </div>
        </div>

        <div className="mb-4">
          <ComTicketTable
            activeTab={activeTab}
            currentPage={currentPage}
            recordsPerPage={RECORDS_PER_PAGE}
            onTotalRecordsChange={setTotalRecords}
            onFilterOptionsChange={handleFilterOptionsChange}
            searchValue={searchValue}
            filters={selectedFilters}
          />
        </div>

        {totalRecords > 0 && (
          <div className="bg-white dark:bg-gray-900 px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-sm text-gray-700 dark:text-gray-300 order-2 sm:order-1">
              Showing{' '}
              <span className="font-medium text-gray-900 dark:text-white">
                {paginationInfo.start}
              </span>{' '}
              to{' '}
              <span className="font-medium text-gray-900 dark:text-white">
                {paginationInfo.end}
              </span>{' '}
              of{' '}
              <span className="font-medium text-gray-900 dark:text-white">
                {totalRecords}
              </span>{' '}
              records
            </div>

            <div className="flex space-x-2 order-1 sm:order-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`
                  px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-md transition-colors
                  ${currentPage === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-500'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800 dark:border-gray-700'
                  }
                `}
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`
                  px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-md transition-colors
                  ${currentPage === totalPages
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-500'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800 dark:border-gray-700'
                  }
                `}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}