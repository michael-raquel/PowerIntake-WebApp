import ComTable from "./ComTable";

const DEFAULT_TAB = "all-tenant";

const TABLES = {
  [DEFAULT_TAB]: ComTable,
};

export default function ComTenantTable({ activeTab, ...props }) {
  const TableComponent = TABLES[activeTab] || TABLES[DEFAULT_TAB];
  return <TableComponent {...props} />;
}
