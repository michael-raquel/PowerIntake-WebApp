import React from 'react';
import ComUserTable from './components/ComUserTable';

export default function UserPageLayout() {
  // Role-based rendering 
  // const { accounts } = useMsal();
  // const userRole = getUserRole(accounts[0]); 

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">User Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome to your dashboard</p>
      </div>
      
      <div className="bg-white rounded-lg border border-gray-200">
        <ComUserTable />
      </div>
    </div>
  );
}