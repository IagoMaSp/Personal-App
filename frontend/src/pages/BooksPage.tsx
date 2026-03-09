import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { booksApi } from '../api/books';
import type { Book, BookStatus } from '../api/books';
import { Plus, Save, X, Star, Trash2, BookOpen, Upload, Search, Library } from 'lucide-react';

/* ── Status config ───────────────────────────────────────────── */

type StatusFilter = BookStatus | 'all';

const STATUS_CFG: Record<BookStatus, { label: string; color: string; bg: string; dot: string }> = {
    to_read: { label: 'Por leer', color: 'text-slate-400', bg: 'bg-slate-400/10 border-slate-400/30', dot: 'bg-slate-400' },
    reading: { label: 'Leyendo', color: 'text-blue-400', bg: 'bg-blue-400/10 border-blue-400/30', dot: 'bg-blue-400' },
    read: { label: 'Leído', color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/30', dot: 'bg-emerald-400' },
    dropped: { label: 'Abandonado', color: 'text-red-400', bg: 'bg-red-400/10 border-red-400/30', dot: 'bg-red-400' },
};

/* ── Star rating component ───────────────────────────────────── */

interface StarRatingProps {
    value: number;
    onChange?: (v: number) => void;
    size?: 'sm' | 'md';
}

const StarRating = ({ value, onChange, size = 'sm' }: StarRatingProps) => {
    const [hovered, setHovered] = useState(0);
    const dim = size === 'sm' ? 'w-3.5 h-3.5' : 'w-5 h-5';

    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map(star => {
                const filled = (hovered || value) >= star;
                const half = !filled && (hovered || value) >= star - 0.5;
                return (
                    <button
                        key={star}
                        type="button"
                        className={`relative ${dim} transition-transform ${onChange ? 'cursor-pointer hover:scale-125' : 'cursor-default'}`}
                        onMouseEnter={() => onChange && setHovered(star)}
                        onMouseLeave={() => onChange && setHovered(0)}
                        onClick={() => onChange?.(hovered || star)}
                    >
                        <Star className={`${dim} text-hk-border absolute inset-0`} />
                        <div
                            className="absolute inset-0 overflow-hidden"
                            style={{ width: half ? '50%' : filled ? '100%' : '0%' }}
                        >
                            <Star className={`${dim} fill-amber-400 text-amber-400`} />
                        </div>
                    </button>
                );
            })}
            <span className="ml-1 text-xs font-bold text-amber-400/80">{value.toFixed(1)}</span>
        </div>
    );
};

/* ── Book Card ───────────────────────────────────────────────── */

interface BookCardProps {
    book: Book;
    index: number;
    visible: boolean;
    onEdit: () => void;
    onDelete: () => void;
}

const BookCard = ({ book, index, visible, onEdit, onDelete }: BookCardProps) => {
    const cfg = STATUS_CFG[book.status];
    const cardRef = useRef<HTMLDivElement>(null);

    // 3-D tilt on mouse move
    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const el = cardRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        el.style.transform = `perspective(600px) rotateY(${x * 10}deg) rotateX(${-y * 8}deg) translateZ(4px)`;
    };
    const handleMouseLeave = () => {
        if (cardRef.current) cardRef.current.style.transform = '';
    };

    return (
        <div
            className="book-card-wrapper"
            style={{
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.96)',
                transition: `opacity 0.4s ease ${index * 0.05}s, transform 0.4s ease ${index * 0.05}s`,
            }}
        >
            <div
                ref={cardRef}
                className="group book-card"
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                style={{ transition: 'transform 0.15s ease' }}
            >
                {/* Cover image or placeholder */}
                <div className="book-cover">
                    {book.cover_image ? (
                        <img
                            src={book.cover_image}
                            alt={book.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                    ) : (
                        <div className="book-cover-placeholder">
                            {/* Decorative lines */}
                            <div className="absolute inset-0 flex flex-col justify-center gap-2 p-4 opacity-20">
                                {[...Array(6)].map((_, i) => (
                                    <div key={i} className="h-px bg-hk-accent" style={{ width: `${60 + Math.random() * 30}%` }} />
                                ))}
                            </div>
                            <BookOpen className="w-10 h-10 text-hk-accent/30 mb-3 relative z-10" />
                            <p className="font-serif font-bold text-sm text-hk-text text-center leading-snug line-clamp-3 relative z-10 px-2">
                                {book.title}
                            </p>
                            <p className="text-[10px] text-hk-text-muted/60 mt-1 relative z-10">{book.author}</p>
                        </div>
                    )}

                    {/* Shimmer on hover */}
                    <div className="book-shimmer" />

                    {/* Left spine shadow */}
                    <div className="book-spine" />

                    {/* Status badge */}
                    <div className={`book-status-badge ${cfg.bg} ${cfg.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} mr-1.5`} />
                        {cfg.label}
                    </div>
                </div>

                {/* Hover overlay */}
                <div className="book-overlay">
                    <div className="flex flex-col h-full">
                        <h3 className="font-serif font-bold text-sm text-hk-text leading-snug line-clamp-2 mb-1">
                            {book.title}
                        </h3>
                        <p className="text-[11px] text-hk-accent mb-3 line-clamp-1">{book.author}</p>

                        <StarRating value={book.rating} size="sm" />

                        {book.review && (
                            <div className="mt-3 flex-1 min-h-0">
                                <p className="text-[9px] uppercase tracking-widest text-hk-text-muted/50 mb-1">Tu reseña</p>
                                <p className="text-[11px] text-hk-text/80 italic line-clamp-4">"{book.review}"</p>
                            </div>
                        )}

                        <div className="flex gap-2 mt-auto pt-3 border-t border-hk-border/30">
                            <button
                                onClick={e => { e.stopPropagation(); onDelete(); }}
                                className="book-action-del"
                                title="Eliminar"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                                onClick={e => { e.stopPropagation(); onEdit(); }}
                                className="book-action-edit flex-1"
                            >
                                Editar
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Title below card */}
            <div className="book-title-below">
                <p className="text-xs font-medium text-hk-text/80 truncate">{book.title}</p>
                <p className="text-[10px] text-hk-text-muted/50 truncate">{book.author || '—'}</p>
            </div>
        </div>
    );
};

/* ── Empty state ────────────────────────────────────────────── */

const EmptyShelf = ({ onAdd }: { onAdd: () => void }) => (
    <div className="flex-1 flex flex-col items-center justify-center gap-6 py-16">
        <div className="shelf-empty-emblem">
            <div className="shelf-emblem-ring shelf-emblem-ring--outer" />
            <div className="shelf-emblem-ring shelf-emblem-ring--inner" />
            <Library className="w-10 h-10 text-hk-accent/50 relative z-10" />
        </div>
        <div className="text-center">
            <p className="font-serif text-xl text-hk-text/40 mb-1">La estantería está vacía</p>
            <p className="text-xs text-hk-text-muted/30 tracking-widest uppercase">Añade tu primer libro</p>
        </div>
        <button onClick={onAdd} className="shelf-add-cta">
            <Plus className="w-4 h-4 mr-2" />
            Añadir Libro
        </button>
    </div>
);

/* ── Main page ───────────────────────────────────────────────── */

export const BooksPage = () => {
    const queryClient = useQueryClient();
    const [isCreating, setIsCreating] = useState(false);
    const [selectedBook, setSelectedBook] = useState<Book | null>(null);
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [visibleCount, setVisibleCount] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const dropZoneRef = useRef<HTMLDivElement>(null);

    // Form state
    const [title, setTitle] = useState('');
    const [author, setAuthor] = useState('');
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [coverPreview, setCoverPreview] = useState<string | null>(null);
    const [status, setStatus] = useState<BookStatus>('to_read');
    const [rating, setRating] = useState(0);
    const [synopsis, setSynopsis] = useState('');
    const [review, setReview] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

    const { data: books, isLoading } = useQuery({ queryKey: ['books'], queryFn: booksApi.getAll });

    // Filter + search
    const filtered = books?.filter(b => {
        const matchStatus = statusFilter === 'all' || b.status === statusFilter;
        const q = searchQuery.toLowerCase();
        const matchSearch = !q || b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q);
        return matchStatus && matchSearch;
    });

    // Staggered entrance
    useEffect(() => {
        setVisibleCount(0);
        if (!filtered?.length) return;
        let i = 0;
        const step = () => { i++; setVisibleCount(i); if (i < filtered!.length) setTimeout(step, 50); };
        const t = setTimeout(step, 100);
        return () => clearTimeout(t);
    }, [statusFilter, searchQuery, books?.length]);

    /* Mutations */
    const createMutation = useMutation({
        mutationFn: booksApi.create,
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['books'] }); resetForm(); },
        onError: err => alert('Error: ' + err.message),
    });
    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: FormData }) => booksApi.update(id, data),
        onSuccess: (updated) => { queryClient.invalidateQueries({ queryKey: ['books'] }); setSelectedBook(updated); resetForm(); },
        onError: err => alert('Error: ' + err.message),
    });
    const deleteMutation = useMutation({
        mutationFn: booksApi.delete,
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['books'] }); setDeleteConfirmId(null); },
    });

    const handleEdit = (book: Book) => {
        setSelectedBook(book);
        setTitle(book.title);
        setAuthor(book.author);
        setCoverFile(null);
        setCoverPreview(book.cover_image);
        setStatus(book.status);
        setRating(book.rating);
        setSynopsis(book.synopsis);
        setReview(book.review);
        setIsCreating(true);
    };

    const resetForm = () => {
        setIsCreating(false);
        setSelectedBook(null);
        setTitle(''); setAuthor('');
        setCoverFile(null); setCoverPreview(null);
        setStatus('to_read'); setRating(0);
        setSynopsis(''); setReview('');
        setIsDragging(false);
    };

    const handleSave = () => {
        if (!title.trim()) return;
        const fd = new FormData();
        fd.append('title', title);
        fd.append('author', author);
        fd.append('status', status);
        fd.append('rating', rating.toString());
        fd.append('synopsis', synopsis);
        fd.append('review', review);
        if (coverFile) fd.append('cover_image', coverFile);
        selectedBook
            ? updateMutation.mutate({ id: selectedBook.id, data: fd })
            : createMutation.mutate(fd);
    };

    const setImageFile = (file: File) => {
        setCoverFile(file);
        setCoverPreview(URL.createObjectURL(file));
    };

    const isSaving = createMutation.isPending || updateMutation.isPending;

    const countByStatus = (s: BookStatus) => books?.filter(b => b.status === s).length ?? 0;

    return (
        <div className="books-page">

            {/* ── Page Header ── */}
            <div className="books-header">
                <div className="flex items-center gap-3">
                    <Library className="w-5 h-5 text-hk-accent/70" />
                    <h2 className="text-2xl font-bold font-serif text-hk-text tracking-wide">Biblioteca</h2>
                    {books && (
                        <span className="px-2 py-0.5 rounded-full bg-hk-accent/10 border border-hk-accent/20 text-hk-accent text-xs font-bold">
                            {books.length}
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    {/* Search */}
                    <div className="books-search-wrapper">
                        <Search className="w-3.5 h-3.5 text-hk-text-muted/40 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Buscar título o autor..."
                            className="books-search-input"
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-hk-text-muted/40 hover:text-hk-text transition-colors">
                                <X className="w-3 h-3" />
                            </button>
                        )}
                    </div>

                    <button
                        onClick={() => { resetForm(); setIsCreating(true); }}
                        className="books-add-btn"
                    >
                        <Plus className="w-4 h-4 mr-1.5" />
                        Añadir Libro
                    </button>
                </div>
            </div>

            {/* ── Status filter tabs ── */}
            <div className="books-filter-tabs">
                <button
                    onClick={() => setStatusFilter('all')}
                    className={`filter-tab ${statusFilter === 'all' ? 'filter-tab--active' : ''}`}
                >
                    Todos
                    {books && <span className="filter-tab-count">{books.length}</span>}
                </button>
                {(Object.keys(STATUS_CFG) as BookStatus[]).map(s => (
                    <button
                        key={s}
                        onClick={() => setStatusFilter(s)}
                        className={`filter-tab ${statusFilter === s ? 'filter-tab--active' : ''}`}
                    >
                        <span className={`w-1.5 h-1.5 rounded-full ${STATUS_CFG[s].dot}`} />
                        {STATUS_CFG[s].label}
                        <span className="filter-tab-count">{countByStatus(s)}</span>
                    </button>
                ))}
            </div>

            {/* ── Books Grid ── */}
            <div className="books-grid-area">
                {isLoading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-5 p-1">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="flex flex-col gap-2" style={{ opacity: 1 - i * 0.1 }}>
                                <div className="aspect-[2/3] rounded-xl bg-hk-border/30 animate-pulse" />
                                <div className="h-3 rounded bg-hk-border/20 animate-pulse w-3/4" />
                            </div>
                        ))}
                    </div>
                ) : filtered?.length === 0 ? (
                    <EmptyShelf onAdd={() => { resetForm(); setIsCreating(true); }} />
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-5 p-1">
                        {filtered?.map((book, idx) => (
                            <BookCard
                                key={book.id}
                                book={book}
                                index={idx}
                                visible={idx < visibleCount}
                                onEdit={() => handleEdit(book)}
                                onDelete={() => setDeleteConfirmId(book.id)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* ── Delete confirm modal ── */}
            {deleteConfirmId !== null && (
                <div className="modal-backdrop" onClick={() => setDeleteConfirmId(null)}>
                    <div className="delete-modal" onClick={e => e.stopPropagation()}>
                        <div className="delete-modal-icon">
                            <Trash2 className="w-6 h-6 text-red-400" />
                        </div>
                        <h3 className="text-base font-bold text-hk-text font-serif">¿Eliminar libro?</h3>
                        <p className="text-xs text-hk-text-muted/70 text-center">Esta acción no se puede deshacer.</p>
                        <div className="flex gap-3 mt-2">
                            <button onClick={() => setDeleteConfirmId(null)} className="modal-cancel-btn">Cancelar</button>
                            <button
                                onClick={() => deleteMutation.mutate(deleteConfirmId!)}
                                className="modal-delete-btn"
                                disabled={deleteMutation.isPending}
                            >
                                {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Create / Edit Modal ── */}
            {isCreating && (
                <div className="modal-backdrop" onClick={resetForm}>
                    <div className="book-modal" onClick={e => e.stopPropagation()}>

                        {/* Modal header */}
                        <div className="book-modal-header">
                            <div className="flex items-center gap-2">
                                <BookOpen className="w-4 h-4 text-hk-accent/70" />
                                <h3 className="text-lg font-bold font-serif text-hk-text">
                                    {selectedBook ? 'Editar Libro' : 'Añadir Libro'}
                                </h3>
                            </div>
                            <button onClick={resetForm} className="modal-close-btn">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="book-modal-body">
                            {/* Left — cover preview */}
                            <div className="book-modal-cover-col">
                                <div
                                    ref={dropZoneRef}
                                    className={`book-cover-dropzone ${isDragging ? 'book-cover-dropzone--drag' : ''} ${coverPreview ? 'book-cover-dropzone--filled' : ''}`}
                                    onClick={() => fileInputRef.current?.click()}
                                    onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                                    onDragLeave={() => setIsDragging(false)}
                                    onDrop={e => {
                                        e.preventDefault(); setIsDragging(false);
                                        const f = e.dataTransfer.files?.[0];
                                        if (f) setImageFile(f);
                                    }}
                                    onPaste={e => {
                                        for (let i = 0; i < e.clipboardData.items.length; i++) {
                                            if (e.clipboardData.items[i].type.startsWith('image/')) {
                                                const f = e.clipboardData.items[i].getAsFile();
                                                if (f) setImageFile(f);
                                            }
                                        }
                                    }}
                                    tabIndex={0}
                                >
                                    {coverPreview ? (
                                        <>
                                            <img
                                                src={coverPreview}
                                                alt="Portada"
                                                className="absolute inset-0 w-full h-full object-cover"
                                            />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <span className="text-xs text-white font-medium flex items-center gap-1">
                                                    <Upload className="w-3.5 h-3.5" />
                                                    Cambiar
                                                </span>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex flex-col items-center gap-3 text-center pointer-events-none">
                                            <Upload className={`w-8 h-8 ${isDragging ? 'text-hk-accent' : 'text-hk-text-muted/30'}`} />
                                            <span className="text-xs text-hk-text-muted/50 leading-relaxed">
                                                Arrastra, pega<br />(Ctrl+V) o clica
                                            </span>
                                        </div>
                                    )}
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={e => { const f = e.target.files?.[0]; if (f) setImageFile(f); }}
                                    />
                                </div>

                                {/* Status + rating in cover col */}
                                <div className="mt-4 space-y-3">
                                    <div>
                                        <label className="book-label">Estado</label>
                                        <div className="flex flex-col gap-1.5 mt-1.5">
                                            {(Object.keys(STATUS_CFG) as BookStatus[]).map(s => (
                                                <button
                                                    key={s}
                                                    type="button"
                                                    onClick={() => setStatus(s)}
                                                    className={`status-radio ${status === s ? `status-radio--active ${STATUS_CFG[s].bg} ${STATUS_CFG[s].color}` : ''}`}
                                                >
                                                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_CFG[s].dot} ${status === s ? 'opacity-100' : 'opacity-30'}`} />
                                                    {STATUS_CFG[s].label}
                                                    {status === s && <span className="ml-auto text-[8px] opacity-60">✓</span>}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right — fields */}
                            <div className="book-modal-fields-col">
                                {/* Title */}
                                <div>
                                    <label className="book-label">Título <span className="text-red-400">*</span></label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={e => setTitle(e.target.value)}
                                        placeholder="Título del libro..."
                                        className="book-input"
                                    />
                                </div>

                                {/* Author */}
                                <div>
                                    <label className="book-label">Autor</label>
                                    <input
                                        type="text"
                                        value={author}
                                        onChange={e => setAuthor(e.target.value)}
                                        placeholder="Nombre del autor..."
                                        className="book-input"
                                    />
                                </div>

                                {/* Rating */}
                                <div>
                                    <label className="book-label flex justify-between">
                                        <span>Puntuación</span>
                                        <span className="text-amber-400 font-bold">{rating.toFixed(1)} / 5</span>
                                    </label>
                                    <div className="mt-2 space-y-2">
                                        <StarRating value={rating} onChange={setRating} size="md" />
                                        <input
                                            type="range"
                                            min="0" max="5" step="0.5"
                                            value={rating}
                                            onChange={e => setRating(Number(e.target.value))}
                                            className="w-full book-range"
                                        />
                                    </div>
                                </div>

                                {/* Synopsis */}
                                <div>
                                    <label className="book-label">Sinopsis</label>
                                    <textarea
                                        value={synopsis}
                                        onChange={e => setSynopsis(e.target.value)}
                                        rows={3}
                                        placeholder="Breve descripción del libro..."
                                        className="book-textarea"
                                    />
                                </div>

                                {/* Review */}
                                <div>
                                    <label className="book-label">Reseña personal</label>
                                    <textarea
                                        value={review}
                                        onChange={e => setReview(e.target.value)}
                                        rows={4}
                                        placeholder="Tus pensamientos sobre el libro..."
                                        className="book-textarea"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Modal footer */}
                        <div className="book-modal-footer">
                            <button onClick={resetForm} className="modal-cancel-btn">Cancelar</button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving || !title.trim()}
                                className="modal-save-btn"
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
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
