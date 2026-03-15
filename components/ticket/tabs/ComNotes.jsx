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
  const [newNote, setNewNote] = useState('');

  const { notes, loading, error, fetchNotes } = useFetchNote(id);
  const { createNote, submitting } = useCreateNote();

  const handleSubmit = async () => {
    if (!newNote.trim() || !id) return;
    await createNote({ ticketuuid: id, note: newNote, createdby: tokenInfo?.account?.localAccountId });
    setNewNote('');
    fetchNotes();
  };

  if (loading) return <div className="text-center py-10 text-gray-400">Loading notes...</div>;

  return (
    <div className="flex flex-col h-full">
      {error && <div className="text-sm text-red-400 mb-2">Failed to load notes</div>}

      <div className="flex-1 space-y-3 overflow-y-auto pr-1">
        {!notes?.length ? (
          <div className="flex flex-col items-center py-10 text-gray-400">
            <StickyNote className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-sm">No notes yet</p>
          </div>
        ) : (
          notes.map(note => (
            <div key={note.v_noteuuid} className="bg-gray-50 rounded-xl border p-3">
              <p className="text-sm text-gray-900 whitespace-pre-wrap">{note.v_note}</p>
              <p className="text-xs text-gray-500 mt-2">
                {note.v_createdbyname || note.v_createdby || 'Unknown'}
                {note.v_createdat && ` • ${format(new Date(note.v_createdat), 'MMM dd, yyyy • hh:mm a')}`}
              </p>
            </div>
          ))
        )}
      </div>

      <div className="mt-3 pt-3 border-t">
        <div className="flex gap-2">
          <Textarea
            value={newNote}
            onChange={e => setNewNote(e.target.value)}
            placeholder="Write a note..."
            className="min-h-[40px] resize-none"
            rows={1}
          />
          <Button onClick={handleSubmit} disabled={!newNote.trim() || submitting || !id} className="bg-purple-600 hover:bg-purple-700">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}