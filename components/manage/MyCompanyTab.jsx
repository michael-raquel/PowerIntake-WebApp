"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { useMsal } from "@azure/msal-react";
import useFetchAllCompanyUsers from "@/hooks/UseFetchAllCompanyUsers";
import useSyncUsers from "@/hooks/UseSyncUsers";
import useCreatePromoteAdmin from "@/hooks/UseCreatePromoteAdmin";
import useDeleteDemoteAdmin from "@/hooks/UseDeleteDemoteAdmin";
import useUpdateUserRole from "@/hooks/UseUpdateUserRole";
import { Switch } from '@/components/ui/switch';
import CompanyFilter from "@/components/manage/MyCompanyFilter";

const TABLE_HEADERS = [
  "Manager Name",
  "User Name",
  "Role",
  "Department",
  "Total Ticket",
  "Open Ticket",
  "Status",
  "Admin",
];

const MOBILE_CARD_HEIGHT = 230;
const MIN_RECORDS = 1;
const DEFAULT_ROWS = 10;

export default function MyCompanyTab({ recordsPerPage: parentRecordsPerPage, tableContainerRef }) {
  const { accounts } = useMsal();
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
  const [activeFilters, setActiveFilters] = useState({});

  const handleSync = async () => {
    await syncUsers();
    fetchData(page, activeFilters);
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
      fetchData(page, activeFilters);
    }
  };

  const roles       = [...new Set(data.map((r) => r.v_role).filter(Boolean))];
  const departments = [...new Set(data.map((r) => r.v_department).filter(Boolean))];
  const statuses    = [...new Set(data.map((r) => r.v_status).filter(Boolean))];
  const managers    = [...new Set(data.map((r) => r.v_managername).filter(Boolean))];

  const hasRole = (roleValue, roleName) =>
    String(roleValue || "")
      .split(",")
      .map((role) => role.trim().toLowerCase())
      .includes(roleName.toLowerCase());
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
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {total} total records
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

      {/* {error && (
        <div className="px-4 py-3 text-sm border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-start gap-2 text-red-500 dark:text-red-400">
            <span className="font-medium">Error:</span>
            <span>{error}</span>
          </div>
        </div>
      )} */}

    <div className="flex-1 min-h-0 overflow-y-auto block md:hidden divide-y divide-gray-100 dark:divide-gray-800" ref={mobileContainerRef}>
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
                      {row.v_username?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{row.v_username}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{row.v_role || "User"}</p>
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
                    <p className="text-xs text-gray-500 dark:text-gray-400">Total Tickets</p>
                    <p className="text-sm font-semibold text-center text-gray-900 dark:text-white">{row.v_totalticket ?? 0}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg px-3 py-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Open Tickets</p>
                    <p className="text-sm font-semibold text-center text-gray-900 dark:text-white">{row.v_openticket ?? 0}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-700 pt-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Admin</span>
                  <Switch
                    className="data-[state=checked]:bg-blue-500 cursor-pointer"
                    checked={hasRole(row.v_role, "Admin")}
                    onCheckedChange={(checked) => handleAdminToggle(row, checked)}
                    disabled={promoting || demoting || fetchingGroupId || demoteGroupLoading}
                  />
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
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={TABLE_HEADERS.length} className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                  No records found.
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr key={i} className="hover:bg-gray-50 text-center dark:hover:bg-gray-800 transition-colors">
                  <td className="px-4 py-3 text-gray-900 dark:text-white whitespace-nowrap">{row.v_managername || "N/A"}</td>
                  <td className="px-4 py-3 text-gray-900 dark:text-white whitespace-nowrap">{row.v_username}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">{row.v_role === "SuperAdmin" ? "Super Admin" : row.v_role || "User"}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">{row.v_department || "N/A"}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">{row.v_totalticket}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">{row.v_openticket}</td>
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
                      checked={hasRole(row.v_role, "Admin")}
                      onCheckedChange={(checked) => handleAdminToggle(row, checked)}
                      disabled={promoting || demoting || fetchingGroupId || demoteGroupLoading}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot className="border-t border-gray-200 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-800/60">
            <tr className="text-center">
              <td colSpan={4} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                Total
              </td>
              <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white">
                {totals?.totalTickets ?? 0}
              </td>
              <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white">
                {totals?.openTickets ?? 0}
              </td>
              <td className="px-4 py-3" />
              <td className="px-4 py-3" />
            </tr>
          </tfoot>
        </table>
        </div>
      </div>

      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-800">
        <div className="hidden md:flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
          <span>{total} total records</span>
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