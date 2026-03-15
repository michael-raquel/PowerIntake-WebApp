"use client";

import { useState } from 'react';
import { Search, Filter, Plus, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const FILTER_CONFIG = {
  'my-client': ['Client', 'Manager', 'Priority', 'Category', 'Status'],
  'my-company': ['Manager', 'Priority', 'Category', 'Status'],
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
  const activeFilterCount = Object.keys(selectedFilters).length;

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

  return (
    <div className="flex items-center gap-2 w-full">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          value={searchValue}
          onChange={(e) => onSearch?.(e.target.value)}
          placeholder="Search username or ID"
          className="pl-9 w-full"
        />
      </div>

      <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="icon" className="relative shrink-0">
            <Filter className="w-4 h-4" />
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-72 p-4" align="end">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">Filter by</h4>
              {activeFilterCount > 0 && (
                <Button variant="ghost" size="sm" onClick={() => onFiltersChange({})} className="h-8 text-xs">
                  Clear all
                </Button>
              )}
            </div>

            {filtersForTab.map((filter) => {
              const options = getOptionsForFilter(filter);
              const currentValue = selectedFilters[filter];

              return (
                <div key={filter} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium">{filter}</span>
                    {currentValue && (
                      <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => clearFilter(filter)}>
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>

                  <Select
                    value={currentValue || ''}
                    onValueChange={(value) => handleFilterChange(filter, value)}
                    disabled={!options.length}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={options.length ? `Select ${filter}` : 'No options'} />
                    </SelectTrigger>
                    <SelectContent>
                      {options.length ? (
                        options.map((opt) => (
                          <SelectItem key={`${filter}-${opt}`} value={opt}>
                            {opt}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-options" disabled>
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

      <Button onClick={onCreateTicket} className="gap-2 shrink-0">
        <Plus className="w-4 h-4" />
        New
      </Button>
    </div>
  );
}