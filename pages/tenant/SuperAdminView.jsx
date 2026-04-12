"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import ComFilters from "@/components/tenant/ComFilters";
import ComTenantTable from "@/components/tenant/ComTenantTable";
import ComCreateTenant from "@/components/tenant/ComCreateTenant";
import ComUpdateForm from "@/components/tenant/ComUpdateForm";
import ComCard from "@/components/tenant/ComCard";
import { useAuth } from "@/context/AuthContext";
import { useFetchUserSettings } from "@/hooks/UseFetchUserSettings";
import { useUpdateRecordCount } from "@/hooks/UseUpdateRecordCount";
import {
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Building2,
} from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const MOBILE_PER_PAGE = 10;
const DEFAULT_ROWS = 5;
const VALID_TABS = new Set(["all-tenant"]);

export default function SuperAdminView() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { tokenInfo } = useAuth();
  const userId = tokenInfo?.account?.localAccountId;

  const initialTab = searchParams.get("tab") || null;
  const initialSearch = searchParams.get("search") || "";

  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState(
    initialTab && VALID_TABS.has(initialTab) ? initialTab : "all-tenant",
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [showCreateTenant, setShowCreateTenant] = useState(
    () => searchParams.get("create") === "true",
  );
  const [searchValue, setSearchValue] = useState(initialSearch);
  const [selectedFilters, setSelectedFilters] = useState({});
  const [filterOptions, setFilterOptions] = useState({});
  const [refreshKey, setRefreshKey] = useState(0);
  const recordsPerPage = DEFAULT_ROWS;
  const [userRowsPerPage, setUserRowsPerPage] = useState(null);
  const [selectedTenant, setSelectedTenant] = useState(null);

  const rowsPerPageStorageKey = useMemo(
    () => (userId ? `tenant-rows-per-page:${userId}` : null),
    [userId],
  );

  const { userSettings, refetch: refetchUserSettings } = useFetchUserSettings({
    entrauserid: userId,
  });
  const { updateRecordCount, loading: updating } = useUpdateRecordCount();

  const matchedUserSettings = useMemo(() => {
    const normalizedUserId = String(userId || "").trim();
    if (!Array.isArray(userSettings) || userSettings.length === 0) return null;

    return (
      userSettings.find((setting) => {
        const settingUserId = String(
          setting?.v_entrauserid ?? setting?.entrauserid ?? "",
        ).trim();
        return settingUserId && settingUserId === normalizedUserId;
      }) || userSettings[0]
    );
  }, [userSettings, userId]);

  const tabs = useMemo(() => [{ id: "all-tenant", label: "Tenants" }], []);

  const safeTab = useMemo(() => {
    const ids = tabs.map((tab) => tab.id);
    return ids.includes(activeTab) ? activeTab : "all-tenant";
  }, [tabs, activeTab]);

  const settingsRowsPerPage = useMemo(() => {
    if (matchedUserSettings) {
      const setting = matchedUserSettings;
      const recordCount = Number(
        setting?.v_tenantrecordcount ?? setting?.tenantrecordcount,
      );
      if (recordCount > 0) {
        return recordCount;
      }
    }
    return null;
  }, [matchedUserSettings]);

  const storedRowsPerPage = useMemo(() => {
    if (!rowsPerPageStorageKey || typeof window === "undefined") return null;
    const raw = window.localStorage.getItem(rowsPerPageStorageKey);
    const parsed = Number(raw);
    if (!Number.isFinite(parsed) || parsed <= 0) return null;
    return parsed;
  }, [rowsPerPageStorageKey]);

  const effectiveRecordsPerPage =
    userRowsPerPage ??
    settingsRowsPerPage ??
    storedRowsPerPage ??
    recordsPerPage;
  const mobileRecordsPerPage =
    userRowsPerPage ??
    settingsRowsPerPage ??
    storedRowsPerPage ??
    MOBILE_PER_PAGE;

  useEffect(() => {
    if (!rowsPerPageStorageKey || typeof window === "undefined") return;
    if (!Number.isFinite(settingsRowsPerPage) || settingsRowsPerPage <= 0) return;
    window.localStorage.setItem(
      rowsPerPageStorageKey,
      String(settingsRowsPerPage),
    );
  }, [rowsPerPageStorageKey, settingsRowsPerPage]);

  const perPage = isMobile ? mobileRecordsPerPage : effectiveRecordsPerPage;
  const totalPages = Math.max(1, Math.ceil(totalRecords / perPage));
  const safePage = Math.min(currentPage, totalPages);

  const handleTabChange = useCallback((id) => {
    setActiveTab(id);
    setCurrentPage(1);
    setSearchValue("");
    setSelectedFilters({});
    setFilterOptions({});
  }, []);

  const handleFiltersChange = useCallback((filters) => {
    setSelectedFilters(filters);
    setCurrentPage(1);
  }, []);

  const handleRecordsPerPageChange = useCallback(async (value) => {
    const newValue = Number(value);
    if (!Number.isFinite(newValue) || newValue <= 0) return;
    setCurrentPage(1);
    setUserRowsPerPage(newValue);
    if (rowsPerPageStorageKey && typeof window !== "undefined") {
      window.localStorage.setItem(rowsPerPageStorageKey, String(newValue));
    }

    const entraUserIdToSave =
      matchedUserSettings?.v_entrauserid ??
      matchedUserSettings?.entrauserid ??
      userId;

    if (!entraUserIdToSave) return;

    try {
      const payload = {
        entrauserid: entraUserIdToSave,
        ticketrecordcount:
          matchedUserSettings?.v_ticketrecordcount ??
          matchedUserSettings?.ticketrecordcount ??
          null,
        managerecordcount:
          matchedUserSettings?.v_managerecordcount ??
          matchedUserSettings?.managerecordcount ??
          null,
        tenantrecordcount: newValue,
        modifiedby: tokenInfo?.account?.username ?? null,
      };

      await updateRecordCount(payload);
      await refetchUserSettings?.();
    } catch (err) {
      console.error("Failed to update record count:", err);
    }
  }, [
    matchedUserSettings,
    updateRecordCount,
    tokenInfo,
    userId,
    refetchUserSettings,
    rowsPerPageStorageKey,
  ]);

  const handleTenantCreated = useCallback(() => {
    setShowCreateTenant(false);
    setRefreshKey((key) => key + 1);
  }, []);

  const handleTenantSelect = useCallback((tenant) => {
    setSelectedTenant(tenant);
  }, []);

  const handleDialogClose = useCallback(() => {
    setSelectedTenant(null);
  }, []);

  const handleTenantUpdated = useCallback(() => {
    setRefreshKey((key) => key + 1);
    setSelectedTenant(null);
  }, []);

  useEffect(() => {
    const hasParams =
      searchParams.get("create") ||
      searchParams.get("tab") ||
      searchParams.get("search");
    if (hasParams) router.replace("/tenant", undefined, { shallow: true });
  }, [router, searchParams]);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  if (showCreateTenant) {
    return (
      <ComCreateTenant
        onClose={() => setShowCreateTenant(false)}
        onTenantCreated={handleTenantCreated}
      />
    );
  }

  const header = (
    <div className="px-4 bg-linear-to-l from-pink-500 to-violet-800 rounded-xl py-5 flex-shrink-0 shadow-md">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-inner">
          <Building2 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="font-black text-xl sm:text-2xl text-white tracking-tight">
            Tenants
          </h2>
          <p className="text-xs text-white/60 mt-0.5">
            Create and manage tenant records
          </p>
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
            className={`px-4 py-2.5 text-xs sm:text-sm font-medium transition-all duration-150 rounded-t-lg border-b-2 cursor-pointer ${
              safeTab === id
                ? "border-violet-600 text-violet-600 bg-violet-50 dark:bg-violet-950/30 dark:border-violet-400 dark:text-violet-400 font-semibold"
                : "border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-white/4"
            }`}
          >
            {label}
          </button>
        ))}
      </nav>
    </div>
  );

  const pagination =
    totalRecords === 0
      ? null
      : (() => {
          const pages = [];
          if (totalPages <= 5) {
            for (let index = 1; index <= totalPages; index += 1)
              pages.push(index);
          } else if (safePage <= 3) {
            pages.push(1, 2, 3, 4, "...", totalPages);
          } else if (safePage >= totalPages - 2) {
            pages.push(
              1,
              "...",
              totalPages - 3,
              totalPages - 2,
              totalPages - 1,
              totalPages,
            );
          } else {
            pages.push(
              1,
              "...",
              safePage - 1,
              safePage,
              safePage + 1,
              "...",
              totalPages,
            );
          }

          return (
            <div
              className={`flex items-center justify-between gap-4 py-2 border-t border-gray-200 dark:border-gray-800 mt-auto ${
                isMobile ? "px-5 flex-col" : "pr-15 flex-row"
              }`}
            >
              <div
                className={`flex items-center gap-3 ${
                  isMobile ? "w-full justify-between" : ""
                }`}
              >
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  {totalRecords} Total Records
                </span>
                {isMobile && (
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-600 dark:text-gray-400 font-medium whitespace-nowrap">
                      Rows per page:
                    </label>
                    <Select
                      value={String(mobileRecordsPerPage ?? 10)}
                      onValueChange={handleRecordsPerPageChange}
                      disabled={updating}
                    >
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
                )}
              </div>
              <div
                className={`flex items-center gap-3 ${
                  isMobile ? "w-full justify-center" : ""
                }`}
              >
                <div className="hidden md:flex items-center gap-2">
                  <label className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                    Rows per page:
                  </label>
                  <Select
                    value={String(effectiveRecordsPerPage ?? 5)}
                    onValueChange={handleRecordsPerPageChange}
                    disabled={updating}
                  >
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
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={safePage === 1}
                    className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {pages.map((page, index) =>
                    page === "..." ? (
                      <span
                        key={`ellipsis-${index}`}
                        className="text-xs text-gray-400 px-1"
                      >
                        ...
                      </span>
                    ) : (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 text-xs rounded-lg transition-colors font-medium ${
                          page === safePage
                            ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                            : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                        }`}
                      >
                        {page}
                      </button>
                    ),
                  )}

                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
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
    <footer className="mt-4 border-t border-gray-200 dark:border-gray-800">
      <div className="px-6 py-2 flex flex-col sm:flex-row items-center sm:justify-between gap-2">
        <div className="flex items-center gap-2 shrink-0 order-1 sm:order-1">
          <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0" />
          <p className="text-sm font-semibold text-gray-900 dark:text-white tracking-tight whitespace-nowrap">
            Sparta Services, LLC
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0 order-2 sm:order-3 sm:pr-14">
          <div className="hidden sm:flex items-center gap-1">
            {[
              {
                href: "https://www.spartaserv.com/terms-conditions",
                label: "Terms",
              },
              { href: "https://Portal.SpartaServ.com", label: "Portal" },
              {
                href: "https://www.spartaserv.com/privacy-policy",
                label: "Privacy Policy",
              },
              { href: "https://www.spartaserv.com", label: "SpartaServ.com" },
            ].map((link, index, array) => (
              <span key={link.label} className="flex items-center">
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-purple-600 dark:text-purple-400 underline underline-offset-2 decoration-purple-300 dark:decoration-purple-700 hover:decoration-purple-600 dark:hover:decoration-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/30 transition-all whitespace-nowrap"
                >
                  {link.label}
                  <ExternalLink className="w-2.5 h-2.5 opacity-70 shrink-0" />
                </a>
                {index < array.length - 1 && (
                  <span className="w-px h-3 bg-gray-300 dark:bg-gray-700 mx-0.5 shrink-0" />
                )}
              </span>
            ))}
          </div>
          <div className="grid sm:hidden grid-cols-2 gap-x-0 gap-y-0">
            {[
              {
                href: "https://www.spartaserv.com/terms-conditions",
                label: "Terms",
              },
              { href: "https://Portal.SpartaServ.com", label: "Portal" },
              {
                href: "https://www.spartaserv.com/privacy-policy",
                label: "Privacy Policy",
              },
              { href: "https://www.spartaserv.com", label: "SpartaServ.com" },
            ].map((link, index) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs font-medium text-purple-600 dark:text-purple-400 underline underline-offset-2 decoration-purple-300 dark:decoration-purple-700 hover:decoration-purple-600 dark:hover:decoration-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/30 transition-all whitespace-nowrap ${
                  index % 2 === 0 ? "justify-end" : "justify-start"
                }`}
              >
                {link.label}
                <ExternalLink className="w-2.5 h-2.5 opacity-70 shrink-0" />
              </a>
            ))}
          </div>
        </div>
        <p className="text-[11px] text-gray-400 dark:text-gray-500 whitespace-nowrap order-3 sm:order-2">
          &copy; {new Date().getFullYear()} Sparta Services, LLC. All rights
          reserved.
        </p>
      </div>
    </footer>
  );

  const tableProps = {
    activeTab: safeTab,
    currentPage: safePage,
    onTotalRecordsChange: setTotalRecords,
    onFilterOptionsChange: setFilterOptions,
    searchValue,
    filters: selectedFilters,
    refreshKey,
    onTenantSelect: handleTenantSelect,
  };

  if (isMobile) {
    return (
      <div className="h-[100dvh] flex flex-col p-4 pb-0 overflow-hidden">
        <div className="flex-1 flex flex-col gap-4 min-h-0">
          {header}
          {tabBar}
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 flex flex-col flex-1 min-h-0">
            <div className="p-4 flex-shrink-0">
              <ComFilters
                onCreateTenant={() => setShowCreateTenant(true)}
                activeTab={safeTab}
                searchValue={searchValue}
                onSearch={setSearchValue}
                selectedFilters={selectedFilters}
                onFiltersChange={handleFiltersChange}
                filterOptions={filterOptions}
              />
            </div>
            <div className="border-t border-gray-200 dark:border-gray-800 flex-shrink-0" />
            <div className="px-4 pb-4 pt-0 flex-1 min-h-0 overflow-auto">
              <ComTenantTable
                {...tableProps}
                recordsPerPage={mobileRecordsPerPage}
                renderAs="cards"
                CardComponent={ComCard}
              />
            </div>
            {pagination}
          </div>
        </div>
        {footer}
        {selectedTenant && (
          <ComUpdateForm
            tenant={selectedTenant}
            mode="super-admin"
            onClose={handleDialogClose}
            onUpdated={handleTenantUpdated}
          />
        )}
      </div>
    );
  }

  return (
    <div className="h-[100dvh] flex flex-col p-4 pb-0 overflow-hidden">
      <div className="flex flex-col gap-4 flex-1 min-h-0">
        {header}
        {tabBar}
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4 pb-0 flex flex-col flex-1 min-h-0">
          <div className="flex-shrink-0">
            <ComFilters
              onCreateTenant={() => setShowCreateTenant(true)}
              activeTab={safeTab}
              searchValue={searchValue}
              onSearch={setSearchValue}
              selectedFilters={selectedFilters}
              onFiltersChange={handleFiltersChange}
              filterOptions={filterOptions}
            />
          </div>
          <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-800 mt-3" />
          <div className="flex-1 min-h-0 overflow-auto">
            <ComTenantTable
              {...tableProps}
              recordsPerPage={effectiveRecordsPerPage}
            />
          </div>
          {pagination}
        </div>
      </div>
      {footer}
      {selectedTenant && (
        <ComUpdateForm
          tenant={selectedTenant}
          mode="super-admin"
          onClose={handleDialogClose}
          onUpdated={handleTenantUpdated}
        />
      )}
    </div>
  );
}
