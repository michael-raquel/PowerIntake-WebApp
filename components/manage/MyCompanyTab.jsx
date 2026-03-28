"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { useMsal } from "@azure/msal-react";
import useFetchAllCompanyUsers from "@/hooks/UseFetchAllCompanyUsers";
import useSyncUsers from "@/hooks/UseSyncUsers";
import useCreatePromoteAdmin from "@/hooks/UseCreatePromoteAdmin";
import useDeleteDemoteAdmin from "@/hooks/UseDeleteDemoteAdmin";
import useUpdateUserRole from "@/hooks/UseUpdateUserRole";
import { useFetchUserSettings } from "@/hooks/UseFetchUserSettings";
import { useUpdateRecordCount } from "@/hooks/UseUpdateRecordCount";
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import CompanyFilter from "@/components/manage/MyCompanyFilter";

const TABLE_HEADERS = [
  "Manager Name",
  "User Name",
  "Role",
  "Department",
  "Tickets",
  "Completed Tickets",
  "In Progress",
  "Cancelled Tickets",
  "Completion Rate",
  "Status",
  "Admin",
];

const DEFAULT_ROWS = 10;

export default function MyCompanyTab({ recordsPerPage: parentRecordsPerPage, tableContainerRef }) {
  const { accounts } = useMsal();
  const [selectedRowsPerPage, setSelectedRowsPerPage] = useState(null);
  const [activeFilters, setActiveFilters] = useState({});
  const [roleOverrides, setRoleOverrides] = useState({});
  const hasUserSelectionRef = useRef(false);
  const lastSettingsValueRef = useRef(null);

  const { userSettings } = useFetchUserSettings({ entrauserid: accounts?.[0]?.localAccountId });
  const { updateRecordCount, loading: updating } = useUpdateRecordCount();

  useEffect(() => {
    if (userSettings && userSettings.length > 0) {
      const setting = userSettings[0];
      const recordCount = Number(setting?.v_managerecordcount);
      if (recordCount > 0) {
        const settingsChanged = recordCount !== lastSettingsValueRef.current;
        lastSettingsValueRef.current = recordCount;
        if ((settingsChanged || !hasUserSelectionRef.current) && recordCount !== selectedRowsPerPage) {
          setSelectedRowsPerPage(recordCount);
        }
      }
    }
  }, [userSettings]);

  const effectiveLimit = selectedRowsPerPage ?? DEFAULT_ROWS;

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
    totals,
    filterOptions,
    allRoleData,
  } = useFetchAllCompanyUsers(1, effectiveLimit);

  const { syncUsers, loading: syncing, error: syncError, result: syncResult } = useSyncUsers();
  const {
    promoteAdmin,
    loading: promoting,
    fetchingGroupId,
    groupId,
  } = useCreatePromoteAdmin();
  const {
    demoteAdmin,
    loading: demoting,
    appRoleLoading: demoteGroupLoading,
    groupId: demoteGroupId,
  } = useDeleteDemoteAdmin({
    roleValue: "Admin",
    roleDisplayName: "Admin",
  });
  const { updateUserRole } = useUpdateUserRole();
  useEffect(() => {
    if (selectedRowsPerPage !== null) {
      fetchData(1, activeFilters);
    }
  }, [selectedRowsPerPage, fetchData, activeFilters]);

  const handleSync = async () => {
    await syncUsers();
    fetchData(page, activeFilters);
  };

  const handleRecordsPerPageChange = async (value) => {
    const newValue = Number(value);
    hasUserSelectionRef.current = true;
    lastSettingsValueRef.current = newValue;
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
    fetchData(1, newFilters);
  };

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

  const handleAdminToggle = async (row, checked) => {
    const userKey = row?.v_entrauserid;
    const updatedRole = buildRoleString(row?.v_role, "Admin", checked);
    if (userKey) {
      setRoleOverrides((prev) => ({
        ...prev,
        [userKey]: updatedRole,
      }));
    }

    try {
      if (checked) {
        if (fetchingGroupId || !groupId) return;
        await promoteAdmin(row?.v_entrauserid);
      } else {
        if (demoteGroupLoading || !demoteGroupId) return;
        await demoteAdmin(row?.v_entrauserid);
      }

      await updateUserRole({
        entrauserid: row?.v_entrauserid,
        userrole: buildRoleString(row?.v_role, "Admin", checked),
        modifiedby: accounts?.[0]?.username || null,
      });
    } catch (err) {
    } finally {
      await fetchData(page, activeFilters);
      if (userKey) {
        setRoleOverrides((prev) => {
          const next = { ...prev };
          delete next[userKey];
          return next;
        });
      }
    }
  };

  const roles       = filterOptions?.roles ?? [];
  const departments = filterOptions?.departments ?? [];
  const statuses    = filterOptions?.statuses ?? [];
  const managers    = filterOptions?.managers ?? [];

  const normalizeRole = useCallback((role) =>
    String(role || "")
      .replace(/\s+/g, "")
      .toLowerCase(),
  []);

  const getRoleValue = useCallback((row) => roleOverrides[row?.v_entrauserid] ?? row?.v_role, [roleOverrides]);

  const hasRole = (roleValue, roleName) => {
    const target = normalizeRole(roleName);
    return String(roleValue || "")
      .split(",")
      .map((role) => normalizeRole(role))
      .includes(target);
  };

  const roleIsActive = Boolean(activeFilters?.selectedRoles && activeFilters.selectedRoles.length > 0);

  const exactRoleData = useMemo(() => {
    if (!roleIsActive) return [];
    const selectedRoles = activeFilters.selectedRoles || [];
    return allRoleData.filter((row) => 
      selectedRoles.some((selectedRole) => 
        normalizeRole(getRoleValue(row)) === normalizeRole(selectedRole)
      )
    );
  }, [activeFilters?.selectedRoles, allRoleData, getRoleValue, normalizeRole, roleIsActive]);

  const pagedData = useMemo(() => {
    if (!roleIsActive) return data;
    const start = (page - 1) * effectiveLimit;
    return exactRoleData.slice(start, start + effectiveLimit);
  }, [data, exactRoleData, effectiveLimit, page, roleIsActive]);

  const displayTotal = roleIsActive ? exactRoleData.length : (total ?? 0);
  const displayTotalPages = roleIsActive
    ? (effectiveLimit > 0 ? Math.max(1, Math.ceil(exactRoleData.length / effectiveLimit)) : 1)
    : totalPages;
  const displayHasPrev = roleIsActive ? page > 1 : hasPrev;
  const displayHasNext = roleIsActive ? page < displayTotalPages : hasNext;

  useEffect(() => {
    if (roleIsActive && page > displayTotalPages) {
      fetchData(1, activeFilters);
    }
  }, [activeFilters, displayTotalPages, fetchData, page, roleIsActive]);
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 flex flex-col min-h-0 flex-1">

      <CompanyFilter
        onFilter={handleFilter}
        managers={managers}
        roles={roles}
        departments={departments}
        statuses={statuses}
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
          <button
            onClick={handleSync}
            disabled={loading || syncing}
            className="p-1.5 rounded-lg text-violet-500 font-bold hover:text-violet-700 hover:bg-violet-100 dark:text-violet-400 dark:hover:text-violet-300 dark:hover:bg-violet-900/30 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${loading || syncing ? "animate-spin" : ""}`} />
          </button>
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
              <div key={i} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm p-4 space-y-3">

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400 font-semibold text-sm">
                      {row.v_username?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{row.v_username}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{getRoleValue(row) || "User"}</p>
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
                    <p className="text-xs text-gray-500 dark:text-gray-400">Manager</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      { row.v_managername || "N/A"}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg px-3 py-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Department</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{row.v_department || "N/A"}</p>
                  </div>
                </div>

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
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg px-3 py-2 flex items-center justify-between">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Admin</span>
                    <Switch
                      className="data-[state=checked]:bg-blue-500 cursor-pointer"
                      checked={hasRole(getRoleValue(row), "Admin")}
                      onCheckedChange={(checked) => handleAdminToggle(row, checked)}
                      disabled={promoting || demoting || fetchingGroupId || demoteGroupLoading || hasRole(getRoleValue(row), "SuperAdmin") || hasRole(getRoleValue(row), "Super Admin") || row.v_status !== "true"}
                    />
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
                  <p className="text-xs text-gray-500 dark:text-gray-400">Completed</p>
                  <p className="text-sm font-semibold text-center text-gray-900 dark:text-white">
                    {totals?.completedTickets ?? 0}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg px-3 py-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400">In Progress</p>
                  <p className="text-sm font-semibold text-center text-gray-900 dark:text-white">
                    {totals?.openTickets ?? 0}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg px-3 py-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Cancelled</p>
                  <p className="text-sm font-semibold text-center text-gray-900 dark:text-white">
                    {totals?.cancelledTickets ?? 0}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg px-3 py-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Completion Rate</p>
                  <p className="text-sm font-semibold text-center text-gray-900 dark:text-white">
                    {totals?.completionRate ?? 0}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="hidden md:flex flex-col flex-1 min-h-0" ref={tableContainerRef}>
        <div className="flex-1 min-h-0 overflow-x-auto overflow-y-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-800">
              {TABLE_HEADERS.map((header) => (
                <th
                  key={header}
                  className="px-4 py-3 font-bold text-center text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap"
                >
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
            ) : pagedData.length === 0 ? (
              <tr>
                <td colSpan={TABLE_HEADERS.length} className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                  No records found.
                </td>
              </tr>
            ) : (
              pagedData.map((row, i) => (
                <tr key={i} className="hover:bg-gray-50 text-center dark:hover:bg-gray-800 transition-colors">
                  <td className="px-4 py-3 text-gray-900 dark:text-white whitespace-nowrap">{row.v_managername || "N/A"}</td>
                  <td className="px-4 py-3 text-gray-900 dark:text-white whitespace-nowrap">{row.v_username}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">{getRoleValue(row) === "SuperAdmin" ? "Super Admin" : getRoleValue(row) || "User"}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">{row.v_department || "N/A"}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">{row.v_totalticket}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">{row.v_completed ?? 0}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">{row.v_openticket}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">{row.v_cancelled ?? 0}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">{row.v_completion ?? 0}%</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                   <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      row.v_status === "true"
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    }`}>
                      {row.v_status === "true" ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <Switch
                      className="data-[state=checked]:bg-blue-500 cursor-pointer"
                      checked={hasRole(getRoleValue(row), "Admin")}
                      onCheckedChange={(checked) => handleAdminToggle(row, checked)}
                      disabled={promoting || demoting || fetchingGroupId || demoteGroupLoading || hasRole(getRoleValue(row), "SuperAdmin") || row.v_status !== "true"}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot className="border-t border-gray-200 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-800/60">
            <tr className="text-center">
              <td colSpan={4} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
              </td>
              <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white">
                {totals?.totalTickets ?? 0}
              </td>
              <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white">
                {totals?.completedTickets ?? 0}
              </td>
              <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white">
                {totals?.openTickets ?? 0}
              </td>
              <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white">
                {totals?.cancelledTickets ?? 0}
              </td>
              <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white">
                {totals?.completionRate ?? 0}%
              </td>
              <td className="px-4 py-3" />
              <td className="px-4 py-3" />
            </tr>
          </tfoot>
        </table>
        </div>
      </div>

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
              onClick={() => fetchData(page - 1, activeFilters)}
              disabled={!displayHasPrev || loading}
              className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {[...Array(displayTotalPages)].map((_, i) => {
              const pageNum = i + 1;
              if (pageNum === 1 || pageNum === displayTotalPages || Math.abs(pageNum - page) <= 1) {
                return (
                  <button
                    key={pageNum}
                    onClick={() => fetchData(pageNum, activeFilters)}
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
              onClick={() => fetchData(page + 1, activeFilters)}
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