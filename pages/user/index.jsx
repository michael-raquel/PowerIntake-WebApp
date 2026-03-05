import React from 'react';
import ComUserTable from './components/ComUserTable';


export default function UserPage() {
  return (
    <div>
      <h1>User Page</h1>
      <p>This is the user page.</p>
      <div className="p-6">
      <ComUserTable />
    </div>
    </div>
  );
}

