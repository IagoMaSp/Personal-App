import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Clock, Pin, BookOpen, Calendar, ArrowRight, Book as BookIcon, Sparkles, FileText } from 'lucide-react';
import { getNoteIcon } from './NotesPage';
import { WeatherWidget } from '../components/home/WeatherWidget';

import { notesApi } from '../api/notes';
import { booksApi } from '../api/books';
import { schedulesApi } from '../api/schedules';
import { eventsApi } from '../api/events';

import type { Note } from '../api/notes';
import type { Book } from '../api/books';
import type { Schedule } from '../api/schedules';
import type { Event } from '../api/events';

/* ── Constants ─────────────────────────────────────────────── */

const LEGACY_MAP: Record<string, string> = {
    'bg-hk-accent': '#6b8ea5', 'bg-blue-500': '#3b82f6',
    'bg-green-500': '#10b981', 'bg-yellow-500': '#f59e0b',
    'bg-purple-500': '#8b5cf6', 'bg-pink-500': '#ec4899',
    'bg-red-500': '#ef4444',
};

const toHex = (c: string) => LEGACY_MAP[c] ?? (c?.startsWith('#') ? c : '#6b8ea5');

const stripHtml = (html: string) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
};

/**
 * Extract first non-empty paragraph from HTML content.
 * Falls back to plain-text truncation if no <p> found.
 */
const getFirstParagraph = (html: string, maxChars = 120): string => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    // Try to get first <p> tag
    const firstP = tmp.querySelector('p');
    const text = (firstP ? firstP.textContent : tmp.textContent) || '';
    const trimmed = text.trim();
    return trimmed.length > maxChars ? trimmed.slice(0, maxChars).trimEnd() + '…' : trimmed;
};

const MONTHS_SHORT = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const DAYS_LONG = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

/* ── Stat card ─────────────────────────────────────────────── */

interface StatCardProps {
    icon: React.ReactNode;
    label: string;
    value: number | string;
    to: string;
    accent?: string;
    delay?: number;
}

const StatCard = ({ icon, label, value, to, accent = '#6b8ea5', delay = 0 }: StatCardProps) => (
    <Link
        to={to}
        className="home-stat-card"
        style={{ '--stat-accent': accent, animationDelay: `${delay}s` } as React.CSSProperties}
    >
        <div className="home-stat-icon-wrap" style={{ background: accent + '18', borderColor: accent + '30' }}>
            <span style={{ color: accent }}>{icon}</span>
        </div>
        <div className="home-stat-body">
            <span className="home-stat-value">{value}</span>
            <span className="home-stat-label">{label}</span>
        </div>
        <ArrowRight className="home-stat-arrow" style={{ color: accent }} />
    </Link>
);

/* ── Agenda item ────────────────────────────────────────────── */

interface AgendaItemProps {
    title: string;
    start: string;
    end: string;
    color: string;
    isAllDay: boolean;
    type: 'schedule' | 'event';
    index: number;
}

const AgendaItem = ({ title, start, end, color, isAllDay, type, index }: AgendaItemProps) => {
    const hex = toHex(color);
    const now = new Date();
    const [hS, mS] = start.split(':').map(Number);
    const [hE, mE] = end.split(':').map(Number);
    const startMin = hS * 60 + mS;
    const endMin = hE * 60 + mE;
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const isActive = !isAllDay && nowMin >= startMin && nowMin <= endMin;
    const isPast = !isAllDay && nowMin > endMin;

    return (
        <div
            className={`agenda-item ${isActive ? 'agenda-item--active' : ''} ${isPast ? 'agenda-item--past' : ''}`}
            style={{ '--item-color': hex, animationDelay: `${0.05 + index * 0.04}s` } as React.CSSProperties}
        >
            <div className="agenda-item-bar" style={{ background: hex }} />
            <div className="agenda-item-time">
                {isAllDay ? (
                    <span className="agenda-allday">Todo el día</span>
                ) : (
                    <>
                        <span className="agenda-time-start">{start.slice(0, 5)}</span>
                        <span className="agenda-time-sep">↓</span>
                        <span className="agenda-time-end">{end.slice(0, 5)}</span>
                    </>
                )}
            </div>
            <div className="agenda-item-body">
                <p className="agenda-item-title">{title}</p>
                <span className={`agenda-item-type ${type === 'schedule' ? 'agenda-item-type--sched' : 'agenda-item-type--event'}`}>
                    {type === 'schedule' ? 'Horario' : 'Evento'}
                </span>
            </div>
            {isActive && (
                <div className="agenda-active-dot" style={{ background: hex }} />
            )}
        </div>
    );
};

/* ── Main component ─────────────────────────────────────────── */

export const HomePage = () => {
    const today = new Date();
    const todayISO = today.toISOString().split('T')[0];
    const jsDay = today.getDay();
    const appDay = jsDay === 0 ? 6 : jsDay - 1;

    const { data: notes, isLoading: lN } = useQuery<Note[]>({ queryKey: ['notes'], queryFn: notesApi.getAll });
    const { data: books, isLoading: lB } = useQuery<Book[]>({ queryKey: ['books'], queryFn: booksApi.getAll });
    const { data: schedules, isLoading: lS } = useQuery<Schedule[]>({ queryKey: ['schedules'], queryFn: schedulesApi.getAll });
    const { data: events, isLoading: lE } = useQuery<Event[]>({
        queryKey: ['events', today.getFullYear(), today.getMonth() + 1],
        queryFn: () => eventsApi.getAll(today.getFullYear(), today.getMonth() + 1),
    });

    const isLoading = lN || lB || lS || lE;

    // Derived
    const pinnedNotes = notes?.filter(n => n.pinned).slice(0, 4) || [];
    const activeBooks = books?.filter(b => b.status === 'reading').slice(0, 3) || [];
    const agendaItems = [
        ...(schedules?.filter(s => s.day_of_week === appDay) || []).map(s => ({
            id: `s-${s.id}`, title: s.title,
            start: s.start_time, end: s.end_time,
            color: s.color, isAllDay: false, type: 'schedule' as const,
        })),
        ...(events?.filter(e => e.date === todayISO) || []).map(e => ({
            id: `e-${e.id}`, title: e.title,
            start: e.start_time || '00:00:00', end: e.end_time || '23:59:59',
            color: e.color, isAllDay: e.is_all_day, type: 'event' as const,
        })),
    ].sort((a, b) => a.start.localeCompare(b.start));

    // Stats
    const totalNotes = notes?.length ?? 0;
    const totalBooks = books?.length ?? 0;
    const booksRead = books?.filter(b => b.status === 'read').length ?? 0;
    const upcomingEvs = events?.filter(e => e.date >= todayISO).length ?? 0;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-48">
                <div className="flex flex-col items-center gap-3">
                    <Sparkles className="w-8 h-8 text-hk-accent/40 animate-pulse" />
                    <p className="text-xs text-hk-text-muted/40 tracking-widest uppercase">Cargando...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="home-page">

            {/* ── Greeting header ── */}
            <div className="home-greeting">
                <div>
                    <h2 className="home-title">
                        {today.getHours() < 12 ? 'Buenos días' : today.getHours() < 19 ? 'Buenas tardes' : 'Buenas noches'}
                    </h2>
                    <p className="home-date">
                        {DAYS_LONG[jsDay]}, {today.getDate()} de {MONTHS_SHORT[today.getMonth()]} {today.getFullYear()}
                    </p>
                </div>
                <div className="home-time-display">
                    {String(today.getHours()).padStart(2, '0')}:{String(today.getMinutes()).padStart(2, '0')}
                </div>
            </div>

            {/* ── Stats row ── */}
            <div className="home-stats-row">
                <StatCard icon={<FileText className="w-4 h-4" />} label="Notas" value={totalNotes} to="/notes" accent="#6b8ea5" delay={0.05} />
                <StatCard icon={<BookOpen className="w-4 h-4" />} label="En biblioteca" value={totalBooks} to="/books" accent="#8b5cf6" delay={0.10} />
                <StatCard icon={<BookOpen className="w-4 h-4" />} label="Libros leídos" value={booksRead} to="/books" accent="#10b981" delay={0.15} />
                <StatCard icon={<Calendar className="w-4 h-4" />} label="Eventos este mes" value={upcomingEvs} to="/events" accent="#f59e0b" delay={0.20} />
            </div>

            {/* ── Main grid ── */}
            <div className="home-main-grid">

                {/* Agenda de hoy */}
                <div className="home-card home-card--agenda">
                    <div className="home-card-header">
                        <div className="flex items-center gap-2.5">
                            <div className="home-card-icon-wrap">
                                <Calendar className="w-4 h-4 text-hk-accent" />
                            </div>
                            <h3 className="home-card-title">Agenda de Hoy</h3>
                        </div>
                        <Link to="/events" className="home-card-link">
                            Ver calendario <ArrowRight className="w-3 h-3" />
                        </Link>
                    </div>

                    <div className="home-agenda-body">
                        {agendaItems.length === 0 ? (
                            <div className="home-empty-state">
                                <div className="home-empty-icon">
                                    <Clock className="w-6 h-6 opacity-25" />
                                </div>
                                <p className="home-empty-text">No hay actividades para hoy</p>
                                <p className="home-empty-sub">¡Disfruta tu día libre!</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {agendaItems.map((item, i) => (
                                    <AgendaItem key={item.id} {...item} index={i} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right column */}
                <div className="home-right-col space-y-4">

                    {/* Clima */}
                    <WeatherWidget />

                    {/* Notas fijadas */}
                    <div className="home-card">
                        <div className="home-card-header">
                            <div className="flex items-center gap-2.5">
                                <div className="home-card-icon-wrap">
                                    <Pin className="w-4 h-4 text-hk-accent" />
                                </div>
                                <h3 className="home-card-title">Notas Fijadas</h3>
                            </div>
                            {pinnedNotes.length > 0 && (
                                <Link to="/notes" className="home-card-link">
                                    Ver todas <ArrowRight className="w-3 h-3" />
                                </Link>
                            )}
                        </div>

                        {pinnedNotes.length === 0 ? (
                            <div className="home-empty-state home-empty-state--sm">
                                <p className="home-empty-text">No tienes notas fijadas</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {pinnedNotes.map(note => {
                                    const NoteIconComp = getNoteIcon(note.icon);
                                    const preview = getFirstParagraph(note.content);
                                    const fullText = stripHtml(note.content);
                                    return (
                                        <Link key={note.id} to={`/notes?noteId=${note.id}`} className="home-note-item group">
                                            <div className="home-note-title group-hover:text-hk-accent flex items-center gap-1.5">
                                                <NoteIconComp className="w-3 h-3 opacity-60 flex-shrink-0" />
                                                <span className="truncate">{note.title || 'Sin título'}</span>
                                            </div>
                                            <div
                                                className="home-note-preview"
                                                title={fullText.length > 120 ? fullText : undefined}
                                            >
                                                {preview || 'Nota vacía...'}
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        )}

                    </div>

                    {/* Leyendo ahora */}
                    <div className="home-card">
                        <div className="home-card-header">
                            <div className="flex items-center gap-2.5">
                                <div className="home-card-icon-wrap">
                                    <BookOpen className="w-4 h-4 text-hk-accent" />
                                </div>
                                <h3 className="home-card-title">Leyendo Ahora</h3>
                            </div>
                            {activeBooks.length > 0 && (
                                <Link to="/books" className="home-card-link">
                                    Biblioteca <ArrowRight className="w-3 h-3" />
                                </Link>
                            )}
                        </div>

                        {activeBooks.length === 0 ? (
                            <div className="home-empty-state home-empty-state--sm">
                                <p className="home-empty-text">No estás leyendo ningún libro</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {activeBooks.map(book => (
                                    <Link key={book.id} to="/books" className="home-book-item group">
                                        {book.cover_image ? (
                                            <img
                                                src={book.cover_image}
                                                alt={book.title}
                                                className="home-book-cover"
                                            />
                                        ) : (
                                            <div className="home-book-cover-placeholder">
                                                <BookIcon className="w-4 h-4 text-hk-border/50" />
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <div className="home-book-title group-hover:text-hk-accent">{book.title}</div>
                                            <div className="home-book-author">{book.author || 'Autor desconocido'}</div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};
