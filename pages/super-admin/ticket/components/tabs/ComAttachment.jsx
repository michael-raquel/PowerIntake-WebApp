import React from 'react';
import { Paperclip, FileText } from 'lucide-react';
import { format } from 'date-fns';

export default function ComAttachment({ ticket }) {
  const attachments = ticket?.v_attachments ?? [];

  if (!attachments.length) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-gray-400">
        <Paperclip className="w-8 h-8 mb-2" />
        <p className="text-sm">No attachments.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {attachments.map((a) => (
        <div key={a.v_attachmentid} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <FileText className="w-4 h-4 text-blue-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{a.v_attachment}</p>
            <p className="text-xs text-gray-400">{format(new Date(a.v_createdat), 'MMM dd, yyyy')}</p>
          </div>
        </div>
      ))}
    </div>
  );
}