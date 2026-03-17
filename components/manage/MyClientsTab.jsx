"use client";

import { RefreshCw, ChevronLeft, ChevronRight, Copy, Check } from "lucide-react";
import useFetchMyClients from "@/hooks/UseFetchMyClientUsers";
import useSyncUsers from "@/hooks/UseSyncUsers";
import ClientsFilter from "@/components/manage/MyClientsFilter";
import { useState } from "react";

const TABLE_HEADERS = [
  "Tenant ID",
  "Client Name",
  "User Name",
  "Total Ticket",
  "Open Ticket",
  "Status",
];

const LIMIT = 10;

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

export default function MyClientsTab() {

  const {
    data,
    loading,
    error,
    page,
    total,
    totalPages,
    hasNext,
    hasPrev,
    fetchData,
  } = useFetchMyClients(1, LIMIT);

  const { syncUsers, loading: syncing, error: syncError, result: syncResult } = useSyncUsers();

  const [searchQuery, setSearchQuery] = useState("");

  const handleSync = async () => {
    await syncUsers();
    fetchData(page);
  };

  const handleFilter = (newFilters) => {
    setSearchQuery(newFilters.search ?? "");
    fetchData(1, newFilters);
  };

  const tenantnames = [...new Set(data.map((r) => r.v_tenantname).filter(Boolean))];
  const statuses    = [...new Set(data.map((r) => r.v_status).filter(Boolean))];

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">

      <ClientsFilter
        onFilter={handleFilter}
        tenantnames={tenantnames}
        statuses={statuses}
      />

      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {total} total records
          </span>
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
        </div>
        <button
          onClick={handleSync}
          disabled={loading || syncing}
          className="p-1.5 rounded-lg text-violet-500 font-bold hover:text-violet-700 hover:bg-violet-100 dark:text-violet-400 dark:hover:text-violet-300 dark:hover:bg-violet-900/30 transition-colors cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-5 h-5 ${loading || syncing ? "animate-spin" : ""}`} />
        </button>
      </div>

      {error && (
        <div className="px-4 py-3 text-sm border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-start gap-2 text-red-500 dark:text-red-400">
            <span className="font-medium">Error:</span>
            <span>{error}</span>
          </div>
        </div>
      )}

      <div className="block md:hidden divide-y divide-gray-100 dark:divide-gray-800">
        {loading ? (
          <div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
            Loading...
          </div>
        ) : data.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
            No records found.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 p-4">
            {data.map((row, i) => (
              <div key={i} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400 font-semibold text-sm">
                      {row.v_tenantname?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{row.v_tenantname}</p>
                      <div className="flex items-center gap-1">
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[120px]">{row.v_tenantid}</p>
                        <CopyButton value={row.v_tenantid} />
                      </div>
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
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg px-3 py-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400">User Name</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{row.v_username}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg px-3 py-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Total Tickets</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{row.v_totalticket ?? 0}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg px-3 py-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Open Tickets</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{row.v_openticket ?? 0}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-800">
              {TABLE_HEADERS.map((header) => (
                <th
                  key={header}
                  className="px-4 py-3 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {loading ? (
              [...Array(LIMIT)].map((_, i) => (
                <tr key={i}>
                  {TABLE_HEADERS.map((h) => (
                    <td key={h} className="px-4 py-3">
                      <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse w-24" />
                    </td>
                  ))}
                </tr>
              ))
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
                      <span className="text-gray-600 dark:text-gray-300 truncate max-w-[120px] block">
                        {row.v_tenantid}
                      </span>
                      <CopyButton value={row.v_tenantid} />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-900 dark:text-white whitespace-nowrap">{row.v_tenantname}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">{row.v_username}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">{row.v_totalticket ?? 0}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">{row.v_openticket ?? 0}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      row.v_status === "true"
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    }`}>
                      {row.v_status === "true" ? "Active" : "Inactive"}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-800">
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Page {page} of {totalPages}
        </span>
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