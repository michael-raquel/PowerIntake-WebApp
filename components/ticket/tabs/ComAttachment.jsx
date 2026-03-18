import { useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Paperclip, X, Eye, ImageIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import useUploadImage from '@/hooks/UseUploadImage';
import useDeleteImage from '@/hooks/UseDeleteImage';
import useGetAttachments from '@/hooks/UseGetAttachment';
import useCreateAttachments from '@/hooks/UseCreateAttachment';
import useUpdateAttachments from '@/hooks/UseUpdateAttachment';

export default function ComAttachment({
  ticketuuid,
  attachments = [],
  onChange,
  canEdit = false,
  createdby,
  modifiedby
}) {
  const fileInputRef = useRef(null);
  const { uploadImage } = useUploadImage();
  const { deleteImage } = useDeleteImage();
  const { getAttachments, attachments: fetchedAttachments, loading: fetchLoading } = useGetAttachments();
  const { createAttachments, loading: createLoading } = useCreateAttachments();
  const { updateAttachments, loading: updateLoading } = useUpdateAttachments();

  const fetchAttachments = useCallback(async () => {
    if (!ticketuuid) return;
    try {
      await getAttachments({ ticketuuid });
    } catch (err) {
      console.error('Failed to fetch attachments:', err);
    }
  }, [ticketuuid, getAttachments]);

  useEffect(() => {
    if (ticketuuid) fetchAttachments();
  }, [ticketuuid, fetchAttachments]);

  useEffect(() => {
    if (!fetchedAttachments) return;
    if (fetchedAttachments.length > 0) {
      const formatted = fetchedAttachments.map(a => ({
        name: decodeURIComponent(a.v_attachment?.split('/').pop()?.split('?')[0] || 'Unknown'),
        blobName: a.v_attachment?.split('/').pop()?.split('?')[0] || '',
        url: a.v_attachment,
        createdAt: a.v_createdat,
        attachmentuuid: a.v_attachmentuuid
      }));
      onChange(formatted);
    } else {
      onChange([]);
    }
  }, [fetchedAttachments, onChange]);

  const handleUpload = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (!files.length || !ticketuuid) return;

    try {
      const uploads = await Promise.all(
        files.map(async (file) => {
          const result = await uploadImage(file);
          return {
            name: result.blobName,
            blobName: result.blobName,
            url: result.url,
            createdAt: result.createdAt,
          };
        })
      );

      const urls = uploads.map(u => u.url);

      if (attachments.length === 0) {
        await createAttachments({
          ticketuuid,
          attachments: urls,
          createdby: createdby || modifiedby
        });
      } else {
        const existing = attachments.map(a => a.url);
        await updateAttachments({
          ticketuuid,
          attachments: [...existing, ...urls],
          modifiedby: modifiedby || createdby
        });
      }

      await fetchAttachments();
    } catch (err) {
      console.error('Upload failed:', err);
    }
  };

  const handleRemove = async (attachment, index) => {
    if (!ticketuuid) return;

    try {
      const blobName = attachment.url.split('/').pop()?.split('?')[0];
      if (blobName) await deleteImage(blobName);

      const remaining = attachments.filter((_, i) => i !== index).map(a => a.url);
      await updateAttachments({
        ticketuuid,
        attachments: remaining,
        modifiedby: modifiedby || createdby
      });

      await fetchAttachments();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleView = (url) => window.open(url, '_blank');

  const isLoading = createLoading || updateLoading || fetchLoading;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1">
          <Paperclip className="w-4 h-4" /> Attachments
          {isLoading && <span className="text-xs text-purple-600 ml-2">(Loading...)</span>}
        </p>
        {canEdit && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Add files
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={handleUpload}
              disabled={isLoading}
            />
          </>
        )}
      </div>

      {!attachments.length ? (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400 dark:text-gray-500 text-sm border border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
          <Paperclip className="w-8 h-8 mb-2" />
          <p>No attachments</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {attachments.map((a, index) => (
            <div
              key={a.attachmentuuid || `${a.name}-${index}`}
              className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="px-4 py-3 bg-gray-50/80 dark:bg-gray-900/80 border-l-2 border-purple-500 dark:border-purple-600">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate" title={a.name}>
                  {a.name}
                </p>
                {a.createdAt && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 flex items-center gap-1">
                    <span className="text-purple-400">•</span>
                    {format(new Date(a.createdAt), 'MMM d, yyyy')}
                  </p>
                )}
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-800/30 flex items-center justify-center">
                <div className="relative w-full aspect-video bg-gray-100 dark:bg-gray-800 rounded-md overflow-hidden flex items-center justify-center">
                  {a.url ? (
                    <Image
                      src={a.url}
                      alt={a.name}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-contain"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src =
                          'https://via.placeholder.com/400x200?text=Preview+not+available';
                      }}
                    />
                  ) : (
                    <ImageIcon className="w-12 h-12 text-gray-400" />
                  )}
                </div>
              </div>

              <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 flex items-center justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleView(a.url)}
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                >
                  <Eye className="w-4 h-4 mr-1" /> View
                </Button>
                {canEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemove(a, index)}
                    disabled={isLoading}
                    className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/30"
                  >
                    <X className="w-4 h-4 mr-1" /> Remove
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}