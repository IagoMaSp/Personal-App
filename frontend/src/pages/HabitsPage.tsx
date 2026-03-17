import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { habitsApi } from '../api/habits';
import type { Habit } from '../api/habits';
import { Plus, Check, X, Flame, Target } from 'lucide-react';
import { NOTE_ICONS, getNoteIcon } from './NotesPage';
import { format, subDays, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';

const HABIT_COLORS = [
    '#6b8ea5', // Default HK Blue
    '#e06c75', // Red
    '#98c379', // Green
    '#e5c07b', // Yellow
    '#c678dd', // Purple
    '#56b6c2', // Cyan
    '#d19a66', // Orange
    '#8b9eb7', // Muted Blue
];

const DAYS_OF_WEEK = [
    { label: 'L', value: 0 },
    { label: 'M', value: 1 },
    { label: 'X', value: 2 },
    { label: 'J', value: 3 },
    { label: 'V', value: 4 },
    { label: 'S', value: 5 },
    { label: 'D', value: 6 },
];

// Helper to map JS getDay() (0=Sun, 1=Mon) to Python backend (0=Mon, 6=Sun)
const jsDayToPythonDay = (jsDay: number) => jsDay === 0 ? 6 : jsDay - 1;

export const HabitsPage = () => {
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

    const { data: habits = [], isLoading } = useQuery({
        queryKey: ['habits'],
        queryFn: habitsApi.getAll
    });

    const toggleTodayMutation = useMutation({
        mutationFn: habitsApi.toggleToday,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['habits'] }),
    });

    const pythonToday = jsDayToPythonDay(new Date().getDay());
    const todayHabits = habits.filter(h => h.is_active && h.target_days.includes(pythonToday));

    const handleOpenCreate = () => {
        setEditingHabit(null);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (habit: Habit) => {
        setEditingHabit(habit);
        setIsModalOpen(true);
    };

    return (
        <div className="flex flex-col h-full overflow-y-auto p-6 space-y-8 animate-fade-in relative">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold font-serif tracking-wide text-hk-text mb-1 flex items-center gap-2">
                        <Target className="w-6 h-6 text-hk-accent/80" />
                        Hábitos
                    </h1>
                    <p className="text-sm text-hk-text-muted/60 tracking-wide">
                        {format(new Date(), "EEEE d 'de' MMMM", { locale: es })}
                    </p>
                </div>
                <button
                    onClick={handleOpenCreate}
                    className="flex items-center gap-2 px-4 py-2 bg-hk-accent/10 hover:bg-hk-accent/20 
                               text-hk-accent border border-hk-accent/30 rounded-lg transition-all
                               font-semibold tracking-wide text-sm shadow-[0_0_15px_rgba(107,142,165,0.15)]"
                >
                    <Plus className="w-4 h-4" />
                    Nuevo Hábito
                </button>
            </div>

            {/* Today's Habits */}
            <section className="space-y-4">
                <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-hk-text-muted/50 border-b border-hk-border pb-2">
                    Para Hoy
                </h2>

                {isLoading ? (
                    <div className="flex gap-4">
                        <div className="h-20 flex-1 rounded-xl bg-hk-border/30 animate-pulse" />
                        <div className="h-20 flex-1 rounded-xl bg-hk-border/30 animate-pulse" />
                    </div>
                ) : todayHabits.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-hk-text-muted/40 font-serif mb-2">No hay hábitos programados para hoy</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {todayHabits.map((habit) => {
                            const Icon = getNoteIcon(habit.icon);
                            const isCompleted = habit.completed_today;
                            return (
                                <div
                                    key={habit.id}
                                    onClick={() => handleOpenEdit(habit)}
                                    className="relative p-4 rounded-xl border transition-all cursor-pointer overflow-hidden group flex items-center justify-between"
                                    style={{
                                        borderColor: isCompleted ? habit.color : 'var(--theme-border)',
                                        backgroundColor: isCompleted ? `${habit.color}15` : 'var(--theme-surface)',
                                        boxShadow: isCompleted ? `0 0 20px ${habit.color}10` : 'none',
                                    }}
                                >
                                    <div className="flex-1 min-w-0 pr-4">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span style={{ color: habit.color }}><Icon className="w-4 h-4" /></span>
                                            <h3 className="font-semibold text-sm truncate"
                                                style={{ color: isCompleted ? habit.color : 'var(--theme-text)' }}>
                                                {habit.name}
                                            </h3>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2 mt-2">
                                            <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-hk-bg border border-hk-border text-hk-text-muted">
                                                <Flame className="w-3 h-3 text-orange-400" />
                                                {habit.current_streak} días
                                            </span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleTodayMutation.mutate(habit.id);
                                        }}
                                        className="relative w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-transform active:scale-90"
                                        style={{
                                            border: `2px solid ${isCompleted ? habit.color : 'var(--theme-border)'}`,
                                            backgroundColor: isCompleted ? habit.color : 'transparent',
                                        }}
                                    >
                                        <Check className={`w-5 h-5 transition-opacity ${isCompleted ? 'opacity-100 text-hk-bg' : 'opacity-0'}`} />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>

            {/* Heatmaps */}
            <section className="space-y-6 pt-4">
                <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-hk-text-muted/50 border-b border-hk-border pb-2">
                    Progreso (Últimas 12 Semanas)
                </h2>

                {habits.filter(h => h.is_active).map(habit => (
                    <HabitHeatmap key={habit.id} habit={habit} />
                ))}
            </section>

            {/* Modal */}
            {isModalOpen && (
                <HabitModal
                    habit={editingHabit}
                    onClose={() => setIsModalOpen(false)}
                />
            )}
        </div>
    );
};

/* --- Heatmap Component --- */
const HabitHeatmap = ({ habit }: { habit: Habit }) => {
    // Generate dates: 12 weeks * 7 days = 84 days back from today
    const { data: logs = [] } = useQuery({
        queryKey: ['habitLogs', habit.id],
        queryFn: () => habitsApi.getLogs(habit.id, format(subDays(startOfDay(new Date()), 84), 'yyyy-MM-dd')),
    });

    const completedDates = useMemo(() => {
        return new Set(logs.filter(l => l.completed).map(l => l.date));
    }, [logs]);

    const items = useMemo(() => {
        const today = startOfDay(new Date());
        // To build columns of weeks, we generate dates backward, but we want it left-to-right.
        // Let's generate 84 days:
        let days = [];
        for (let i = 83; i >= 0; i--) {
            const d = subDays(today, i);
            const dateStr = format(d, 'yyyy-MM-dd');
            days.push({
                date: d,
                dateStr,
                isCompleted: completedDates.has(dateStr),
                isTarget: habit.target_days.includes(jsDayToPythonDay(d.getDay())),
            });
        }

        // Group by columns (weeks). Let's arrange so today is the bottom-right if possible
        // Actually, a simple grid 12 cols x 7 rows is what the prompt asked for.
        // It's easier to use a flex layout with column wrap or CSS Grid.
        // If we use grid: grid-flow-col grid-rows-7 gap-[2px]
        return days;
    }, [habit.target_days, completedDates]);

    return (
        <div className="bg-hk-surface/50 border border-hk-border rounded-xl p-4 flex flex-col md:flex-row md:items-center gap-6">
            <div className="w-full md:w-48 flex-shrink-0">
                <div className="flex items-center gap-2 mb-1">
                    {(() => {
                        const Icon = getNoteIcon(habit.icon);
                        return <span style={{ color: habit.color }}><Icon className="w-4 h-4" /></span>
                    })()}
                    <h3 className="font-semibold text-sm text-hk-text truncate">{habit.name}</h3>
                </div>
                <div className="text-[10px] text-hk-text-muted/60">
                    Completado {habit.completion_rate_30d}% de los últimos 30 días
                </div>
            </div>

            <div className="flex-1 overflow-x-auto pb-2">
                <div className="grid grid-rows-7 grid-flow-col gap-[2px] w-max">
                    {items.map((item, i) => (
                        <div
                            key={i}
                            className="w-[12px] h-[12px] rounded-[2px] relative group"
                            style={{
                                backgroundColor: item.isCompleted
                                    ? habit.color
                                    : (item.isTarget ? 'var(--theme-border)' : 'transparent'),
                                opacity: item.isCompleted ? 1 : 0.6
                            }}
                        >
                            <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity bg-black text-xs text-white p-1 rounded -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap z-10 pointer-events-none">
                                {format(item.date, "MMM d")} {item.isCompleted ? '✓' : ''}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

/* --- Modal Component --- */
const HabitModal = ({ habit, onClose }: { habit: Habit | null, onClose: () => void }) => {
    const queryClient = useQueryClient();
    const [name, setName] = useState(habit?.name || '');
    const [icon, setIcon] = useState<string | null>(habit?.icon || null);
    const [color, setColor] = useState(habit?.color || HABIT_COLORS[0]);
    const [targetDays, setTargetDays] = useState<number[]>(habit?.target_days || [0, 1, 2, 3, 4, 5, 6]);
    const [showIconPicker, setShowIconPicker] = useState(false);

    const isEdit = !!habit;

    const mutationFn = isEdit
        ? (data: Partial<Habit>) => habitsApi.update(habit.id, data)
        : habitsApi.create;

    const saveMutation = useMutation<Habit, Error, Partial<Habit>>({
        mutationFn: mutationFn as any,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['habits'] });
            onClose();
        }
    });

    const deleteMutation = useMutation({
        mutationFn: habitsApi.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['habits'] });
            onClose();
        }
    });

    const handleSave = () => {
        if (!name.trim()) return;
        saveMutation.mutate({
            name,
            icon,
            color,
            frequency: 'daily',
            target_days: targetDays,
            is_active: true
        });
    };

    const toggleDay = (dayValue: number) => {
        setTargetDays(prev =>
            prev.includes(dayValue)
                ? prev.filter(d => d !== dayValue)
                : [...prev, dayValue]
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-hk-bg border border-hk-border rounded-xl w-full max-w-md shadow-2xl flex flex-col max-h-full">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-hk-border">
                    <h2 className="font-serif font-bold text-lg text-hk-text">
                        {isEdit ? 'Editar Hábito' : 'Nuevo Hábito'}
                    </h2>
                    <button onClick={onClose} className="text-hk-text-muted hover:text-hk-text transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-5 space-y-6 overflow-y-auto">
                    {/* Name */}
                    <div>
                        <label className="block text-xs uppercase tracking-widest text-hk-text-muted/70 mb-2 font-bold">
                            Nombre
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ej. Leer 30 minutos..."
                            className="w-full bg-hk-surface border border-hk-border rounded-lg px-4 py-2.5 text-sm text-hk-text focus:outline-none focus:border-hk-accent transition-colors"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Icon */}
                        <div className="relative">
                            <label className="block text-xs uppercase tracking-widest text-hk-text-muted/70 mb-2 font-bold">
                                Ícono
                            </label>
                            <button
                                onClick={() => setShowIconPicker(!showIconPicker)}
                                className="w-full flex items-center justify-center gap-2 bg-hk-surface border border-hk-border rounded-lg px-4 py-2.5 hover:border-hk-accent/50 transition-colors"
                            >
                                {(() => {
                                    const Icon = getNoteIcon(icon);
                                    return <Icon className="w-4 h-4 text-hk-text" />
                                })()}
                                <span className="text-sm text-hk-text truncate">{icon || 'Elegir'}</span>
                            </button>

                            {showIconPicker && (
                                <div className="absolute top-full left-0 mt-2 w-48 bg-hk-surface border border-hk-border rounded-lg p-2 grid grid-cols-4 gap-2 z-10 shadow-xl max-h-48 overflow-y-auto">
                                    {NOTE_ICONS.map(({ key, Icon }) => (
                                        <button
                                            key={key}
                                            onClick={() => { setIcon(key); setShowIconPicker(false); }}
                                            className={`p-2 rounded hover:bg-hk-border/50 flex items-center justify-center ${icon === key ? 'bg-hk-accent/20' : ''}`}
                                        >
                                            <Icon className={`w-4 h-4 ${icon === key ? 'text-hk-accent' : 'text-hk-text'}`} />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Color */}
                        <div>
                            <label className="block text-xs uppercase tracking-widest text-hk-text-muted/70 mb-2 font-bold">
                                Color
                            </label>
                            <div className="flex flex-wrap gap-2 pt-1">
                                {HABIT_COLORS.map(c => (
                                    <button
                                        key={c}
                                        onClick={() => setColor(c)}
                                        className={`w-6 h-6 rounded-full transition-transform ${color === c ? 'scale-125 ring-2 ring-offset-2 ring-offset-hk-bg' : 'hover:scale-110'}`}
                                        style={{ backgroundColor: c, '--tw-ring-color': c } as React.CSSProperties}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Target Days */}
                    <div>
                        <label className="block text-xs uppercase tracking-widest text-hk-text-muted/70 mb-3 font-bold">
                            Frecuencia (Días)
                        </label>
                        <div className="flex items-center justify-between gap-1">
                            {DAYS_OF_WEEK.map(day => {
                                const active = targetDays.includes(day.value);
                                return (
                                    <button
                                        key={day.value}
                                        onClick={() => toggleDay(day.value)}
                                        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-colors
                                            ${active ? 'bg-hk-accent/20 text-hk-accent border border-hk-accent/50' : 'bg-hk-surface text-hk-text-muted border border-hk-border hover:border-hk-text-muted/50'}`}
                                    >
                                        {day.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-hk-border flex items-center justify-between gap-3 bg-hk-surface/50 rounded-b-xl">
                    {isEdit ? (
                        <button
                            onClick={() => deleteMutation.mutate(habit.id)}
                            className="text-xs text-red-500 hover:text-red-400 font-semibold px-3 py-2 rounded border border-red-500/20 bg-red-500/10"
                        >
                            Eliminar
                        </button>
                    ) : <div />}

                    <div className="flex gap-2">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg text-sm font-semibold text-hk-text-muted hover:text-hk-text"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={!name.trim() || saveMutation.isPending}
                            className="px-6 py-2 rounded-lg text-sm font-semibold bg-hk-accent text-hk-bg hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_15px_rgba(107,142,165,0.4)]"
                        >
                            Guardar
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};
