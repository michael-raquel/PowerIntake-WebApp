import { useState, useRef, useEffect } from 'react';
import { StickyNote, Send } from 'lucide-react';
import { format } from 'date-fns';
import { useFetchNote } from '@/hooks/UseFetchNotes';
import { useCreateNote } from '@/hooks/UseCreateNotes';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

export default function ComNotes({ ticket, ticketUuid, canEdit = true }) {
  const id = ticketUuid || ticket?.v_ticketuuid;
  const { tokenInfo } = useAuth();
  const currentUserId = tokenInfo?.account?.localAccountId;
  const currentUserName = tokenInfo?.account?.name || 'You';
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const [newNote, setNewNote] = useState('');
  const [isComposing, setIsComposing] = useState(false);

  const { notes, loading, error, fetchNotes } = useFetchNote(id);
  const { createNote, submitting } = useCreateNote();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [notes]);

  const handleSubmit = async () => {
    if (!newNote.trim() || !id || submitting) return;
    
    const noteText = newNote.trim();
    setNewNote('');
    
    if (textareaRef.current) {
      textareaRef.current.style.height = '40px';
    }
    
    await createNote({
      ticketuuid: id,
      note: noteText,
      createdby: currentUserId,
    });
    
    fetchNotes();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleTextareaChange = (e) => {
    const textarea = e.target;
    setNewNote(textarea.value);
    
    textarea.style.height = '40px';
    const newHeight = Math.min(textarea.scrollHeight, 100);
    textarea.style.height = `${newHeight}px`;
  };

  const getDisplayName = (note) => {
    if (note.v_createdbyname) return note.v_createdbyname;
    if (note.v_createdby === currentUserId) return currentUserName;
    return note.v_createdby || 'Unknown';
  };

  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return format(date, 'h:mm a');
    }
    return format(date, 'MMM d, h:mm a');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-gray-400 dark:text-gray-500">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2" />
          <p className="text-sm">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 rounded-lg overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {error && (
          <div className="text-sm text-red-400 dark:text-red-500 text-center py-2">
            Failed to load messages
          </div>
        )}

        {!notes?.length ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500">
            <StickyNote className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm">No messages yet</p>
            <p className="text-xs mt-2 text-gray-500 dark:text-gray-400">
              Be the first to start the conversation
            </p>
          </div>
        ) : (
          notes.map((note, index) => {
            const isCurrentUser = note.v_createdby === currentUserId;
            const showHeader = index === 0 || notes[index - 1]?.v_createdby !== note.v_createdby;
            
            return (
              <div key={note.v_noteuuid} className="space-y-1">
                {showHeader && !isCurrentUser && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                    {getDisplayName(note)}
                  </div>
                )}
                <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`
                      relative max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-2.5 break-words
                      ${isCurrentUser 
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-br-none' 
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-none'
                      }
                    `}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                      {note.v_note}
                    </p>
                    <div className={`flex items-center gap-1 mt-1 text-[10px] ${
                      isCurrentUser 
                        ? 'text-purple-200 justify-end' 
                        : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      <span>{formatMessageTime(note.v_createdat)}</span>
                      {isCurrentUser && (
                        <span className="ml-1">• You</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 p-3">
  <div className="flex items-end gap-2">
    <Textarea
      ref={textareaRef}
      value={newNote}
      onChange={handleTextareaChange}
      onKeyDown={handleKeyDown}
      onCompositionStart={() => setIsComposing(true)}
      onCompositionEnd={() => setIsComposing(false)}
      placeholder="Write a message..."
      className="flex-1 min-h-[40px] max-h-[100px] resize-none bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 overflow-y-auto"
      rows={1}
      disabled={submitting}
    />
    <Button
      onClick={handleSubmit}
      disabled={!newNote.trim() || submitting}
      className="h-[40px] px-4 bg-purple-600 hover:bg-purple-700 dark:bg-purple-600 dark:hover:bg-purple-700 text-white rounded-lg shrink-0"
    >
      <Send className="h-4 w-4 mr-2" />
      Send
    </Button>
  </div>
</div>
    </div>
  );
}