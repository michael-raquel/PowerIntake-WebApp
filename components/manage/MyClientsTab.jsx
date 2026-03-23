"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { RefreshCw, ChevronLeft, ChevronRight, Copy, Check, Search, X } from "lucide-react";
import useFetchMyClients from "@/hooks/UseFetchMyClientUsers";
import useSyncUsers from "@/hooks/UseSyncUsers";
import { Input } from "@/components/ui/input";

const TABLE_HEADERS = ["Tenant ID", "Client Name", "Total Tickets", "Open Tickets"];
const MOBILE_CARD_HEIGHT = 150;
const MIN_RECORDS = 1;
const DEFAULT_ROWS = 10;

function CopyButton({ value }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="ml-1.5 p-0.5 rounded text-gray-400 hover:text-violet-500 dark:hover:text-violet-400 transition-colors"
      title="Copy Tenant ID"
    >
      {copied
        ? <Check className="w-3.5 h-3.5 text-green-500" />
        : <Copy className="w-3.5 h-3.5" />
      }
    </button>
  );
}

export default function MyClientsTab({ recordsPerPage: parentRecordsPerPage, tableContainerRef }) {
  const [isMobile, setIsMobile] = useState(false);
  const mobileContainerRef = useRef(null);
  const [mobileLimit, setMobileLimit] = useState(DEFAULT_ROWS);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const updateMobileLimit = useCallback(() => {
    if (!mobileContainerRef.current) return;
    const height = mobileContainerRef.current.clientHeight;
    if (!height) return;
    const calculated = Math.max(MIN_RECORDS, Math.floor(height / MOBILE_CARD_HEIGHT));
    setMobileLimit((prev) => (prev !== calculated ? calculated : prev));
  }, []);

  useEffect(() => {
    if (!isMobile) return;
    const raf = requestAnimationFrame(updateMobileLimit);
    window.addEventListener("resize", updateMobileLimit);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", updateMobileLimit);
    };
  }, [isMobile, updateMobileLimit]);

  const effectiveLimit = isMobile ? mobileLimit : (parentRecordsPerPage || DEFAULT_ROWS);

  const {
    data, loading, error,
    page, total, totalPages,
    hasNext, hasPrev, fetchData,
    totals,
  } = useFetchMyClients(1, effectiveLimit);

  const { syncUsers, loading: syncing, error: syncError, result: syncResult } = useSyncUsers();

  const [search, setSearch] = useState("");

  const handleSync = async () => {
    await syncUsers();
    fetchData(page);
  };

  const handleSearch = (e) => {
    const val = e.target.value;
    setSearch(val);
    fetchData(1, { tenantname: val });
  };

  const clearSearch = () => {
    setSearch("");
    fetchData(1, { tenantname: "" });
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 flex flex-col min-h-0 flex-1">

      <div className="flex items-center gap-1 sm:gap-2 px-4 py-3 border-b border-gray-200 dark:border-gray-800">
        <div className="relative flex-1 min-w-[100px] sm:min-w-[150px]">
          <Search className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <Input
            value={search}
            onChange={handleSearch}
            placeholder="Search client name..."
            className="pl-7 sm:pl-9 pr-8 w-full dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100 dark:placeholder:text-gray-500 text-xs sm:text-sm h-8 sm:h-10"
          />
          {search && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center px-4 py-3 border-b border-gray-200 dark:border-gray-800">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {(total ?? 0)} total records
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
              {syncResult.message} New users: {syncResult.synced ?? 0}
            </span>
          )}
          <button
            onClick={handleSync}
            disabled={loading || syncing}
            className="p-1.5 rounded-lg text-violet-500 font-bold hover:text-violet-700 hover:bg-violet-100 dark:text-violet-400 dark:hover:text-violet-300 dark:hover:bg-violet-900/30 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${loading || syncing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto block md:hidden divide-y divide-gray-100 dark:divide-gray-800" ref={mobileContainerRef}>
        {loading ? (
          <div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">Loading...</div>
        ) : data.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">No records found.</div>
        ) : (
          <div className="grid grid-cols-1 gap-3 p-4">
            {data.map((row, i) => (
              <div key={i} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm p-4 space-y-3">
                <div className="flex items-center gap-3 ">
                  <div className="w-9 h-9 rounded-md bg-violet-600 dark:bg-violet-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {row.v_tenantname?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-violet-700 dark:text-violet-300 tracking-wide">
                      {row.v_tenantname}
                    </p>
                    <div className="flex items-center gap-1">
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[120px]">{row.v_tenantid}</p>
                      <CopyButton value={row.v_tenantid} />
                    </div>
                  </div>
                </div>
                <div className="border-t border-gray-100 dark:border-gray-700" />
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg px-3 py-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Total Tickets</p>
                    <p className="text-sm font-semibold text-center text-gray-900 dark:text-white">{row.v_totalticket ?? 0}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg px-3 py-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Open Tickets</p>
                    <p className="text-sm font-semibold text-center text-gray-900 dark:text-white">{row.v_openticket ?? 0}</p>
                  </div>
                </div>
              </div>
            ))}
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">Totals</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">All records</span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg px-3 py-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Total Tickets</p>
                  <p className="text-sm font-semibold text-center text-gray-900 dark:text-white">
                    {totals?.totalTickets ?? 0}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg px-3 py-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Open Tickets</p>
                  <p className="text-sm font-semibold text-center text-gray-900 dark:text-white">
                    {totals?.openTickets ?? 0}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="hidden md:flex flex-col flex-1 min-h-0" ref={tableContainerRef}>
        <div className="flex-1 min-h-0 overflow-x-auto overflow-y-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-800">
              {TABLE_HEADERS.map((header) => (
                <th key={header} className="px-4 py-3 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {loading ? (
              <tr>
                <td colSpan={TABLE_HEADERS.length} className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                  Loading...
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={TABLE_HEADERS.length} className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                  No records found.
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr key={i} className="hover:bg-gray-50 text-center dark:hover:bg-gray-800 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-gray-600 dark:text-gray-300 truncate max-w-[120px] block">{row.v_tenantid}</span>
                      <CopyButton value={row.v_tenantid} />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-900 dark:text-white whitespace-nowrap">{row.v_tenantname}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">{row.v_totalticket ?? 0}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">{row.v_openticket ?? 0}</td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot className="border-t border-gray-200 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-800/60">
            <tr className="text-center">
              <td colSpan={2} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                Total
              </td>
              <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white">
                {totals?.totalTickets ?? 0}
              </td>
              <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white">
                {totals?.openTickets ?? 0}
              </td>
            </tr>
          </tfoot>
        </table>
        </div>
      </div>

      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-800">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {(total ?? 0)} total records
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => fetchData(page - 1)}
            disabled={!hasPrev || loading}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          {[...Array(totalPages)].map((_, i) => {
            const pageNum = i + 1;
            if (pageNum === 1 || pageNum === totalPages || Math.abs(pageNum - page) <= 1) {
              return (
                <button
                  key={pageNum}
                  onClick={() => fetchData(pageNum)}
                  disabled={loading}
                  className={`w-8 h-8 text-xs rounded-lg transition-colors ${
                    pageNum === page
                      ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                      : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                  }`}
                >
                  {pageNum}
                </button>
              );
            }
            if (Math.abs(pageNum - page) === 2) {
              return <span key={pageNum} className="text-xs text-gray-400 px-1">...</span>;
            }
            return null;
          })}
          <button
            onClick={() => fetchData(page + 1)}
            disabled={!hasNext || loading}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

    </div>
  );
}