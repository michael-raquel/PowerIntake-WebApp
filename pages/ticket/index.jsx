"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import ComFilters from '@/components/ticket/ComFilters';
import ComTicketTable from '@/components/ticket/ComTicketTable';
import ComCreateTicket from '@/components/ticket/ComCreateTicket';
import ComCard from '@/components/ticket/tables/ComCard';
import { useAuth } from '@/context/AuthContext';
import useManagerCheck from '@/hooks/UseManagerCheck';
import { ExternalLink, ChevronLeft, ChevronRight, Ticket } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';

const ROW_HEIGHT = 50;
const MIN_RECORDS = 1;
const MOBILE_CARDS_PER_PAGE = 10;

export default function TicketPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { tokenInfo } = useAuth();
  const roles = tokenInfo?.account?.roles || [];
  const isSuperAdmin = roles.includes('SuperAdmin');
  const isAdmin = roles.includes('Admin');
  const { isManager } = useManagerCheck();

  const tableContainerRef = useRef(null);
  const [recordsPerPage, setRecordsPerPage] = useState(MIN_RECORDS);
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState('my-ticket');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [showCreateTicket, setShowCreateTicket] = useState(() => searchParams.get('create') === 'true');
  const [searchValue, setSearchValue] = useState('');
  const [selectedFilters, setSelectedFilters] = useState({});
  const [filterOptions, setFilterOptions] = useState({});
  const [refreshKey, setRefreshKey] = useState(0);
  const [mobileTickets, setMobileTickets] = useState([]);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const updateRecordsPerPage = useCallback(() => {
    if (tableContainerRef.current) {
      const calculated = Math.max(MIN_RECORDS, Math.floor(tableContainerRef.current.clientHeight / ROW_HEIGHT));
      setRecordsPerPage(calculated);
    }
  }, []);

  useEffect(() => {
    if (isMobile) return;
    updateRecordsPerPage();
    const observer = new ResizeObserver(updateRecordsPerPage);
    if (tableContainerRef.current) observer.observe(tableContainerRef.current);
    return () => observer.disconnect();
  }, [updateRecordsPerPage, isMobile]);

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
    if (isManager) t.push({ id: 'my-team', label: 'My Team' });
    t.push({ id: 'my-ticket', label: 'My Ticket' });
    return t;
  }, [isSuperAdmin, isAdmin, isManager]);

  const safeActiveTab = useMemo(() => {
    const ids = tabs.map(t => t.id);
    return ids.includes(activeTab) ? activeTab : 'my-ticket';
  }, [tabs, activeTab]);

  const effectiveRecordsPerPage = isMobile ? MOBILE_CARDS_PER_PAGE : recordsPerPage;
  const totalPages = Math.ceil(totalRecords / effectiveRecordsPerPage);

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

  if (showCreateTicket) {
    return <ComCreateTicket onClose={() => setShowCreateTicket(false)} />;
  }

  const renderHeader = (
    <div className="px-4 bg-gradient-to-l from-pink-500 to-violet-800 rounded-xl py-5 flex-shrink-0 shadow-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-inner">
            <Ticket className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-black text-xl sm:text-2xl text-white tracking-tight">Tickets</h2>
            <p className="text-xs text-white/60 mt-0.5">Create and manage your tickets</p>
          </div>
        </div>
        {/* <div className="flex flex-col items-end gap-0.5">
          <span className="text-2xl font-black text-white/90">{totalRecords}</span>
          <span className="text-[10px] text-white/50 uppercase tracking-widest">Total</span>
        </div> */}
      </div>
    </div>
  );

  const renderTabs = (
    <div className="flex border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
      <nav className="flex gap-x-1">
        {tabs.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => handleTabChange(id)}
            className={`px-4 py-2.5 text-xs sm:text-sm font-medium transition-all duration-150 rounded-t-lg border-b-2 cursor-pointer ${safeActiveTab === id
                ? "border-violet-600 text-violet-600 bg-violet-50 dark:bg-violet-950/30 dark:border-violet-400 dark:text-violet-400 font-semibold"
                : "border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-white/[0.04]"
              }`}
          >
            {label}
          </button>
        ))}
      </nav>
    </div>
  );

  const renderPagination = totalRecords > 0 && (
    <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-800">
      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
        {totalRecords} Records
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        {[...Array(totalPages)].map((_, i) => {
          const pageNum = i + 1;
          if (pageNum === 1 || pageNum === totalPages || Math.abs(pageNum - currentPage) <= 1) {
            return (
              <button
                key={pageNum}
                onClick={() => handlePageChange(pageNum)}
                className={`w-8 h-8 text-xs rounded-lg transition-colors ${pageNum === currentPage
                    ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                    : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                  }`}
              >
                {pageNum}
              </button>
            );
          }
          if (Math.abs(pageNum - currentPage) === 2) {
            return <span key={pageNum} className="text-xs text-gray-400 px-1">...</span>;
          }
          return null;
        })}
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  const renderFooter = (
    <footer className="mt-4 border-t border-gray-200 dark:border-gray-800">
      <div className="px-6 py-3 flex flex-col sm:flex-row items-center sm:justify-between gap-4 relative">
        <p className="text-sm font-semibold text-gray-900 dark:text-white tracking-tight">
          Sparta Services, LLC
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap hidden sm:block absolute left-1/2 -translate-x-1/2">
          &copy; {new Date().getFullYear()} Sparta Services, LLC. All rights reserved.
        </p>
        <div className="flex flex-nowrap justify-center sm:justify-end sm:flex-wrap gap-x-3 sm:gap-x-6 gap-y-1 sm:gap-y-2 w-full sm:w-auto">
          <a href="https://www.spartaserv.com/terms-conditions" target="_blank" rel="noopener noreferrer"
            className="text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors flex items-center gap-1 shrink-0"
            style={{ fontSize: 'clamp(11px, 3vw, 14px)' }}>
            Terms
            <ExternalLink style={{ width: 'clamp(10px, 2.5vw, 12px)', height: 'clamp(10px, 2.5vw, 12px)' }} className="opacity-60 flex-shrink-0" />
          </a>
          <a href="https://www.spartaserv.com/privacy-policy" target="_blank" rel="noopener noreferrer"
            className="text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors flex items-center gap-1 shrink-0"
            style={{ fontSize: 'clamp(11px, 3vw, 14px)' }}>
            Privacy Policy
            <ExternalLink style={{ width: 'clamp(10px, 2.5vw, 12px)', height: 'clamp(10px, 2.5vw, 12px)' }} className="opacity-60 flex-shrink-0" />
          </a>
          <a href="https://www.spartaserv.com" target="_blank" rel="noopener noreferrer"
            className="text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors flex items-center gap-1 shrink-0"
            style={{ fontSize: 'clamp(11px, 3vw, 14px)' }}>
            spartaserv.com
            <ExternalLink style={{ width: 'clamp(10px, 2.5vw, 12px)', height: 'clamp(10px, 2.5vw, 12px)' }} className="opacity-60 flex-shrink-0" />
          </a>
          <a href="https://Portal.SpartaServ.com" target="_blank" rel="noopener noreferrer"
            className="text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors flex items-center gap-1 shrink-0"
            style={{ fontSize: 'clamp(11px, 3vw, 14px)' }}>
            Portal
            <ExternalLink style={{ width: 'clamp(10px, 2.5vw, 12px)', height: 'clamp(10px, 2.5vw, 12px)' }} className="opacity-60 flex-shrink-0" />
          </a>
        </div>
        <p className="text-[10px] text-gray-400 dark:text-gray-500 sm:hidden text-center">
          &copy; {new Date().getFullYear()} Sparta Services, LLC. All rights reserved.
        </p>
      </div>
    </footer>
  );

  if (isMobile) {
    return (
      <div className="min-h-screen flex flex-col p-4 pb-0">
        <div className="flex-1 flex flex-col gap-4">
          {renderHeader}
          {renderTabs}

          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 flex flex-col">
            <div className="p-4">
              <ComFilters
                onCreateTicket={() => setShowCreateTicket(true)}
                activeTab={safeActiveTab}
                searchValue={searchValue}
                onSearch={setSearchValue}
                selectedFilters={selectedFilters}
                onFiltersChange={(filters) => { setSelectedFilters(filters); setCurrentPage(1); }}
                filterOptions={filterOptions}
              />
            </div>

            <div className="border-t border-gray-200 dark:border-gray-800" />

            <div className="p-4">
              <ComTicketTable
                activeTab={safeActiveTab}
                currentPage={currentPage}
                recordsPerPage={MOBILE_CARDS_PER_PAGE}
                onTotalRecordsChange={setTotalRecords}
                onFilterOptionsChange={setFilterOptions}
                searchValue={searchValue}
                filters={selectedFilters}
                refreshKey={refreshKey}
                onTicketUpdated={() => setRefreshKey(k => k + 1)}
                renderAs="cards"
                CardComponent={ComCard}
              />
            </div>

            {renderPagination}
          </div>
        </div>
        {renderFooter}
      </div>
    );
  }

  // ── Desktop layout 
  return (
    <div className="h-screen flex flex-col overflow-hidden p-4 md:p-6 pb-0 md:pb-0">
      <div className="flex-1 flex flex-col gap-4 min-h-0">
        {renderHeader}
        {renderTabs}

        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4 flex flex-col flex-1 min-h-0">
          <div className="flex-shrink-0">
            <ComFilters
              onCreateTicket={() => setShowCreateTicket(true)}
              activeTab={safeActiveTab}
              searchValue={searchValue}
              onSearch={setSearchValue}
              selectedFilters={selectedFilters}
              onFiltersChange={(filters) => { setSelectedFilters(filters); setCurrentPage(1); }}
              filterOptions={filterOptions}
            />
          </div>

          <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-800 mt-2" />

          <div ref={tableContainerRef} className="flex-1 min-h-0 overflow-hidden">
            <ComTicketTable
              activeTab={safeActiveTab}
              currentPage={currentPage}
              recordsPerPage={recordsPerPage}
              onTotalRecordsChange={setTotalRecords}
              onFilterOptionsChange={setFilterOptions}
              searchValue={searchValue}
              filters={selectedFilters}
              refreshKey={refreshKey}
              onTicketUpdated={() => setRefreshKey(k => k + 1)}
            />
          </div>

          {renderPagination}
        </div>
      </div>

      {renderFooter}
    </div>
  );
}