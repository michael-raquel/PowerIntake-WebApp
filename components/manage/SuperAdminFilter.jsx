import { ChevronDown, Search, SlidersHorizontal, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function SuperAdminFilter({
  onFilter,
  filters = {},
  roles       = [],
  statuses    = [],
}) {
  const search = filters?.search ?? "";
  const clientname = filters?.clientname ?? "";
  const hasRoleFilter = filters?.selectedRoles !== undefined && filters?.selectedRoles !== null;
  const hasStatusFilter = filters?.status !== undefined && filters?.status !== null;
  const rawSelectedRoles = Array.isArray(filters?.selectedRoles)
    ? filters.selectedRoles
    : filters?.selectedRoles
      ? [filters.selectedRoles]
      : [];
  const rawSelectedStatuses = Array.isArray(filters?.status)
    ? filters.status
    : filters?.status
      ? [filters.status]
      : [];

  const selectedRoles = hasRoleFilter
    ? rawSelectedRoles.filter((role) => roles.includes(role))
    : roles;
  const selectedStatuses = hasStatusFilter
    ? rawSelectedStatuses.filter((status) => statuses.includes(status))
    : statuses;

  const allRolesSelected = roles.length > 0 && selectedRoles.length === roles.length;
  const roleFilterActive = hasRoleFilter && !allRolesSelected;
  const allStatusesSelected = statuses.length > 0 && selectedStatuses.length === statuses.length;
  const statusFilterActive = hasStatusFilter && !allStatusesSelected;

  const resolveRoles = (nextRoles) => {
    if (roles.length === 0) return nextRoles;
    return nextRoles.length === roles.length ? null : nextRoles;
  };

  const resolveStatuses = (nextStatuses) => {
    if (statuses.length === 0) return nextStatuses;
    return nextStatuses.length === statuses.length ? null : nextStatuses;
  };

  const roleLabel = roles.length === 0
    ? "No roles"
    : selectedRoles.length === 0
      ? "No roles"
      : allRolesSelected
        ? "All roles"
        : `${selectedRoles.length} selected`;

  const statusNames = selectedStatuses.map((s) => (s === "true" ? "Active" : "Inactive"));
  const statusLabel = statuses.length === 0
    ? "No statuses"
    : selectedStatuses.length === 0
      ? "No status"
      : allStatusesSelected
        ? "All statuses"
        : statusNames.join(", ");

  const activeFilterCount = [
    clientname,
    roleFilterActive,
    statusFilterActive,
  ].filter(Boolean).length;

  const roleSomeSelected = selectedRoles.length > 0 && !allRolesSelected;
  const statusSomeSelected = selectedStatuses.length > 0 && !allStatusesSelected;

  const handleSearch = (e) => {
    const newSearch = e.target.value;
    onFilter?.({ search: newSearch });
  };

  const handleClientname = (e) => {
    const newClientname = e.target.value;
    onFilter?.({ clientname: newClientname });
  };

  const handleRole = (roleValue) => {
    const updated = selectedRoles.includes(roleValue)
      ? selectedRoles.filter((role) => role !== roleValue)
      : [...selectedRoles, roleValue];
    onFilter?.({ selectedRoles: resolveRoles(updated) });
  };

  const handleStatus = (statusValue) => {
    const updated = selectedStatuses.includes(statusValue)
      ? selectedStatuses.filter((status) => status !== statusValue)
      : [...selectedStatuses, statusValue];
    onFilter?.({ status: resolveStatuses(updated) });
  };

  const handleSelectAllRoles = () => {
    onFilter?.({ selectedRoles: resolveRoles(roles) });
  };

  const handleUnselectAllRoles = () => {
    onFilter?.({ selectedRoles: resolveRoles([]) });
  };

  const handleSelectAllStatuses = () => {
    onFilter?.({ status: resolveStatuses(statuses) });
  };

  const handleUnselectAllStatuses = () => {
    onFilter?.({ status: resolveStatuses([]) });
  };

  const handleToggleAllRoles = () => {
    if (allRolesSelected) {
      handleUnselectAllRoles();
    } else {
      handleSelectAllRoles();
    }
  };

  const handleToggleAllStatuses = () => {
    if (allStatusesSelected) {
      handleUnselectAllStatuses();
    } else {
      handleSelectAllStatuses();
    }
  };

  const clearOne = (key) => {
    if (key === "clientname") {
      onFilter?.({ clientname: "" });
    }
    if (key === "role") {
      onFilter?.({ selectedRoles: resolveRoles(roles) });
    }
    if (key === "status") {
      onFilter?.({ status: resolveStatuses(statuses) });
    }
  };

  const clearAll = () => {
    onFilter?.({
      search: "",
      clientname: "",
      selectedRoles: resolveRoles(roles),
      status: resolveStatuses(statuses),
    });
  };

  return (
    <div className="flex flex-row items-center gap-1 sm:gap-2 w-full px-4 py-3 border-b border-gray-200 dark:border-gray-800">

      <div className="relative flex-1 min-w-[100px] sm:min-w-[150px]">
        <Search className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 w-3.5 h-3.5 sm:w-4 sm:h-4" />
        <Input
          value={search}
          onChange={handleSearch}
          placeholder="Search user name..."
          className="pl-7 sm:pl-9 pr-8 w-full dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100 dark:placeholder:text-gray-500 text-xs sm:text-sm h-8 sm:h-10"
        />
        {search && (
          <button
            onClick={() => {
              onFilter?.({ search: "" });
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="relative gap-1 sm:gap-2 px-2 sm:px-3 h-8 sm:h-10 bg-white text-gray-900 border-gray-300 hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800 dark:text-gray-300 dark:bg-gray-900"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="text-xs sm:text-sm whitespace-nowrap">Filters</span>
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="absolute -top-2 -right-2 h-4 w-4 sm:h-5 sm:w-5 p-0 flex items-center justify-center text-[8px] sm:text-xs dark:bg-gray-700 dark:text-gray-200">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>

        <PopoverContent
          className="w-64 p-3 dark:bg-gray-900 dark:border-gray-800 max-h-[min(80vh,600px)] overflow-y-auto z-[29]"
          align="end"
          sideOffset={5}
          avoidCollisions={false}
        >
          <div className="space-y-3">

            <div className="flex items-center justify-between sticky top-0 bg-white dark:bg-gray-900 pb-1 z-[29]">
              <h4 className="font-medium text-sm dark:text-gray-200">Filter by</h4>
              {activeFilterCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAll}
                  className="h-7 text-xs dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  Clear all
                </Button>
              )}
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700" />

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium dark:text-gray-300">Client Name</span>
                {clientname && (
                  <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => clearOne("clientname")}>
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <Input
                  value={clientname}
                  onChange={handleClientname}
                  placeholder="Search client name..."
                  className="pl-7 w-full dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 text-xs h-8"
                />
              </div>
            </div>

            <div className="space-y-1 relative">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium dark:text-gray-300">Role</span>
                {roleFilterActive && (
                  <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => clearOne("role")}>
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <button className="w-full flex items-center justify-between px-3 py-1.5 text-xs border rounded-md bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <span className="truncate">{roleLabel}</span>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-64 p-0 dark:bg-gray-800 dark:border-gray-700 z-[29]"
                  align="start"
                  side="bottom"
                  sideOffset={5}
                  avoidCollisions={true}
                  collisionPadding={16}
                >
                  <div className="max-h-60 overflow-y-auto">
                    <div className="p-2 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">
                      <label className="flex items-center gap-2 px-2 py-1 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={allRolesSelected}
                          ref={(el) => { if (el) el.indeterminate = roleSomeSelected; }}
                          onChange={handleToggleAllRoles}
                          className="h-3.5 w-3.5 rounded border-gray-300"
                        />
                        <span className="text-xs font-medium dark:text-gray-300">Select All</span>
                      </label>
                    </div>
                    {roles.length === 0 ? (
                      <p className="px-4 py-2 text-xs text-gray-400 dark:text-gray-500">No roles available</p>
                    ) : (
                      roles.map((r) => (
                        <label key={r} className="flex items-center gap-2 px-4 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                          <input
                            type="checkbox"
                            id={`role-${r}`}
                            checked={selectedRoles.includes(r)}
                            onChange={() => handleRole(r)}
                            className="h-3.5 w-3.5 rounded border-gray-300"
                          />
                          <span className="text-xs dark:text-gray-300">{r}</span>
                        </label>
                      ))
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-1 relative">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium dark:text-gray-300">Status</span>
                {statusFilterActive && (
                  <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => clearOne("status")}>
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <button className="w-full flex items-center justify-between px-3 py-1.5 text-xs border rounded-md bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <span className="truncate">{statusLabel}</span>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-64 p-0 dark:bg-gray-800 dark:border-gray-700 z-[29]"
                  align="start"
                  side="bottom"
                  sideOffset={5}
                  avoidCollisions={true}
                  collisionPadding={16}
                >
                  <div className="max-h-60 overflow-y-auto">
                    <div className="p-2 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">
                      <label className="flex items-center gap-2 px-2 py-1 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={allStatusesSelected}
                          ref={(el) => { if (el) el.indeterminate = statusSomeSelected; }}
                          onChange={handleToggleAllStatuses}
                          className="h-3.5 w-3.5 rounded border-gray-300"
                        />
                        <span className="text-xs font-medium dark:text-gray-300">Select All</span>
                      </label>
                    </div>
                    {statuses.length === 0 ? (
                      <p className="px-4 py-2 text-xs text-gray-400 dark:text-gray-500">No statuses available</p>
                    ) : (
                      statuses.map((s) => (
                        <label key={s} className="flex items-center gap-2 px-4 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedStatuses.includes(s)}
                            onChange={() => handleStatus(s)}
                            className="h-3.5 w-3.5 rounded border-gray-300"
                          />
                          <span className="text-xs dark:text-gray-300">
                            {s === "true" ? "Active" : "Inactive"}
                          </span>
                        </label>
                      ))
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

          </div>
        </PopoverContent>
      </Popover>

    </div>
  );
}