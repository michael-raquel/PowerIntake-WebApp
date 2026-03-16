"use client";

import { useState } from 'react';
import { Search, Filter, Plus, X, SlidersHorizontal } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const FILTER_CONFIG = {
  'my-client': ['Client', 'Priority', 'Category', 'Status'],
  'my-company': ['Department', 'Priority', 'Category', 'Status'],
  'my-team': ['Priority', 'Category', 'Status'],
  'my-ticket': ['Priority', 'Category', 'Status'],
};

const PRIORITY_OPTIONS = ['High', 'Medium', 'Low'];

export default function ComFilters({
  onSearch,
  searchValue,
  onCreateTicket,
  activeTab,
  selectedFilters = {},
  onFiltersChange,
  filterOptions = {},
}) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const filtersForTab = FILTER_CONFIG[activeTab] || [];
  
  const activeFilterCount = Object.entries(selectedFilters).filter(
    ([_, v]) => v && typeof v === 'string' && v.trim() !== ''
  ).length;

  const getOptionsForFilter = (filter) => {
    if (filter === 'Priority') return PRIORITY_OPTIONS;

    const options = filterOptions[filter] || [];
    const uniqueOptions = [...new Set(options.map(v => String(v).trim()).filter(Boolean))];
    const selected = selectedFilters[filter];

    return selected && !uniqueOptions.includes(selected)
      ? [selected, ...uniqueOptions]
      : uniqueOptions;
  };

  const handleFilterChange = (filter, value) => {
    if (!value) return;
    onFiltersChange({ ...selectedFilters, [filter]: value });
  };

  const clearFilter = (filter) => {
    const next = { ...selectedFilters };
    delete next[filter];
    onFiltersChange(next);
  };

  const handleInputChange = (filter, e) => {
    const value = e.target.value;
    if (value === '') {
      clearFilter(filter);
    } else {
      onFiltersChange({ ...selectedFilters, [filter]: value });
    }
  };

  return (
    <div className="flex flex-row items-center gap-2 w-full">
      <div className="relative flex-1 min-w-[150px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
        <Input
          value={searchValue}
          onChange={(e) => onSearch?.(e.target.value)}
          placeholder="Search username or ID"
          className="pl-9 w-full dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100 dark:placeholder:text-gray-500"
        />
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="relative gap-2 dark:border-gray-700 dark:hover:bg-gray-800 dark:text-gray-300">
              <SlidersHorizontal className="w-4 h-4" />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center dark:bg-gray-700 dark:text-gray-200">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>

          <PopoverContent className="w-72 p-4 dark:bg-gray-900 dark:border-gray-800" align="end">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm dark:text-gray-200">Filter by</h4>
                {activeFilterCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={() => onFiltersChange({})} className="h-8 text-xs dark:text-gray-300 dark:hover:bg-gray-800">
                    Clear all
                  </Button>
                )}
              </div>

              {filtersForTab.map((filter) => {
                const options = getOptionsForFilter(filter);
                const currentValue = selectedFilters[filter] || '';

                if (filter === 'Client' || filter === 'Manager') {
                  return (
                    <div key={filter} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium dark:text-gray-300">{filter}</span>
                        {currentValue && (
                          <Button variant="ghost" size="icon" className="h-5 w-5 dark:text-gray-400 dark:hover:bg-gray-800" onClick={() => clearFilter(filter)}>
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                      <div className="relative">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                        <Input
                          value={currentValue}
                          onChange={(e) => handleInputChange(filter, e)}
                          placeholder={`Search ${filter.toLowerCase()}...`}
                          className="pl-7 w-full dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
                        />
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={filter} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium dark:text-gray-300">{filter}</span>
                      {currentValue && (
                        <Button variant="ghost" size="icon" className="h-5 w-5 dark:text-gray-400 dark:hover:bg-gray-800" onClick={() => clearFilter(filter)}>
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>

                    <Select
                      value={currentValue || ''}
                      onValueChange={(value) => handleFilterChange(filter, value)}
                      disabled={!options.length}
                    >
                      <SelectTrigger className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 dark:focus:ring-gray-700">
                        <SelectValue placeholder={options.length ? `Select ${filter}` : 'No options'} />
                      </SelectTrigger>
                      <SelectContent className="dark:bg-gray-900 dark:border-gray-800">
                        {options.length ? (
                          options.map((opt) => (
                            <SelectItem key={`${filter}-${opt}`} value={opt} className="dark:text-gray-200 dark:focus:bg-gray-800 dark:focus:text-gray-100">
                              {opt}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-options" disabled className="dark:text-gray-500">
                            No options available
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>

        <Button
          onClick={onCreateTicket}
          className="gap-2 shrink-0 bg-purple-600 hover:bg-purple-700 text-white"
        >
          <Plus className="w-4 h-4" />
          New
        </Button>
      </div>
    </div>
  );
}