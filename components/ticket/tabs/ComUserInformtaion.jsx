export default function ComUserInformation({ ticket }) {
  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800/50 dark:to-gray-900/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:border-purple-200 dark:hover:border-purple-800 transition-all group">
        <div className="flex items-start gap-3">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 text-xs group-hover:scale-110 transition-transform shrink-0">
            🏛️
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Tenant</p>
            </div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1 break-words">
              {ticket?.v_tenantname || '—'}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800/50 dark:to-gray-900/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:border-purple-200 dark:hover:border-purple-800 transition-all group">
        <div className="flex items-start gap-3">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 text-xs group-hover:scale-110 transition-transform shrink-0">
            👤
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Full Name</p>
            </div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1 break-words">
              {ticket?.v_username || '—'}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800/50 dark:to-gray-900/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:border-purple-200 dark:hover:border-purple-800 transition-all group">
        <div className="flex items-start gap-3">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 text-xs group-hover:scale-110 transition-transform shrink-0">
            ✉️
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Email Address</p>
              {ticket?.v_useremail && (
                <button
                  onClick={() => navigator.clipboard.writeText(ticket.v_useremail)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-purple-600 dark:text-purple-400 hover:underline"
                  title="Copy email"
                >
                  Copy
                </button>
              )}
            </div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1 break-words">
              {ticket?.v_useremail || '—'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800/50 dark:to-gray-900/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:border-purple-200 dark:hover:border-purple-800 transition-all group">
          <div className="flex items-start gap-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 text-xs group-hover:scale-110 transition-transform shrink-0">
              📱
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Mobile Phone</p>
                {(ticket?.v_mobilephone || ticket?.mobilePhone) && (
                  <button
                    onClick={() => navigator.clipboard.writeText(ticket?.v_mobilephone || ticket?.mobilePhone)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-purple-600 dark:text-purple-400 hover:underline"
                    title="Copy mobile"
                  >
                    Copy
                  </button>
                )}
              </div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1 break-words">
                {ticket?.v_mobilephone || ticket?.mobilePhone || '—'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800/50 dark:to-gray-900/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:border-purple-200 dark:hover:border-purple-800 transition-all group">
          <div className="flex items-start gap-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 text-xs group-hover:scale-110 transition-transform shrink-0">
              📞
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Business Phone</p>
                {(ticket?.v_businessphone || ticket?.businessPhones?.[0]) && (
                  <button
                    onClick={() => navigator.clipboard.writeText(ticket?.v_businessphone || ticket?.businessPhones?.[0])}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-purple-600 dark:text-purple-400 hover:underline"
                    title="Copy business"
                  >
                    Copy
                  </button>
                )}
              </div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1 break-words">
                {ticket?.v_businessphone || ticket?.businessPhones?.[0] || '—'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800/50 dark:to-gray-900/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:border-purple-200 dark:hover:border-purple-800 transition-all group">
          <div className="flex items-start gap-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 text-xs group-hover:scale-110 transition-transform shrink-0">
              💼
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Job Title</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1 break-words">
                {ticket?.v_jobtitle || '—'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800/50 dark:to-gray-900/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:border-purple-200 dark:hover:border-purple-800 transition-all group">
          <div className="flex items-start gap-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 text-xs group-hover:scale-110 transition-transform shrink-0">
              🏢
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Department</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1 break-words">
                {ticket?.v_department || '—'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800/50 dark:to-gray-900/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:border-purple-200 dark:hover:border-purple-800 transition-all group">
        <div className="flex items-start gap-3">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 text-xs group-hover:scale-110 transition-transform shrink-0">
            🌐
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Company HQ Timezone</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1 break-words">
              {ticket?.v_usertimezone || '—'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}