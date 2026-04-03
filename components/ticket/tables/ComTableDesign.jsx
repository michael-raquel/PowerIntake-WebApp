"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { ArrowUpDown, ChevronUp, ChevronDown, RefreshCw } from "lucide-react";

export default function ComTableDesign({
  columns = [],
  data = [],
  loading = false,
  emptyText = "No records found.",
  totalRecords,
  footerRow = null,
  onRowClick,
  isSyncing,
  syncNode,
  actions,
  className = "",
}) {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [colWidths, setColWidths] = useState({});
  const resizeRef = useRef(null);

  useEffect(() => {
    setColWidths((prev) => {
      const next = { ...prev };
      columns.forEach((col) => {
        if (next[col.key] == null && col.defaultWidth) next[col.key] = col.defaultWidth;
      });
      return next;
    });
  }, [columns]);

  const handleMouseMove = useCallback((e) => {
    if (!resizeRef.current) return;
    const { key, startX, startWidth, minWidth } = resizeRef.current;
    setColWidths((prev) => ({
      ...prev,
      [key]: Math.max(minWidth ?? 60, startWidth + (e.clientX - startX)),
    }));
  }, []);

  const stopResize = useCallback(function stopResizeHandler() {
    resizeRef.current = null;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("mouseup", stopResizeHandler);
  }, [handleMouseMove]);

  const startResize = useCallback(
    (e, col) => {
      e.preventDefault();
      e.stopPropagation();
      const th = e.currentTarget.closest("th");
      if (!th) return;
      resizeRef.current = {
        key: col.key,
        startX: e.clientX,
        startWidth: th.getBoundingClientRect().width,
        minWidth: col.minWidth ?? 60,
      };
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", stopResize);
    },
    [handleMouseMove, stopResize]
  );

  useEffect(
    () => () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", stopResize);
    },
    [handleMouseMove, stopResize]
  );

  const handleSort = useCallback((col) => {
    if (!col.sortValue) return;
    setSortConfig((prev) =>
      prev.key === col.key
        ? { key: col.key, direction: prev.direction === "asc" ? "desc" : "asc" }
        : { key: col.key, direction: "asc" }
    );
  }, []);

  const sortedData = (() => {
    if (!sortConfig.key) return data;
    const col = columns.find((c) => c.key === sortConfig.key);
    if (!col?.sortValue) return data;
    const compare = (a, b) => {
      const av = col.sortValue(a);
      const bv = col.sortValue(b);
      const ae = av == null || av === "";
      const be = bv == null || bv === "";
      if (ae && be) return 0;
      if (ae) return 1;
      if (be) return -1;
      const an = Number(av), bn = Number(bv);
      if (!isNaN(an) && !isNaN(bn)) return an - bn;
      return String(av).localeCompare(String(bv), undefined, {
        numeric: true,
        sensitivity: "base",
      });
    };
    const sorted = [...data].sort(compare);
    return sortConfig.direction === "asc" ? sorted : sorted.reverse();
  })();

  const SortIcon = ({ colKey }) => {
    if (sortConfig.key !== colKey)
      return <ArrowUpDown className="w-3.5 h-3.5 text-gray-400 shrink-0" />;
    return sortConfig.direction === "asc" ? (
      <ChevronUp className="w-3.5 h-3.5 text-gray-600 dark:text-gray-300 shrink-0" />
    ) : (
      <ChevronDown className="w-3.5 h-3.5 text-gray-600 dark:text-gray-300 shrink-0" />
    );
  };

  const defaultSyncNode = (
    <span className="inline-flex items-center gap-1.5 text-violet-500 dark:text-violet-400 text-xs font-medium">
      <RefreshCw className="w-3 h-3 animate-spin" /> Finalizing...
    </span>
  );

  const displayed = totalRecords ?? sortedData.length;

  return (
    <div className={`hidden md:flex flex-col min-h-0 h-full ${className}`}>
      <div className="flex items-center justify-between px-0 py-3 border-b border-gray-200 dark:border-gray-800 shrink-0">
        <span className="text-xs text-gray-500 dark:text-gray-400">{displayed} Total Records</span>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-x-auto overflow-y-auto">
          <table className="w-full text-sm" style={{ tableLayout: "fixed", borderCollapse: "collapse" }}>
            <colgroup>
              {columns.map((col) => (
                <col
                  key={col.key}
                  style={colWidths[col.key] ? { width: `${colWidths[col.key]}px` } : undefined}
                />
              ))}
            </colgroup>

            <thead className="sticky top-0 bg-white dark:bg-gray-900 z-10">
              <tr className="border-b border-gray-200 dark:border-gray-800">
                {columns.map((col) => {
                  const isSorted = sortConfig.key === col.key;
                  const alignClass = col.align === "left" ? "text-left" : "text-center";
                  const paddingClass = col.align === "left" ? "pl-8 pr-6" : "px-4";
                  const ariaSort = isSorted
                    ? (sortConfig.direction === "asc" ? "ascending" : "descending")
                    : "none";

                  return (
                    <th
                      key={col.key}
                      aria-sort={ariaSort}
                      className={`relative py-3 font-bold text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap select-none ${alignClass} ${paddingClass} border-r border-gray-200 dark:border-gray-800 last:border-r-0 overflow-hidden bg-white dark:bg-gray-900`}
                      style={colWidths[col.key] ? { width: `${colWidths[col.key]}px` } : undefined}
                    >
                      {col.sortValue ? (
                        <button
                          type="button"
                          onClick={() => handleSort(col)}
                          className={`flex items-center gap-1 w-full min-w-0 ${
                            col.align === "left" ? "justify-start" : "justify-center"
                          } hover:text-gray-700 dark:hover:text-gray-200`}
                          title={`Sort by ${col.label}`}
                        >
                          <span className="truncate">{col.headerRender ? col.headerRender() : col.label}</span>
                          <SortIcon colKey={col.key} />
                        </button>
                      ) : (
                        <div className={`flex items-center gap-1 w-full min-w-0 ${
                          col.align === "left" ? "justify-start" : "justify-center"
                        }`}>
                          <span className="truncate">{col.headerRender ? col.headerRender() : col.label}</span>
                        </div>
                      )}

                      {/* Resize handle */}
                      <div
                        role="separator"
                        aria-orientation="vertical"
                        className="absolute right-0 top-0 h-full w-2 cursor-col-resize hover:bg-violet-200/60 dark:hover:bg-violet-900/40"
                        onMouseDown={(e) => startResize(e, col)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400"
                  >
                    Loading...
                  </td>
                </tr>
              ) : sortedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400"
                  >
                    {emptyText}
                  </td>
                </tr>
              ) : (
                sortedData.map((row, i) => {
                  const syncing = isSyncing?.(row) ?? false;
                  return (
                    <tr
                      key={row.v_ticketuuid ?? row.v_entrauserid ?? i}
                      onClick={() => !syncing && onRowClick?.(row)}
                      className={`transition-colors ${
                        syncing
                          ? "bg-violet-50 dark:bg-violet-950/20 cursor-wait"
                          : onRowClick
                          ? "hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                          : ""
                      }`}
                    >
                      {columns.map((col, ci) => (
                        <td
                          key={col.key}
                          className={`px-4 py-3 overflow-hidden text-ellipsis whitespace-nowrap text-gray-600 dark:text-gray-300 border-r border-gray-200 dark:border-gray-800 last:border-r-0 ${
                            col.align === "left" ? "text-left" : "text-center"
                          } ${col.cellClass ?? ""}`}
                          style={
                            colWidths[col.key] ? { maxWidth: `${colWidths[col.key]}px` } : undefined
                          }
                          onClick={col.stopPropagation ? (e) => e.stopPropagation() : undefined}
                        >
                          {ci === 0 && syncing
                            ? (syncNode ?? defaultSyncNode)
                            : col.render
                            ? col.render(row)
                            : null}
                        </td>
                      ))}
                    </tr>
                  );
                })
              )}

              {footerRow && !loading && sortedData.length > 0 && (
                <tr className="bg-gray-50/70 dark:bg-gray-800/60 font-semibold border-t border-gray-200 dark:border-gray-800">
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className="px-4 py-3 text-sm text-center text-gray-700 dark:text-gray-200 border-r border-gray-200 dark:border-gray-800 last:border-r-0"
                    >
                      {footerRow[col.key] ?? ""}
                    </td>
                  ))}
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}