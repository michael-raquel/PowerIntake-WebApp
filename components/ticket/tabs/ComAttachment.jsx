import { useRef, useEffect, useCallback, useState } from 'react';
import Image from 'next/image';
import { Paperclip, X, Eye, Download, ImageIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import useUploadImage from '@/hooks/UseUploadImage';
import useDeleteImage from '@/hooks/UseDeleteImage';
import useDownloadImage from '@/hooks/UseDownloadImage';
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
  const [downloadingId, setDownloadingId] = useState(null);
  const { uploadImage } = useUploadImage();
  const { deleteImage } = useDeleteImage();
  const { downloadImage } = useDownloadImage();
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

  const handleDownload = async (attachment, index) => {
    try {
      setDownloadingId(index);
      const blobName = attachment.url.split('/').pop()?.split('?')[0];
      if (!blobName) throw new Error('Invalid blob name');
      await downloadImage(blobName, attachment.name);
    } catch (err) {
      console.error('Download failed:', err);
      window.open(attachment.url, '_blank');
    } finally {
      setDownloadingId(null);
    }
  };

  const isLoading = createLoading || updateLoading || fetchLoading;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <Paperclip className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Attachments</p>
            {isLoading && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1.5">
                <span className="w-1 h-1 bg-gray-400 dark:bg-gray-500 rounded-full animate-pulse" />
                Loading...
              </p>
            )}
          </div>
        </div>
        {canEdit && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="w-full sm:w-auto h-9 px-4 text-xs border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Upload files
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

      {!attachments.length && (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
          <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-xl mb-3">
            <ImageIcon className="w-6 h-6 text-gray-400 dark:text-gray-500" />
          </div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">No attachments</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Upload files to attach them to this ticket</p>
        </div>
      )}

      {attachments.length > 0 && (
        <div className="grid grid-cols-1 gap-4">
          {attachments.map((a, index) => (
            <div
              key={a.attachmentuuid || `${a.name}-${index}`}
              className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden"
            >
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-start gap-2">
                  <div className="w-1 h-1 mt-2 bg-gray-300 dark:bg-gray-600 rounded-full" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate" title={a.name}>
                      {a.name}
                    </p>
                    {a.createdAt && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {format(new Date(a.createdAt), 'MMM d, yyyy')}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-800/30">
                <div className="relative w-full aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
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
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                    </div>
                  )}
                </div>
              </div>

              <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20">
                <div className="flex items-center justify-end gap-1 sm:gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleView(a.url)}
                    className="h-8 px-2 sm:px-3 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <Eye className="w-3.5 h-3.5 sm:mr-1.5" />
                    <span className="hidden sm:inline">View</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownload(a, index)}
                    disabled={downloadingId === index}
                    className="h-8 px-2 sm:px-3 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <Download className="w-3.5 h-3.5 sm:mr-1.5" />
                    <span className="hidden sm:inline">
                      {downloadingId === index ? 'Downloading...' : 'Download'}
                    </span>
                  </Button>
                  {canEdit && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemove(a, index)}
                      disabled={isLoading}
                      className="h-8 px-2 sm:px-3 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
                    >
                      <X className="w-3.5 h-3.5 sm:mr-1.5" />
                      <span className="hidden sm:inline">Remove</span>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}