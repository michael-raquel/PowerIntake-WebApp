import React from "react";
import PropTypes from "prop-types";

export default function TicketTable({ tickets, loading, error, viewConfig, onRowClick }) {
  const columns = viewConfig?.columns ?? [];
  const cardFields = viewConfig?.cardFields ?? [];

  const getTicketValue = (ticket, field) => {
    const fieldMap = {
      ticketuuid: ["ticketuuid", "v_ticketuuid"],
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
    };

    const keys = fieldMap[field] ?? [field];
    for (const key of keys) {
      const value = ticket?.[key];
      if (value !== null && value !== undefined && value !== "") return value;
    }
    return null;
  };

  const getColumnLabel = (column) => {
    const labels = {
      ticketnumber: "Ticket #",
      tenant: "Client",
      department: "Department",
      user: "User",
      title: "Title",
      category: "Category",
      priority: "Priority",
      created: "Created",
      status: "Status",
      technician: "Technician",
      manager: "Manager",
    };
    return labels[column] ?? column;
  };

  const getPriorityColor = (priority) => {
    const value = String(priority ?? "").toLowerCase();
    if (value === "critical") return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
    if (value === "high") return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
    if (value === "medium") return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
    if (value === "low") return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
  };

  const formatTicketValue = (field, value) => {
    if (value === null || value === undefined || value === "") return "-";
    if (field === "created") {
      const date = new Date(value);
      if (!Number.isNaN(date.getTime())) return date.toLocaleString();
    }
    return String(value);
  };

  if (loading) return <p className="text-center py-6 text-sm text-gray-500 dark:text-gray-400">Loading...</p>;
  if (error) return <p className="text-center py-6 text-sm text-red-500">{error}</p>;

  return (
    <>
      <div className="sm:hidden space-y-3 p-3">
        {tickets.length > 0 ? (
          tickets.map((ticket) => {
            const ticketId = formatTicketValue("ticketnumber", getTicketValue(ticket, "ticketnumber"));
            const priorityValue = getTicketValue(ticket, "priority");
            const handleClick = () => onRowClick?.(ticket);

            return (
              <div
                key={getTicketValue(ticket, "ticketuuid") ?? getTicketValue(ticket, "ticketnumber")}
                className={`bg-white dark:bg-black rounded-lg border border-gray-200 dark:border-gray-800 hover:shadow-md transition-all duration-300 overflow-hidden ${
                  onRowClick ? "cursor-pointer" : ""
                }`}
                onClick={handleClick}
                role={onRowClick ? "button" : undefined}
                tabIndex={onRowClick ? 0 : undefined}
                onKeyDown={(e) => {
                  if (!onRowClick) return;
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleClick();
                  }
                }}
              >
                <div className="px-4 py-2 bg-gray-50 dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-medium text-gray-500 dark:text-slate-400">Ticket</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{ticketId}</span>
                  </div>
                  {priorityValue && (
                    <div className={`px-2 py-0.5 text-xs font-medium rounded border-l-2 border-transparent ${getPriorityColor(priorityValue)}`}>
                      {String(priorityValue)}
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    {cardFields.map((field) => {
                      const value = getTicketValue(ticket, field);
                      if (!value || field === "priority") return null;

                      return (
                        <div key={field} className="flex flex-col min-w-0">
                          <span className="text-[10px] font-medium text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                            {getColumnLabel(field)}
                          </span>
                          <span className="text-xs text-gray-700 dark:text-slate-300 truncate" title={String(value)}>
                            {formatTicketValue(field, value)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="px-4 py-1.5 bg-gray-50/50 dark:bg-slate-900/50 border-t border-gray-100 dark:border-slate-700 text-[10px] text-gray-400 dark:text-slate-500 flex justify-end">
                  <span>Click to view details</span>
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-sm text-center text-gray-500 dark:text-gray-400 py-6">No tickets found.</p>
        )}
      </div>

      <div className="hidden sm:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              {columns.map((column) => (
                <th
                  key={column}
                  scope="col"
                  className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  {getColumnLabel(column)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-black divide-y divide-gray-200 dark:divide-gray-800">
            {tickets.length > 0 ? (
              tickets.map((ticket) => (
                <tr
                  key={getTicketValue(ticket, "ticketuuid") ?? getTicketValue(ticket, "ticketnumber")}
                  onClick={() => onRowClick?.(ticket)}
                  className="hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors duration-150 cursor-pointer"
                >
                  {columns.map((column) => {
                    const value = getTicketValue(ticket, column);

                    if (column === "priority") {
                      return (
                        <td key={column} className="px-3 py-2 whitespace-nowrap">
                          <span
                            className={`px-1.5 py-0.5 inline-flex text-sm leading-3 font-semibold rounded-full ${getPriorityColor(
                              value
                            )}`}
                          >
                            {formatTicketValue(column, value)}
                          </span>
                        </td>
                      );
                    }

                    return (
                      <td
                        key={column}
                        className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 max-w-[120px] truncate"
                        title={value ? String(value) : ""}
                      >
                        {formatTicketValue(column, value)}
                      </td>
                    );
                  })}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={Math.max(columns.length, 1)} className="px-3 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                  No tickets found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

TicketTable.propTypes = {
  tickets: PropTypes.array.isRequired,
  loading: PropTypes.bool,
  error: PropTypes.string,
  viewConfig: PropTypes.shape({
    columns: PropTypes.arrayOf(PropTypes.string),
    cardFields: PropTypes.arrayOf(PropTypes.string),
  }),
  onRowClick: PropTypes.func,
};
