import { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { schedulesApi } from '../api/schedules';
import type { Schedule } from '../api/schedules';
import { eventsApi } from '../api/events';
import type { Event } from '../api/events';
import { useNavigate } from 'react-router-dom';
import { Plus, Save, X, Trash2, Upload, Clock, Calendar } from 'lucide-react';

/* ── Constants ───────────────────────────────────────────────── */

const DAYS = [
    { value: 0, label: 'Lunes', short: 'Lun' },
    { value: 1, label: 'Martes', short: 'Mar' },
    { value: 2, label: 'Miércoles', short: 'Mié' },
    { value: 3, label: 'Jueves', short: 'Jue' },
    { value: 4, label: 'Viernes', short: 'Vie' },
    { value: 5, label: 'Sábado', short: 'Sáb' },
    { value: 6, label: 'Domingo', short: 'Dom' },
];

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const HOUR_HEIGHT = 64; // px per hour

// Color palette: store as hex, display as human-readable
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

// Map legacy bg-* class names → hex for backward compat
const LEGACY_MAP: Record<string, string> = {
    'bg-hk-accent': '#6b8ea5',
    'bg-blue-500': '#3b82f6',
    'bg-green-500': '#10b981',
    'bg-yellow-500': '#f59e0b',
    'bg-purple-500': '#8b5cf6',
    'bg-pink-500': '#ec4899',
    'bg-red-500': '#ef4444',
};

const toHex = (color: string) => LEGACY_MAP[color] ?? (color.startsWith('#') ? color : '#6b8ea5');

/* ── Time helpers ────────────────────────────────────────────── */

const timeToMinutes = (t: string): number => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
};

const getBlockStyle = (start: string, end: string) => {
    const startMin = timeToMinutes(start);
    const endMin = timeToMinutes(end);
    const top = (startMin / 60) * HOUR_HEIGHT;
    const height = Math.max(((endMin - startMin) / 60) * HOUR_HEIGHT, 20);
    return { top: `${top}px`, height: `${height}px` };
};

const nowPosition = (): number => {
    const now = new Date();
    return ((now.getHours() + now.getMinutes() / 60) / 24) * 24 * HOUR_HEIGHT;
};

const todayDayIndex = (): number => {
    const d = new Date().getDay(); // 0=Sun
    return d === 0 ? 6 : d - 1;   // convert to Mon=0
};

const fmt = (t: string) => t.slice(0, 5);

/* ── Schedule Block ────────────────────────────────────────────── */

interface BlockProps {
    schedule: Schedule;
    onEdit: () => void;
}

const ScheduleBlock = ({ schedule, onEdit }: BlockProps) => {
    const hex = toHex(schedule.color);
    const style = getBlockStyle(schedule.start_time, schedule.end_time);
    const durationMin = timeToMinutes(schedule.end_time) - timeToMinutes(schedule.start_time);
    const compact = durationMin <= 45;

    return (
        <div
            className="schedule-block group"
            style={{
                ...style,
                '--block-color': hex,
                borderLeftColor: hex,
                background: `linear-gradient(135deg, ${hex}22 0%, ${hex}14 100%)`,
            } as React.CSSProperties}
            onClick={onEdit}
            title={`${schedule.title}\n${fmt(schedule.start_time)} – ${fmt(schedule.end_time)}`}
        >
            {/* Glow on hover */}
            <div className="schedule-block-glow" style={{ background: hex }} />

            <div className="schedule-block-content">
                <p className={`font-semibold text-white leading-tight truncate ${compact ? 'text-[10px]' : 'text-xs'}`}>
                    {schedule.title}
                </p>
                {!compact && (
                    <p className="text-[10px] text-white/60 mt-0.5 truncate">
                        {fmt(schedule.start_time)} – {fmt(schedule.end_time)}
                    </p>
                )}
            </div>

            {/* Time duration pill */}
            <div className="schedule-block-duration" style={{ color: hex }}>
                {durationMin}m
            </div>
        </div>
    );
};

/* ── Event Block ─────────────────────────────────────────────── */

interface EventBlockProps {
    event: Event;
    onClick: () => void;
}

const EventBlock = ({ event, onClick }: EventBlockProps) => {
    const hex = toHex(event.color);
    const style = getBlockStyle(event.start_time || '00:00:00', event.end_time || '23:59:59');
    const durationMin = timeToMinutes(event.end_time || '23:59:59') - timeToMinutes(event.start_time || '00:00:00');
    const compact = durationMin <= 45;

    return (
        <div
            className="schedule-block group"
            style={{
                ...style,
                '--block-color': hex,
                borderLeftColor: hex,
                background: `linear-gradient(135deg, ${hex}22 0%, ${hex}14 100%)`,
                borderWidth: '2px',
                borderStyle: 'dashed'
            } as React.CSSProperties}
            onClick={onClick}
            title={`[Evento] ${event.title}\n${event.start_time ? fmt(event.start_time) : ''} – ${event.end_time ? fmt(event.end_time) : ''}`}
        >
            <div className="schedule-block-glow" style={{ background: hex }} />

            <div className="schedule-block-content">
                <p className={`font-semibold text-white leading-tight truncate ${compact ? 'text-[10px]' : 'text-xs'}`}>
                    📝 {event.title}
                </p>
                {!compact && event.start_time && event.end_time && (
                    <p className="text-[10px] text-white/60 mt-0.5 truncate">
                        {fmt(event.start_time)} – {fmt(event.end_time)}
                    </p>
                )}
            </div>

            <div className="schedule-block-duration" style={{ color: hex }}>
                {durationMin}m
            </div>
        </div>
    );
};

/* ── Main page ───────────────────────────────────────────────── */

export const SchedulesPage = () => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const [isCreating, setIsCreating] = useState(false);
    const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const gridRef = useRef<HTMLDivElement>(null);
    const [nowY, setNowY] = useState(nowPosition());

    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [dayOfWeek, setDayOfWeek] = useState(0);
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('10:00');
    const [color, setColor] = useState(PALETTE[0].hex);

    // Live clock line
    useEffect(() => {
        const interval = setInterval(() => setNowY(nowPosition()), 60_000);
        return () => clearInterval(interval);
    }, []);

    // Scroll to current time on mount
    useEffect(() => {
        if (gridRef.current) {
            const scrollTo = Math.max(0, nowY - 120);
            gridRef.current.scrollTop = scrollTo;
        }
    }, []);

    const { data: schedules, isLoading: schedLoading } = useQuery({
        queryKey: ['schedules'],
        queryFn: schedulesApi.getAll,
    });

    const { data: events, isLoading: evLoading } = useQuery({
        queryKey: ['events'],
        queryFn: () => eventsApi.getAll()
    });

    // Calculate current week boundaries
    const now = new Date();
    const dayOfWeekIdx = now.getDay();
    const appTodayIdx = dayOfWeekIdx === 0 ? 6 : dayOfWeekIdx - 1;

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - appTodayIdx);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const currentWeekEvents = events?.filter(ev => {
        if (ev.is_all_day || !ev.start_time || !ev.end_time) return false;
        const evDate = new Date(ev.date + 'T00:00:00');
        return evDate >= startOfWeek && evDate <= endOfWeek;
    }) || [];

    /* Mutations */
    const createMutation = useMutation({
        mutationFn: schedulesApi.create,
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['schedules'] }); resetForm(); },
        onError: (err: any) => alert('Error: ' + (err.response?.data?.non_field_errors?.[0] || err.message)),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: Partial<Schedule> }) => schedulesApi.update(id, data),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['schedules'] }); resetForm(); },
        onError: (err: any) => alert('Error: ' + (err.response?.data?.non_field_errors?.[0] || err.message)),
    });

    const deleteMutation = useMutation({
        mutationFn: schedulesApi.delete,
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['schedules'] }); resetForm(); },
    });

    const resetForm = () => {
        setIsCreating(false);
        setSelectedSchedule(null);
        setDeleteConfirm(false);
        setTitle(''); setDescription('');
        setDayOfWeek(0);
        setStartTime('09:00'); setEndTime('10:00');
        setColor(PALETTE[0].hex);
    };

    const handleEdit = (schedule: Schedule) => {
        setSelectedSchedule(schedule);
        setTitle(schedule.title);
        setDescription(schedule.description);
        setDayOfWeek(schedule.day_of_week);
        setStartTime(schedule.start_time.slice(0, 5));
        setEndTime(schedule.end_time.slice(0, 5));
        setColor(toHex(schedule.color));
        setDeleteConfirm(false);
        setIsCreating(true);
    };

    const handleSave = () => {
        if (!title.trim()) return;
        const data = { title, description, day_of_week: dayOfWeek, start_time: startTime + ':00', end_time: endTime + ':00', color };
        selectedSchedule
            ? updateMutation.mutate({ id: selectedSchedule.id, data })
            : createMutation.mutate(data);
    };

    /* ICS Import */
    const handleImportICS = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const text = await file.text();
        const events = text.split('BEGIN:VEVENT');
        let count = 0;
        for (let i = 1; i < events.length; i++) {
            const ev = events[i];
            const summaryMatch = ev.match(/^SUMMARY.*?:(.*)/m);
            const dtStartMatch = ev.match(/^DTSTART.*?:(\d{8}T\d{6}Z?)/m);
            const dtEndMatch = ev.match(/^DTEND.*?:(\d{8}T\d{6}Z?)/m);
            if (!summaryMatch || !dtStartMatch || !dtEndMatch) continue;
            const startStr = dtStartMatch[1];
            const endStr = dtEndMatch[1];
            let hS = parseInt(startStr.slice(9, 11)), mS = parseInt(startStr.slice(11, 13));
            let hE = parseInt(endStr.slice(9, 11)), mE = parseInt(endStr.slice(11, 13));
            if (startStr.endsWith('Z')) {
                const sd = new Date(Date.UTC(+startStr.slice(0, 4), +startStr.slice(4, 6) - 1, +startStr.slice(6, 8), hS, mS));
                const ed = new Date(Date.UTC(+endStr.slice(0, 4), +endStr.slice(4, 6) - 1, +endStr.slice(6, 8), hE, mE));
                hS = sd.getHours(); mS = sd.getMinutes(); hE = ed.getHours(); mE = ed.getMinutes();
            }
            const jsDay = new Date(+startStr.slice(0, 4), +startStr.slice(4, 6) - 1, +startStr.slice(6, 8)).getDay();
            const appDay = jsDay === 0 ? 6 : jsDay - 1;
            createMutation.mutate({
                title: summaryMatch[1].trim(),
                description: 'Importado desde ICS',
                day_of_week: appDay,
                start_time: `${String(hS).padStart(2, '0')}:${String(mS).padStart(2, '0')}:00`,
                end_time: `${String(hE).padStart(2, '0')}:${String(mE).padStart(2, '0')}:00`,
                color: PALETTE[3].hex,
            });
            count++;
        }
        alert(count > 0 ? `Se importaron ${count} actividades.` : 'No se encontraron eventos válidos.');
        if (fileInputRef.current) fileInputRef.current.value = '';
    }, [createMutation]);

    const today = todayDayIndex();
    const isSaving = createMutation.isPending || updateMutation.isPending;

    return (
        <div className="sched-page">

            {/* ── Header ── */}
            <div className="sched-header">
                <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-hk-accent/70" />
                    <h2 className="text-2xl font-bold font-serif text-hk-text tracking-wide">Horarios</h2>
                    {schedules && (
                        <span className="px-2 py-0.5 rounded-full bg-hk-accent/10 border border-hk-accent/20 text-hk-accent text-xs font-bold">
                            {schedules.length}
                        </span>
                    )}
                </div>

                <div className="flex gap-2">
                    <input type="file" ref={fileInputRef} onChange={handleImportICS} accept=".ics" className="hidden" />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="sched-import-btn"
                        title="Importar calendario .ics"
                    >
                        <Upload className="w-4 h-4 mr-1.5" />
                        Importar ICS
                    </button>
                    <button
                        onClick={() => { resetForm(); setIsCreating(true); }}
                        className="sched-add-btn"
                    >
                        <Plus className="w-4 h-4 mr-1.5" />
                        Añadir Actividad
                    </button>
                </div>
            </div>

            {/* ── Calendar Grid ── */}
            {schedLoading || evLoading ? (
                <div className="flex-1 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4 text-hk-text-muted/40">
                        <Clock className="w-10 h-10 animate-spin opacity-40" />
                        <p className="text-sm tracking-widest uppercase">Cargando...</p>
                    </div>
                </div>
            ) : (
                <div className="sched-grid-container">

                    {/* Header row with day names */}
                    <div className="sched-day-headers">
                        {/* Time gutter spacer */}
                        <div className="sched-time-gutter-header" />
                        {DAYS.map(day => (
                            <div
                                key={day.value}
                                className={`sched-day-header ${day.value === today ? 'sched-day-header--today' : ''}`}
                            >
                                <span className="hidden sm:inline">{day.label}</span>
                                <span className="sm:hidden">{day.short}</span>
                                {day.value === today && (
                                    <span className="sched-today-dot" />
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Scrollable body */}
                    <div className="sched-grid-body" ref={gridRef}>

                        {/* Time gutter */}
                        <div className="sched-time-gutter">
                            {HOURS.map(h => (
                                <div
                                    key={h}
                                    className="sched-hour-label"
                                    style={{ height: `${HOUR_HEIGHT}px` }}
                                >
                                    <span>{h === 0 ? '' : `${String(h).padStart(2, '0')}:00`}</span>
                                </div>
                            ))}
                        </div>

                        {/* Days columns */}
                        {DAYS.map(day => (
                            <div
                                key={day.value}
                                className={`sched-day-col ${day.value === today ? 'sched-day-col--today' : ''}`}
                                style={{ height: `${24 * HOUR_HEIGHT}px` }}
                            >
                                {/* Hour grid lines */}
                                {HOURS.map(h => (
                                    <div
                                        key={h}
                                        className="sched-grid-line"
                                        style={{ top: `${h * HOUR_HEIGHT}px` }}
                                    />
                                ))}

                                {/* Half-hour lines */}
                                {HOURS.map(h => (
                                    <div
                                        key={`h-${h}`}
                                        className="sched-grid-line sched-grid-line--half"
                                        style={{ top: `${h * HOUR_HEIGHT + HOUR_HEIGHT / 2}px` }}
                                    />
                                ))}

                                {/* Now line */}
                                {day.value === today && (
                                    <div className="sched-now-line" style={{ top: `${nowY}px` }}>
                                        <div className="sched-now-dot" />
                                    </div>
                                )}

                                {/* Blocks */}
                                {schedules?.filter(s => s.day_of_week === day.value).map(s => (
                                    <ScheduleBlock key={`sched-${s.id}`} schedule={s} onEdit={() => handleEdit(s)} />
                                ))}

                                {/* Events for this specific day */}
                                {currentWeekEvents.filter(ev => {
                                    const evDate = new Date(ev.date + 'T00:00:00');
                                    const jsDay = evDate.getDay();
                                    const appDay = jsDay === 0 ? 6 : jsDay - 1;
                                    return appDay === day.value;
                                }).map(ev => (
                                    <EventBlock key={`ev-${ev.id}`} event={ev} onClick={() => navigate('/events')} />
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Create / Edit Modal ── */}
            {isCreating && (
                <div className="modal-backdrop" onClick={resetForm}>
                    <div className="sched-modal" onClick={e => e.stopPropagation()}>

                        {/* Modal header */}
                        <div className="book-modal-header">
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-hk-accent/70" />
                                <h3 className="text-lg font-bold font-serif text-hk-text">
                                    {selectedSchedule ? 'Editar Actividad' : 'Nueva Actividad'}
                                </h3>
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
                                    placeholder="Ej. Clase de inglés, Gimnasio..."
                                    className="book-input"
                                    autoFocus
                                />
                            </div>

                            {/* Day */}
                            <div>
                                <label className="book-label">Día de la semana</label>
                                <div className="grid grid-cols-7 gap-1 mt-1.5">
                                    {DAYS.map(d => (
                                        <button
                                            key={d.value}
                                            type="button"
                                            onClick={() => setDayOfWeek(d.value)}
                                            className={`day-picker-btn ${dayOfWeek === d.value ? 'day-picker-btn--active' : ''}`}
                                        >
                                            {d.short}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Times */}
                            <div className="grid grid-cols-2 gap-4">
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
                            </div>

                            {/* Duration preview */}
                            {startTime && endTime && (
                                <div className="sched-duration-preview">
                                    <Clock className="w-3.5 h-3.5 mr-1.5 opacity-60" />
                                    <span>
                                        {Math.max(0, timeToMinutes(endTime) - timeToMinutes(startTime))} minutos
                                    </span>
                                    <span className="mx-2 opacity-30">·</span>
                                    <span>{fmt(startTime)} – {fmt(endTime)}</span>
                                </div>
                            )}

                            {/* Color palette */}
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
                                    rows={2}
                                    placeholder="Notas adicionales sobre esta actividad..."
                                    className="book-textarea"
                                />
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="book-modal-footer justify-between">
                            <div>
                                {selectedSchedule && (
                                    deleteConfirm ? (
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-red-400/80">¿Eliminar?</span>
                                            <button
                                                onClick={() => deleteMutation.mutate(selectedSchedule.id)}
                                                className="modal-delete-btn"
                                                disabled={deleteMutation.isPending}
                                            >
                                                {deleteMutation.isPending ? '...' : 'Sí'}
                                            </button>
                                            <button onClick={() => setDeleteConfirm(false)} className="modal-cancel-btn">
                                                No
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setDeleteConfirm(true)}
                                            className="delete-btn"
                                            title="Eliminar actividad"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )
                                )}
                            </div>
                            <div className="flex gap-2">
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
                </div>
            )}
        </div>
    );
};
