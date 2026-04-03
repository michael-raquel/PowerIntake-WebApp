"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpDown, ChevronDown, ChevronUp, Copy, Check } from "lucide-react";
import { useFetchTenant } from "@/hooks/UseFetchTenant";
import ComCard from "./ComCard";

const readField = (tenant, keys, fallback = "") => {
  for (const key of keys) {
    const value = tenant?.[key];
    if (value !== null && value !== undefined && String(value).trim() !== "") {
      return value;
    }
  }
  return fallback;
};

const normalizeBoolean = (value) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const lowered = value.trim().toLowerCase();
    if (["true", "1", "yes", "y", "active", "consented"].includes(lowered))
      return true;
    if (
      ["false", "0", "no", "n", "inactive", "not consented"].includes(lowered)
    )
      return false;
  }
  return null;
};

const toStatusLabel = (value) => {
  const bool = normalizeBoolean(value);
  return bool === null ? "unknown" : String(bool);
};

const toConsentLabel = (value) => {
  const bool = normalizeBoolean(value);
  return bool === null ? "unknown" : String(bool);
};

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
};

const matchesMultiFilter = (selected, value) => {
  if (!Array.isArray(selected) || selected.length === 0) return true;
  return selected.includes(value);
};

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

  return String(aValue).localeCompare(String(bValue), undefined, {
    numeric: true,
    sensitivity: "base",
  });
};

const getBooleanPillClass = (value) => {
  switch (String(value).toLowerCase()) {
    case "true":
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
    case "false":
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400";
  }
};

function CopyButton({ value }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (event) => {
    event?.stopPropagation();
    if (!value) return;
    try {
      await navigator.clipboard.writeText(String(value));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Ignore clipboard failures.
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="ml-1.5 p-0.5 rounded text-gray-400 hover:text-violet-500 dark:hover:text-violet-400 transition-colors"
      title="Copy value"
    >
      {copied ? (
        <Check className="w-3.5 h-3.5 text-green-500" />
      ) : (
        <Copy className="w-3.5 h-3.5" />
      )}
    </button>
  );
}

const COLUMNS = [
  {
    key: "entratenantid",
    label: "Entra Tenant ID",
    align: "left",
    minWidth: 250,
    defaultWidth: 300,
    sortValue: (row) => row.entratenantid,
  },
  {
    key: "tenantname",
    label: "Tenant Name",
    align: "left",
    minWidth: 200,
    defaultWidth: 240,
    sortValue: (row) => row.tenantName,
  },
  {
    key: "tenantemail",
    label: "Tenant Email",
    align: "left",
    minWidth: 200,
    defaultWidth: 240,
    sortValue: (row) => row.tenantEmail,
  },
  {
    key: "dynamicsaccountid",
    label: "Dynamics Account ID",
    align: "left",
    minWidth: 250,
    defaultWidth: 300,
    sortValue: (row) => row.dynamicsaccountid,
  },
  {
    key: "admingroupid",
    label: "Admin Group ID",
    align: "left",
    minWidth: 250,
    defaultWidth: 300,
    sortValue: (row) => row.admingroupid,
  },
  {
    key: "usergroupid",
    label: "User Group ID",
    align: "left",
    minWidth: 250,
    defaultWidth: 300,
    sortValue: (row) => row.usergroupid,
  },
  {
    key: "isconsented",
    label: "Is Consented",
    align: "center",
    minWidth: 120,
    defaultWidth: 140,
    sortValue: (row) => row.consentLabel,
  },
  {
    key: "isactive",
    label: "Is Active",
    align: "center",
    minWidth: 120,
    defaultWidth: 130,
    sortValue: (row) => row.statusLabel,
  },
  {
    key: "createdat",
    label: "Created At",
    align: "left",
    minWidth: 180,
    defaultWidth: 210,
    sortValue: (row) => row.createdAt,
  },
];

const COPYABLE_COLUMNS = new Set([
  "entratenantid",
  "dynamicsaccountid",
  "admingroupid",
  "usergroupid",
]);

export default function ComTable({
  currentPage,
  recordsPerPage,
  onTotalRecordsChange,
  onFilterOptionsChange,
  searchValue = "",
  filters = {},
  refreshKey,
  onTenantSelect,
  renderAs,
  CardComponent = ComCard,
}) {
  const { tenants, loading, error } = useFetchTenant({ refreshKey });
  const previousFilteredLengthRef = useRef();
  const [sortConfig, setSortConfig] = useState({
    key: "createdat",
    direction: "desc",
  });
  const [columnWidths, setColumnWidths] = useState({});
  const resizeStateRef = useRef(null);

  const normalizedTenants = useMemo(
    () =>
      (tenants || []).map((tenant) => ({
        source: tenant,
        entratenantid: readField(
          tenant,
          ["entratenantid", "v_entratenantid"],
          "-",
        ),
        tenantName: readField(tenant, ["v_tenantname", "tenantname"], "-"),
        tenantId: readField(
          tenant,
          ["v_tenantid", "tenantid", "v_tenantuuid", "tenantuuid"],
          "-",
        ),
        entraTenantId: readField(
          tenant,
          ["v_entratenantid", "entratenantid"],
          "-",
        ),
        tenantEmail: readField(tenant, ["v_tenantemail", "tenantemail"], "-"),
        createdby: readField(tenant, ["createdby", "v_createdby"], "-"),
        dynamicsaccountid: readField(
          tenant,
          ["dynamicsaccountid", "v_dynamicsaccountid"],
          "-",
        ),
        admingroupid: readField(
          tenant,
          ["admingroupid", "v_admingroupid"],
          "-",
        ),
        usergroupid: readField(tenant, ["usergroupid", "v_usergroupid"], "-"),
        statusLabel: toStatusLabel(
          readField(tenant, ["v_isactive", "isactive"], null),
        ),
        consentLabel: toConsentLabel(
          readField(tenant, ["v_isconsented", "isconsented"], null),
        ),
        createdAt: readField(tenant, ["v_createdat", "createdat"], null),
      })),
    [tenants],
  );

  useEffect(() => {
    setColumnWidths((previous) => {
      const next = { ...previous };
      COLUMNS.forEach((column) => {
        if (next[column.key] == null && column.defaultWidth) {
          next[column.key] = column.defaultWidth;
        }
      });
      return next;
    });
  }, []);

  useEffect(() => {
    const statusOptions = [
      ...new Set(normalizedTenants.map((row) => row.statusLabel)),
    ].sort();
    const consentOptions = [
      ...new Set(normalizedTenants.map((row) => row.consentLabel)),
    ].sort();

    onFilterOptionsChange?.({
      Status: statusOptions,
      Consent: consentOptions,
    });
  }, [normalizedTenants, onFilterOptionsChange]);

  const filteredTenants = useMemo(() => {
    const search = String(searchValue || "")
      .trim()
      .toLowerCase();

    return normalizedTenants.filter((row) => {
      if (search) {
        const searchable = [
          row.tenantName,
          row.entraTenantId,
          row.tenantEmail,
          row.dynamicsaccountid,
          row.admingroupid,
          row.usergroupid,
        ]
          .map((value) => String(value || "").toLowerCase())
          .join(" ");
        if (!searchable.includes(search)) return false;
      }

      if (!matchesMultiFilter(filters.Status, row.statusLabel)) return false;
      if (!matchesMultiFilter(filters.Consent, row.consentLabel)) return false;

      return true;
    });
  }, [normalizedTenants, searchValue, filters]);

  useEffect(() => {
    if (previousFilteredLengthRef.current !== filteredTenants.length) {
      previousFilteredLengthRef.current = filteredTenants.length;
      onTotalRecordsChange?.(filteredTenants.length);
    }
  }, [filteredTenants.length, onTotalRecordsChange]);

  const paginated = useMemo(() => {
    const selectedColumn = COLUMNS.find(
      (column) => column.key === sortConfig.key,
    );
    const sorted = selectedColumn
      ? [...filteredTenants].sort((a, b) =>
          compareSortValues(
            selectedColumn.sortValue(a),
            selectedColumn.sortValue(b),
          ),
        )
      : [...filteredTenants];

    if (sortConfig.direction === "desc") {
      sorted.reverse();
    }

    const start = (currentPage - 1) * recordsPerPage;
    return sorted.slice(start, start + recordsPerPage);
  }, [filteredTenants, currentPage, recordsPerPage, sortConfig]);

  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { key, direction: "asc" };
    });
  };

  const handleResize = useCallback((event) => {
    if (!resizeStateRef.current) return;
    const { key, startX, startWidth, minWidth } = resizeStateRef.current;
    const delta = event.clientX - startX;
    const nextWidth = Math.max(minWidth, startWidth + delta);
    setColumnWidths((previous) => ({
      ...previous,
      [key]: nextWidth,
    }));
  }, []);

  const stopResize = useCallback(
    function stopResizeHandler() {
      resizeStateRef.current = null;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", handleResize);
      window.removeEventListener("mouseup", stopResizeHandler);
    },
    [handleResize],
  );

  const handleResizeStart = useCallback(
    (event, key, minWidth) => {
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
    },
    [handleResize, stopResize],
  );

  useEffect(
    () => () => {
      window.removeEventListener("mousemove", handleResize);
      window.removeEventListener("mouseup", stopResize);
    },
    [handleResize, stopResize],
  );

  const renderCellValue = (row, key) => {
    if (key === "entratenantid") return row.entratenantid;
    if (key === "tenantname") return row.tenantName;
    if (key === "tenantemail") return row.tenantEmail;
    if (key === "dynamicsaccountid") return row.dynamicsaccountid;
    if (key === "admingroupid") return row.admingroupid;
    if (key === "usergroupid") return row.usergroupid;
    if (key === "isconsented") return row.consentLabel;
    if (key === "isactive") return row.statusLabel;
    if (key === "createdat") return formatDateTime(row.createdAt);
    return "-";
  };

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-500 dark:text-gray-400">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-500 dark:text-red-400">
        {error}
      </div>
    );
  }

  if (renderAs === "cards") {
    return (
      <div className="md:hidden">
        <div className="flex justify-between items-center px-0 py-3 border-b border-gray-200 dark:border-gray-800">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {filteredTenants.length} Total Records
          </span>
        </div>
        <div className="space-y-3 p-3">
          {paginated.map((row) => (
            <CardComponent
              key={readField(
                row.source,
                ["v_tenantuuid", "tenantuuid", "v_tenantid", "tenantid"],
                row.tenantId,
              )}
              tenant={row.source}
              onClick={() => onTenantSelect?.(row.source)}
            />
          ))}
          {!paginated.length && (
            <p className="text-sm text-center text-gray-500 dark:text-gray-400 py-6">
              No tenants found.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="hidden md:flex flex-col flex-1 min-h-0">
      <div className="flex-1 min-h-0 overflow-x-auto overflow-y-auto">
        <table className="w-full text-sm table-fixed border-collapse">
          <colgroup>
            {COLUMNS.map((column) => (
              <col
                key={column.key}
                style={
                  columnWidths[column.key]
                    ? { width: `${columnWidths[column.key]}px` }
                    : undefined
                }
              />
            ))}
          </colgroup>
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-800">
              {COLUMNS.map((column) => {
                const isSorted = sortConfig.key === column.key;
                const sortIcon = !isSorted ? (
                  <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
                ) : sortConfig.direction === "asc" ? (
                  <ChevronUp className="w-3.5 h-3.5 text-gray-600 dark:text-gray-300" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-gray-600 dark:text-gray-300" />
                );
                const alignClass =
                  column.align === "left" ? "text-left" : "text-center";
                const paddingClass =
                  column.align === "left" ? "pl-4 pr-4" : "px-4";

                return (
                  <th
                    key={column.key}
                    aria-sort={
                      isSorted
                        ? sortConfig.direction === "asc"
                          ? "ascending"
                          : "descending"
                        : "none"
                    }
                    className={`sticky top-0 z-10 bg-white dark:bg-gray-900 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap ${alignClass} ${paddingClass} border-r border-gray-200 dark:border-gray-800 last:border-r-0 overflow-hidden`}
                  >
                    <button
                      type="button"
                      onClick={() => handleSort(column.key)}
                      className={`flex items-center gap-1 w-full min-w-0 ${
                        column.align === "left"
                          ? "justify-start"
                          : "justify-center"
                      } hover:text-gray-700 dark:hover:text-gray-200`}
                      title={`Sort by ${column.label}`}
                    >
                      <span className="truncate">{column.label}</span>
                      {sortIcon}
                    </button>
                    <div
                      role="separator"
                      aria-orientation="vertical"
                      onMouseDown={(event) =>
                        handleResizeStart(event, column.key, column.minWidth)
                      }
                      onClick={(event) => event.stopPropagation()}
                      className="absolute right-0 top-0 h-full w-2 cursor-col-resize hover:bg-violet-200/60 dark:hover:bg-violet-900/40"
                    />
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {paginated.length === 0 ? (
              <tr>
                <td
                  colSpan={COLUMNS.length}
                  className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400"
                >
                  No tenants found.
                </td>
              </tr>
            ) : (
              paginated.map((row) => {
                const rowKey = readField(
                  row.source,
                  ["v_tenantuuid", "tenantuuid", "v_tenantid", "tenantid"],
                  row.tenantId,
                );

                return (
                  <tr
                    key={String(rowKey)}
                    onClick={() => onTenantSelect?.(row.source)}
                    className="hover:bg-gray-50 text-center dark:hover:bg-gray-800 transition-colors cursor-pointer"
                  >
                    {COLUMNS.map((column) => {
                      const value = renderCellValue(row, column.key);
                      const alignmentClass =
                        column.align === "left" ? "text-left" : "text-center";
                      const textClass =
                        column.key === "tenantname" ||
                        column.key === "tenantemail"
                          ? "text-gray-900 dark:text-white"
                          : "text-gray-600 dark:text-gray-300";
                      const canCopy =
                        COPYABLE_COLUMNS.has(column.key) &&
                        value !== null &&
                        value !== undefined &&
                        String(value).trim() !== "" &&
                        String(value) !== "-";

                      return (
                        <td
                          key={column.key}
                          className={`px-4 py-3 whitespace-nowrap border-r border-gray-200 dark:border-gray-800 last:border-r-0 overflow-hidden truncate ${alignmentClass} ${textClass}`}
                        >
                          {column.key === "isconsented" ||
                          column.key === "isactive" ? (
                            <span
                              className={`inline-flex items-center px-1.5 py-0.5 text-xs rounded-full ${getBooleanPillClass(
                                value,
                              )}`}
                            >
                              {value || "-"}
                            </span>
                          ) : canCopy ? (
                            <div
                              className={`flex items-center gap-1 min-w-0 ${
                                column.align === "left"
                                  ? "justify-start"
                                  : "justify-center"
                              }`}
                            >
                              <span className="truncate block max-w-full font-mono">
                                {value || "-"}
                              </span>
                              <CopyButton value={value} />
                            </div>
                          ) : (
                            <span className="truncate block max-w-full">
                              {value || "-"}
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
