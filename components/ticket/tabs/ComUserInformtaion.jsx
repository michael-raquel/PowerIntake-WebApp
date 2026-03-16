export default function ComUserInformation({ ticket }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 sm:p-4">
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Name</p>
        <p className="text-sm font-medium text-gray-900 dark:text-white break-words">
          {ticket?.v_username || '—'}
        </p>
      </div>
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 sm:p-4">
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Email</p>
        <p className="text-sm font-medium text-gray-900 dark:text-white break-all">
          {ticket?.v_useremail || '—'}
        </p>
      </div>
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 sm:p-4">
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Job Title</p>
        <p className="text-sm font-medium text-gray-900 dark:text-white break-words">
          {ticket?.v_jobtitle || '—'}
        </p>
      </div>
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 sm:p-4">
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Department</p>
        <p className="text-sm font-medium text-gray-900 dark:text-white break-words">
          {ticket?.v_department || '—'}
        </p>
      </div>
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 sm:p-4">
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Tenant</p>
        <p className="text-sm font-medium text-gray-900 dark:text-white break-words">
          {ticket?.v_tenantname || '—'}
        </p>
      </div>
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 sm:p-4">
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Timezone</p>
        <p className="text-sm font-medium text-gray-900 dark:text-white break-words">
          {ticket?.v_usertimezone || '—'}
        </p>
      </div>
    </div>
  );
}