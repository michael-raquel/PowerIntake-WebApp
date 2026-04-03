import ComTable from "./ComTable";

const TABLES = {
  "all-tenant": ComTable,
};

export default function ComTenantTable({ activeTab, ...props }) {
  const TableComponent = TABLES[activeTab] || ComTable;
  return <TableComponent {...props} />;
}
