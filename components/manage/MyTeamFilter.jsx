import { Search, SlidersHorizontal, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function MyTeamFilter({
  onFiltersChange,
  searchValue = "",
  onSearch,
  statuses = [],
  selectedFilters = {},
  rowsPerPage = 10,
  onRowsPerPageChange,
  rowsPerPageDisabled = false,
}) {
  const rawSelectedStatuses = Array.isArray(selectedFilters.status)
    ? selectedFilters.status
    : selectedFilters.status
      ? [selectedFilters.status]
      : [];
  const selectedStatuses = rawSelectedStatuses.length === 0 && statuses.length > 0
    ? statuses
    : rawSelectedStatuses;

  const allStatusesSelected = statuses.length > 0 && selectedStatuses.length === statuses.length;
  const statusFilterActive = selectedStatuses.length > 0 && !allStatusesSelected;
  const activeFilterCount = statusFilterActive ? 1 : 0;

  const rowsValue = String(rowsPerPage ?? 10);

  const toggleStatus = (value) => {
    const next = selectedStatuses.includes(value)
      ? selectedStatuses.filter((s) => s !== value)
      : [...selectedStatuses, value];
    const nextStatuses = next.length === 0 && statuses.length > 0 ? statuses : next;
    const updated = { ...selectedFilters, status: nextStatuses };
    if (nextStatuses.length === 0) delete updated.status;
    onFiltersChange(updated);
  };

  const clearStatus = () => {
    if (statuses.length === 0) {
      const next = { ...selectedFilters };
      delete next.status;
      onFiltersChange(next);
      return;
    }
    onFiltersChange({ ...selectedFilters, status: statuses });
  };

  return (
    <div className="flex flex-row items-center gap-1 sm:gap-2 w-full">
      <div className="relative flex-1 min-w-[100px] sm:min-w-[150px]">
        <Search className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 w-3.5 h-3.5 sm:w-4 sm:h-4" />
        <Input
          value={searchValue}
          onChange={(e) => onSearch?.(e.target.value)}
          placeholder="Search user name..."
          className="pl-7 sm:pl-9 pr-8 w-full dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100 dark:placeholder:text-gray-500 text-xs sm:text-sm h-8 sm:h-10"
        />
        {searchValue && (
          <button
            onClick={() => onSearch?.("")}
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

        <PopoverContent className="w-64 p-4 dark:bg-gray-900 dark:border-gray-800" align="end">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900 dark:text-white">Filters</span>
              {activeFilterCount > 0 && (
                <button
                  onClick={() => onFiltersChange(statuses.length > 0 ? { status: statuses } : {})}
                  className="text-xs text-violet-600 dark:text-violet-400 hover:underline"
                >
                  Clear all
                </button>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Status</label>
                {statusFilterActive && (
                  <button onClick={clearStatus}>
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
                      onChange={() => toggleStatus(s)}
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

      {onRowsPerPageChange && (
        <div className="md:hidden">
          <Select value={rowsValue} onValueChange={onRowsPerPageChange} disabled={rowsPerPageDisabled}>
            <SelectTrigger size="sm" className="h-8 px-2 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="15">15</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}