import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notesApi, categoriesApi } from '../api/notes';
import type { Note } from '../api/notes';
import { TipTapEditor } from '../components/notes/TipTapEditor';
import { Pin, Trash2, Plus, Save, X, Search, BookOpen, Sparkles, Star, Home, Heart, Circle, Moon, GraduationCap, Music, Zap, Globe, Smile, Coffee, Target, Bookmark, FileText, Download } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useSearchParams } from 'react-router-dom';

/* ---------- Icon definitions ---------- */
export const NOTE_ICONS: { key: string; Icon: React.FC<{ className?: string }> }[] = [
    { key: 'FileText', Icon: FileText },
    { key: 'Star', Icon: Star },
    { key: 'Heart', Icon: Heart },
    { key: 'Home', Icon: Home },
    { key: 'Circle', Icon: Circle },
    { key: 'Moon', Icon: Moon },
    { key: 'GraduationCap', Icon: GraduationCap },
    { key: 'Music', Icon: Music },
    { key: 'Zap', Icon: Zap },
    { key: 'Globe', Icon: Globe },
    { key: 'Smile', Icon: Smile },
    { key: 'Coffee', Icon: Coffee },
    { key: 'Target', Icon: Target },
    { key: 'Bookmark', Icon: Bookmark },
];

export function getNoteIcon(key: string | null | undefined): React.FC<{ className?: string }> {
    const found = NOTE_ICONS.find(i => i.key === key);
    return found ? found.Icon : FileText;
}

/* ---------- tiny animation hook ---------- */
function useStaggeredMount(count: number, delay = 60) {
    const [visibleCount, setVisibleCount] = useState(0);
    useEffect(() => {
        setVisibleCount(0);
        if (count === 0) return;
        let i = 0;
        const step = () => {
            i++;
            setVisibleCount(i);
            if (i < count) setTimeout(step, delay);
        };
        const t = setTimeout(step, 80);
        return () => clearTimeout(t);
    }, [count, delay]);
    return visibleCount;
}

/* ---------- Note Card ---------- */
interface NoteCardProps {
    note: Note;
    isSelected: boolean;
    index: number;
    visibleCount: number;
    onClick: () => void;
    onPinToggle: (e: React.MouseEvent) => void;
}

const NoteCard = ({ note, isSelected, index, visibleCount, onClick, onPinToggle }: NoteCardProps) => {
    const visible = index < visibleCount;
    const NoteIconComp = getNoteIcon(note.icon);
    return (
        <div
            onClick={onClick}
            className="note-card"
            style={{
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(12px)',
                transition: `opacity 0.35s ease ${index * 0.04}s, transform 0.35s ease ${index * 0.04}s`,
            }}
        >
            <div className={`note-card-inner ${isSelected ? 'note-card--active' : ''}`}>
                {/* Pin glow when active */}
                {note.pinned && (
                    <span className="note-pin-glow" />
                )}

                {/* Header row */}
                <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        <NoteIconComp className="w-3.5 h-3.5 text-hk-accent/60 flex-shrink-0" />
                        <h3 className="font-semibold text-hk-text truncate text-sm leading-snug flex-1">
                            {note.title}
                        </h3>
                    </div>
                    <button
                        onClick={onPinToggle}
                        className={`pin-btn flex-shrink-0 ${note.pinned ? 'pin-btn--active' : ''}`}
                        title={note.pinned ? 'Desfijar' : 'Fijar'}
                    >
                        <Pin className={`w-3.5 h-3.5 ${note.pinned ? 'fill-current' : ''}`} />
                    </button>
                </div>

                {/* Categories */}
                {note.categories.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                        {note.categories.map(cat => (
                            <span key={cat.id} className="note-category-pill">
                                {cat.name}
                            </span>
                        ))}
                    </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between mt-auto">
                    <span className="text-[10px] text-hk-text-muted/60">
                        {formatDistanceToNow(new Date(note.updated_at), { addSuffix: true, locale: es })}
                    </span>
                    {note.pinned && (
                        <span className="text-[9px] uppercase tracking-widest text-hk-accent/70 font-bold">
                            Fijada
                        </span>
                    )}
                </div>

                {/* Selected indicator bar */}
                {isSelected && (
                    <span className="note-selected-bar" />
                )}
            </div>
        </div>
    );
};

/* ---------- Empty state ---------- */
const EmptyEditorState = ({ onNew }: { onNew: () => void }) => (
    <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8">
        {/* Animated HK-style emblem */}
        <div className="empty-state-emblem">
            <div className="emblem-ring emblem-ring--outer" />
            <div className="emblem-ring emblem-ring--inner" />
            <BookOpen className="w-8 h-8 text-hk-accent/60 relative z-10" />
        </div>

        <div className="text-center space-y-2">
            <p className="text-hk-text/50 font-serif text-lg tracking-wide">No hay nada aquí aún</p>
            <p className="text-hk-text-muted/40 text-xs tracking-widest uppercase">
                Selecciona una nota o crea una nueva
            </p>
        </div>

        <button onClick={onNew} className="new-note-cta-btn">
            <Plus className="w-4 h-4 mr-2" />
            Nueva Nota
        </button>
    </div>
);

/* ---------- Main page ---------- */
export const NotesPage = () => {
    const queryClient = useQueryClient();
    const [searchParams, setSearchParams] = useSearchParams();
    const [selectedNote, setSelectedNote] = useState<Note | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [isPinned, setIsPinned] = useState(false);
    const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
    const [noteIcon, setNoteIcon] = useState<string | null>(null);
    const [showIconPicker, setShowIconPicker] = useState(false);
    const iconPickerRef = useRef<HTMLDivElement>(null);

    // Initialize global spacing from local storage for the view mode
    useEffect(() => {
        const storedLineHeight = localStorage.getItem('hk-editor-line-height');
        const storedGap = localStorage.getItem('hk-editor-paragraph-gap');
        if (storedLineHeight) {
            document.documentElement.style.setProperty('--editor-line-height', storedLineHeight);
        }
        if (storedGap) {
            document.documentElement.style.setProperty('--editor-paragraph-gap', storedGap);
        }
    }, []);

    const [isCreatingCategory, setIsCreatingCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [deletingCategoryId, setDeletingCategoryId] = useState<number | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [justSaved, setJustSaved] = useState(false);

    const categoryInputRef = useRef<HTMLInputElement>(null);

    // Close icon picker on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (iconPickerRef.current && !iconPickerRef.current.contains(e.target as Node)) {
                setShowIconPicker(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: categoriesApi.getAll });
    const { data: notes, isLoading } = useQuery({ queryKey: ['notes'], queryFn: notesApi.getAll });

    useEffect(() => {
        const noteIdParam = searchParams.get('noteId');
        if (notes && noteIdParam) {
            const numId = parseInt(noteIdParam, 10);
            const targetNote = notes.find(n => n.id === numId);
            if (targetNote && selectedNote?.id !== targetNote.id) {
                setSelectedNote(targetNote);
                setTitle(targetNote.title);
                setContent(targetNote.content);
                setIsPinned(targetNote.pinned);
                setNoteIcon(targetNote.icon || null);
                setSelectedCategoryIds(targetNote.categories.map(c => c.id));
                setShowDeleteConfirm(false);
                setIsEditing(false);

                searchParams.delete('noteId');
                setSearchParams(searchParams, { replace: true });
            }
        }
    }, [notes, searchParams, selectedNote]);

    /* filtrar notas */
    const filteredNotes = notes?.filter(n =>
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.categories.some(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    /* ordenar: fijadas primero */
    const sortedNotes = filteredNotes?.slice().sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });

    const visibleCount = useStaggeredMount(sortedNotes?.length ?? 0);

    useEffect(() => {
        if (isCreatingCategory) categoryInputRef.current?.focus();
    }, [isCreatingCategory]);

    /* Mutations */
    const createMutation = useMutation({
        mutationFn: notesApi.create,
        onSuccess: (newNote) => {
            queryClient.invalidateQueries({ queryKey: ['notes'] });
            setSelectedNote(newNote);
            setIsEditing(false);
            triggerSaveFlash();
        },
        onError: (err) => alert('Error al guardar la nota: ' + err.message),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: any }) => notesApi.update(id, data),
        onSuccess: (updatedNote) => {
            queryClient.invalidateQueries({ queryKey: ['notes'] });
            setSelectedNote(updatedNote);
            setIsEditing(false);
            triggerSaveFlash();
        },
        onError: (err) => alert('Error al actualizar la nota: ' + err.message),
    });

    const deleteMutation = useMutation({
        mutationFn: notesApi.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notes'] });
            setShowDeleteConfirm(false);
            resetForm();
        },
    });

    const togglePinMutation = useMutation({
        mutationFn: ({ id, pinned }: { id: number; pinned: boolean }) => notesApi.update(id, { pinned }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notes'] }),
    });

    const triggerSaveFlash = () => {
        setJustSaved(true);
        setTimeout(() => setJustSaved(false), 2000);
    };

    const handleSelectNote = (note: Note) => {
        setSelectedNote(note);
        setTitle(note.title);
        setContent(note.content);
        setIsPinned(note.pinned);
        setNoteIcon(note.icon || null);
        setSelectedCategoryIds(note.categories.map(c => c.id));
        setShowDeleteConfirm(false);
        setIsEditing(false);
    };

    const resetForm = () => {
        setSelectedNote(null);
        setTitle('');
        setContent('');
        setIsPinned(false);
        setNoteIcon(null);
        setSelectedCategoryIds([]);
        setShowDeleteConfirm(false);
        setIsEditing(true);
    };

    const handleSave = () => {
        if (!title.trim()) return;
        if (selectedNote) {
            updateMutation.mutate({ id: selectedNote.id, data: { title, content, pinned: isPinned, icon: noteIcon, category_ids: selectedCategoryIds } });
        } else {
            createMutation.mutate({ title, content, pinned: isPinned, icon: noteIcon, category_ids: selectedCategoryIds });
        }
    };

    const toggleCategory = (id: number) => {
        setSelectedCategoryIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const isSaving = updateMutation.isPending || createMutation.isPending;

    const exportToMarkdown = (note: Note) => {
        let md = note.content;

        md = md.replace(/<h1>(.*?)<\/h1>/gi, '# $1\n\n');
        md = md.replace(/<h2>(.*?)<\/h2>/gi, '## $1\n\n');
        md = md.replace(/<h3>(.*?)<\/h3>/gi, '### $1\n\n');
        md = md.replace(/<p>(.*?)<\/p>/gi, '$1\n\n');
        md = md.replace(/<blockquote>(.*?)<\/blockquote>/gi, '> $1\n\n');

        md = md.replace(/<li data-type="taskItem" data-checked="true">.*?<div>(.*?)<\/div><\/li>/gi, '- [x] $1\n');
        md = md.replace(/<li data-type="taskItem" data-checked="false">.*?<div>(.*?)<\/div><\/li>/gi, '- [ ] $1\n');
        md = md.replace(/<li data-type="taskItem">.*?<div>(.*?)<\/div><\/li>/gi, '- [ ] $1\n');

        md = md.replace(/<li>(.*?)<\/li>/gi, '- $1\n');
        md = md.replace(/<ul>(.*?)<\/ul>/gi, '\n$1\n');
        md = md.replace(/<ol>(.*?)<\/ol>/gi, '\n$1\n');

        md = md.replace(/<strong>(.*?)<\/strong>/gi, '**$1**');
        md = md.replace(/<em>(.*?)<\/em>/gi, '*$1*');
        md = md.replace(/<s>(.*?)<\/s>/gi, '~~$1~~');
        md = md.replace(/<code>(.*?)<\/code>/gi, '`$1`');

        md = md.replace(/<[^>]+>/g, '');

        const textarea = document.createElement('textarea');
        textarea.innerHTML = md;
        md = textarea.value;

        const fullText = `# ${note.title}\n\n${md}`;

        const blob = new Blob([fullText], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${note.title.toLowerCase().replace(/\\s+/g, '-')}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="notes-page-layout">

            {/* ===== SIDEBAR ===== */}
            <aside className="notes-sidebar">
                {/* Header */}
                <div className="notes-sidebar-header">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-hk-accent/70" />
                        <h2 className="text-lg font-bold font-serif text-hk-text tracking-wide">Notas</h2>
                        {notes && (
                            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-hk-accent/10 text-hk-accent text-[10px] font-bold border border-hk-accent/20">
                                {notes.length}
                            </span>
                        )}
                    </div>
                    <button onClick={resetForm} className="new-note-btn" title="Nueva nota">
                        <Plus className="w-4 h-4" />
                    </button>
                </div>

                {/* Search */}
                <div className="notes-search-wrapper">
                    <Search className="w-3.5 h-3.5 text-hk-text-muted/50 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Buscar notas..."
                        className="notes-search-input"
                    />
                    {searchQuery && (
                        <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-hk-text-muted/50 hover:text-hk-text transition-colors">
                            <X className="w-3 h-3" />
                        </button>
                    )}
                </div>

                {/* Note list */}
                <div className="notes-list-scroll">
                    {isLoading ? (
                        <div className="flex flex-col gap-2 p-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-20 rounded-xl bg-hk-border/30 animate-pulse" style={{ opacity: 1 - i * 0.2 }} />
                            ))}
                        </div>
                    ) : sortedNotes?.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-3 text-hk-text-muted/40">
                            <BookOpen className="w-8 h-8 opacity-40" />
                            <p className="text-xs tracking-wide">
                                {searchQuery ? 'Sin resultados' : 'No hay notas aún'}
                            </p>
                        </div>
                    ) : (
                        <div className="p-3 space-y-2">
                            {sortedNotes?.map((note, idx) => (
                                <NoteCard
                                    key={note.id}
                                    note={note}
                                    isSelected={selectedNote?.id === note.id}
                                    index={idx}
                                    visibleCount={visibleCount}
                                    onClick={() => handleSelectNote(note)}
                                    onPinToggle={(e) => {
                                        e.stopPropagation();
                                        togglePinMutation.mutate({ id: note.id, pinned: !note.pinned });
                                    }}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Sidebar footer decoration */}
                <div className="notes-sidebar-footer">
                    <div className="sidebar-divider-line" />
                    <span className="text-[9px] uppercase tracking-[0.2em] text-hk-text-muted/30">
                        Notas Personales
                    </span>
                    <div className="sidebar-divider-line" />
                </div>
            </aside>

            {/* ===== EDITOR ===== */}
            <main className={`notes-editor-panel ${justSaved ? 'notes-editor-panel--saved' : ''}`}>
                {selectedNote || isEditing ? (
                    <div className="flex flex-col h-full">

                        {/* Editor header */}
                        <div className="notes-editor-header">
                            <div className="flex-1 min-w-0">
                                {isEditing ? (
                                    <>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={title}
                                                onChange={e => setTitle(e.target.value)}
                                                placeholder="Título de la nota..."
                                                className="notes-title-input"
                                            />
                                            {/* Underline glow */}
                                            <div className={`notes-title-underline ${title ? 'notes-title-underline--active' : ''}`} />
                                        </div>

                                        {/* Icon picker */}
                                        <div className="relative mt-2" ref={iconPickerRef}>
                                            {(() => {
                                                const CurrentIcon = getNoteIcon(noteIcon);
                                                return (
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowIconPicker(p => !p)}
                                                        className="note-icon-btn"
                                                        title="Elegir icono"
                                                    >
                                                        <CurrentIcon className="w-4 h-4" />
                                                        <span className="text-xs text-hk-text-muted/60 ml-1">{noteIcon ?? 'Sin icono'}</span>
                                                        <span className="text-[10px] text-hk-accent/50 ml-auto">▾</span>
                                                    </button>
                                                );
                                            })()}
                                            {showIconPicker && (
                                                <div className="note-icon-picker">
                                                    <button
                                                        type="button"
                                                        className={`note-icon-opt ${!noteIcon ? 'note-icon-opt--active' : ''}`}
                                                        onClick={() => { setNoteIcon(null); setShowIconPicker(false); }}
                                                        title="Sin icono"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                    {NOTE_ICONS.map(({ key, Icon }) => (
                                                        <button
                                                            key={key}
                                                            type="button"
                                                            className={`note-icon-opt ${noteIcon === key ? 'note-icon-opt--active' : ''}`}
                                                            onClick={() => { setNoteIcon(key); setShowIconPicker(false); }}
                                                            title={key}
                                                        >
                                                            <Icon className="w-4 h-4" />
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        {/* Categories */}
                                        <div className="flex flex-wrap gap-2 mt-3">
                                            {categories?.map(category =>
                                                deletingCategoryId === category.id ? (
                                                    <div key={`del-${category.id}`} className="cat-delete-confirm">
                                                        <span className="text-[9px] text-red-400/80 mr-1">¿Borrar?</span>
                                                        <button
                                                            className="cat-delete-confirm-yes"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                categoriesApi.delete(category.id)
                                                                    .then(() => {
                                                                        queryClient.invalidateQueries({ queryKey: ['categories'] });
                                                                        queryClient.invalidateQueries({ queryKey: ['notes'] });
                                                                        setDeletingCategoryId(null);
                                                                    })
                                                                    .catch(err => alert('Error: ' + err.message));
                                                            }}
                                                        >Sí</button>
                                                        <button
                                                            className="cat-delete-confirm-no"
                                                            onClick={(e) => { e.stopPropagation(); setDeletingCategoryId(null); }}
                                                        >No</button>
                                                    </div>
                                                ) : (
                                                    <div key={category.id} className="category-chip-wrapper group">
                                                        <button
                                                            onClick={() => toggleCategory(category.id)}
                                                            className={`category-chip ${selectedCategoryIds.includes(category.id) ? 'category-chip--active' : ''}`}
                                                        >
                                                            {category.name}
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setDeletingCategoryId(category.id); }}
                                                            className="category-chip-delete"
                                                            title="Eliminar categoría"
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
                                                )
                                            )}

                                            {isCreatingCategory ? (
                                                <div className="flex items-center gap-1">
                                                    <input
                                                        ref={categoryInputRef}
                                                        type="text"
                                                        value={newCategoryName}
                                                        onChange={e => setNewCategoryName(e.target.value)}
                                                        placeholder="Nombre..."
                                                        className="new-category-input"
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter' && newCategoryName.trim()) {
                                                                categoriesApi.create({ name: newCategoryName.trim() })
                                                                    .then(newCat => {
                                                                        queryClient.invalidateQueries({ queryKey: ['categories'] });
                                                                        setSelectedCategoryIds(prev => [...prev, newCat.id]);
                                                                        setIsCreatingCategory(false);
                                                                        setNewCategoryName('');
                                                                    })
                                                                    .catch(err => alert('Error: ' + err.message));
                                                            }
                                                            if (e.key === 'Escape') {
                                                                setIsCreatingCategory(false);
                                                                setNewCategoryName('');
                                                            }
                                                        }}
                                                    />
                                                    <button onClick={() => { setIsCreatingCategory(false); setNewCategoryName(''); }} className="text-hk-text-muted/50 hover:text-hk-text transition-colors p-1">
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <button className="new-category-btn" onClick={() => setIsCreatingCategory(true)}>
                                                    <Plus className="w-3 h-3 mr-1" />
                                                    Categoría
                                                </button>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <div>
                                        <h2 className="text-xl font-bold text-hk-text font-serif tracking-wide">
                                            {selectedNote?.title}
                                        </h2>
                                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                                            {selectedNote?.categories.map(cat => (
                                                <span key={cat.id} className="note-category-pill">{cat.name}</span>
                                            ))}
                                            <span className="text-[10px] text-hk-text-muted/50 ml-auto">
                                                {selectedNote && format(new Date(selectedNote.updated_at), "d 'de' MMMM 'de' yyyy", { locale: es })}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Action buttons */}
                            <div className="flex items-center gap-2 ml-4">
                                {isEditing ? (
                                    <>
                                        {/* Pin toggle */}
                                        <button
                                            onClick={() => setIsPinned(!isPinned)}
                                            className={`editor-action-btn ${isPinned ? 'editor-action-btn--pin-active' : ''}`}
                                            title={isPinned ? 'Desfijar' : 'Fijar nota'}
                                        >
                                            <Pin className={`w-4 h-4 ${isPinned ? 'fill-current' : ''}`} />
                                        </button>

                                        {selectedNote && (
                                            <button
                                                onClick={() => setIsEditing(false)}
                                                className="editor-action-btn"
                                                title="Cancelar"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        )}

                                        <button
                                            onClick={handleSave}
                                            disabled={isSaving || !title.trim()}
                                            className="save-btn"
                                            title={!title.trim() ? 'Agrega un título' : 'Guardar nota'}
                                        >
                                            {isSaving ? (
                                                <span className="flex items-center gap-2">
                                                    <span className="save-spinner" />
                                                    Guardando...
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-2">
                                                    <Save className="w-4 h-4" />
                                                    Guardar
                                                </span>
                                            )}
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button onClick={() => setIsEditing(true)} className="edit-btn">
                                            Editar
                                        </button>

                                        {selectedNote && (
                                            <button
                                                onClick={() => exportToMarkdown(selectedNote)}
                                                className="editor-action-btn"
                                                title="Exportar como Markdown"
                                            >
                                                <Download className="w-4 h-4" />
                                            </button>
                                        )}

                                        {showDeleteConfirm ? (
                                            <div className="delete-confirm-bar">
                                                <span className="text-xs text-red-400/80">¿Eliminar?</span>
                                                <button onClick={() => deleteMutation.mutate(selectedNote!.id)} className="delete-confirm-yes">
                                                    Sí
                                                </button>
                                                <button onClick={() => setShowDeleteConfirm(false)} className="delete-confirm-no">
                                                    No
                                                </button>
                                            </div>
                                        ) : (
                                            <button onClick={() => setShowDeleteConfirm(true)} className="delete-btn" title="Eliminar nota">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Divider with glow */}
                        <div className="notes-header-divider" />

                        {/* Editor body */}
                        <div className="flex-1 overflow-y-auto notes-editor-body">
                            {isEditing ? (
                                <TipTapEditor content={content} onChange={setContent} />
                            ) : (
                                <div
                                    className="prose prose-invert max-w-none text-hk-text notes-view-content"
                                    dangerouslySetInnerHTML={{ __html: selectedNote?.content || '' }}
                                    onClick={(e) => {
                                        const target = e.target as HTMLElement;
                                        if (target.tagName === 'INPUT' && (target as HTMLInputElement).type === 'checkbox') {
                                            const li = target.closest('li[data-type="taskItem"]');
                                            if (li) {
                                                const isChecked = (target as HTMLInputElement).checked;
                                                li.setAttribute('data-checked', isChecked ? 'true' : 'false');
                                                if (isChecked) {
                                                    target.setAttribute('checked', 'checked');
                                                } else {
                                                    target.removeAttribute('checked');
                                                }
                                                const newContent = e.currentTarget.innerHTML;
                                                updateMutation.mutate({
                                                    id: selectedNote!.id,
                                                    data: { content: newContent }
                                                });
                                                setContent(newContent);
                                            }
                                        }
                                    }}
                                />
                            )}
                        </div>

                        {/* Save success flash */}
                        {justSaved && (
                            <div className="save-success-toast">
                                <Sparkles className="w-3.5 h-3.5 mr-2 text-hk-accent" />
                                Nota guardada
                            </div>
                        )}
                    </div>
                ) : (
                    <EmptyEditorState onNew={resetForm} />
                )}
            </main>
        </div>
    );
};
