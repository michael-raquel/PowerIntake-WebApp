"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/router";
import { RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { useMsal } from "@azure/msal-react";
import useFetchSuperAdminUsers from "@/hooks/UseFetchSystemAdminUsers";
import useSyncUsers from "@/hooks/UseSyncUsers";
import useCreatePromoteSuperAdmin from "@/hooks/UseCreatePromoteSuperAdmin";
import useDeleteDemoteAdmin from "@/hooks/UseDeleteDemoteAdmin";
import useUpdateUserRole from "@/hooks/UseUpdateUserRole";
import { useFetchUserSettings } from "@/hooks/UseFetchUserSettings";
import { useUpdateRecordCount } from "@/hooks/UseUpdateRecordCount";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import SuperAdminFilter from "@/components/manage/SuperAdminFilter";
import SuperAdminTable from "./table/SuperAdminTable";
import { formatPercent } from "@/lib/utils";

const DEFAULT_ROWS = 10;
const SPARTA_TENANT_NAME = "Sparta Services LLC";
const SPARTA_TENANT_NAME_NORMALIZED = SPARTA_TENANT_NAME.toLowerCase();

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

export default function SuperAdminTab() {
  const { accounts } = useMsal();
  const router = useRouter();
  const [selectedRowsPerPage, setSelectedRowsPerPage] = useState(null);
  const effectiveLimit = selectedRowsPerPage ?? DEFAULT_ROWS;
  const [localPage, setLocalPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [columnWidths, setColumnWidths] = useState({});
  const resizeStateRef = useRef(null);

  const {
    data,
    loading,
    fetchData,
    filterOptions,
  } = useFetchSuperAdminUsers(1, effectiveLimit, { fetchAll: true });

  const { syncUsers, loading: syncing, error: syncError, result: syncResult } = useSyncUsers();
  const {
    promoteSuperAdmin,
    loading: promoting,
    fetchingGroupId,
    groupId,
  } = useCreatePromoteSuperAdmin();
  const {
    demoteAdmin,
    loading: demoting,
    appRoleLoading: demoteGroupLoading,
    groupId: demoteGroupId,
  } = useDeleteDemoteAdmin({
    roleValue: "SuperAdmin",
    roleDisplayName: "SuperAdmin",
  });
  const { updateUserRole } = useUpdateUserRole();

  const { userSettings } = useFetchUserSettings({ entrauserid: accounts?.[0]?.localAccountId });
  const { updateRecordCount, loading: updating } = useUpdateRecordCount();

  const [activeFilters, setActiveFilters] = useState({});
  const [roleOverrides, setRoleOverrides] = useState({});

  useEffect(() => {
    if (userSettings && userSettings.length > 0) {
      const setting = userSettings[0];
      const recordCount = Number(setting?.v_managerecordcount);
      if (recordCount > 0) {
        setSelectedRowsPerPage(recordCount);
      }
    }
  }, [userSettings]);

  useEffect(() => {
    if (selectedRowsPerPage !== null) {
      fetchData(1, {});
      setLocalPage(1);
    }
  }, [selectedRowsPerPage, fetchData]);

  const buildRoleString = useCallback((currentRole, roleName, checked) => {
    const rawRoles = String(currentRole || "")
      .split(",")
      .map((role) => role.trim())
      .filter(Boolean);

    const roleSet = new Set(rawRoles.map((role) => role.toLowerCase()));
    const roleKey = roleName.toLowerCase();

    if (checked) {
      roleSet.add(roleKey);
    } else {
      roleSet.delete(roleKey);
    }

    const priority = ["superadmin", "admin", "user"];
    const normalized = new Map([
      ["superadmin", "SuperAdmin"],
      ["admin", "Admin"],
      ["user", "User"],
    ]);

    const ordered = [];
    priority.forEach((key) => {
      if (roleSet.has(key)) ordered.push(normalized.get(key));
    });

    rawRoles.forEach((role) => {
      const key = role.toLowerCase();
      if (!priority.includes(key) && roleSet.has(key)) {
        ordered.push(role);
      }
    });

    return ordered.join(", ");
  }, []);

  const handleSuperAdminToggle = async (row, checked) => {
    const userKey = row?.v_entrauserid;
    const updatedRole = buildRoleString(row?.v_role, "SuperAdmin", checked);
    if (userKey) {
      setRoleOverrides((prev) => ({
        ...prev,
        [userKey]: updatedRole,
      }));
    }

    const payload = {
      userOid: row?.v_entrauserid,
      roleValue: "SuperAdmin",
      checked,
    };

    try {
      if (checked) {
        if (fetchingGroupId || !groupId) return;
        await promoteSuperAdmin(payload.userOid);
      } else {
        if (demoteGroupLoading || !demoteGroupId) return;
        await demoteAdmin(payload.userOid);
      }

      await updateUserRole({
        entrauserid: row?.v_entrauserid,
        userrole: buildRoleString(row?.v_role, "SuperAdmin", checked),
        modifiedby: accounts?.[0]?.username || null,
      });
    } catch (err) {
    } finally {
      await fetchData(1, {});
      if (userKey) {
        setRoleOverrides((prev) => {
          const next = { ...prev };
          delete next[userKey];
          return next;
        });
      }
    }
  };

  const handleSync = async () => {
    await syncUsers();
    fetchData(1, {});
  };

  const handleRecordsPerPageChange = async (value) => {
    const newValue = Number(value);
    setSelectedRowsPerPage(newValue);

    if (userSettings && userSettings.length > 0) {
      try {
        await updateRecordCount({
          entrauserid: userSettings[0]?.v_entrauserid,
          ticketrecordcount: userSettings[0]?.v_ticketrecordcount ?? null,
          managerecordcount: newValue,
          modifiedby: accounts?.[0]?.username ?? null,
        });
      } catch (err) {
        console.error("Failed to update record count:", err);
      }
    }
  };

  const handleFilter = (newFilters) => {
    setActiveFilters(newFilters);
    setLocalPage(1);
  };

  const handleRowClick = useCallback((row) => {
    const searchText = String(row?.v_username || "").trim();
    if (!searchText) return;
    const params = new URLSearchParams({ tab: "my-client", search: searchText });
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

  const roles    = filterOptions?.roles ?? [];
  const statuses = filterOptions?.statuses ?? [];

  const normalizeRole = useCallback((role) =>
    String(role || "")
      .replace(/\s+/g, "")
      .toLowerCase(),
  []);

  const getRoleValue = useCallback((row) => roleOverrides[row?.v_entrauserid] ?? row?.v_role, [roleOverrides]);

  const hasRole = useCallback((roleValue, roleName) => {
    const target = normalizeRole(roleName);
    return String(roleValue || "")
      .split(",")
      .map((role) => normalizeRole(role))
      .includes(target);
  }, [normalizeRole]);

  const isSpartaTenant = useCallback(
    (row) => String(row?.v_tenantname || "").trim().toLowerCase() === SPARTA_TENANT_NAME_NORMALIZED,
    [],
  );

  const columns = useMemo(() => [
    {
      key: "clientName",
      label: "Client Name",
      align: "center",
      minWidth: 180,
      defaultWidth: 220,
      sortValue: (row) => row?.v_tenantname ?? "",
    },
    {
      key: "userName",
      label: "User Name",
      align: "center",
      minWidth: 180,
      defaultWidth: 220,
      sortValue: (row) => row?.v_username ?? "",
    },
    {
      key: "role",
      label: "Role",
      align: "center",
      minWidth: 150,
      defaultWidth: 170,
      sortValue: (row) => getRoleValue(row) ?? "",
    },
    {
      key: "department",
      label: "Department",
      align: "center",
      minWidth: 160,
      defaultWidth: 180,
      sortValue: (row) => row?.v_department ?? "",
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
      key: "completed",
      label: "Completed",
      align: "center",
      minWidth: 160,
      defaultWidth: 170,
      sortValue: (row) => Number(row?.v_completed ?? 0),
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
      key: "cancelled",
      label: "Cancelled",
      align: "center",
      minWidth: 160,
      defaultWidth: 170,
      sortValue: (row) => Number(row?.v_cancelled ?? 0),
    },
    {
      key: "completionRate",
      label: "Completion Rate",
      align: "center",
      minWidth: 170,
      defaultWidth: 180,
      sortValue: (row) => Number(row?.v_completion ?? 0),
    },
    {
      key: "status",
      label: "Status",
      align: "center",
      minWidth: 120,
      defaultWidth: 130,
      sortValue: (row) => (row?.v_status === "true" ? "Active" : "Inactive"),
    },
    {
      key: "superAdmin",
      label: "Super Admin",
      align: "center",
      minWidth: 140,
      defaultWidth: 150,
      sortValue: (row) => (hasRole(getRoleValue(row), "SuperAdmin") ? 1 : 0),
    },
  ], [getRoleValue, hasRole]);

  useEffect(() => {
    setColumnWidths((prev) => {
      const next = { ...prev };
      columns.forEach((column) => {
        if (next[column.key] == null && column.defaultWidth) {
          next[column.key] = column.defaultWidth;
        }
      });
      return next;
    });
  }, [columns]);

  const filteredData = useMemo(() => {
    const searchValue = String(activeFilters?.search ?? "").trim().toLowerCase();
    const clientValue = String(activeFilters?.clientname ?? "").trim().toLowerCase();
    const selectedRoles = Array.isArray(activeFilters?.selectedRoles)
      ? activeFilters.selectedRoles
      : activeFilters?.selectedRoles
        ? [activeFilters.selectedRoles]
        : [];
    const selectedStatuses = Array.isArray(activeFilters?.status)
      ? activeFilters.status
      : activeFilters?.status
        ? [activeFilters.status]
        : [];
    const normalizedRoles = selectedRoles.map((role) => normalizeRole(role));

    return data.filter((row) => {
      if (searchValue) {
        const username = String(row.v_username || "").toLowerCase();
        if (!username.includes(searchValue)) return false;
      }

      if (clientValue) {
        const clientName = String(row.v_tenantname || "").toLowerCase();
        if (!clientName.includes(clientValue)) return false;
      }

      if (normalizedRoles.length > 0) {
        const roleValue = normalizeRole(getRoleValue(row));
        if (!normalizedRoles.includes(roleValue)) return false;
      }

      if (selectedStatuses.length > 0) {
        if (!selectedStatuses.includes(String(row.v_status))) return false;
      }

      return true;
    });
  }, [activeFilters, data, getRoleValue, normalizeRole]);

  const displayTotal = filteredData.length;
  const displayTotalPages = effectiveLimit > 0
    ? Math.max(1, Math.ceil(filteredData.length / effectiveLimit))
    : 1;
  const displayHasPrev = localPage > 1;
  const displayHasNext = localPage < displayTotalPages;

  const sortedData = useMemo(() => {
    if (!sortConfig.key) return filteredData;
    const column = columns.find((entry) => entry.key === sortConfig.key);
    if (!column) return filteredData;
    const next = [...filteredData];
    next.sort((a, b) => compareSortValues(column.sortValue(a), column.sortValue(b)));
    return sortConfig.direction === "asc" ? next : next.reverse();
  }, [filteredData, sortConfig, columns]);

  const pagedData = useMemo(() => {
    const start = (localPage - 1) * effectiveLimit;
    return sortedData.slice(start, start + effectiveLimit);
  }, [sortedData, effectiveLimit, localPage]);

  const filteredTotals = useMemo(() => {
    const totalTickets = filteredData.reduce((sum, row) => sum + Number(row?.v_totalticket ?? 0), 0);
    const openTickets = filteredData.reduce((sum, row) => sum + Number(row?.v_openticket ?? 0), 0);
    const completedTickets = filteredData.reduce((sum, row) => sum + Number(row?.v_completed ?? 0), 0);
    const cancelledTickets = filteredData.reduce((sum, row) => sum + Number(row?.v_cancelled ?? 0), 0);
    const completionRate = totalTickets > 0
      ? Number(((completedTickets / totalTickets) * 100).toFixed(1))
      : 0;

    return { totalTickets, openTickets, completedTickets, cancelledTickets, completionRate };
  }, [filteredData]);

  useEffect(() => {
    if (localPage > displayTotalPages) {
      setLocalPage(1);
    }
  }, [localPage, displayTotalPages]);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 flex flex-col min-h-0 flex-1">

      <SuperAdminFilter
        onFilter={handleFilter}
        roles={roles}
        statuses={statuses}
        rowsPerPage={selectedRowsPerPage ?? DEFAULT_ROWS}
        onRowsPerPageChange={handleRecordsPerPageChange}
        rowsPerPageDisabled={updating}
      />

      <div className="flex items-center px-4 py-3 border-b border-gray-200 dark:border-gray-800">
        <div className="text-xs text-gray-500 dark:text-gray-400">{displayTotal} Total Records</div>

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

      {/* {error && (
        <div className="px-4 py-3 text-sm border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-start gap-2 text-red-500 dark:text-red-400">
            <span className="font-medium">Error:</span>
            <span>{error}</span>
          </div>
        </div>
      )} */}

    <div className="block md:hidden divide-y divide-gray-100 dark:divide-gray-800">
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
                    className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm overflow-hidden cursor-pointer hover:border-violet-300 dark:hover:border-violet-700 transition-colors"
                  >

                    <div className="flex items-center gap-2 px-3 py-2.5 bg-violet-50 dark:bg-violet-900/20 border-b border-violet-100 dark:border-violet-800/40">
                      <div className="w-6 h-6 rounded-md bg-violet-600 dark:bg-violet-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {row.v_tenantname?.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-semibold text-violet-600 dark:text-violet-300 tracking-wide">
                        {row.v_tenantname}
                      </span>
                    </div>

                    <div className="p-4 space-y-3">

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400 font-semibold text-sm">
                            {row.v_username?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">{row.v_username}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {getRoleValue(row) === "SuperAdmin" ? "Super Admin" : getRoleValue(row) || "User"}
                            </p>
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
                          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                            <span>Total</span>
                            <span className="font-semibold text-gray-900 dark:text-white">{row.v_totalticket ?? 0}</span>
                          </div>
                          <div className="mt-1 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                            <span>Completed</span>
                            <span className="font-semibold text-gray-900 dark:text-white">{row.v_completed ?? 0}</span>
                          </div>
                           <div className="mt-1 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                            <span>In Progress</span>
                            <span className="font-semibold text-gray-900 dark:text-white">{row.v_openticket ?? 0}</span>
                          </div>
                           <div className="mt-1 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                            <span>Cancelled</span>
                            <span className="font-semibold text-gray-900 dark:text-white">{row.v_cancelled ?? 0}</span>
                          </div>
                            <div className="mt-1 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                            <span>Completion</span>
                            <span className="font-semibold text-gray-900 dark:text-white">{formatPercent(row.v_completion)}</span>
                          </div>
                        </div>
                        <div
                          className="bg-gray-50 dark:bg-gray-700/50 rounded-lg px-3 py-2 flex items-center justify-between"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <span className="text-xs text-gray-500 dark:text-gray-400">Super Admin</span>
                          <Switch
                            className="data-[state=checked]:bg-blue-500 cursor-pointer"
                            checked={hasRole(getRoleValue(row), "SuperAdmin")}
                            onCheckedChange={(checked) => handleSuperAdminToggle(row, checked)}
                            disabled={promoting || demoting || fetchingGroupId || demoteGroupLoading || row.v_status !== "true" || !isSpartaTenant(row)}
                          />
                        </div>
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
                        {filteredTotals.totalTickets}
                      </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg px-3 py-2">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Completed</p>
                      <p className="text-sm font-semibold text-center text-gray-900 dark:text-white">
                        {filteredTotals.completedTickets}
                      </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg px-3 py-2">
                      <p className="text-xs text-gray-500 dark:text-gray-400">In Progress</p>
                      <p className="text-sm font-semibold text-center text-gray-900 dark:text-white">
                        {filteredTotals.openTickets}
                      </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg px-3 py-2">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Cancelled</p>
                      <p className="text-sm font-semibold text-center text-gray-900 dark:text-white">
                        {filteredTotals.cancelledTickets}
                      </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg px-3 py-2">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Completion Rate</p>
                      <p className="text-sm font-semibold text-center text-gray-900 dark:text-white">{formatPercent(filteredTotals.completionRate)}</p>
                    </div>
                  </div>
                </div>
              </div>
          )}
      </div>

      <SuperAdminTable
        columns={columns}
        columnWidths={columnWidths}
        handleResizeStart={handleResizeStart}
        sortConfig={sortConfig}
        handleSort={handleSort}
        pagedData={pagedData}
        loading={loading}
        filteredTotals={filteredTotals}
        handleRowClick={handleRowClick}
        getRoleValue={getRoleValue}
        hasRole={hasRole}
        handleSuperAdminToggle={handleSuperAdminToggle}
        promoting={promoting}
        demoting={demoting}
        fetchingGroupId={fetchingGroupId}
        demoteGroupLoading={demoteGroupLoading}
        isSpartaTenant={isSpartaTenant}
      />

      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-800 pr-20">
        <div className="text-xs text-gray-500 dark:text-gray-400">{displayTotal} Total Records</div>
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
              onClick={() => setLocalPage((current) => Math.max(1, current - 1))}
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
              onClick={() => setLocalPage((current) => Math.min(displayTotalPages, current + 1))}
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
