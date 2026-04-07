"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/router";
import { RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import useFetchMyTeam from "@/hooks/UseFetchMyTeamUsers";
import useSyncUsers from "@/hooks/UseSyncUsers";
import { useFetchUserSettings } from "@/hooks/UseFetchUserSettings";
import { useUpdateRecordCount } from "@/hooks/UseUpdateRecordCount";
import { useMsal } from "@azure/msal-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import MyTeamFilter from "@/components/manage/MyTeamFilter";
import MyTeamTable from "./table/MyTeamTable";
import { formatPercent } from "@/lib/utils";

const TABLE_COLUMNS = [
  {
    key: "userName",
    label: "User Name",
    align: "center",
    minWidth: 180,
    defaultWidth: 220,
    sortValue: (row) => row?.v_username ?? "",
  },
  {
    key: "jobTitle",
    label: "Job Title",
    align: "center",
    minWidth: 200,
    defaultWidth: 240,
    sortValue: (row) => row?.v_jobtitle ?? "",
  },
  {
    key: "tickets",
    label: "Tickets",
    align: "center",
    minWidth: 110,
    defaultWidth: 120,
    sortValue: (row) => Number(row?.v_totalticket ?? 0),
  },
  {
    key: "new",
    label: "New",
    align: "center",
    minWidth: 130,
    defaultWidth: 140,
    sortValue: (row) => Number(row?.v_newticket ?? 0),
  },
  {
    key: "inProgress",
    label: "In Progress",
    align: "center",
    minWidth: 130,
    defaultWidth: 140,
    sortValue: (row) => Number(row?.v_openticket ?? 0),
  },
  {
    key: "completed",
    label: "Completed",
    align: "center",
    minWidth: 150,
    defaultWidth: 160,
    sortValue: (row) => Number(row?.v_completed ?? 0),
  },
  {
    key: "completionRate",
    label: "Completion Rate",
    align: "center",
    minWidth: 160,
    defaultWidth: 170,
    sortValue: (row) => Number(row?.v_completion ?? 0),
  },
  {
    key: "status",
    label: "Status",
    align: "center",
    minWidth: 130,
    defaultWidth: 140,
    sortValue: (row) => (row?.v_status === "true" ? "Active" : "Inactive"),
  },
];

const DEFAULT_ROWS = 10;

const compareSortValues = (aValue, bValue) => {
  const aEmpty = aValue === null || aValue === undefined || aValue === "";
  const bEmpty = bValue === null || bValue === undefined || bValue === "";

  if (aEmpty && bEmpty) return 0;
  if (aEmpty) return 1;
  if (bEmpty) return -1;

  const aNumber = typeof aValue === "number" ? aValue : Number(aValue);
  const bNumber = typeof bValue === "number" ? bValue : Number(bValue);
  const aIsNumber = !Number.isNaN(aNumber) && String(aValue).trim() !== "";
  const bIsNumber = !Number.isNaN(bNumber) && String(bValue).trim() !== "";

  if (aIsNumber && bIsNumber) return aNumber - bNumber;

  return String(aValue).localeCompare(String(bValue), undefined, { numeric: true, sensitivity: "base" });
};

export default function MyTeamTab({ selectedFilters = {}, searchValue = "", onFiltersChange = () => {}, onSearchChange = () => {} }) {
  const { accounts } = useMsal();
  const router = useRouter();
  const [localPage, setLocalPage] = useState(1);
  const [userRowsPerPage, setUserRowsPerPage] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [columnWidths, setColumnWidths] = useState({});
  const resizeStateRef = useRef(null);

  const { userSettings } = useFetchUserSettings({ entrauserid: accounts?.[0]?.localAccountId });
  const { updateRecordCount, loading: updating } = useUpdateRecordCount();

  const settingsRowsPerPage = useMemo(() => {
    if (userSettings && userSettings.length > 0) {
      const setting = userSettings[0];
      const recordCount = Number(setting?.v_managerecordcount);
      if (recordCount > 0) {
        return recordCount;
      }
    }
    return null;
  }, [userSettings]);

  const selectedRowsPerPage = userRowsPerPage ?? settingsRowsPerPage ?? DEFAULT_ROWS;
  const effectiveLimit = selectedRowsPerPage;

  const {
    data,
    loading,
    fetchData,
    totals,
    filterOptions,
  } = useFetchMyTeam(1, effectiveLimit);

  useEffect(() => {
    if (selectedRowsPerPage !== null) {
      fetchData(1, {});
    }
  }, [selectedRowsPerPage, fetchData]);

  useEffect(() => {
    setColumnWidths((prev) => {
      const next = { ...prev };
      TABLE_COLUMNS.forEach((column) => {
        if (next[column.key] == null && column.defaultWidth) {
          next[column.key] = column.defaultWidth;
        }
      });
      return next;
    });
  }, []);

  const { syncUsers, loading: syncing, error: syncError, result: syncResult } = useSyncUsers();

  const handleSync = async () => {
    await syncUsers();
    fetchData(1, {});
  };

  const handleRecordsPerPageChange = async (value) => {
    const newValue = Number(value);
    setLocalPage(1);
    setUserRowsPerPage(newValue);

    if (userSettings && userSettings.length > 0) {
      try {
        await updateRecordCount({
          entrauserid: userSettings[0]?.v_entrauserid,
          ticketrecordcount: userSettings[0]?.v_ticketrecordcount ?? null,
          managerecordcount: newValue,
          tenantrecordcount: userSettings[0]?.v_tenantrecordcount ?? userSettings[0]?.tenantrecordcount ?? null,
          modifiedby: accounts?.[0]?.username ?? null,
        });
      } catch (err) {
        console.error("Failed to update record count:", err);
      }
    }
  };

  const statuses = useMemo(() => filterOptions?.statuses ?? [], [filterOptions?.statuses]);

  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return [];

    const selectedStatuses = Array.isArray(selectedFilters.status)
      ? selectedFilters.status
      : selectedFilters.status
        ? [selectedFilters.status]
        : [];
    const hasStatusFilter = selectedFilters?.status !== undefined && selectedFilters?.status !== null;
    const hasAllStatusesSelected = statuses.length > 0 && selectedStatuses.length === statuses.length;
    const effectiveStatuses = hasStatusFilter && !hasAllStatusesSelected ? selectedStatuses : [];
    const statusFiltersNone = hasStatusFilter && selectedStatuses.length === 0 && statuses.length > 0;

    return data.filter((row) => {
      // Text search
      if (searchValue && searchValue.trim()) {
        const searchLower = searchValue.toLowerCase();
        if (
          !String(row.v_username || "").toLowerCase().includes(searchLower) &&
          !String(row.v_jobtitle || "").toLowerCase().includes(searchLower)
        ) {
          return false;
        }
      }

      // Status filter
      if (statusFiltersNone) {
        return false;
      }
      if (effectiveStatuses.length > 0) {
        if (!effectiveStatuses.includes(String(row.v_status))) {
          return false;
        }
      }

      return true;
    });
  }, [data, searchValue, selectedFilters.status, statuses]);

  const displayTotal = filteredData.length;
  const displayTotalPages = effectiveLimit > 0 ? Math.max(1, Math.ceil(filteredData.length / effectiveLimit)) : 1;
  const displayHasPrev = localPage > 1;
  const displayHasNext = localPage < displayTotalPages;

  const sortedData = useMemo(() => {
    if (!sortConfig.key) return filteredData;
    const column = TABLE_COLUMNS.find((entry) => entry.key === sortConfig.key);
    if (!column) return filteredData;
    const next = [...filteredData];
    next.sort((a, b) => compareSortValues(column.sortValue(a), column.sortValue(b)));
    return sortConfig.direction === "asc" ? next : next.reverse();
  }, [filteredData, sortConfig]);

  const pagedData = useMemo(() => {
    const start = (localPage - 1) * effectiveLimit;
    return sortedData.slice(start, start + effectiveLimit);
  }, [sortedData, effectiveLimit, localPage]);

  const handleFiltersChange = useCallback((nextFilters) => {
    setLocalPage(1);
    onFiltersChange?.(nextFilters);
  }, [onFiltersChange]);

  const handleSearchChange = useCallback((value) => {
    setLocalPage(1);
    onSearchChange?.(value);
  }, [onSearchChange]);

  const handleRowClick = useCallback((row) => {
    const searchText = String(row?.v_username || "").trim();
    if (!searchText) return;
    const params = new URLSearchParams({ tab: "my-team", search: searchText });
    router.push(`/ticket?${params.toString()}`);
  }, [router]);

  const handleSort = useCallback((key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { key, direction: "asc" };
    });
    setLocalPage(1);
  }, []);

  const handleResize = useCallback((event) => {
    if (!resizeStateRef.current) return;
    const { key, startX, startWidth, minWidth } = resizeStateRef.current;
    const delta = event.clientX - startX;
    const nextWidth = Math.max(minWidth, startWidth + delta);
    setColumnWidths((prev) => ({
      ...prev,
      [key]: nextWidth,
    }));
  }, []);

  const stopResize = useCallback(function stopResizeHandler() {
    resizeStateRef.current = null;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
    window.removeEventListener("mousemove", handleResize);
    window.removeEventListener("mouseup", stopResizeHandler);
  }, [handleResize]);

  const handleResizeStart = useCallback((event, key, minWidth) => {
    event.preventDefault();
    event.stopPropagation();
    const th = event.currentTarget.closest("th");
    if (!th) return;
    resizeStateRef.current = {
      key,
      startX: event.clientX,
      startWidth: th.getBoundingClientRect().width,
      minWidth,
    };
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("mousemove", handleResize);
    window.addEventListener("mouseup", stopResize);
  }, [handleResize, stopResize]);

  useEffect(() => () => {
    window.removeEventListener("mousemove", handleResize);
    window.removeEventListener("mouseup", stopResize);
  }, [handleResize, stopResize]);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 flex flex-col min-h-0 flex-1">

      <MyTeamFilter
        onFiltersChange={handleFiltersChange}
        searchValue={searchValue}
        onSearch={handleSearchChange}
        statuses={statuses}
        selectedFilters={selectedFilters}
        rowsPerPage={selectedRowsPerPage ?? DEFAULT_ROWS}
        onRowsPerPageChange={handleRecordsPerPageChange}
        rowsPerPageDisabled={updating}
      />

      <div className="flex items-center px-4 py-3 border-b border-gray-200 dark:border-gray-800">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {displayTotal} Total Records
        </div>
        <div className="ml-auto flex items-center gap-3">
          {syncing && (
            <span className="text-xs text-blue-500 dark:text-blue-400">Syncing users...</span>
          )}
          {syncError && (
            <span className="text-xs text-red-500 dark:text-red-400">Sync failed: {syncError}</span>
          )}
          {syncResult && !syncing && (
            <span className="text-xs text-green-500 dark:text-green-400">
              {syncResult.message}
            </span>
          )}
          {/* <button
            onClick={handleSync}
            disabled={loading || syncing}
            className="p-1.5 rounded-lg text-violet-500 font-bold hover:text-violet-700 hover:bg-violet-100 dark:text-violet-400 dark:hover:text-violet-300 dark:hover:bg-violet-900/30 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${loading || syncing ? "animate-spin" : ""}`} />
          </button> */}
        </div>
      </div>
{/* 
      {error && (
        <div className="px-4 py-3 text-sm border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-start gap-2 text-red-500 dark:text-red-400">
            <span className="font-medium">Error:</span>
            <span>{error}</span>
          </div>
        </div>
      )} */}

    <div className="flex-1 min-h-0 overflow-y-auto block md:hidden divide-y divide-gray-100 dark:divide-gray-800">
        {loading ? (
          <div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
            Loading...
          </div>
        ) : pagedData.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
            No records found.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 p-4">
            {pagedData.map((row, i) => (
              <div
                key={i}
                onClick={() => handleRowClick(row)}
                className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm p-4 space-y-3 cursor-pointer hover:border-violet-300 dark:hover:border-violet-700 transition-colors"
              >
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400 font-semibold text-sm">
                      {row.v_username?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{row.v_username}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{row.v_jobtitle || "N/A"}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    row.v_status === "true"
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  }`}>
                    {row.v_status === "true" ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className="border-t border-gray-100 dark:border-gray-700" />

                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg px-3 py-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Tickets</p>
                    <p className="text-sm font-semibold text-center text-gray-900 dark:text-white">{row.v_totalticket ?? 0}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg px-3 py-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400">New</p>
                    <p className="text-sm font-semibold text-center text-gray-900 dark:text-white">{row.v_newticket ?? 0}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg px-3 py-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400">In Progress</p>
                    <p className="text-sm font-semibold text-center text-gray-900 dark:text-white">{row.v_openticket ?? 0}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg px-3 py-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Completed</p>
                    <p className="text-sm font-semibold text-center text-gray-900 dark:text-white">{row.v_completed ?? 0}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg px-3 py-2 col-span-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Completion Rate</p>
                    <p className="text-sm font-semibold text-center text-gray-900 dark:text-white">{formatPercent(row.v_completion)}</p>
                  </div>
                </div>

              </div>
            ))}
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">Totals</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">All records</span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg px-3 py-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Tickets</p>
                  <p className="text-sm font-semibold text-center text-gray-900 dark:text-white">
                    {totals?.totalTickets ?? 0}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg px-3 py-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400">New</p>
                  <p className="text-sm font-semibold text-center text-gray-900 dark:text-white">
                    {totals?.newTickets ?? 0}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg px-3 py-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400">In Progress</p>
                  <p className="text-sm font-semibold text-center text-gray-900 dark:text-white">
                    {totals?.openTickets ?? 0}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg px-3 py-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Completed</p>
                  <p className="text-sm font-semibold text-center text-gray-900 dark:text-white">
                    {totals?.completedTickets ?? 0}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg px-3 py-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Completion Rate</p>
                  <p className="text-sm font-semibold text-center text-gray-900 dark:text-white">{formatPercent(totals?.completionRate)}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <MyTeamTable
        columns={TABLE_COLUMNS}
        columnWidths={columnWidths}
        handleResizeStart={handleResizeStart}
        sortConfig={sortConfig}
        handleSort={handleSort}
        pagedData={pagedData}
        loading={loading}
        totals={totals}
        handleRowClick={handleRowClick}
        data={data}
      />

      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-800 pr-20">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {displayTotal} Total Records
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2">
            <label className="text-xs text-gray-600 dark:text-gray-400 font-medium">Rows per page:</label>
            <Select value={String(selectedRowsPerPage ?? 10)} onValueChange={handleRecordsPerPageChange} disabled={updating}>
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
              onClick={() => setLocalPage(Math.max(1, localPage - 1))}
              disabled={!displayHasPrev || loading}
              className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {[...Array(displayTotalPages)].map((_, i) => {
              const pageNum = i + 1;
              if (pageNum === 1 || pageNum === displayTotalPages || Math.abs(pageNum - localPage) <= 1) {
                return (
                  <button
                    key={pageNum}
                    onClick={() => setLocalPage(pageNum)}
                    disabled={loading}
                    className={`w-8 h-8 text-xs rounded-lg transition-colors ${
                      pageNum === localPage
                        ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                        : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              }
              if (Math.abs(pageNum - localPage) === 2) {
                return <span key={pageNum} className="text-xs text-gray-400 px-1">...</span>;
              }
              return null;
            })}

            <button
              onClick={() => setLocalPage(Math.min(displayTotalPages, localPage + 1))}
              disabled={!displayHasNext || loading}
              className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}