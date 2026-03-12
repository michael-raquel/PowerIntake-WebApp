import React from 'react';
import PropTypes from 'prop-types';
import ComTableClient from './tables/ComTableClients';
import ComTableCompany from './tables/ComTableCompany';
import ComTableTeam from './tables/ComTableTeam';
import ComTableMyTicket from './tables/ComTableMyTickets';

export default function ComTicketTable({ activeTab, currentPage, recordsPerPage, onTotalRecordsChange }) {
  const tableProps = { currentPage, recordsPerPage, onTotalRecordsChange };

  const renderTable = () => {
    switch (activeTab) {
      case 'my-client':   return <ComTableClient {...tableProps} />;
      case 'my-company':  return <ComTableCompany {...tableProps} />;
      case 'my-team':     return <ComTableTeam {...tableProps} />;
      case 'my-ticket':   return <ComTableMyTicket {...tableProps} />;
      default:            return <ComTableMyTicket {...tableProps} />;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden transition-colors duration-300">
      {renderTable()}
    </div>
  );
}

ComTicketTable.propTypes = {
  activeTab: PropTypes.string.isRequired,
  currentPage: PropTypes.number.isRequired,
  recordsPerPage: PropTypes.number.isRequired,
  onTotalRecordsChange: PropTypes.func.isRequired,
};