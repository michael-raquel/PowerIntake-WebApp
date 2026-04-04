"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Search, Plus, X, SlidersHorizontal, Eye, EyeOff, ChevronDown } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

const FILTER_CONFIG = {
  'my-client': ['Client', 'Department', 'Source', 'Priority', 'Category', 'Ticket Status'],
  'my-company': ['Department', 'Source', 'Priority', 'Category', 'Ticket Status'],
  'my-team': ['Source', 'Priority', 'Category', 'Ticket Status'],
  'my-ticket': ['Source', 'Priority', 'Category', 'Ticket Status'],
};

const TEXT_INPUT_FILTERS = new Set(['Client', 'Manager']);

export default function ComFilters({
  onSearch,
  searchValue,
  onCreateTicket,
  activeTab,
  selectedFilters = {},
  onFiltersChange,
  filterOptions = {},
  hideCompleted = false,
  onHideCompletedChange,
}) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const prevOptionsRef = useRef({});

  const filtersForTab = useMemo(() => FILTER_CONFIG[activeTab] || [], [activeTab]);

  const getOptions = useCallback(
    (filter) =>
      [...new Set((filterOptions[filter] || []).map((v) => String(v)).filter((v) => v))],
    [filterOptions]
  );

  const getSelected = useCallback(
    (filter) => {
      const v = selectedFilters[filter];
      return Array.isArray(v) ? v : v ? [v] : [];
    },
    [selectedFilters]
  );

  useEffect(() => {
    const next = { ...selectedFilters };
    let changed = false;

    for (const filter of filtersForTab) {
      if (TEXT_INPUT_FILTERS.has(filter)) continue;

      const options = getOptions(filter);
      const prev = prevOptionsRef.current[filter] || [];
      const selected = getSelected(filter);

      if (options.length > 0 && prev.length === 0 && selected.length === 0) {
        next[filter] = [...options];
        changed = true;
      } else if (options.length > prev.length && selected.length > 0) {
        next[filter] = [...new Set([...selected, ...options.filter((o) => !prev.includes(o))])];
        changed = true;
      }
    }

    prevOptionsRef.current = Object.fromEntries(filtersForTab.map((f) => [f, getOptions(f)]));
    if (changed) onFiltersChange(next);
  }, [filtersForTab, getOptions, getSelected, onFiltersChange, selectedFilters]);

  const activeFilterCount = filtersForTab.filter((filter) => {
    if (TEXT_INPUT_FILTERS.has(filter)) {
      const v = selectedFilters[filter];
      return !!v?.trim();
    }
    const selected = getSelected(filter);
    const options = getOptions(filter);
    return selected.length > 0 && selected.length < options.length;
  }).length + (hideCompleted ? 1 : 0);

  const updateFilter = (filter, value) => onFiltersChange({ ...selectedFilters, [filter]: value || undefined });
  const clearFilter = (filter) => { const next = { ...selectedFilters }; delete next[filter]; onFiltersChange(next); };
  const handleMultiSelect = (filter, option) => { const cur = getSelected(filter); const updated = cur.includes(option) ? cur.filter(v => v !== option) : [...cur, option]; updateFilter(filter, updated.length ? updated : undefined); };
  const handleSelectAll = (filter, options) => { const cur = getSelected(filter); updateFilter(filter, cur.length === options.length ? undefined : [...options]); };
  const handleMainPopoverChange = (open) => { setIsFilterOpen(open); if (!open) setOpenDropdown(null); };

  return (
    <div className="flex flex-row items-center gap-1 sm:gap-2 w-full">
      <div className="relative flex-1 min-w-[100px] sm:min-w-[150px]">
        <Search className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 w-3.5 h-3.5 sm:w-4 sm:h-4" />
        <Input
          value={searchValue}
          onChange={(e) => onSearch?.(e.target.value)}
          placeholder="Search..."
          className="pl-7 sm:pl-9 w-full dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100 dark:placeholder:text-gray-500 text-xs sm:text-sm h-8 sm:h-10"
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

      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        <Popover open={isFilterOpen} onOpenChange={handleMainPopoverChange}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="relative gap-1 sm:gap-2 px-2 sm:px-3 h-8 sm:h-10 bg-white text-gray-900 border-gray-300 hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800 dark:text-gray-300 dark:bg-gray-900">
              <SlidersHorizontal className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="text-xs sm:text-sm whitespace-nowrap">Filters</span>
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="absolute -top-2 -right-2 h-4 w-4 sm:h-5 sm:w-5 p-0 flex items-center justify-center text-[8px] sm:text-xs dark:bg-gray-700 dark:text-gray-200">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>

          <PopoverContent className="w-64 p-3 dark:bg-gray-900 dark:border-gray-800 max-h-[min(84vh,630px)] overflow-y-auto z-[29]" align="end" sideOffset={5} avoidCollisions={false}>
            <div className="space-y-3">
              <div className="flex items-center justify-between sticky top-0 bg-white dark:bg-gray-900 pb-1 z-[29]">
                <h4 className="font-medium text-sm dark:text-gray-200">Filter by</h4>
                {activeFilterCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={() => { onFiltersChange({}); onHideCompletedChange?.(false); }} className="h-7 text-xs dark:text-gray-300 dark:hover:bg-gray-800">
                    Clear all
                  </Button>
                )}
              </div>

              <div className="flex items-center justify-between py-1.5 px-2 bg-gray-50 dark:bg-gray-800/50 rounded-md">
                <div className="flex items-center gap-2">
                  {hideCompleted ? <EyeOff className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" /> : <Eye className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />}
                  <span className="text-xs font-medium dark:text-gray-300">Hide Completed Tickets</span>
                </div>
                <Switch checked={hideCompleted} onCheckedChange={() => onHideCompletedChange?.(!hideCompleted)} className="data-[state=checked]:bg-purple-600" />
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700" />

              {filtersForTab.map((filter) => {
                const options = getOptions(filter);
                const selectedValues = getSelected(filter);

                if (TEXT_INPUT_FILTERS.has(filter)) {
                  const currentValue = selectedValues[0] || '';
                  return (
                    <div key={filter} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium dark:text-gray-300">{filter}</span>
                        {currentValue && <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => clearFilter(filter)}><X className="h-3 w-3" /></Button>}
                      </div>
                      <div className="relative">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                        <Input value={currentValue} onChange={(e) => e.target.value ? updateFilter(filter, e.target.value) : clearFilter(filter)} placeholder={`Search ${filter.toLowerCase()}...`} className="pl-7 w-full dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 text-xs h-8" />
                      </div>
                    </div>
                  );
                }

                if (options.length === 0) return null;

                const isOpen = openDropdown === filter;
                const allSelected = selectedValues.length === options.length;
                const someSelected = selectedValues.length > 0 && !allSelected;
                const isNarrowed = someSelected;

                return (
                  <div key={filter} className="space-y-1 relative">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium dark:text-gray-300">{filter}</span>
                      {isNarrowed && <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => clearFilter(filter)}><X className="h-3 w-3" /></Button>}
                    </div>
                    <Popover open={isOpen} onOpenChange={(open) => setOpenDropdown(open ? filter : null)}>
                      <PopoverTrigger asChild>
                        <button className={`w-full flex items-center justify-between px-3 py-1.5 text-xs border rounded-md bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${isNarrowed ? 'border-purple-400 dark:border-purple-600' : ''}`}>
                          <span className="truncate">{allSelected ? 'All selected' : selectedValues.length > 0 ? `${selectedValues.length} of ${options.length} selected` : `Select ${filter}`}</span>
                          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-64 p-0 dark:bg-gray-800 dark:border-gray-700 z-[29]" align="start" side="bottom" sideOffset={5} avoidCollisions={true} collisionPadding={16}>
                        <div className="max-h-60 overflow-y-auto">
                          <div className="p-2 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">
                            <label className="flex items-center gap-2 px-2 py-1 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer">
                              <input type="checkbox" checked={allSelected} ref={(el) => { if (el) el.indeterminate = someSelected; }} onChange={() => handleSelectAll(filter, options)} className="h-3.5 w-3.5 rounded border-gray-300" />
                              <span className="text-xs font-medium dark:text-gray-300">Select All</span>
                            </label>
                          </div>
                          {options.map((opt) => (
                            <label key={opt} className="flex items-center gap-2 px-4 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                              <input type="checkbox" checked={selectedValues.includes(opt)} onChange={() => handleMultiSelect(filter, opt)} className="h-3.5 w-3.5 rounded border-gray-300" />
                              <span className="text-xs dark:text-gray-300">{opt}</span>
                            </label>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>

        <Button onClick={onCreateTicket} size="sm" className="gap-1 sm:gap-2 shrink-0 bg-purple-600 hover:bg-purple-700 text-white px-2 sm:px-3 h-8 sm:h-10">
          <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span className="text-xs sm:text-sm whitespace-nowrap">New</span>
        </Button>
      </div>
    </div>
  );
}