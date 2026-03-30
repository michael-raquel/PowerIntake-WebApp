import { useMemo, useState } from "react";
import { ChevronDown, Search, SlidersHorizontal, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function ClientsFilter({
  onFilter,
  tenantnames = [],
  statuses    = [],
}) {
  const [search,     setSearch]     = useState("");
  const [selectedTenantnames, setSelectedTenantnames] = useState([]);
  const [statusSelection, setStatusSelection] = useState(null);

  const selectedStatuses = useMemo(() => {
    if (statusSelection === null) return statuses;
    return statusSelection.filter((status) => statuses.includes(status));
  }, [statusSelection, statuses]);

  const allStatusesSelected = statuses.length > 0 && selectedStatuses.length === statuses.length;
  const statusFilterActive = selectedStatuses.length > 0 && !allStatusesSelected;

  const statusNames = selectedStatuses.map((s) => (s === "true" ? "Active" : "Inactive"));
  const statusLabel = statuses.length === 0
    ? "No statuses"
    : selectedStatuses.length === 0
      ? "No status"
      : allStatusesSelected
        ? "All statuses"
        : statusNames.join(", ");

  const activeFilterCount = [selectedTenantnames.length > 0, statusFilterActive].filter(Boolean).length;

  const resolveStatuses = (nextStatuses) => {
    if (statuses.length === 0) return nextStatuses;
    return nextStatuses.length === statuses.length ? [] : nextStatuses;
  };

  const emit = (overrides = {}) => {
    const statusValue = Object.prototype.hasOwnProperty.call(overrides, "status")
      ? overrides.status
      : selectedStatuses;
    onFilter({
      search,
      tenantname: selectedTenantnames,
      ...overrides,
      status: resolveStatuses(statusValue),
    });
  };

  const handleSearch = (e) => {
    setSearch(e.target.value);
    emit({ search: e.target.value });
  };

  const handleTenantname = (value) => {
    const updated = selectedTenantnames.includes(value)
      ? selectedTenantnames.filter((t) => t !== value)
      : [...selectedTenantnames, value];
    setSelectedTenantnames(updated);
    emit({ tenantname: updated });
  };

  const handleStatus = (value) => {
    const updated = selectedStatuses.includes(value)
      ? selectedStatuses.filter((s) => s !== value)
      : [...selectedStatuses, value];
    setStatusSelection(updated);
    emit({ status: updated });
  };

  const handleSelectAllStatuses = () => {
    setStatusSelection(null);
    emit({ status: statuses });
  };

  const handleUnselectAllStatuses = () => {
    setStatusSelection([]);
    emit({ status: [] });
  };

  const clearOne = (key) => {
    if (key === "tenantname") { setSelectedTenantnames([]); emit({ tenantname: [] }); }
    if (key === "status")     { setStatusSelection(null);    emit({ status: statuses }); }
  };

  const clearAll = () => {
    setSearch("");
    setSelectedTenantnames([]);
    setStatusSelection(null);
    onFilter({ search: "", tenantname: [], status: resolveStatuses(statuses) });
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 px-4 py-3 border-b border-gray-200 dark:border-gray-800">

      <div className="relative flex-1 w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          value={search}
          onChange={handleSearch}
          placeholder="Search user name..."
          className="pl-9 pr-8"
        />
        {search && (
          <button
            onClick={() => { setSearch(""); emit({ search: "" }); }}
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
            className={`relative gap-2 ${
              activeFilterCount > 0
                ? "border-violet-500 bg-violet-50 text-violet-600 hover:bg-violet-100 dark:bg-violet-900/20 dark:text-violet-400 dark:border-violet-500 dark:hover:bg-violet-900/30"
                : ""
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <Badge className="h-4 w-4 p-0 flex items-center justify-center text-[10px] bg-violet-600 hover:bg-violet-600 text-white dark:bg-violet-500">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-72 p-4" align="end">
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
                {selectedTenantnames.length > 0 && (
                  <button onClick={() => clearOne("tenantname")}>
                    <X className="w-3 h-3 text-gray-400 hover:text-gray-600" />
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {tenantnames.length === 0 && (
                  <p className="text-xs text-gray-400 dark:text-gray-500">No clients available</p>
                )}
                {tenantnames.map((t) => (
                  <label key={t} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedTenantnames.includes(t)}
                      onChange={() => handleTenantname(t)}
                      className="w-4 h-4 rounded border-gray-300 text-violet-600 cursor-pointer"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{t}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Status</label>
                {statusFilterActive && (
                  <button onClick={() => clearOne("status")}>
                    <X className="w-3 h-3 text-gray-400 hover:text-gray-600" />
                  </button>
                )}
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center justify-between w-full h-9 px-3 text-sm rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <span className="truncate">{statusLabel}</span>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-2" align="start">
                  <div className="flex items-center justify-between px-1 pb-2">
                    <button
                      type="button"
                      onClick={handleSelectAllStatuses}
                      disabled={statuses.length === 0}
                      className="text-xs text-violet-600 disabled:text-gray-400"
                    >
                      Select all
                    </button>
                    <button
                      type="button"
                      onClick={handleUnselectAllStatuses}
                      disabled={statuses.length === 0}
                      className="text-xs text-gray-600 dark:text-gray-300 disabled:text-gray-400"
                    >
                      Unselect all
                    </button>
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-2 px-1">
                    {statuses.length === 0 ? (
                      <p className="text-xs text-gray-400 dark:text-gray-500">No statuses available</p>
                    ) : (
                      statuses.map((s) => (
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