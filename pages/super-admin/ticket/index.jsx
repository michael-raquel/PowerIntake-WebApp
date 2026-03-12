import React, { useState } from 'react';
import ComFilters from './components/ComFilters';
import ComTicketTable from './components/ComTicketTable';
import ComCreateTicket from './components/ComCreateTicket';

export default function TicketPage() {
  const [activeTab, setActiveTab] = useState('my-ticket');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [showCreateTicket, setShowCreateTicket] = useState(false);
  const [searchValue, setSearchValue] = useState(''); 

  const recordsPerPage = 10;

  const tabs = [
    { id: 'my-client', label: 'My Client' },
    { id: 'my-company', label: 'My Company' },
    { id: 'my-team', label: 'My Team' },
    { id: 'my-ticket', label: 'My Ticket' },
  ];

  const totalPages = Math.max(1, Math.ceil(totalRecords / recordsPerPage));

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setCurrentPage(1); 
    setTotalRecords(0);
     setSearchValue('');
  };

  const handleCreateTicket = () => {
    setShowCreateTicket(true);
  };

  const handleCloseCreateTicket = () => {
    setShowCreateTicket(false);
  };

  const handleSubmitTicket = (formData) => {
    console.log('Ticket submitted:', formData);
    setShowCreateTicket(false);
  };

  if (showCreateTicket) {
    return (
      <ComCreateTicket 
        onClose={handleCloseCreateTicket}
        onSubmit={handleSubmitTicket}
      />
    );
  }

  return (
    <div className="flex-1 bg-gray-50 dark:bg-black min-h-screen transition-colors duration-300">
      <div className="p-4 sm:p-6 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
          <div className="border-b border-gray-200 dark:border-gray-800 sm:flex-1">
            <nav className="flex flex-wrap gap-x-6 gap-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`pb-3 text-sm font-medium border-b-2 transition-colors duration-300 whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="w-full sm:w-auto">
           <ComFilters 
            onCreateTicket={handleCreateTicket} 
            activeTab={activeTab}
             onSearch={(value) => setSearchValue(value)}
            searchValue={searchValue}
            />
          </div>
        </div>

        <div className="mb-4">
          <ComTicketTable
            activeTab={activeTab}
            currentPage={currentPage}
            recordsPerPage={recordsPerPage}
            onTotalRecordsChange={setTotalRecords}
          />
        </div>

        <div className="bg-white dark:bg-gray-900 px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3 transition-colors duration-300">
          <div className="text-sm text-gray-700 dark:text-gray-300 order-2 sm:order-1">
            {totalRecords > 0 ? (
              <>
                Showing{' '}
                <span className="font-medium text-gray-900 dark:text-white">
                  {(currentPage - 1) * recordsPerPage + 1}
                </span>{' '}
                to{' '}
                <span className="font-medium text-gray-900 dark:text-white">
                  {Math.min(currentPage * recordsPerPage, totalRecords)}
                </span>{' '}
                of{' '}
                <span className="font-medium text-gray-900 dark:text-white">{totalRecords}</span> records
              </>
            ) : (
              <span className="text-gray-500 dark:text-gray-400">No records found</span>
            )}
          </div>

          <div className="flex space-x-2 order-1 sm:order-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-md transition-colors duration-300 ${
                currentPage === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-500'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800 dark:border-gray-700'
              }`}
            >
              Previous
            </button>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages || totalRecords === 0}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-md transition-colors duration-300 ${
                currentPage === totalPages || totalRecords === 0
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-500'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800 dark:border-gray-700'
              }`}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}