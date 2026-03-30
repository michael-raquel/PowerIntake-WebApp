"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import ComFilters from '@/components/ticket/ComFilters';
import ComTicketTable from '@/components/ticket/ComTicketTable';
import ComCreateTicket from '@/components/ticket/ComCreateTicket';
import ComUpdateForm from '@/components/ticket/ComUpdateForm';
import ComCard from '@/components/ticket/tables/ComCard';
import { useAuth } from '@/context/AuthContext';
import useManagerCheck from '@/hooks/UseManagerCheck';
import { useFetchTicket } from '@/hooks/UseFetchTicket';
import { useFetchUserSettings } from '@/hooks/UseFetchUserSettings';
import { useUpdateRecordCount } from '@/hooks/UseUpdateRecordCount';
import { useUpdateHideTickets } from '@/hooks/UseUpdateHideTickets';
import { ExternalLink, ChevronLeft, ChevronRight, Ticket } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

const MOBILE_PER_PAGE = 10;
const ROW_HEIGHT = 50;
const MIN_ROWS = 1;
const DEFAULT_ROWS = 9;

const FOOTER_LINKS = [
  { href: 'https://www.spartaserv.com/terms-conditions', label: 'Terms' },
  { href: 'https://www.spartaserv.com/privacy-policy', label: 'Privacy Policy' },
  { href: 'https://www.spartaserv.com', label: 'SpartaServ.com' },
  { href: 'https://Portal.SpartaServ.com', label: 'Portal' },
];

const VALID_TABS = new Set(['my-client', 'my-company', 'my-team', 'my-ticket']);

export default function TicketPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { tokenInfo } = useAuth();
  const { isManager } = useManagerCheck();

  const roles = tokenInfo?.account?.roles ?? [];
  const isSuperAdmin = roles.includes('SuperAdmin');
  const isAdmin = roles.includes('Admin');
  const userId = tokenInfo?.account?.localAccountId;

  const initialUuid = searchParams.get('uuid') || null;
  const initialTab = searchParams.get('tab') || null;
  const initialSearch = searchParams.get('search') || '';

  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState(
    initialTab && VALID_TABS.has(initialTab) ? initialTab : 'my-ticket'
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [showCreateTicket, setShowCreateTicket] = useState(() => searchParams.get('create') === 'true');
  const [searchValue, setSearchValue] = useState(initialSearch);
  const [selectedFilters, setSelectedFilters] = useState({});
  const [filterOptions, setFilterOptions] = useState({});
  const [refreshKey, setRefreshKey] = useState(0);
  const [recordsPerPage, setRecordsPerPage] = useState(DEFAULT_ROWS);
  const [userRowsPerPage, setUserRowsPerPage] = useState(null);

  const [selectedTicket, setSelectedTicket] = useState(null);
  const pendingUuid = useRef(initialUuid);
  const tableContainerRef = useRef(null);

  const { userSettings } = useFetchUserSettings({ entrauserid: userId });
  const { updateRecordCount, loading: updating } = useUpdateRecordCount();
  const { updateHideTickets } = useUpdateHideTickets();

  const settingsRowsPerPage = useMemo(() => {
    if (userSettings && userSettings.length > 0) {
      const setting = userSettings[0];
      const recordCount = Number(setting?.v_ticketrecordcount);
      if (recordCount > 0) {
        return recordCount;
      }
    }
    return null;
  }, [userSettings]);

  const effectiveRecordsPerPage = userRowsPerPage ?? settingsRowsPerPage ?? recordsPerPage;
  const perPage = isMobile ? MOBILE_PER_PAGE : effectiveRecordsPerPage;
  const totalPages = Math.max(1, Math.ceil(totalRecords / perPage));
  const safePage = Math.min(currentPage, totalPages);
  const [hideCompleted, setHideCompleted] = useState(false);
  const [pendingSyncUuid, setPendingSyncUuid] = useState(null);

  const initialHideCompleted = useMemo(() => {
    if (userSettings && userSettings.length > 0) {
      return Boolean(userSettings[0]?.v_hidecompletedtickets);
    }
    return false;
  }, [userSettings]);

  // const [hideCompleted, setHideCompleted] = useState(initialHideCompleted);

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

  const safeTab = useMemo(() => {
    const ids = tabs.map(t => t.id);
    return ids.includes(activeTab) ? activeTab : 'my-ticket';
  }, [tabs, activeTab]);

  const ticketQuery = useMemo(() => {
    if (!userId || safeTab === 'my-team') return { enabled: false };
    if (safeTab === 'my-company') return { enabled: true, scope: 'my-company', entratenantid: tokenInfo?.account?.tenantId };
    if (safeTab === 'my-client') return { enabled: true, scope: 'my-client', entrauserid: null };
    return { enabled: true, scope: 'my-ticket', entrauserid: userId };
  }, [userId, safeTab, tokenInfo?.account?.tenantId]);

  const { tickets = [], isLoading } = useFetchTicket({ ...ticketQuery, refreshKey });

  useEffect(() => {
    setHideCompleted(initialHideCompleted);
  }, [initialHideCompleted]);

  useEffect(() => {
    if (!pendingUuid.current || isLoading || !tickets.length) return;
    const match = tickets.find(t => t.v_ticketuuid === pendingUuid.current);
    if (match) {
      setSelectedTicket(match);
      pendingUuid.current = null;
    }
  }, [tickets, isLoading]);

  useEffect(() => {
    const param = searchParams.get('search');
    if (param && param !== searchValue) {
      setSearchValue(param);
    }
  }, [searchParams, searchValue]);

  useEffect(() => {
    const hasParams = searchParams.get('create') || searchParams.get('uuid') || searchParams.get('tab') || searchParams.get('search');
    if (hasParams) router.replace('/ticket', undefined, { shallow: true });
  }, [router, searchParams]);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (isMobile) return;
    const update = () => {
      if (!tableContainerRef.current) return;
      const h = tableContainerRef.current.clientHeight;
      if (!h) return;
      const next = Math.max(MIN_ROWS, Math.floor(h / ROW_HEIGHT));
      setRecordsPerPage(prev => prev !== next ? next : prev);
    };
    const raf = requestAnimationFrame(update);
    window.addEventListener('resize', update);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', update); };
  }, [isMobile, safeTab]);

  const handleTabChange = useCallback((id) => {
    setActiveTab(id);
    setCurrentPage(1);
    setSearchValue('');
    setSelectedFilters({});
    setFilterOptions({});
  }, []);

  const handleFiltersChange = useCallback((filters) => {
    setSelectedFilters(filters);
    setCurrentPage(1);
  }, []);

  const handleTicketSelect = useCallback((ticket) => {
    setSelectedTicket(ticket);
  }, []);

  const handleDialogClose = useCallback(() => {
    setSelectedTicket(null);
  }, []);

  const handleTicketUpdated = useCallback(() => {
    setRefreshKey(k => k + 1);
    setSelectedTicket(null);
  }, []);

  const handleHideCompletedChange = useCallback(async (val) => {
    setHideCompleted(val);
    if (userSettings?.[0]?.v_entrauserid) {
      try {
        await updateHideTickets({
          entrauserid: userSettings[0].v_entrauserid,
          hideCompleted: val,
          modifiedby: tokenInfo?.account?.username ?? null,
        });
      } catch (err) {
        console.error('Failed to save hide completed setting:', err);
      }
    }
  }, [userSettings, updateHideTickets, tokenInfo]);

  const handleRecordsPerPageChange = async (value) => {
    const newValue = Number(value);
    setCurrentPage(1);
    setUserRowsPerPage(newValue);

    if (userSettings && userSettings.length > 0) {
      try {
        await updateRecordCount({
          entrauserid: userSettings[0]?.v_entrauserid,
          ticketrecordcount: newValue,
          managerecordcount: userSettings[0]?.v_managerecordcount ?? null,
          modifiedby: tokenInfo?.account?.username ?? null,
        });
      } catch (err) {
        console.error('Failed to update record count:', err);
      }
    }
  };

  if (showCreateTicket) {
  return (
    <ComCreateTicket
      onClose={() => setShowCreateTicket(false)}
      onTicketCreated={(ticketuuid) => {
        setPendingSyncUuid(ticketuuid);
        setShowCreateTicket(false);
      }}
    />
  );
}

  const header = (
    <div className="px-4 bg-gradient-to-l from-pink-500 to-violet-800 rounded-xl py-5 flex-shrink-0 shadow-md">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-inner">
          <Ticket className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="font-black text-xl sm:text-2xl text-white tracking-tight">Tickets</h2>
          <p className="text-xs text-white/60 mt-0.5">Create and manage your tickets</p>
        </div>
      </div>
    </div>
  );

  const tabBar = (
    <div className="flex border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
      <nav className="flex gap-x-1">
        {tabs.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => handleTabChange(id)}
            className={`px-4 py-2.5 text-xs sm:text-sm font-medium transition-all duration-150 rounded-t-lg border-b-2 cursor-pointer ${safeTab === id
              ? 'border-violet-600 text-violet-600 bg-violet-50 dark:bg-violet-950/30 dark:border-violet-400 dark:text-violet-400 font-semibold'
              : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-white/[0.04]'
              }`}
          >
            {label}
          </button>
        ))}
      </nav>
    </div>
  );

  const pagination = totalRecords === 0 ? null : (() => {
    const pages = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else if (safePage <= 3) {
      pages.push(1, 2, 3, 4, '...', totalPages);
    } else if (safePage >= totalPages - 2) {
      pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, '...', safePage - 1, safePage, safePage + 1, '...', totalPages);
    }

    return (
      <div className={`flex items-center justify-between gap-4 py-2 border-t border-gray-200 dark:border-gray-800 mt-auto ${isMobile ? 'px-5 flex-col' : 'pr-15 flex-row'
        }`}>
        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
          {totalRecords} Total Records
        </span>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2">
            <label className="text-xs text-gray-600 dark:text-gray-400 font-medium">Rows per page:</label>
            <Select value={String(effectiveRecordsPerPage ?? 10)} onValueChange={handleRecordsPerPageChange} disabled={updating}>
              <SelectTrigger className="w-20 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="15">15</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {pages.map((page, i) =>
              page === '...' ? (
                <span key={`e${i}`} className="text-xs text-gray-400 px-1">...</span>
              ) : (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 text-xs rounded-lg transition-colors font-medium ${page === safePage
                      ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                      : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                    }`}
                >
                  {page}
                </button>
              )
            )}
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  })();

  const footer = (
    <footer className="mt-4 border-t border-gray-200 dark:border-gray-800 ">
      <div className="px-6 py-2 flex flex-col sm:flex-row items-center sm:justify-between gap-2">

        <div className="flex items-center gap-2 shrink-0 order-1 sm:order-1">
          <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0" />
          <p className="text-sm font-semibold text-gray-900 dark:text-white tracking-tight whitespace-nowrap">Sparta Services, LLC</p>
        </div>

        <div className="flex items-center gap-1 shrink-0 order-2 sm:order-3 sm:pr-14">
          <div className="hidden sm:flex items-center gap-1">
            {[
              { href: 'https://www.spartaserv.com/terms-conditions', label: 'Terms' },
              { href: 'https://Portal.SpartaServ.com', label: 'Portal' },
              { href: 'https://www.spartaserv.com/privacy-policy', label: 'Privacy Policy' },
              { href: 'https://www.spartaserv.com', label: 'SpartaServ.com' },
            ].map((link, i, arr) => (
              <span key={link.label} className="flex items-center">
                <a href={link.href} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-purple-600 dark:text-purple-400 underline underline-offset-2 decoration-purple-300 dark:decoration-purple-700 hover:decoration-purple-600 dark:hover:decoration-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/30 transition-all whitespace-nowrap">
                  {link.label}<ExternalLink className="w-2.5 h-2.5 opacity-70 shrink-0" />
                </a>
                {i < arr.length - 1 && <span className="w-px h-3 bg-gray-300 dark:bg-gray-700 mx-0.5 shrink-0" />}
              </span>
            ))}
          </div>

          <div className="grid sm:hidden grid-cols-2 gap-x-0 gap-y-0">
            {[
              { href: 'https://www.spartaserv.com/terms-conditions', label: 'Terms' },
              { href: 'https://Portal.SpartaServ.com', label: 'Portal' },
              { href: 'https://www.spartaserv.com/privacy-policy', label: 'Privacy Policy' },
              { href: 'https://www.spartaserv.com', label: 'SpartaServ.com' },
            ].map((link, i) => (
              <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer"
                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs font-medium text-purple-600 dark:text-purple-400 underline underline-offset-2 decoration-purple-300 dark:decoration-purple-700 hover:decoration-purple-600 dark:hover:decoration-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/30 transition-all whitespace-nowrap ${i % 2 === 0 ? 'justify-end' : 'justify-start'
                  }`}>
                {link.label}<ExternalLink className="w-2.5 h-2.5 opacity-70 shrink-0" />
              </a>
            ))}
          </div>
        </div>

        <p className="text-[11px] text-gray-400 dark:text-gray-500 whitespace-nowrap order-3 sm:order-2">
          &copy; {new Date().getFullYear()} Sparta Services, LLC. All rights reserved.
        </p>

      </div>
    </footer>
  );

  // const tableProps = {
  //   activeTab: safeTab,
  //   currentPage: safePage,
  //   onTotalRecordsChange: setTotalRecords,
  //   onFilterOptionsChange: setFilterOptions,
  //   searchValue,
  //   filters: selectedFilters,
  //   refreshKey,
  //   onTicketSelect: handleTicketSelect,
  //   onTicketUpdated: () => setRefreshKey(k => k + 1),
  //   pendingSyncUuid,                          
  //   onSynced: () => setPendingSyncUuid(null), 
  // };

  const tableProps = {
    activeTab: safeTab,
    currentPage: safePage,
    onTotalRecordsChange: setTotalRecords,
    onFilterOptionsChange: setFilterOptions,
    searchValue,
    filters: selectedFilters,
    refreshKey,
    onTicketSelect: handleTicketSelect,
    onTicketUpdated: () => setRefreshKey(k => k + 1),
    pendingSyncUuid,
    onSynced:     useCallback(() => { setPendingSyncUuid(null); toast.success('Ticket synced to Dynamics successfully'); }, []),
    onSyncFailed: useCallback(() => toast.warning('Ticket created but Dynamics sync failed'), []),
    onDeleted:    useCallback(() => toast.info('A ticket has been removed'), []),
    onUpdated:    useCallback(() => toast.info('A ticket has been updated'), []),
  };

  // ── Mobile 
  if (isMobile) {
    return (
      <div className="min-h-screen flex flex-col p-4 pb-0">
        <div className="flex-1 flex flex-col gap-4">
          {header}
          {tabBar}
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 flex flex-col">
            <div className="p-4">
              <ComFilters
                onCreateTicket={() => setShowCreateTicket(true)}
                activeTab={safeTab}
                searchValue={searchValue}
                onSearch={setSearchValue}
                selectedFilters={selectedFilters}
                onFiltersChange={handleFiltersChange}
                filterOptions={filterOptions}
                hideCompleted={hideCompleted}
                onHideCompletedChange={handleHideCompletedChange}
              />
            </div>
            <div className="border-t border-gray-200 dark:border-gray-800" />
            <div className="p-4">
              <ComTicketTable {...tableProps} recordsPerPage={MOBILE_PER_PAGE} renderAs="cards" CardComponent={ComCard} />
            </div>
            {pagination}
          </div>
        </div>
        {footer}

        {selectedTicket && (
          <ComUpdateForm
            ticket={selectedTicket}
            onClose={handleDialogClose}
            onUpdated={handleTicketUpdated}
          />
        )}
      </div>
    );
  }

  // ── Desktop 
  return (
    <div className="h-[100dvh] flex flex-col p-4 pb-0 overflow-hidden">
      <div className="flex flex-col gap-4 flex-1 min-h-0">
        {header}
        {tabBar}
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4 pb-0 flex flex-col flex-1 min-h-0">
          <div className="flex-shrink-0">
            <ComFilters
              onCreateTicket={() => setShowCreateTicket(true)}
              activeTab={safeTab}
              searchValue={searchValue}
              onSearch={setSearchValue}
              selectedFilters={selectedFilters}
              onFiltersChange={handleFiltersChange}
              filterOptions={filterOptions}
              hideCompleted={hideCompleted}
              onHideCompletedChange={handleHideCompletedChange}
            />
          </div>
          <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-800 mt-3" />
          <div ref={tableContainerRef} className="flex-1 min-h-0 overflow-auto">
            <ComTicketTable {...tableProps} recordsPerPage={effectiveRecordsPerPage} hideCompleted={hideCompleted} />
          </div>
          {pagination}
        </div>
      </div>
      {footer}

      {selectedTicket && (
        <ComUpdateForm
          ticket={selectedTicket}
          onClose={handleDialogClose}
          onUpdated={handleTicketUpdated}
        />
      )}
    </div>
  );
}