"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useNotes } from "@/modules/notes/hooks/use-notes";
import { Plus, Trash2, Pin, PinOff } from "lucide-react";
import type { NoteDTO } from "@/types/planner";

export function NotesView() {
  const store = useNotes();
  const { notes, loading, addNote, togglePin, update, remove } = store;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const activeNote = notes.find((n: NoteDTO) => n.id === selectedId);

  // Load selected note into editor fields
  useEffect(() => {
    if (activeNote) {
      setTitle(activeNote.title || "");
      setBody(activeNote.body || "");
    } else {
      setTitle("");
      setBody("");
    }
  }, [selectedId, activeNote]);

  // Debounced save using native setTimeout
  useEffect(() => {
    if (!selectedId || !activeNote) return;

    // Only trigger autosave if local state differs from the note in store
    if (title === activeNote.title && body === activeNote.body) return;

    const timer = setTimeout(() => {
      void update(selectedId, { title, body });
    }, 2000); // 2-second idle autosave

    return () => clearTimeout(timer);
  }, [title, body, selectedId, activeNote, update]);

  const handleCreate = async () => {
    const newNote = await addNote("New Note", "");
    if (newNote) {
      setSelectedId(newNote.id);
    }
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    await remove(selectedId);
    setSelectedId(null);
  };

  return (
    <div className="flex h-[calc(100vh-6rem)] gap-6 p-6">
      {/* Sidebar - Notes list */}
      <div className="w-80 flex flex-col gap-4 border-r border-border pr-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight text-foreground">Notes</h2>
          <Button onClick={handleCreate} size="sm" className="gap-1">
            <Plus className="h-4 w-4" /> New Note
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-2">
          {loading && notes.length === 0 ? (
            <p className="text-sm text-muted-foreground p-4 text-center">Loading notes...</p>
          ) : notes.length === 0 ? (
            <div className="text-center py-12 border border-dashed rounded-lg border-muted-foreground/20">
              <p className="text-sm text-muted-foreground">No notes yet.</p>
            </div>
          ) : (
            notes.map((note: NoteDTO) => (
              <div
                key={note.id}
                onClick={() => setSelectedId(note.id)}
                className={`group relative flex flex-col items-start gap-1 p-3 rounded-lg border text-left text-sm transition-all hover:bg-accent cursor-pointer ${
                  note.id === selectedId
                    ? "bg-accent border-accent"
                    : "border-muted-foreground/10 bg-card"
                }`}
              >
                <div className="flex w-full items-center justify-between">
                  <span className="font-semibold truncate pr-6 text-foreground">
                    {note.title || "Untitled"}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      void togglePin(note);
                    }}
                    className={`absolute right-3 opacity-0 group-hover:opacity-100 transition-opacity hover:text-foreground ${
                      note.pinned ? "opacity-100 text-primary" : "text-muted-foreground"
                    }`}
                  >
                    {note.pinned ? (
                      <Pin className="h-3.5 w-3.5 fill-current" />
                    ) : (
                      <Pin className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
                <span className="line-clamp-2 text-xs text-muted-foreground">
                  {note.body || "No content"}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Editor pane */}
      <div className="flex-1 flex flex-col gap-4">
        {selectedId && activeNote ? (
          <div className="flex-1 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Note title"
                className="text-2xl font-bold border-none shadow-none px-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-auto"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDelete}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Start typing..."
              className="flex-1 resize-none border-none shadow-none px-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-base leading-relaxed"
            />
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center border border-dashed rounded-lg border-muted-foreground/20">
            <div className="text-center max-w-sm">
              <h3 className="font-semibold text-lg text-foreground">No note selected</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Select an existing note from the sidebar, or create a new one to start writing.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
