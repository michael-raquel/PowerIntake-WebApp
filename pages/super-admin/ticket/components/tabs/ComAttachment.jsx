import React, { useRef } from 'react';
import { Paperclip, FileText, X } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';

export default function ComAttachment({ attachments = [], onChange }) {
  const fileInputRef = useRef(null);

  const handleFilesSelected = async (event) => {
    if (!onChange) return;

    const files = Array.from(event.target.files || []);
    event.target.value = '';

    if (!files.length) return;

    try {
      const uploads = await Promise.all(
        files.map(async (file) => {
          const formData = new FormData();
          formData.append('image', file);
          formData.append('name', file.name.split('.').slice(0, -1).join('.') || file.name);

          const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/images/upload`, {
            method: 'POST',
            body: formData,
          });

          const data = await res.json();
          if (!res.ok || data.error || data.success === false) {
            throw new Error(data.error || 'Failed to upload image');
          }

          return {
            name: data.blobName || file.name,
            blobName: data.blobName || file.name,
            url: data.url,
            createdAt: new Date().toISOString(),
          };
        })
      );

      const existingNames = new Set(attachments.map((a) => a.name));
      const merged = [...attachments, ...uploads.filter((u) => !existingNames.has(u.name))];
      onChange(merged);
    } catch (err) {
      console.error('Attachment upload failed:', err);
    }
  };

  const handleRemove = async (index) => {
    if (!onChange) return;

    const target = attachments[index];
    const remaining = attachments.filter((_, i) => i !== index);
    onChange(remaining);

    try {
      if (target?.blobName || target?.name) {
        const blobName = encodeURIComponent(target.blobName || target.name);
        await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/images/upload/${blobName}`, {
          method: 'DELETE',
        });
      }
    } catch (err) {
      console.error('Attachment delete failed:', err);
    }
  };

  const hasAttachments = attachments.length > 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1">
          <Paperclip className="w-4 h-4" /> Attachments
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
        >
          Add files
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={handleFilesSelected}
        />
      </div>

      {!hasAttachments && (
        <div className="flex flex-col items-center justify-center py-8 text-gray-400 text-sm border border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
          <Paperclip className="w-8 h-8 mb-2" />
          <p>No attachments.</p>
        </div>
      )}

      {hasAttachments && (
        <div className="space-y-2">
          {attachments.map((a, index) => (
            <div
              key={`${a.name}-${index}`}
              className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
            >
              <FileText className="w-4 h-4 text-blue-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{a.name}</p>
                {(a.createdAt || a.v_createdat) && (
                  <p className="text-xs text-gray-400">
                    {format(new Date(a.createdAt || a.v_createdat), 'MMM dd, yyyy')}
                  </p>
                )}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleRemove(index)}
                className="h-7 w-7 shrink-0"
              >
                <X className="w-3.5 h-3.5 text-gray-400" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}