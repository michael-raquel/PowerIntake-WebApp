"use client";

import { useState, useEffect, useMemo } from 'react';
import ComFilters from '@/components/ticket/ComFilters';
import ComTicketTable from '@/components/ticket/ComTicketTable';
import ComCreateTicket from '@/components/ticket/ComCreateTicket';
import { useAuth } from '@/context/AuthContext';
import useManagerCheck from '@/hooks/UseManagerCheck';
import { useSearchParams, useRouter } from 'next/navigation';

const RECORDS_PER_PAGE = 10;

export default function TicketPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { tokenInfo } = useAuth();
  const roles = tokenInfo?.account?.roles || [];
  const isSuperAdmin = roles.includes('SuperAdmin');
  const isAdmin = roles.includes('Admin');

  const { isManager } = useManagerCheck();

  const [activeTab, setActiveTab] = useState('my-ticket');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [showCreateTicket, setShowCreateTicket] = useState(
    () => searchParams.get('create') === 'true'
  );
  const [searchValue, setSearchValue] = useState('');
  const [selectedFilters, setSelectedFilters] = useState({});
  const [filterOptions, setFilterOptions] = useState({});
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (searchParams.get('create') === 'true') {
      router.replace('/ticket', undefined, { shallow: true });
    }
  }, [searchParams, router]);

  const tabs = useMemo(() => {
    const t = [];
    if (isSuperAdmin) {
      t.push({ id: 'my-client', label: 'My Client' });
      t.push({ id: 'my-company', label: 'My Company' });
    } else if (isAdmin) {
      t.push({ id: 'my-company', label: 'My Company' });
    }
    if (isManager) {
      t.push({ id: 'my-team', label: 'My Team' });
    }
    t.push({ id: 'my-ticket', label: 'My Ticket' });
    return t;
  }, [isSuperAdmin, isAdmin, isManager]);

  const safeActiveTab = useMemo(() => {
    const tabIds = tabs.map(t => t.id);
    return tabIds.includes(activeTab) ? activeTab : 'my-ticket';
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
    <div className="p-6 rounded-lg">
      <div className="mb-4 px-2 bg-gradient-to-l from-pink-500 to-violet-800 rounded-lg py-4">
        <div className="flex items-center gap-2">
          <h2 className="font-black text-xl sm:text-2xl text-white">Tickets</h2>
          <div className="w-1 h-6 bg-white/40 rounded-full"></div>
        </div>
        <p className="text-xs sm:text-sm text-white/70 mt-1.5 pl-1">
          Create and manage your tickets
        </p>
      </div>

      <div className="flex border-b border-gray-200 dark:border-gray-800 mb-4">
        <nav className="flex gap-x-6">
          {tabs.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => handleTabChange(id)}
              className={`px-4 py-2 border-b-2 text-[10px] sm:text-sm font-medium transition-all duration-100 transform cursor-pointer ${safeActiveTab === id
                  ? "border-violet-600 text-violet-600 font-semibold scale-100 dark:border-violet-400 dark:text-violet-400"
                  : "border-transparent text-gray-600 hover:text-gray-800 hover:scale-110 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
            >
              {label}
            </button>
          ))}
        </nav>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
        <ComFilters
          onCreateTicket={() => setShowCreateTicket(true)}
          activeTab={safeActiveTab}
          searchValue={searchValue}
          onSearch={setSearchValue}
          selectedFilters={selectedFilters}
          onFiltersChange={handleFilterChange}
          filterOptions={filterOptions}
        />

        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
        </div>

        <ComTicketTable
          activeTab={safeActiveTab}
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
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 border-t border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
            <span className="text-sm text-gray-600 dark:text-gray-400 order-2 sm:order-1">
              {getPaginationText()}
            </span>

            <div className="flex items-center gap-3 order-1 sm:order-2 w-full sm:w-auto justify-between sm:justify-end">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`
          inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg
          transition-all duration-200 min-w-[100px] sm:min-w-[90px]
          ${currentPage === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 dark:bg-gray-900 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-800 shadow-sm hover:shadow'
                  }
        `}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span>Prev</span>
              </button>

              <span className="text-sm font-medium text-gray-500 dark:text-gray-400 px-2">
                {currentPage} / {totalPages}
              </span>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`
          inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg
          transition-all duration-200 min-w-[100px] sm:min-w-[90px]
          ${currentPage === totalPages
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 dark:bg-gray-900 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-800 shadow-sm hover:shadow'
                  }
        `}
              >
                <span>Next</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}