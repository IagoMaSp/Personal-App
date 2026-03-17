import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Moon, Sun, LogOut, BookOpen, FileText, X, Loader2, Target } from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { searchApi } from '../../api/search';
import type { SearchResults } from '../../api/search';
import { getNoteIcon } from '../../pages/NotesPage';

const BOOK_STATUS_LABELS: Record<string, { label: string; color: string }> = {
    reading: { label: 'Leyendo', color: '#10b981' },
    read: { label: 'Leído', color: '#6b8ea5' },
    to_read: { label: 'Por leer', color: '#f59e0b' },
    dropped: { label: 'Abandonado', color: '#ef4444' },
};


export const Topbar = () => {
    const { theme, toggleTheme } = useThemeStore();
    const logout = useAuthStore(state => state.logout);
    const navigate = useNavigate();

    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResults | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const doSearch = useCallback(async (q: string) => {
        if (!q.trim()) { setResults(null); setShowDropdown(false); return; }
        setIsSearching(true);
        try {
            const data = await searchApi.search(q);
            setResults(data);
            setShowDropdown(true);
        } catch {
            // ignore
        } finally {
            setIsSearching(false);
        }
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setQuery(val);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => doSearch(val), 350);
    };

    const handleClear = () => {
        setQuery(''); setResults(null); setShowDropdown(false);
        inputRef.current?.focus();
    };

    const navigate_ = (to: string) => {
        navigate(to);
        setShowDropdown(false);
        setQuery('');
    };

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Keyboard: Escape to close
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') { setShowDropdown(false); inputRef.current?.blur(); }
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, []);

    const totalResults = (results?.notes.length ?? 0) + (results?.books.length ?? 0) + (results?.habits.length ?? 0);

    return (
        <header className="topbar">
            {/* ── Global Search ── */}
            <div ref={wrapperRef} className="topbar-search-wrapper">
                <div className={`topbar-search-box ${isFocused ? 'topbar-search-box--focused' : ''}`}>
                    {isSearching ? (
                        <Loader2 className="topbar-search-icon animate-spin" />
                    ) : (
                        <Search className="topbar-search-icon" />
                    )}
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={handleChange}
                        onFocus={() => { setIsFocused(true); results && setShowDropdown(true); }}
                        onBlur={() => setIsFocused(false)}
                        placeholder="Buscar… (content: busca dentro del texto)"
                        className="topbar-search-input"
                    />
                    {query && (
                        <button onClick={handleClear} className="topbar-search-clear" aria-label="Limpiar">
                            <X className="w-3 h-3" />
                        </button>
                    )}
                </div>

                {/* ── Dropdown results ── */}
                {showDropdown && (
                    <div className="search-dropdown">
                        {totalResults === 0 ? (
                            <div className="search-empty">
                                <Search className="w-5 h-5 opacity-20 mb-2" />
                                <span>Sin resultados para</span>
                                <span className="search-empty-query">"{query}"</span>
                            </div>
                        ) : (
                            <div className="search-results-list">
                                {/* Notes section */}
                                {results!.notes.length > 0 && (
                                    <div className="search-section">
                                        <div className="search-section-header">
                                            <FileText className="w-3 h-3" />
                                            Notas
                                            <span className="search-section-count">{results!.notes.length}</span>
                                        </div>
                                        {results!.notes.map(note => (
                                            <button
                                                key={note.id}
                                                onClick={() => navigate_(`/notes?noteId=${note.id}`)}
                                                className="search-result-item group"
                                            >
                                                <div className="search-result-icon">
                                                    {(() => {
                                                        const NIcon = getNoteIcon(note.icon);
                                                        return <NIcon className="w-3.5 h-3.5" />;
                                                    })()}
                                                </div>
                                                <div className="search-result-body">
                                                    <div className="search-result-title">
                                                        {note.title || 'Sin título'}
                                                    </div>
                                                    {note.categories.length > 0 && (
                                                        <div className="flex gap-1 mt-0.5">
                                                            {note.categories.slice(0, 3).map(c => (
                                                                <span
                                                                    key={c.id}
                                                                    className="search-cat-pill"
                                                                    style={{ background: c.color + '25', color: c.color, borderColor: c.color + '40' }}
                                                                >
                                                                    {c.name}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="search-result-arrow">→</div>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Books section */}
                                {results!.books.length > 0 && (
                                    <div className="search-section">
                                        <div className="search-section-header">
                                            <BookOpen className="w-3 h-3" />
                                            Libros
                                            <span className="search-section-count">{results!.books.length}</span>
                                        </div>
                                        {results!.books.map(book => (
                                            <button
                                                key={book.id}
                                                onClick={() => navigate_('/books')}
                                                className="search-result-item group"
                                            >
                                                <div className="search-result-icon">
                                                    <BookOpen className="w-3.5 h-3.5" />
                                                </div>
                                                <div className="search-result-body">
                                                    <div className="search-result-title">{book.title}</div>
                                                    {book.author && (
                                                        <div className="search-result-sub">{book.author}</div>
                                                    )}
                                                </div>
                                                {book.status && BOOK_STATUS_LABELS[book.status] && (
                                                    <span
                                                        className="search-status-pill"
                                                        style={{
                                                            background: BOOK_STATUS_LABELS[book.status].color + '20',
                                                            color: BOOK_STATUS_LABELS[book.status].color,
                                                            borderColor: BOOK_STATUS_LABELS[book.status].color + '40',
                                                        }}
                                                    >
                                                        {BOOK_STATUS_LABELS[book.status].label}
                                                    </span>
                                                )}
                                                <div className="search-result-arrow">→</div>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Habits section */}
                                {results!.habits?.length > 0 && (
                                    <div className="search-section">
                                        <div className="search-section-header">
                                            <Target className="w-3 h-3" />
                                            Hábitos
                                            <span className="search-section-count">{results!.habits.length}</span>
                                        </div>
                                        {results!.habits.map(habit => (
                                            <button
                                                key={habit.id}
                                                onClick={() => navigate_('/habits')}
                                                className="search-result-item group"
                                            >
                                                <div className="search-result-icon">
                                                    <Target className="w-3.5 h-3.5" style={{ color: habit.color || '#6b8ea5' }} />
                                                </div>
                                                <div className="search-result-body">
                                                    <div className="search-result-title">{habit.name}</div>
                                                </div>
                                                <div className="search-result-arrow">→</div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Footer */}
                        <div className="search-footer">
                            <kbd className="search-kbd">Esc</kbd>
                            <span>para cerrar</span>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Right actions ── */}
            <div className="topbar-actions">
                <button
                    onClick={toggleTheme}
                    className="topbar-action-btn"
                    title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
                >
                    {theme === 'dark'
                        ? <Sun className="w-4 h-4" />
                        : <Moon className="w-4 h-4" />
                    }
                </button>
                <div className="topbar-divider" />
                <button
                    onClick={logout}
                    className="topbar-action-btn topbar-action-btn--danger"
                    title="Cerrar sesión"
                >
                    <LogOut className="w-4 h-4" />
                </button>
            </div>
        </header>
    );
};
