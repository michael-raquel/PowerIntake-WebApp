import { useRef, useEffect, useCallback, useState } from 'react';
import Image from 'next/image';
import { Paperclip, X, Eye, Download, ImageIcon, Upload, Lock } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { toast } from "sonner";
import useUploadImage from '@/hooks/UseUploadImage';
import useDeleteImage from '@/hooks/UseDeleteImage';
import useDownloadImage from '@/hooks/UseDownloadImage';
import useGetAttachments from '@/hooks/UseGetAttachment';
import useCreateAttachments from '@/hooks/UseCreateAttachment';
import useUpdateAttachments from '@/hooks/UseUpdateAttachment';

export default function ComAttachment({
  ticketuuid,
  ticket,
  attachments = [],
  onChange,
  canEdit = false,
  createdby,
  modifiedby,
  refreshKey
}) {
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const { uploadImage } = useUploadImage();
  const { deleteImage } = useDeleteImage();
  const { downloadImage } = useDownloadImage();
  const { getAttachments, attachments: fetchedAttachments, loading: fetchLoading } = useGetAttachments();
  const { createAttachments, loading: createLoading } = useCreateAttachments();
  const { updateAttachments, loading: updateLoading } = useUpdateAttachments();

  const readOnlyStatuses = [
    'Work Completed',
    'Problem Solved',
    'Cancelled',
    'Merged',
    'Technician Rejected'
  ];

  const isReadOnly = readOnlyStatuses.includes(ticket?.v_status);
  const canModify = canEdit && !isReadOnly;
  const isLoading = createLoading || updateLoading || fetchLoading;

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
    const formatted = fetchedAttachments.map(a => ({
      name: decodeURIComponent(a.v_attachment?.split('/').pop()?.split('?')[0] || 'Unknown'),
      blobName: a.v_attachment?.split('/').pop()?.split('?')[0] || '',
      url: a.v_attachment,
      createdAt: a.v_createdat,
      attachmentuuid: a.v_attachmentuuid,
      annotationid:   a.v_annotationid ?? null,
    }));
    onChange(formatted.length ? formatted : []);
  }, [fetchedAttachments, onChange]);

  const processUpload = async (files) => {
    const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));

    if (imageFiles.length !== files.length) {
        toast.error('Invalid file type', { description: 'Only images are allowed.' });
        return;
    }
    if (!imageFiles.length) return;

    try {
        const uploads = await Promise.all(imageFiles.map(uploadImage));
        const newUrls = uploads.map(u => u.url);  

        if (attachments.length === 0) {
            await createAttachments({ ticketuuid, attachments: newUrls, createdby: createdby || modifiedby });
        } else {
            await updateAttachments({
                ticketuuid,
                attachments: [...attachments.map(a => a.url), ...newUrls], 
                newAttachments: newUrls,                                   
                modifiedby: modifiedby || createdby
            });
        }

        await fetchAttachments();
        toast.success('Uploaded', { description: `${imageFiles.length} file(s) uploaded` });
    } catch (err) {
        toast.error('Upload failed', { description: 'Please try again.' });
    }
};


useEffect(() => {
    if (refreshKey > 0 && ticketuuid) fetchAttachments();
}, [refreshKey, ticketuuid, fetchAttachments]);

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (files.length && canModify) await processUpload(files);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (!canModify) {
      toast.error('Read-only', { description: `Cannot modify when ticket is ${ticket?.v_status}` });
      return;
    }

    const files = Array.from(e.dataTransfer.files);
    if (files.length) await processUpload(files);
  };

  const handleRemove = async (attachment, index) => {
    if (!canModify) return;

    console.log("[REMOVE] attachment object:", attachment);
    console.log("[REMOVE] annotationid:", attachment.annotationid);
    console.log("[REMOVE] removedAnnotationIds being sent:", attachment.annotationid ? [attachment.annotationid] : []);

    try {
      const blobName = attachment.url.split('/').pop()?.split('?')[0];
      if (blobName) await deleteImage(blobName);

      const remaining = attachments.filter((_, i) => i !== index).map(a => a.url);

      await updateAttachments({
        ticketuuid,
        attachments:          remaining,
        newAttachments:       [],
        removedAnnotationIds: attachment.annotationid ? [attachment.annotationid] : [],
        modifiedby:           modifiedby || createdby,
      });

      await fetchAttachments();
      toast.success('Removed', { description: attachment.name });
    } catch (err) {
      console.error('[REMOVE] error:', err);
      toast.error('Failed to remove', { description: 'Please try again.' });
    }
  };

  const handleDownload = async (attachment, index) => {
    try {
      setDownloadingId(index);
      const blobName = attachment.url.split('/').pop()?.split('?')[0];
      if (blobName) await downloadImage(blobName, attachment.name);
    } catch {
      window.open(attachment.url, '_blank');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <div className="p-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <Paperclip className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Attachments</p>
          {/* {canModify && !isReadOnly && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Upload, view, download or remove files</p>
          )}
          {isReadOnly && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Read-only - Ticket is {ticket.v_status}</p>
          )}
          {isLoading && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Loading...</p>} */}
        </div>
      </div>

      {canModify && (
        <label
          className={`
            flex flex-col items-center justify-center cursor-pointer
            border-2 border-dashed rounded-xl p-8 transition-all duration-200
            ${dragActive
              ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/30'
              : 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 hover:bg-gray-100 dark:hover:bg-gray-800/50 hover:border-gray-400 dark:hover:border-gray-600'
            }
          `}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
            disabled={isLoading}
          />
          <Upload className={`w-10 h-10 mb-3 transition-colors ${dragActive ? 'text-purple-500' : 'text-gray-400 dark:text-gray-500'}`} />
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Drop images here or click to upload
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            JPG, PNG, GIF, WebP supported
          </p>
        </label>
      )}

      {isReadOnly && (
        <div className="bg-gray-50 dark:bg-gray-800/30 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-gray-500 dark:text-gray-400 shrink-0" />
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {/* This ticket is <span className="font-medium text-gray-700 dark:text-gray-300">{ticket?.v_status}</span>. */}
              Attachments are in read-only mode. You can view and download existing files, but cannot upload or remove them.
            </p>
          </div>
        </div>
      )}

      {!attachments.length && (
        <div className="flex flex-col items-center py-12 bg-gray-50 dark:bg-gray-900/30 rounded-xl border border-gray-200 dark:border-gray-800">
          <ImageIcon className="w-8 h-8 text-gray-400 dark:text-gray-500 mb-3" />
          <p className="text-sm text-gray-500 dark:text-gray-400">No attachments yet</p>
          {canModify && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Upload images by clicking or dragging</p>
          )}
          {isReadOnly && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Attachments are read-only for {ticket?.v_status} tickets</p>
          )}
        </div>
      )}

      {attachments.length > 0 && (
        <div className="grid grid-cols-1 gap-4">
          {attachments.map((a, idx) => (
            <div
              key={a.attachmentuuid || idx}
              className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden hover:border-gray-300 dark:hover:border-gray-700 transition-colors"
            >
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-start gap-2">
                  <div className="w-1 h-1 mt-2 bg-gray-300 dark:bg-gray-600 rounded-full" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{a.name}</p>
                    {a.createdAt && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {format(new Date(a.createdAt), 'MMM d, yyyy')}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-800/20">
                <div className="relative w-full aspect-video bg-gray-100 dark:bg-gray-800/50 rounded-lg overflow-hidden">
                  {a.url && a.url.trim() !== '' ? (
                    <Image
                      src={a.url}
                      alt={a.name}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-contain"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.parentElement?.querySelector('.fallback-icon')?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div className={`fallback-icon ${a.url && a.url.trim() !== '' ? 'hidden' : ''} w-full h-full flex items-center justify-center`}>
                    <ImageIcon className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                  </div>
                </div>
              </div>

              <div className="px-4 py-3 flex justify-end gap-2 border-t border-gray-100 dark:border-gray-800">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(a.url, '_blank')}
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <Eye className="w-3.5 h-3.5 sm:mr-1.5" />
                  <span className="hidden sm:inline">View</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDownload(a, idx)}
                  disabled={downloadingId === idx}
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <Download className="w-3.5 h-3.5 sm:mr-1.5" />
                  <span className="hidden sm:inline">{downloadingId === idx ? '...' : 'Download'}</span>
                </Button>
                {canModify && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemove(a, idx)}
                    className="text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20"
                  >
                    <X className="w-3.5 h-3.5 sm:mr-1.5" />
                    <span className="hidden sm:inline">Remove</span>
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