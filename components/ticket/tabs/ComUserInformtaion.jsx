export default function ComUserInformation({ ticket }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="border rounded-lg p-4">
        <p className="text-xs text-gray-500 mb-1">Name</p>
        <p className="text-sm font-medium">{ticket?.v_username || '—'}</p>
      </div>
      <div className="border rounded-lg p-4">
        <p className="text-xs text-gray-500 mb-1">Email</p>
        <p className="text-sm font-medium break-all">{ticket?.v_useremail || '—'}</p>
      </div>
      <div className="border rounded-lg p-4">
        <p className="text-xs text-gray-500 mb-1">Job Title</p>
        <p className="text-sm font-medium">{ticket?.v_jobtitle || '—'}</p>
      </div>
      <div className="border rounded-lg p-4">
        <p className="text-xs text-gray-500 mb-1">Department</p>
        <p className="text-sm font-medium">{ticket?.v_department || '—'}</p>
      </div>
      <div className="border rounded-lg p-4">
        <p className="text-xs text-gray-500 mb-1">Tenant</p>
        <p className="text-sm font-medium">{ticket?.v_tenantname || '—'}</p>
      </div>
      <div className="border rounded-lg p-4">
        <p className="text-xs text-gray-500 mb-1">Timezone</p>
        <p className="text-sm font-medium">{ticket?.v_usertimezone || '—'}</p>
      </div>
    </div>
  );
}