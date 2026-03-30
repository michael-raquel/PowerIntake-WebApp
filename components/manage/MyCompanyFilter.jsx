import { useEffect, useRef, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function CompanyFilter({
  onFilter,
  managers    = [],
  roles       = [],
  departments = [],
  statuses    = [],
}) {
  const [search,     setSearch]     = useState("");
  const [manager,    setManager]    = useState("");
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [selectedDepartments, setSelectedDepartments] = useState([]);
  const [selectedStatuses,    setSelectedStatuses]    = useState([]);
  const initializedRolesRef = useRef(false);

  useEffect(() => {
    if (initializedRolesRef.current || roles.length === 0) return;
    setSelectedRoles(roles);
    initializedRolesRef.current = true;
  }, [roles]);

  const allRolesSelected = roles.length > 0 && selectedRoles.length === roles.length;
  const roleFilterActive = selectedRoles.length > 0 && !allRolesSelected;

  const resolveRoles = (nextRoles) => {
    if (roles.length === 0) return nextRoles;
    return nextRoles.length === roles.length ? [] : nextRoles;
  };

  const activeFilterCount = [
    manager,
    roleFilterActive,
    selectedDepartments.length > 0,
    selectedStatuses.length > 0,
  ].filter(Boolean).length;

  const handleSearch = (e) => {
    const newSearch = e.target.value;
    setSearch(newSearch);
    onFilter({
      search: newSearch,
      manager,
      selectedRoles: resolveRoles(selectedRoles),
      department: selectedDepartments,
      status: selectedStatuses,
    });
  };

  const handleManager = (e) => {
    const newManager = e.target.value;
    setManager(newManager);
    onFilter({
      search,
      manager: newManager,
      selectedRoles: resolveRoles(selectedRoles),
      department: selectedDepartments,
      status: selectedStatuses,
    });
  };

  const handleRole = (roleValue) => {
    const updated = selectedRoles.includes(roleValue)
      ? selectedRoles.filter(r => r !== roleValue)
      : [...selectedRoles, roleValue];
    const nextRoles = updated.length === 0 ? roles : updated;
    setSelectedRoles(nextRoles);
    onFilter({
      search,
      manager,
      selectedRoles: resolveRoles(nextRoles),
      department: selectedDepartments,
      status: selectedStatuses,
    });
  };

  const handleDepartment = (departmentValue) => {
    const updated = selectedDepartments.includes(departmentValue)
      ? selectedDepartments.filter((d) => d !== departmentValue)
      : [...selectedDepartments, departmentValue];
    setSelectedDepartments(updated);
    onFilter({
      search,
      manager,
      selectedRoles: resolveRoles(selectedRoles),
      department: updated,
      status: selectedStatuses,
    });
  };

  const handleStatus = (statusValue) => {
    const updated = selectedStatuses.includes(statusValue)
      ? selectedStatuses.filter((s) => s !== statusValue)
      : [...selectedStatuses, statusValue];
    setSelectedStatuses(updated);
    onFilter({
      search,
      manager,
      selectedRoles: resolveRoles(selectedRoles),
      department: selectedDepartments,
      status: updated,
    });
  };

  const clearOne = (key) => {
    if (key === "manager") {
      setManager("");
      onFilter({ search, manager: "", selectedRoles: resolveRoles(selectedRoles), department: selectedDepartments, status: selectedStatuses });
    }
    if (key === "role") {
      setSelectedRoles(roles);
      onFilter({ search, manager, selectedRoles: resolveRoles(roles), department: selectedDepartments, status: selectedStatuses });
    }
    if (key === "department") {
      setSelectedDepartments([]);
      onFilter({ search, manager, selectedRoles: resolveRoles(selectedRoles), department: [], status: selectedStatuses });
    }
    if (key === "status") {
      setSelectedStatuses([]);
      onFilter({ search, manager, selectedRoles: resolveRoles(selectedRoles), department: selectedDepartments, status: [] });
    }
  };

  const clearAll = () => {
    setSearch("");
    setManager("");
    setSelectedRoles(roles);
    setSelectedDepartments([]);
    setSelectedStatuses([]);
    onFilter({ search: "", manager: "", selectedRoles: resolveRoles(roles), department: [], status: [] });
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
              setSearch("");
              onFilter({ search: "", manager, selectedRoles: resolveRoles(selectedRoles), department: selectedDepartments, status: selectedStatuses });
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
            className={`relative gap-1 sm:gap-2 dark:border-gray-700 dark:hover:bg-gray-800 dark:text-gray-300 px-2 sm:px-3 h-8 sm:h-10 ${
              activeFilterCount > 0
                ? "border-violet-500 bg-violet-50 text-violet-600 hover:bg-violet-100 dark:bg-violet-900/20 dark:text-violet-400 dark:border-violet-500 dark:hover:bg-violet-900/30"
                : ""
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="text-xs sm:text-sm whitespace-nowrap">Filters</span>
            {activeFilterCount > 0 && (
              <Badge className="absolute -top-2 -right-2 h-4 w-4 sm:h-5 sm:w-5 p-0 flex items-center justify-center text-[8px] sm:text-xs bg-violet-600 hover:bg-violet-600 text-white dark:bg-violet-500">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-72 p-4 dark:bg-gray-900 dark:border-gray-800" align="end">
          <div className="space-y-4">

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900 dark:text-white">Filters</span>
              {activeFilterCount > 0 && (
                <button
                  onClick={clearAll}
                  className="text-xs text-violet-600 dark:text-violet-400 hover:underline"
                >
                  Clear all
                </button>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Manager</label>
                {manager && (
                  <button onClick={() => clearOne("manager")}>
                    <X className="w-3 h-3 text-gray-400 hover:text-gray-600" />
                  </button>
                )}
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <Input
                  value={manager}
                  onChange={handleManager}
                  placeholder="Search manager..."
                  className="pl-8 h-9 text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Role</label>
                {roleFilterActive && (
                  <button onClick={() => clearOne("role")}>
                    <X className="w-3 h-3 text-gray-400 hover:text-gray-600" />
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {roles.map((r) => (
                  <div key={r} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`role-${r}`}
                      checked={selectedRoles.includes(r)}
                      onChange={() => handleRole(r)}
                      className="w-4 h-4 rounded border-gray-300 text-violet-600 cursor-pointer"
                    />
                    <label htmlFor={`role-${r}`} className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                      {r}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Department</label>
                {selectedDepartments.length > 0 && (
                  <button onClick={() => clearOne("department")}>
                    <X className="w-3 h-3 text-gray-400 hover:text-gray-600" />
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {departments.length === 0 && (
                  <p className="text-xs text-gray-400 dark:text-gray-500">No departments available</p>
                )}
                {departments.map((d) => (
                  <label key={d} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedDepartments.includes(d)}
                      onChange={() => handleDepartment(d)}
                      className="w-4 h-4 rounded border-gray-300 text-violet-600 cursor-pointer"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{d}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Status</label>
                {selectedStatuses.length > 0 && (
                  <button onClick={() => clearOne("status")}>
                    <X className="w-3 h-3 text-gray-400 hover:text-gray-600" />
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {statuses.length === 0 && (
                  <p className="text-xs text-gray-400 dark:text-gray-500">No statuses available</p>
                )}
                {statuses.map((s) => (
                  <label key={s} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedStatuses.includes(s)}
                      onChange={() => handleStatus(s)}
                      className="w-4 h-4 rounded border-gray-300 text-violet-600 cursor-pointer"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {s === "true" ? "Active" : "Inactive"}
                    </span>
                  </label>
                ))}
              </div>
            </div>

          </div>
        </PopoverContent>
      </Popover>

    </div>
  );
}