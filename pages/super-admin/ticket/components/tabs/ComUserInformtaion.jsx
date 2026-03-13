import React from 'react';
import { cn } from '@/lib/utils';

const Field = ({ label, value, highlight }) => (
  <div className={cn(
    "border border-gray-200 dark:border-gray-700 rounded-lg p-4",
    highlight && "border-amber-200 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-900/10"
  )}>
    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{label}</p>
    <p className="text-sm font-medium text-gray-900 dark:text-white break-words">{value ?? '—'}</p>
  </div>
);

export default function ComUserInformation({ ticket }) {
  const userFields = [
    { label: 'Name',       value: ticket?.v_username },
    { label: 'Email',      value: ticket?.v_useremail },
    { label: 'Job Title',  value: ticket?.v_jobtitle },
    { label: 'Department', value: ticket?.v_department },
    { label: 'Tenant',     value: ticket?.v_tenantname },
    { label: 'Timezone',   value: ticket?.v_usertimezone },
  ];

  return (
    <div className="space-y-4">      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {userFields.map((field, index) => (
          <Field key={index} {...field} />
        ))}
      </div>
    </div>
  );
}