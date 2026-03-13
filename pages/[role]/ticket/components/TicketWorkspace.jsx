import React, { useCallback, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { useAuth } from "@/context/AuthContext";
import { useFetchTicket } from "@/hooks/UseFetchTicket";
import TicketFilters from "./TicketFilters";
import TicketTable from "./TicketTable";
import ComCreateTicket from "@/pages/[role]/ticket/components/ComCreateTicket";
import ComUpdateForm from "@/pages/[role]/ticket/components/ComUpdateForm";

const RECORDS_PER_PAGE = 10;

export default function TicketWorkspace({ routeRole = null }) {
  const { tokenInfo } = useAuth();
  const accountRoles = tokenInfo?.account?.roles ?? [];
  const hasDirectReports = tokenInfo?.account?.hasDirectReports ?? false;

  const resolvedRole = accountRoles.includes("SuperAdmin")
    ? "super-admin"
    : accountRoles.includes("Admin")
      ? "admin"
      : accountRoles.includes("Manager")
        ? "manager"
        : "user";

  const role = routeRole || resolvedRole;

  const [activeView, setActiveView] = useState("my-ticket");
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreateTicket, setShowCreateTicket] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [selectedFilters, setSelectedFilters] = useState({});
  const [selectedTicket, setSelectedTicket] = useState(null);

  const viewConfigById = {
    "my-client": {
      id: "my-client",
      label: "My Client",
      scope: "tenant",
      filters: ["Client", "Manager", "Priority", "Category", "Status"],
      searchableFields: ["ticketnumber", "tenant", "user", "title", "category"],
      cardFields: ["tenant", "user", "title", "category", "priority", "created", "status", "technician"],
      columns: ["ticketnumber", "tenant", "user", "title", "category", "priority", "created", "status", "technician"],
    },
    "my-company": {
      id: "my-company",
      label: "My Company",
      scope: "company",
      filters: ["Manager", "Priority", "Category", "Status"],
      searchableFields: ["ticketnumber", "department", "user", "title", "category"],
      cardFields: ["department", "user", "title", "category", "priority", "created", "status", "technician"],
      columns: ["ticketnumber", "department", "user", "title", "category", "priority", "created", "status", "technician"],
    },
    "my-team": {
      id: "my-team",
      label: "My Team",
      scope: "team",
      filters: ["Priority", "Category", "Status"],
      searchableFields: ["ticketnumber", "user", "title", "category"],
      cardFields: ["user", "title", "category", "priority", "created", "status", "technician"],
      columns: ["ticketnumber", "user", "title", "category", "priority", "created", "status", "technician"],
    },
    "my-ticket": {
      id: "my-ticket",
      label: "My Ticket",
      scope: "own",
      filters: ["Priority", "Category", "Status"],
      searchableFields: ["ticketnumber", "title", "category"],
      cardFields: ["title", "category", "priority", "created", "status", "technician"],
      columns: ["ticketnumber", "title", "category", "priority", "created", "status", "technician"],
    },
  };

  const baseViewIds = role === "super-admin"
    ? ["my-client", "my-company", "my-ticket"]
    : role === "admin"
      ? ["my-company", "my-ticket"]
      : role === "manager"
        ? ["my-ticket"]
        : ["my-ticket"];

  const roleViewIds = hasDirectReports
    ? ["my-team", ...baseViewIds]
    : baseViewIds;

  const activeViewId = roleViewIds.includes(activeView) ? activeView : "my-ticket";
  const roleViews = roleViewIds.map((id) => viewConfigById[id]).filter(Boolean);
  const viewConfig = viewConfigById[activeViewId];

  const currentUserId = tokenInfo?.account?.localAccountId ?? null;
  const { tickets: allTickets, loading, error } = useFetchTicket({
    ticketuuid: null,
    entrauserid: currentUserId,
    role,
    view: activeViewId,
  });

  const normalizeValue = (value) => String(value ?? "").trim().toLowerCase();

  const getTicketValue = (ticket, field) => {
    const fieldMap = {
      ticketnumber: ["v_ticketnumber", "v_ticketid", "ticketid", "id"],
      tenant: ["v_tenantname", "tenantname"],
      department: ["v_department", "department"],
      user: ["v_username", "username"],
      title: ["v_title", "title"],
      category: ["v_ticketcategory", "ticketcategory"],
      priority: ["v_priority", "priority"],
      created: ["v_createdat", "createdat"],
      status: ["v_status", "status"],
      technician: ["v_technicianname", "technicianname"],
      manager: ["v_managername", "v_technicianname", "managername"],
      ownerId: ["v_entrauserid", "entrauserid"],
    };

    const keys = fieldMap[field] ?? [field];
    for (const key of keys) {
      const value = ticket?.[key];
      if (value !== null && value !== undefined && value !== "") return value;
    }
    return null;
  };

  const scopedTickets = useMemo(() => {
    if (!Array.isArray(allTickets)) return [];
    if (viewConfig?.scope !== "own") return allTickets;
    return allTickets.filter(
      (ticket) => normalizeValue(getTicketValue(ticket, "ownerId")) === normalizeValue(currentUserId)
    );
  }, [allTickets, viewConfig?.scope, currentUserId]);

  const filterFieldMap = {
    Client: "tenant",
    Manager: "manager",
    Priority: "priority",
    Category: "category",
    Status: "status",
  };

  const filterOptions = (() => {
    const options = {};
    for (const filter of viewConfig?.filters ?? []) {
      const field = filterFieldMap[filter];
      options[filter] = [
        ...new Set(
          scopedTickets
            .map((ticket) => getTicketValue(ticket, field))
            .map((v) => String(v ?? "").trim())
            .filter(Boolean)
        ),
      ];
    }
    return options;
  })();

  const query = normalizeValue(searchValue);
  const filteredTickets = scopedTickets.filter((ticket) => {
    const searchOk =
      !query ||
      (viewConfig?.searchableFields ?? []).some((field) =>
        normalizeValue(getTicketValue(ticket, field)).includes(query)
      );

    const filterOk = Object.entries(selectedFilters).every(([filterKey, selected]) => {
      if (!selected) return true;
      const field = filterFieldMap[filterKey];
      return normalizeValue(getTicketValue(ticket, field)) === normalizeValue(selected);
    });

    return searchOk && filterOk;
  });

  const totalRecords = filteredTickets.length;
  const startIndex = (currentPage - 1) * RECORDS_PER_PAGE;
  const tickets = filteredTickets.slice(startIndex, startIndex + RECORDS_PER_PAGE);
  const totalPages = Math.max(1, Math.ceil(totalRecords / RECORDS_PER_PAGE));

  const handleViewChange = useCallback((viewId) => {
    setActiveView(viewId);
    setCurrentPage(1);
    setSearchValue("");
    setSelectedFilters({});
  }, []);

  const handlePageChange = useCallback(
    (page) => {
      if (page >= 1 && page <= totalPages) setCurrentPage(page);
    },
    [totalPages]
  );

  const handleFiltersChange = useCallback((filters) => {
    setSelectedFilters(filters);
    setCurrentPage(1);
  }, []);

  const handleSearch = useCallback((value) => {
    setSearchValue(value);
    setCurrentPage(1);
  }, []);

  const paginationInfo = useMemo(() => {
    if (totalRecords === 0) return null;
    const start = (currentPage - 1) * RECORDS_PER_PAGE + 1;
    const end = Math.min(currentPage * RECORDS_PER_PAGE, totalRecords);
    return { start, end };
  }, [currentPage, totalRecords]);

  if (showCreateTicket) {
    return <ComCreateTicket onClose={() => setShowCreateTicket(false)} />;
  }

  return (
    <div className="flex-1 bg-gray-50 dark:bg-black min-h-screen transition-colors duration-300">
      <div className="p-4 sm:p-6 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
          <div className="border-b border-gray-200 dark:border-gray-800 sm:flex-1">
            <nav className="flex flex-wrap gap-x-6 gap-y-2">
              {roleViews.map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => handleViewChange(id)}
                  className={`
                    pb-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
                    ${activeViewId === id
                      ? "border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-700"
                    }
                  `}
                >
                  {label}
                </button>
              ))}
            </nav>
          </div>

          <div className="w-full sm:w-auto">
            <TicketFilters
              onCreateTicket={() => setShowCreateTicket(true)}
              onSearch={handleSearch}
              searchValue={searchValue}
              viewConfig={viewConfig}
              selectedFilters={selectedFilters}
              onFiltersChange={handleFiltersChange}
              filterOptions={filterOptions}
            />
          </div>
        </div>

        <div className="mb-4">
          <TicketTable
            tickets={tickets}
            loading={loading}
            error={error}
            viewConfig={viewConfig}
            onRowClick={setSelectedTicket}
          />
        </div>

        {totalRecords > 0 && (
          <div className="bg-white dark:bg-gray-900 px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-sm text-gray-700 dark:text-gray-300 order-2 sm:order-1">
              Showing{" "}
              <span className="font-medium text-gray-900 dark:text-white">{paginationInfo?.start}</span> to{" "}
              <span className="font-medium text-gray-900 dark:text-white">{paginationInfo?.end}</span> of{" "}
              <span className="font-medium text-gray-900 dark:text-white">{totalRecords}</span> records
            </div>

            <div className="flex space-x-2 order-1 sm:order-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`
                  px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-md transition-colors
                  ${currentPage === 1
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-500"
                    : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800 dark:border-gray-700"
                  }
                `}
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`
                  px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-md transition-colors
                  ${currentPage === totalPages
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-500"
                    : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800 dark:border-gray-700"
                  }
                `}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedTicket && (
        <ComUpdateForm ticket={selectedTicket} onClose={() => setSelectedTicket(null)} />
      )}
    </div>
  );
}

TicketWorkspace.propTypes = {
  routeRole: PropTypes.string,
};