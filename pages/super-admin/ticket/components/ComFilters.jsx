import React, { useState } from 'react';
import { Search, Filter, Plus, X } from 'lucide-react';
import PropTypes from 'prop-types';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const FILTER_OPTIONS = {
  'my-client': ['Client', 'Manager', 'Priority', 'Category', 'Status'],
  'my-company': ['Manager', 'Priority', 'Category', 'Status'],
  'my-team': ['Priority', 'Category', 'Status'],
  'my-ticket': ['Priority', 'Category', 'Status'],
};

export default function ComFilters({ onSearch, searchValue, onCreateTicket, activeTab }) {
  const [selectedFilters, setSelectedFilters] = useState({});
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const handleFilterChange = (filter, value) => {
    setSelectedFilters(prev => ({ ...prev, [filter]: value }));
  };

  const clearFilter = (filter) => {
    setSelectedFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[filter];
      return newFilters;
    });
  };

  const activeFilters = Object.keys(selectedFilters).length;

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
            {activeFilters > 0 && (
              <Badge variant="secondary" className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center">
                {activeFilters}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-4" align="end">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">Filter by</h4>
              {activeFilters > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSelectedFilters({})}
                  className="h-8 text-xs"
                >
                  Clear all
                </Button>
              )}
            </div>
            
            {FILTER_OPTIONS[activeTab]?.map((filter) => (
              <div key={filter} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">{filter}</span>
                  {selectedFilters[filter] && (
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
                  value={selectedFilters[filter] || ''}
                  onValueChange={(value) => handleFilterChange(filter, value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={`Select ${filter}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {filter === 'Priority' && (
                      <>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </>
                    )}
                    {filter === 'Category' && (
                      <>
                        <SelectItem value="internal">Internal Work</SelectItem>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="rma">RMA</SelectItem>
                      </>
                    )}
                    {filter === 'Status' && (
                      <>
                        <SelectItem value="submitted">Submitted</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                      </>
                    )}
                    {filter === 'Client' && (
                      <>
                        <SelectItem value="sparta">Sparta Services</SelectItem>
                        <SelectItem value="are">A.R.E Auto Parts</SelectItem>
                        <SelectItem value="brigs">BRIGS LLC</SelectItem>
                      </>
                    )}
                    {filter === 'Manager' && (
                      <>
                        <SelectItem value="sarah">Sarah</SelectItem>
                        <SelectItem value="alex">Alex</SelectItem>
                        <SelectItem value="ken">Ken</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>

        <Button onClick={onCreateTicket} className="gap-2 w-auto sm:w-auto justify-center">
        <Plus className="w-4 h-4" />
        <span>New</span>
      </Button>
    </div>
  );
}

ComFilters.propTypes = {
  onSearch: PropTypes.func,
  searchValue: PropTypes.string,
  onCreateTicket: PropTypes.func,
  activeTab: PropTypes.string.isRequired,
};

ComFilters.defaultProps = {
  onSearch: undefined,
  searchValue: '',
  onCreateTicket: undefined,
};