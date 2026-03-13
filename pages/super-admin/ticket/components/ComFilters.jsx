// components/ComFilters.jsx
import React, { useState, useMemo, useCallback } from 'react';
import { Search, Filter, Plus, X } from 'lucide-react';
import PropTypes from 'prop-types';
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
const EMPTY_PREFIX = '__empty__';

const normalizeOptions = (arr = []) => 
  [...new Set(arr.map(v => String(v ?? '').trim()).filter(Boolean))];

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

  const filtersForTab = FILTER_CONFIG[activeTab] ?? [];
  const activeFilterCount = Object.keys(selectedFilters).length;

  const optionsByFilter = useMemo(() => {
    const result = {};
    
    for (const filter of filtersForTab) {
      if (filter === 'Priority') {
        result[filter] = PRIORITY_OPTIONS;
        continue;
      }
      
      const options = normalizeOptions(filterOptions[filter]);
      const selected = selectedFilters[filter];
      
      result[filter] = selected && !options.includes(selected) 
        ? [selected, ...options] 
        : options;
    }
    
    return result;
  }, [filtersForTab, filterOptions, selectedFilters]);

  const handleFilterChange = useCallback((filter, value) => {
    if (!value || value.startsWith(EMPTY_PREFIX)) return;
    
    onFiltersChange({
      ...selectedFilters,
      [filter]: value,
    });
  }, [selectedFilters, onFiltersChange]);

  const clearFilter = useCallback((filter) => {
    const next = { ...selectedFilters };
    delete next[filter];
    onFiltersChange(next);
  }, [selectedFilters, onFiltersChange]);

  const clearAllFilters = useCallback(() => {
    onFiltersChange({});
  }, [onFiltersChange]);

  return (
    <div className="flex flex-row items-center gap-2 w-full">
      <div className="relative flex-1 min-w-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
        <Input
          type="text"
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
              <Badge 
                variant="secondary" 
                className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center"
              >
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
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearAllFilters} 
                  className="h-8 text-xs"
                >
                  Clear all
                </Button>
              )}
            </div>

            {filtersForTab.map((filter) => {
              const options = optionsByFilter[filter] ?? [];
              const hasOptions = options.length > 0;
              const currentValue = selectedFilters[filter];

              return (
                <div key={filter} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium">{filter}</span>
                    {currentValue && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-5 w-5" 
                        onClick={() => clearFilter(filter)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>

                  <Select
                    value={currentValue || ''}
                    onValueChange={(value) => handleFilterChange(filter, value)}
                    disabled={!hasOptions}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={hasOptions ? `Select ${filter}` : 'No options'} />
                    </SelectTrigger>
                    <SelectContent>
                      {hasOptions ? (
                        options.map((opt) => (
                          <SelectItem key={`${filter}-${opt}`} value={opt}>
                            {opt}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value={`${EMPTY_PREFIX}${filter}`} disabled>
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

      <Button onClick={onCreateTicket} className="gap-2 w-auto shrink-0">
        <Plus className="w-4 h-4" />
        <span>New</span>
      </Button>
    </div>
  );
}

ComFilters.propTypes = {
  onSearch: PropTypes.func,
  searchValue: PropTypes.string,
  onCreateTicket: PropTypes.func.isRequired,
  activeTab: PropTypes.string.isRequired,
  selectedFilters: PropTypes.object,
  onFiltersChange: PropTypes.func.isRequired,
  filterOptions: PropTypes.object,
};