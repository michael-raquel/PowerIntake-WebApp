import { useState } from 'react';
import { StickyNote, Send } from 'lucide-react';
import { format } from 'date-fns';
import { useFetchNote } from '@/hooks/UseFetchNotes';
import { useCreateNote } from '@/hooks/UseCreateNotes';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

export default function ComNotes({ ticket, ticketUuid }) {
  const id = ticketUuid || ticket?.v_ticketuuid;
  const { tokenInfo } = useAuth();
  const currentUserId = tokenInfo?.account?.localAccountId;
  const currentUserName = tokenInfo?.account?.name || 'You';

  const [newNote, setNewNote] = useState('');

  const { notes, loading, error, fetchNotes } = useFetchNote(id);
  const { createNote, submitting } = useCreateNote();

  const handleSubmit = async () => {
    if (!newNote.trim() || !id) return;
    await createNote({
      ticketuuid: id,
      note: newNote,
      createdby: currentUserId,
    });
    setNewNote('');
    fetchNotes();
  };

  const getDisplayName = (note) => {
    if (note.v_createdbyname) return note.v_createdbyname;
    if (note.v_createdby === currentUserId) return currentUserName;
    return note.v_createdby || 'Unknown';
  };

  if (loading) return <div className="text-center py-10 text-gray-400 dark:text-gray-500">Loading notes...</div>;

  return (
    <div className="flex flex-col h-full">
      {error && <div className="text-sm text-red-400 dark:text-red-500 mb-2">Failed to load notes</div>}

      <div className="flex-1 space-y-3 overflow-y-auto pr-1">
        {!notes?.length ? (
          <div className="flex flex-col items-center py-10 text-gray-400 dark:text-gray-500">
            <StickyNote className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-sm">No notes yet</p>
          </div>
        ) : (
          notes.map((note) => {
            const isCurrentUser = note.v_createdby === currentUserId;
            return (
              <div
                key={note.v_noteuuid}
                className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`
                    max-w-[80%] rounded-xl p-3 
                    ${isCurrentUser 
                      ? 'bg-purple-100 dark:bg-purple-900/30 text-gray-900 dark:text-gray-100' 
                      : 'bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700'
                    }
                  `}
                >
                  <p className="text-sm whitespace-pre-wrap break-words">{note.v_note}</p>
                  <div className={`flex items-center gap-2 mt-2 text-xs ${
                    isCurrentUser ? 'justify-end text-purple-700 dark:text-purple-300' : 'justify-between text-gray-500 dark:text-gray-400'
                  }`}>
                    {!isCurrentUser && <span>{getDisplayName(note)}</span>}
                    {note.v_createdat && (
                      <span>{format(new Date(note.v_createdat), 'MMM dd, yyyy • hh:mm a')}</span>
                    )}
                    {isCurrentUser && <span>{getDisplayName(note)}</span>}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex gap-2">
          <Textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Write a note..."
            className="min-h-[40px] resize-none dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 dark:placeholder:text-gray-500"
            rows={1}
          />
          <Button
            onClick={handleSubmit}
            disabled={!newNote.trim() || submitting || !id}
            className="bg-purple-600 hover:bg-purple-700 dark:bg-purple-600 dark:hover:bg-purple-700 text-white shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}