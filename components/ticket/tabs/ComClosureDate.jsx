import { format, differenceInCalendarDays } from 'date-fns';

export default function ComClosureDate({ ticket }) {
  const created = ticket?.v_createdat ? new Date(ticket.v_createdat) : null;
  const target = ticket?.v_target ? new Date(ticket.v_target) : null;
  const modified = ticket?.v_modifiedat ? new Date(ticket.v_modifiedat) : null;
  const closed = ticket?.v_closuredate ? new Date(ticket.v_closuredate) : null;
  const note = ticket?.v_closurenote;
  const resolutionSummary = ticket?.v_resolutionsummary;

  const hasText = (value) => typeof value === 'string' && value.trim().length > 0;


  const daysOpen = created ? Math.max(0, differenceInCalendarDays(new Date(), created)) : null;

  const formatDate = (date, withTime = false) => {
    if (!date) return '—';
    return format(date, withTime ? 'MMM dd, yyyy • hh:mm a' : 'MMM dd, yyyy');
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800/50 dark:to-gray-900/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:border-purple-200 dark:hover:border-purple-800 transition-all">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-6 w-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <span className="text-xs text-green-600 dark:text-green-400">📅</span>
            </div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Created</p>
          </div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            {formatDate(created, true)}
          </p>
        </div>

          <div className="bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800/50 dark:to-gray-900/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:border-purple-200 dark:hover:border-purple-800 transition-all">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-6 w-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <span className="text-xs text-green-600 dark:text-green-400">🎯</span>
            </div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Target Date</p>
          </div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            {formatDate(target, true)}
          </p>
        </div>

        <div className="bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800/50 dark:to-gray-900/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800 transition-all">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <span className="text-xs text-blue-600 dark:text-blue-400">✏️</span>
            </div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Modified</p>
          </div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            {formatDate(modified, true)}
          </p>
        </div>

        <div className="bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800/50 dark:to-gray-900/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:border-amber-200 dark:hover:border-amber-800 transition-all">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-6 w-6 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <span className="text-xs text-amber-600 dark:text-amber-400">⏳</span>
            </div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Days Open</p>
          </div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            {daysOpen !== null ? `${daysOpen} ${daysOpen === 1 ? 'day' : 'days'}` : '—'}
          </p>
        </div>

        <div className="bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800/50 dark:to-gray-900/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:border-emerald-200 dark:hover:border-emerald-800 transition-all">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-6 w-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <span className="text-xs text-emerald-600 dark:text-emerald-400">✅</span>
            </div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Closed</p>
          </div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            {closed ? formatDate(closed) : 'Not closed'}
          </p>
        </div>
      </div>

      {hasText(note) && (
        <div className="bg-gradient-to-br from-white to-purple-50/40 dark:from-gray-800/50 dark:to-purple-950/20 rounded-xl p-4 border border-purple-200/70 dark:border-purple-800/50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <span className="text-xs text-purple-600 dark:text-purple-400">📝</span>
              </div>
              <p className="text-xs font-medium text-purple-700 dark:text-purple-300">Closure Note</p>
            </div>
          </div>
          <div className="bg-white/90 dark:bg-gray-800/50 rounded-lg p-3 border border-purple-100 dark:border-purple-900/40">
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">
              {note}
            </p>
          </div>
        </div>
      )}

      {hasText(resolutionSummary) && (
        <div className="bg-gradient-to-br from-white to-indigo-50/40 dark:from-gray-800/50 dark:to-indigo-950/20 rounded-xl p-4 border border-indigo-200/70 dark:border-indigo-800/50">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-6 w-6 rounded-md bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
              <span className="text-xs text-indigo-600 dark:text-indigo-400">📌</span>
            </div>
            <p className="text-xs font-medium text-indigo-700 dark:text-indigo-300">Resolution Summary</p>
          </div>
          <div className="bg-white/90 dark:bg-gray-800/50 rounded-lg p-3 border border-dashed border-indigo-200 dark:border-indigo-800/50">
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words leading-relaxed">
              {resolutionSummary}
            </p>
          </div>
        </div>
      )}



    </div>

  );
}