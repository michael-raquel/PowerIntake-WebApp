import { useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function SuperAdminFilter({
  onFilter,
  roles       = [],
  statuses    = [],
}) {
  const [search,     setSearch]     = useState("");
  const [clientname, setClientname] = useState("");
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [status,     setStatus]     = useState("");

  const activeFilterCount = [clientname, selectedRoles.length > 0, status].filter(Boolean).length;

  const handleSearch = (e) => {
    const newSearch = e.target.value;
    setSearch(newSearch);
    onFilter({
      search: newSearch,
      clientname,
      selectedRoles,
      status,
    });
  };

  const handleClientname = (e) => {
    const newClientname = e.target.value;
    setClientname(newClientname);
    onFilter({
      search,
      clientname: newClientname,
      selectedRoles,
      status,
    });
  };

  const handleRole = (roleValue) => {
    const updated = selectedRoles.includes(roleValue)
      ? selectedRoles.filter(r => r !== roleValue)
      : [...selectedRoles, roleValue];
    setSelectedRoles(updated);
    onFilter({
      search,
      clientname,
      selectedRoles: updated,
      status,
    });
  };

  const handleStatus = (val) => {
    const newStatus = val === "__all__" ? "" : val;
    setStatus(newStatus);
    onFilter({
      search,
      clientname,
      selectedRoles,
      status: newStatus,
    });
  };

  const clearOne = (key) => {
    if (key === "clientname") {
      setClientname("");
      onFilter({ search, clientname: "", selectedRoles, status });
    }
    if (key === "role") {
      setSelectedRoles([]);
      onFilter({ search, clientname, selectedRoles: [], status });
    }
    if (key === "status") {
      setStatus("");
      onFilter({ search, clientname, selectedRoles, status: "" });
    }
  };

  const clearAll = () => {
    setSearch("");
    setClientname("");
    setSelectedRoles([]);
    setStatus("");
    onFilter({ search: "", clientname: "", selectedRoles: [], status: "" });
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
              onFilter({ search: "", clientname, selectedRoles, status });
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
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Client Name</label>
                {clientname && (
                  <button onClick={() => clearOne("clientname")}>
                    <X className="w-3 h-3 text-gray-400 hover:text-gray-600" />
                  </button>
                )}
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <Input
                  value={clientname}
                  onChange={handleClientname}
                  placeholder="Search client name..."
                  className="pl-8 h-9 text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Role</label>
                {selectedRoles.length > 0 && (
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
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Status</label>
                {status && (
                  <button onClick={() => clearOne("status")}>
                    <X className="w-3 h-3 text-gray-400 hover:text-gray-600" />
                  </button>
                )}
              </div>
              <Select value={status || "__all__"} onValueChange={handleStatus}>
                <SelectTrigger className="h-9 text-sm w-full">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Statuses</SelectItem>
                  {statuses.map((s) => (
                    <SelectItem key={s} value={s}>{s == "true" ? "Active" : "Inactive"}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

          </div>
        </PopoverContent>
      </Popover>

    </div>
  );
}