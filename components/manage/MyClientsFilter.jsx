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

  const someStatusesSelected = selectedStatuses.length > 0 && !allStatusesSelected;
  const handleToggleAllStatuses = () => {
    if (allStatusesSelected) {
      handleUnselectAllStatuses();
    } else {
      handleSelectAllStatuses();
    }
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
                {selectedTenantnames.length > 0 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={() => clearOne("tenantname")}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
              <div className="max-h-60 overflow-y-auto space-y-1">
                {tenantnames.length === 0 && (
                  <p className="text-xs text-gray-400 dark:text-gray-500">No clients available</p>
                )}
                {tenantnames.map((t) => (
                  <label key={t} className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedTenantnames.includes(t)}
                      onChange={() => handleTenantname(t)}
                      className="h-3.5 w-3.5 rounded border-gray-300"
                    />
                    <span className="text-xs dark:text-gray-300">{t}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-1 relative">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium dark:text-gray-300">Status</span>
                {statusFilterActive && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={() => clearOne("status")}
                  >
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
                          ref={(el) => { if (el) el.indeterminate = someStatusesSelected; }}
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