import React, { useMemo, useState } from 'react';
import { StickyNote, Send } from 'lucide-react';
import { format } from 'date-fns';
import { useFetchNote } from '@/hooks/UseFetchNotes';
import { useCreateNote } from '@/hooks/UseCreateNotes';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

export default function ComNotes({ ticket, ticketUuid }) {
  const effectiveTicketUuid = ticketUuid || ticket?.v_ticketuuid || null;
  const { tokenInfo } = useAuth();

  const currentUserId = tokenInfo?.account?.localAccountId || null;
  const currentUserName =
    tokenInfo?.account?.name ||
    tokenInfo?.account?.username ||
    'You';

  const createdBy = useMemo(
    () => currentUserId || ticket?.v_entrauserid || null,
    [currentUserId, ticket]
  );

  const { notes, loading, error, fetchNotes } = useFetchNote(effectiveTicketUuid);
  const { createNote, submitting } = useCreateNote();

  const [newNote, setNewNote] = useState('');
  const [submitError, setSubmitError] = useState(null);

  const getDisplayName = (note) => {
    const apiName = note?.v_createdbyname || note?.createdbyname;
    if (apiName) return apiName;

    const apiId = note?.v_createdby || note?.createdby;
    if (apiId && currentUserId && apiId === currentUserId) return currentUserName;

    return apiId || 'Unknown';
  };

  const handleCreateNote = async () => {
    if (!newNote.trim() || !effectiveTicketUuid) return;

    try {
      setSubmitError(null);

      await createNote({
        ticketuuid: effectiveTicketUuid,
        note: newNote,
        createdby: createdBy,
      });

      setNewNote('');
      await fetchNotes();
    } catch {
      setSubmitError('Failed to send note');
    }
  };

  if (loading) {
    return <div className="py-10 text-center text-sm text-gray-400">Loading notes...</div>;
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {error && <div className="mb-2 text-sm text-red-400">Failed to load notes</div>}

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
        {!notes.length ? (
          <div className="flex flex-col items-center justify-center py-10 text-gray-400">
            <StickyNote className="mb-2 h-8 w-8 opacity-50" />
            <p className="text-sm">No notes yet</p>
          </div>
        ) : (
          notes.map((note) => (
            <div
              key={note?.v_noteuuid || note?.v_noteid || note?.noteuuid}
              className="rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-900"
            >
              <p className="text-sm whitespace-pre-wrap break-words text-gray-900 dark:text-gray-100">
                {note?.v_note ?? note?.note ?? '—'}
              </p>
              <p className="mt-2 text-[11px] text-gray-500 dark:text-gray-400">
                {getDisplayName(note)}
                {(note?.v_createdat || note?.createdat)
                  ? ` • ${format(new Date(note?.v_createdat || note?.createdat), 'MMM dd, yyyy • hh:mm a')}`
                  : ''}
              </p>
            </div>
          ))
        )}
      </div>

      <div className="mt-3 border-t border-gray-200 pt-3 dark:border-gray-800">
        <div className="flex items-end gap-2">
          <Textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Write a note..."
            className="min-h-[40px] max-h-[120px] resize-none"
            rows={1}
          />
          <Button
            type="button"
            size="icon"
            onClick={handleCreateNote}
            disabled={!newNote.trim() || submitting || !effectiveTicketUuid}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        {submitError && <p className="mt-1 text-xs text-red-400">{submitError}</p>}
      </div>
    </div>
  );
}