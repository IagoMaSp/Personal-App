import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventsApi } from '../api/events';
import type { Event } from '../api/events';
import { schedulesApi } from '../api/schedules';
import { Plus, Save, X, Trash2, ChevronLeft, ChevronRight, Calendar as CalendarIcon, RefreshCw, Clock, Sparkles } from 'lucide-react';

/* ── Constants ───────────────────────────────────────────────── */

const DAYS_HEADER = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const PALETTE = [
    { id: 'slate', hex: '#6b8ea5' },
    { id: 'blue', hex: '#3b82f6' },
    { id: 'violet', hex: '#8b5cf6' },
    { id: 'pink', hex: '#ec4899' },
    { id: 'red', hex: '#ef4444' },
    { id: 'amber', hex: '#f59e0b' },
    { id: 'emerald', hex: '#10b981' },
    { id: 'teal', hex: '#14b8a6' },
];

const LEGACY_MAP: Record<string, string> = {
    'bg-hk-accent': '#6b8ea5', 'bg-blue-500': '#3b82f6',
    'bg-green-500': '#10b981', 'bg-yellow-500': '#f59e0b',
    'bg-purple-500': '#8b5cf6', 'bg-pink-500': '#ec4899',
    'bg-red-500': '#ef4444',
};

const toHex = (c: string) => LEGACY_MAP[c] ?? (c?.startsWith('#') ? c : '#6b8ea5');

/* ── Helpers ─────────────────────────────────────────────────── */

const todayStr = () => new Date().toISOString().split('T')[0];

const fmt5 = (t: string | null | undefined) => t ? t.slice(0, 5) : '';

/* ── Event pill inside calendar cell ────────────────────────── */

interface PillProps {
    label: string;
    hex: string;
    icon?: React.ReactNode;
    time?: string;
    onClick?: (e: React.MouseEvent) => void;
    dashed?: boolean;
}

const EventPill = ({ label, hex, icon, time, onClick, dashed }: PillProps) => (
    <div
        className={`cal-pill ${dashed ? 'cal-pill--dashed' : ''}`}
        style={{ '--pill-color': hex } as React.CSSProperties}
        onClick={onClick}
        title={label}
    >
        <span className="cal-pill-dot" style={{ background: hex }} />
        {icon && <span className="cal-pill-icon">{icon}</span>}
        {time && <span className="cal-pill-time">{time}</span>}
        <span className="cal-pill-label">{label}</span>
    </div>
);

/* ── Main page ───────────────────────────────────────────────── */

export const EventsPage = () => {
    const queryClient = useQueryClient();
    const today = new Date();

    // Calendar navigation
    const [currentYear, setCurrentYear] = useState(today.getFullYear());
    const [currentMonth, setCurrentMonth] = useState(today.getMonth());

    // Modal
    const [isCreating, setIsCreating] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState(false);

    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState(todayStr());
    const [isAllDay, setIsAllDay] = useState(false);
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('10:00');
    const [color, setColor] = useState(PALETTE[0].hex);

    // Animate calendar cells
    const [cellsVisible, setCellsVisible] = useState(false);
    useEffect(() => {
        setCellsVisible(false);
        const t = setTimeout(() => setCellsVisible(true), 80);
        return () => clearTimeout(t);
    }, [currentMonth, currentYear]);

    const { data: events, isLoading } = useQuery({
        queryKey: ['events', currentYear, currentMonth + 1],
        queryFn: () => eventsApi.getAll(currentYear, currentMonth + 1),
    });

    const { data: schedules } = useQuery({
        queryKey: ['schedules'],
        queryFn: schedulesApi.getAll,
    });

    /* Mutations */
    const createMutation = useMutation({
        mutationFn: eventsApi.create,
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['events'] }); resetForm(); },
        onError: (err: any) => alert('Error: ' + (err.response?.data?.non_field_errors?.[0] || err.message)),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: Partial<Event> }) => eventsApi.update(id, data),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['events'] }); resetForm(); },
        onError: (err: any) => alert('Error: ' + (err.response?.data?.non_field_errors?.[0] || err.message)),
    });

    const deleteMutation = useMutation({
        mutationFn: eventsApi.delete,
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['events'] }); resetForm(); },
    });

    const resetForm = () => {
        setIsCreating(false); setSelectedEvent(null); setDeleteConfirm(false);
        setTitle(''); setDescription(''); setDate(todayStr());
        setIsAllDay(false); setStartTime('09:00'); setEndTime('10:00');
        setColor(PALETTE[0].hex);
    };

    const handleEdit = (ev: Event) => {
        setSelectedEvent(ev);
        setTitle(ev.title); setDescription(ev.description || '');
        setDate(ev.date); setIsAllDay(ev.is_all_day);
        setStartTime(ev.start_time ? ev.start_time.slice(0, 5) : '09:00');
        setEndTime(ev.end_time ? ev.end_time.slice(0, 5) : '10:00');
        setColor(toHex(ev.color));
        setDeleteConfirm(false);
        setIsCreating(true);
    };

    const handleDayClick = (dateStr: string) => {
        resetForm(); setDate(dateStr); setIsCreating(true);
    };

    const handleSave = () => {
        if (!title.trim() || !date) return;
        const data: Partial<Event> = { title, description, date, is_all_day: isAllDay, color };
        if (!isAllDay && startTime && endTime) {
            data.start_time = `${startTime}:00`;
            data.end_time = `${endTime}:00`;
        } else {
            data.start_time = null;
            data.end_time = null;
        }
        selectedEvent
            ? updateMutation.mutate({ id: selectedEvent.id, data })
            : createMutation.mutate(data);
    };

    const prevMonth = () => currentMonth === 0
        ? (setCurrentMonth(11), setCurrentYear(y => y - 1))
        : setCurrentMonth(m => m - 1);

    const nextMonth = () => currentMonth === 11
        ? (setCurrentMonth(0), setCurrentYear(y => y + 1))
        : setCurrentMonth(m => m + 1);

    /* ── Calendar math ── */

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();
    const todayISO = todayStr();

    const calendarCells = [];

    for (let i = 0; i < firstDayOfMonth; i++) {
        calendarCells.push({ day: daysInPrevMonth - firstDayOfMonth + i + 1, isCurrentMonth: false, dateString: '', events: [], schedules: [] });
    }

    for (let i = 1; i <= daysInMonth; i++) {
        const monthStr = (currentMonth + 1).toString().padStart(2, '0');
        const dayStr = i.toString().padStart(2, '0');
        const dateString = `${currentYear}-${monthStr}-${dayStr}`;
        const jsDay = new Date(currentYear, currentMonth, i).getDay();
        const appDay = jsDay === 0 ? 6 : jsDay - 1;
        calendarCells.push({
            day: i, isCurrentMonth: true, dateString,
            events: events?.filter(e => e.date === dateString) || [],
            schedules: schedules?.filter(s => s.day_of_week === appDay) || [],
            isToday: dateString === todayISO,
        });
    }

    const remaining = 42 - calendarCells.length;
    for (let i = 1; i <= remaining; i++) {
        calendarCells.push({ day: i, isCurrentMonth: false, dateString: '', events: [], schedules: [] });
    }

    const totalEventsThisMonth = events?.length ?? 0;
    const isSaving = createMutation.isPending || updateMutation.isPending;

    return (
        <div className="events-page">

            {/* ── Header ── */}
            <div className="events-header">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <CalendarIcon className="w-5 h-5 text-hk-accent/70" />
                        <h2 className="text-2xl font-bold font-serif text-hk-text tracking-wide">Calendario</h2>
                    </div>

                    {/* Month navigator */}
                    <div className="month-nav">
                        <button onClick={prevMonth} className="month-nav-arrow" title="Mes anterior">
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="month-nav-label">
                            {MONTHS[currentMonth]} {currentYear}
                        </span>
                        <button onClick={nextMonth} className="month-nav-arrow" title="Mes siguiente">
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>

                    <button onClick={() => { setCurrentYear(today.getFullYear()); setCurrentMonth(today.getMonth()); }} className="today-btn">
                        Hoy
                    </button>

                    {totalEventsThisMonth > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-hk-accent/10 border border-hk-accent/20 text-hk-accent text-xs font-bold">
                            {totalEventsThisMonth} eventos
                        </span>
                    )}
                </div>

                <button
                    onClick={() => { resetForm(); setIsCreating(true); }}
                    className="sched-add-btn"
                >
                    <Plus className="w-4 h-4 mr-1.5" />
                    Añadir Evento
                </button>
            </div>

            {/* ── Calendar ── */}
            {isLoading ? (
                <div className="flex-1 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4 text-hk-text-muted/40">
                        <Sparkles className="w-10 h-10 animate-pulse opacity-40" />
                        <p className="text-sm tracking-widest uppercase">Cargando eventos...</p>
                    </div>
                </div>
            ) : (
                <div className="cal-container">

                    {/* Day-of-week headers */}
                    <div className="cal-dow-headers">
                        {DAYS_HEADER.map(d => (
                            <div key={d} className="cal-dow-header">{d}</div>
                        ))}
                    </div>

                    {/* Cells grid */}
                    <div className="cal-grid">
                        {calendarCells.map((cell, idx) => (
                            <div
                                key={idx}
                                className={`cal-cell
                                    ${cell.isCurrentMonth ? 'cal-cell--current' : 'cal-cell--other'}
                                    ${(cell as any).isToday ? 'cal-cell--today' : ''}
                                `}
                                style={{
                                    opacity: cellsVisible && cell.isCurrentMonth ? 1 : cell.isCurrentMonth ? 0 : undefined,
                                    transform: cellsVisible && cell.isCurrentMonth ? 'none' : cell.isCurrentMonth ? 'scale(0.97)' : undefined,
                                    transition: `opacity 0.3s ease ${(idx % 7) * 0.03}s, transform 0.3s ease ${(idx % 7) * 0.03}s`,
                                }}
                                onClick={() => cell.isCurrentMonth && handleDayClick(cell.dateString)}
                            >
                                {/* Day number */}
                                <div className="cal-cell-top">
                                    <span className={`cal-day-num ${(cell as any).isToday ? 'cal-day-num--today' : ''}`}>
                                        {cell.day}
                                    </span>
                                    {cell.isCurrentMonth && (
                                        <Plus className="cal-cell-add-hint" />
                                    )}
                                </div>

                                {/* Events & schedules */}
                                <div className="cal-cell-body">
                                    {cell.schedules?.map(s => (
                                        <EventPill
                                            key={`s-${s.id}`}
                                            hex={toHex(s.color)}
                                            label={s.title}
                                            time={fmt5(s.start_time)}
                                            icon={<RefreshCw className="w-2.5 h-2.5" />}
                                            dashed
                                        />
                                    ))}
                                    {cell.events.map(ev => (
                                        <EventPill
                                            key={`e-${ev.id}`}
                                            hex={toHex(ev.color)}
                                            label={ev.title}
                                            time={ev.is_all_day ? undefined : fmt5(ev.start_time)}
                                            onClick={e => { e.stopPropagation(); handleEdit(ev); }}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Create / Edit Modal ── */}
            {isCreating && (
                <div className="modal-backdrop" onClick={resetForm}>
                    <div className="events-modal" onClick={e => e.stopPropagation()}>

                        {/* Header */}
                        <div className="book-modal-header">
                            <div className="flex items-center gap-2">
                                <CalendarIcon className="w-4 h-4 text-hk-accent/70" />
                                <h3 className="text-lg font-bold font-serif text-hk-text">
                                    {selectedEvent ? 'Editar Evento' : 'Nuevo Evento'}
                                </h3>
                                {date && (
                                    <span className="text-xs text-hk-text-muted/50 font-normal ml-1">· {date}</span>
                                )}
                            </div>
                            <button onClick={resetForm} className="modal-close-btn">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="p-5 space-y-4 overflow-y-auto flex-1">

                            {/* Title */}
                            <div>
                                <label className="book-label">Título <span className="text-red-400">*</span></label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    placeholder="Ej. Cumpleaños, Reunión, Examen..."
                                    className="book-input"
                                    autoFocus
                                />
                            </div>

                            {/* Date + all-day toggle */}
                            <div className="grid grid-cols-2 gap-3 items-end">
                                <div lang="es">
                                    <label className="book-label">Fecha</label>
                                    <input
                                        type="date"
                                        value={date}
                                        onChange={e => setDate(e.target.value)}
                                        className="book-input"
                                    />
                                </div>
                                <div>
                                    <label className="book-label">Duración</label>
                                    <button
                                        type="button"
                                        onClick={() => setIsAllDay(a => !a)}
                                        className={`allday-toggle ${isAllDay ? 'allday-toggle--on' : ''}`}
                                    >
                                        <span className={`allday-toggle-knob ${isAllDay ? 'allday-toggle-knob--on' : ''}`} />
                                        Todo el día
                                    </button>
                                </div>
                            </div>

                            {/* Times */}
                            {!isAllDay && (
                                <div className="grid grid-cols-2 gap-3">
                                    <div lang="es">
                                        <label className="book-label">Hora inicio</label>
                                        <input
                                            type="time"
                                            value={startTime}
                                            onChange={e => setStartTime(e.target.value)}
                                            className="book-input time-input"
                                        />
                                    </div>
                                    <div lang="es">
                                        <label className="book-label">Hora fin</label>
                                        <input
                                            type="time"
                                            value={endTime}
                                            onChange={e => setEndTime(e.target.value)}
                                            className="book-input time-input"
                                        />
                                    </div>
                                    {startTime && endTime && (
                                        <div className="col-span-2">
                                            <div className="sched-duration-preview">
                                                <Clock className="w-3.5 h-3.5 mr-1.5 opacity-50" />
                                                {Math.max(0,
                                                    (parseInt(endTime) * 60 + parseInt(endTime.split(':')[1])) -
                                                    (parseInt(startTime) * 60 + parseInt(startTime.split(':')[1]))
                                                )} minutos · {startTime} – {endTime}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Color */}
                            <div>
                                <label className="book-label">Color</label>
                                <div className="flex gap-2 mt-2 flex-wrap">
                                    {PALETTE.map(p => (
                                        <button
                                            key={p.id}
                                            type="button"
                                            onClick={() => setColor(p.hex)}
                                            className={`color-circle ${color === p.hex ? 'color-circle--active' : ''}`}
                                            style={{ background: p.hex }}
                                            title={p.hex}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="book-label">Descripción <span className="text-hk-text-muted/40 normal-case font-normal">(opcional)</span></label>
                                <textarea
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    rows={3}
                                    placeholder="Ubicación, notas adicionales..."
                                    className="book-textarea"
                                />
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="book-modal-footer justify-between">
                            <div>
                                {selectedEvent && (
                                    deleteConfirm ? (
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-red-400/80">¿Eliminar?</span>
                                            <button
                                                onClick={() => deleteMutation.mutate(selectedEvent.id)}
                                                className="modal-delete-btn"
                                                disabled={deleteMutation.isPending}
                                            >
                                                {deleteMutation.isPending ? '...' : 'Sí'}
                                            </button>
                                            <button onClick={() => setDeleteConfirm(false)} className="modal-cancel-btn">No</button>
                                        </div>
                                    ) : (
                                        <button onClick={() => setDeleteConfirm(true)} className="delete-btn" title="Eliminar">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )
                                )}
                            </div>
                            <div className="flex gap-2">
                                <button onClick={resetForm} className="modal-cancel-btn">Cancelar</button>
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving || !title.trim() || !date}
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
                </div>
            )}
        </div>
    );
};
