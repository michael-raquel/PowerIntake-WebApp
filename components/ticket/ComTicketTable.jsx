import ComTableClient from './tables/ComTableClients';
import ComTableCompany from './tables/ComTableCompany';
import ComTableTeam from './tables/ComTableTeam';
import ComTableMyTicket from './tables/ComTableMyTickets';

const TABLES = {
  'my-client': ComTableClient,
  'my-company': ComTableCompany,
  'my-team': ComTableTeam,
  'my-ticket': ComTableMyTicket,
};

export default function ComTicketTable({ activeTab, ...props }) {
  const TableComponent = TABLES[activeTab] || ComTableMyTicket;
  return <TableComponent {...props} />;
}