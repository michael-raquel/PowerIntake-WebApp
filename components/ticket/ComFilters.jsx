"use client";

import { useState } from 'react';
import { Search, Filter, Plus, X, SlidersHorizontal, Eye, EyeOff } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

const FILTER_CONFIG = {
  'my-client': ['Client', 'Department', 'Source', 'Priority', 'Category', 'Status'],
  'my-company': ['Department', 'Source', 'Priority', 'Category', 'Status'],
  'my-team': ['Source', 'Priority', 'Category', 'Status'],
  'my-ticket': ['Source', 'Priority', 'Category', 'Status'],
};

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

  const filtersForTab = FILTER_CONFIG[activeTab] || [];
  
  const activeFilterCount = Object.entries(selectedFilters).filter(
    ([_, v]) => v && typeof v === 'string' && v.trim() !== ''
  ).length + (hideCompleted ? 1 : 0);

  const getOptionsForFilter = (filter) => {
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

  const handleHideCompletedToggle = () => {
    onHideCompletedChange?.(!hideCompleted);
  };

  const clearAllFilters = () => {
    onFiltersChange({});
    if (hideCompleted) {
      onHideCompletedChange?.(false);
    }
  };

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
      </div>

      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className="relative gap-1 sm:gap-2 px-2 sm:px-3 h-8 sm:h-10
                bg-white text-gray-900 border-gray-300
                hover:bg-gray-100
                dark:border-gray-700 dark:hover:bg-gray-800 dark:text-gray-300 dark:bg-gray-900"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="text-xs sm:text-sm whitespace-nowrap">Filters</span>
              {activeFilterCount > 0 && (
                <Badge 
                  variant="secondary" 
                  className="absolute -top-2 -right-2 h-4 w-4 sm:h-5 sm:w-5 p-0 flex items-center justify-center text-[8px] sm:text-xs dark:bg-gray-700 dark:text-gray-200"
                >
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
                  <Button variant="ghost" size="sm" onClick={clearAllFilters} className="h-8 text-xs dark:text-gray-300 dark:hover:bg-gray-800">
                    Clear all
                  </Button>
                )}
              </div>

              <div className="flex items-center justify-between py-2 px-1 bg-gray-50 dark:bg-gray-800/50 rounded-md">
                <div className="flex items-center gap-2">
                  {hideCompleted ? (
                    <EyeOff className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                  ) : (
                    <Eye className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                  )}
                  <span className="text-xs font-medium dark:text-gray-300">Hide Completed Tickets</span>
                </div>
                <Switch
                  checked={hideCompleted}
                  onCheckedChange={handleHideCompletedToggle}
                  className="data-[state=checked]:bg-purple-600"
                />
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700" />

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
                          className="pl-7 w-full dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 text-xs h-8"
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
                      <SelectTrigger className="w-full dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 dark:focus:ring-gray-700 h-8 text-xs">
                        <SelectValue placeholder={options.length ? `Select ${filter}` : 'No options'} />
                      </SelectTrigger>
                      <SelectContent className="dark:bg-gray-900 dark:border-gray-800">
                        {options.length ? (
                          options.map((opt) => (
                            <SelectItem key={`${filter}-${opt}`} value={opt} className="dark:text-gray-200 dark:focus:bg-gray-800 dark:focus:text-gray-100 text-xs">
                              {opt}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-options" disabled className="dark:text-gray-500 text-xs">
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
          size="sm"
          className="gap-1 sm:gap-2 shrink-0 bg-purple-600 hover:bg-purple-700 text-white px-2 sm:px-3 h-8 sm:h-10"
        >
          <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span className="text-xs sm:text-sm whitespace-nowrap">New</span>
        </Button>
      </div>
    </div>
  );
}