"use client";

import { useState } from "react";
import { ArrowUpDown, ChevronUp, ChevronDown, Copy, Check } from "lucide-react";
import { formatPercent } from "@/lib/utils";

export function CopyButton({ value }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async (event) => {
    event?.stopPropagation();
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // ignore clipboard failures
    }
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

export default function MyClientsTable({
  columns,
  columnWidths,
  handleResizeStart,
  sortConfig,
  handleSort,
  pagedData,
  loading,
  totals,
  handleRowClick,
}) {
  return (
    <div className="hidden md:flex flex-col flex-1 min-h-0">
      <div className="flex-1 min-h-0 overflow-x-auto overflow-y-auto">
        <table className="w-full text-sm table-fixed border-collapse">
          <colgroup>
            {columns.map((column) => (
              <col
                key={column.key}
                style={columnWidths[column.key] ? { width: `${columnWidths[column.key]}px` } : undefined}
              />
            ))}
          </colgroup>
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-800">
              {columns.map((column) => {
                const isSorted = sortConfig.key === column.key;
                const sortIcon = !isSorted
                  ? <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
                  : sortConfig.direction === "asc"
                    ? <ChevronUp className="w-3.5 h-3.5 text-gray-600 dark:text-gray-300" />
                    : <ChevronDown className="w-3.5 h-3.5 text-gray-600 dark:text-gray-300" />;
                const alignClass = column.align === "left" ? "text-left" : "text-center";
                const paddingClass = column.headerClassName ?? (column.align === "left" ? "pl-8 pr-6" : "px-4");
                const ariaSort = isSorted
                  ? (sortConfig.direction === "asc" ? "ascending" : "descending")
                  : "none";

                return (
                  <th
                    key={column.key}
                    aria-sort={ariaSort}
                    className={`relative py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap ${alignClass} ${paddingClass} border-r border-gray-200 dark:border-gray-800 last:border-r-0 overflow-hidden`}
                  >
                    <button
                      type="button"
                      onClick={() => handleSort(column.key)}
                      className={`flex items-center gap-1 w-full min-w-0 ${column.align === "left" ? "justify-start" : "justify-center"} hover:text-gray-700 dark:hover:text-gray-200`}
                      title={`Sort by ${column.label}`}
                    >
                      <span className="truncate">{column.label}</span>
                      {sortIcon}
                    </button>
                    <div
                      role="separator"
                      aria-orientation="vertical"
                      onMouseDown={(event) => handleResizeStart(event, column.key, column.minWidth)}
                      onClick={(event) => event.stopPropagation()}
                      className="absolute right-0 top-0 h-full w-2 cursor-col-resize hover:bg-violet-200/60 dark:hover:bg-violet-900/40"
                    />
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">Loading...</td>
              </tr>
            ) : pagedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">No records found.</td>
              </tr>
            ) : (
              pagedData.map((row, i) => (
                <tr
                  key={i}
                  onClick={() => handleRowClick(row)}
                  className="hover:bg-gray-50 text-center dark:hover:bg-gray-800 transition-colors cursor-pointer"
                >
                  <td className="px-4 py-3 whitespace-nowrap max-w-[220px] border-r border-gray-200 dark:border-gray-800 last:border-r-0 overflow-hidden">
                    <div className="flex items-center justify-center gap-1 min-w-0">
                      <span className="text-gray-600 dark:text-gray-300 truncate block max-w-full font-mono">{row.v_tenantid}</span>
                      <CopyButton value={row.v_tenantid} />
                    </div>
                  </td>
                  <td className="py-3 text-gray-900 dark:text-white whitespace-nowrap text-left pl-8 border-r border-gray-200 dark:border-gray-800 last:border-r-0 overflow-hidden truncate">{row.v_tenantname}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap border-r border-gray-200 dark:border-gray-800 last:border-r-0 overflow-hidden">{row.v_totalticket ?? 0}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap border-r border-gray-200 dark:border-gray-800 last:border-r-0 overflow-hidden">{row.v_newticket ?? 0}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap border-r border-gray-200 dark:border-gray-800 last:border-r-0 overflow-hidden">{row.v_openticket ?? 0}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap border-r border-gray-200 dark:border-gray-800 last:border-r-0 overflow-hidden">{row.v_completed ?? 0}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap border-r border-gray-200 dark:border-gray-800 last:border-r-0 overflow-hidden">{formatPercent(row.v_completion)}</td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot className="border-t border-gray-200 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-800/60">
            <tr className="text-center">
              <td colSpan={2} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-800">
              </td>
              <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-800">{totals?.totalTickets ?? 0}</td>
              <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-800">{totals?.newTickets ?? 0}</td>
              <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-800">{totals?.openTickets ?? 0}</td>
              <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-800">{totals?.completedTickets ?? 0}</td>
              <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white">{formatPercent(totals?.completionRate)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
