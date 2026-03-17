import { useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function ClientsFilter({
  onFilter,
  tenantnames = [],
  statuses    = [],
}) {
  const [search,     setSearch]     = useState("");
  const [tenantname, setTenantname] = useState("");
  const [status,     setStatus]     = useState("");

  const activeFilterCount = [tenantname, status].filter(Boolean).length;

  const emit = (overrides = {}) => {
    onFilter({
      search,
      tenantname,
      status,
      ...overrides,
    });
  };

  const handleSearch = (e) => {
    setSearch(e.target.value);
    emit({ search: e.target.value });
  };

  const handleTenantname = (val) => {
    const v = val === "__all__" ? "" : val;
    setTenantname(v);
    emit({ tenantname: v });
  };

  const handleStatus = (val) => {
    const v = val === "__all__" ? "" : val;
    setStatus(v);
    emit({ status: v });
  };

  const clearOne = (key) => {
    if (key === "tenantname") { setTenantname(""); emit({ tenantname: "" }); }
    if (key === "status")     { setStatus("");     emit({ status: "" }); }
  };

  const clearAll = () => {
    setSearch(""); setTenantname(""); setStatus("");
    onFilter({ search: "", tenantname: "", status: "" });
  };

  return (
    <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 dark:border-gray-800">

      <div className="relative flex-1">
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
                {tenantname && (
                  <button onClick={() => clearOne("tenantname")}>
                    <X className="w-3 h-3 text-gray-400 hover:text-gray-600" />
                  </button>
                )}
              </div>
              <Select value={tenantname || "__all__"} onValueChange={handleTenantname}>
                <SelectTrigger className="h-9 text-sm w-full">
                  <SelectValue placeholder="All Clients" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Clients</SelectItem>
                  {tenantnames.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                    <SelectItem key={s} value={s}>
                      {s === "true" ? "Active" : "Inactive"}
                    </SelectItem>
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