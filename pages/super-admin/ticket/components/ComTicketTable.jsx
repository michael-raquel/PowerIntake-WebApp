import React from 'react';
import PropTypes from 'prop-types';
import ComTableClient from './tables/ComTableClients';
import ComTableCompany from './tables/ComTableCompany';
import ComTableTeam from './tables/ComTableTeam';
import ComTableMyTicket from './tables/ComTableMyTickets';

export default function ComTicketTable({
  activeTab,
  currentPage,
  recordsPerPage,
  onTotalRecordsChange,
  onFilterOptionsChange,
  searchValue = '',
  filters = {},
}) {
  const tableProps = {
    currentPage,
    recordsPerPage,
    onTotalRecordsChange,
    onFilterOptionsChange,
    searchValue,
    filters,
  };

  switch (activeTab) {
    case 'my-client':
      return <ComTableClient {...tableProps} />;
    case 'my-company':
      return <ComTableCompany {...tableProps} />;
    case 'my-team':
      return <ComTableTeam {...tableProps} />;
    case 'my-ticket':
    default:
      return <ComTableMyTicket {...tableProps} />;
  }
}

ComTicketTable.propTypes = {
  activeTab: PropTypes.string.isRequired,
  currentPage: PropTypes.number.isRequired,
  recordsPerPage: PropTypes.number.isRequired,
  onTotalRecordsChange: PropTypes.func.isRequired,
  onFilterOptionsChange: PropTypes.func,
  searchValue: PropTypes.string,
  filters: PropTypes.object,
};