import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financesApi } from '../api/finances';
import type { Transaction } from '../api/finances';
import { Plus, Trash2, Edit2, Wallet, TrendingUp, TrendingDown, RefreshCw, Sparkles, X, Save, ChevronLeft, ChevronRight, PieChart } from 'lucide-react';
import { format, parseISO, addMonths, subMonths, isSameMonth, startOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';

const CHART_COLORS = ['#e06c75', '#98c379', '#e5c07b', '#61afef', '#c678dd', '#56b6c2', '#d19a66', '#6b8ea5', '#8b9eb7'];

export const FinancesPage = () => {
    const queryClient = useQueryClient();

    const [isCreatingTx, setIsCreatingTx] = useState(false);
    const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

    // Filters & View State
    const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()));
    const [typeFilter, setTypeFilter] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');

    // Queries
    const { data: transactions, isLoading: loadingTx } = useQuery({
        queryKey: ['finances-transactions'],
        queryFn: financesApi.getTransactions,
    });

    const { data: categories, isLoading: loadingCat } = useQuery({
        queryKey: ['finances-categories'],
        queryFn: financesApi.getCategories,
    });

    // Mutations
    const txMutation = useMutation({
        mutationFn: (data: Partial<Transaction>) =>
            selectedTx ? financesApi.updateTransaction(selectedTx.id, data) : financesApi.createTransaction(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['finances-transactions'] });
            setIsCreatingTx(false);
            setSelectedTx(null);
        }
    });

    const deleteTxMutation = useMutation({
        mutationFn: financesApi.deleteTransaction,
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['finances-transactions'] }); }
    });

    // Derived Data
    const filteredByMonth = useMemo(() => {
        return transactions?.filter(t => isSameMonth(parseISO(t.date), currentMonth)) || [];
    }, [transactions, currentMonth]);

    const displayTransactions = useMemo(() => {
        return filteredByMonth.filter(t => typeFilter === 'ALL' || t.type === typeFilter);
    }, [filteredByMonth, typeFilter]);

    const totalIncome = filteredByMonth.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + parseFloat(t.amount || '0'), 0);
    const totalExpense = filteredByMonth.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + parseFloat(t.amount || '0'), 0);
    const balance = totalIncome - totalExpense;

    const expensesByCategory = useMemo(() => {
        const expenses = filteredByMonth.filter(t => t.type === 'EXPENSE');
        const groups: Record<string, { total: number, color: string }> = {};

        expenses.forEach(t => {
            const catName = t.category_detail?.name || 'Sin categoría';
            const fallbackColor = t.category_detail?.color;
            if (!groups[catName]) {
                groups[catName] = { total: 0, color: fallbackColor || '' };
            }
            groups[catName].total += parseFloat(t.amount || '0');
        });

        let colorIndex = 0;
        Object.values(groups).forEach(g => {
            if (!g.color) {
                g.color = CHART_COLORS[colorIndex % CHART_COLORS.length];
                colorIndex++;
            }
        });

        return Object.entries(groups)
            .map(([name, { total, color }]) => ({ name, total, color }))
            .sort((a, b) => b.total - a.total);
    }, [filteredByMonth]);


    // Handlers
    const [txFormData, setTxFormData] = useState<Partial<Transaction>>({
        title: '', amount: '', type: 'EXPENSE', category: null, date: format(new Date(), 'yyyy-MM-dd'), is_recurring: false, recurrence_period: null
    });

    const handleOpenTx = (tx?: Transaction) => {
        if (tx) {
            setSelectedTx(tx);
            setTxFormData({ ...tx });
        } else {
            setSelectedTx(null);
            setTxFormData({ title: '', amount: '', type: 'EXPENSE', category: null, date: format(new Date(), 'yyyy-MM-dd'), is_recurring: false, recurrence_period: null });
        }
        setIsCreatingTx(true);
    };

    const handleTxSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        txMutation.mutate(txFormData);
    };

    if (loadingTx || loadingCat) {
        return (
            <div className="flex-1 flex items-center justify-center p-8 h-full">
                <div className="flex flex-col items-center gap-4 text-hk-text-muted/40 animate-pulse">
                    <Sparkles className="w-10 h-10 opacity-40" />
                    <p className="text-sm tracking-widest uppercase font-bold">Cargando Finanzas...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-hk-bg animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5 shrink-0 px-2 lg:px-8 pt-8">
                <div className="flex items-center gap-3">
                    <Wallet className="w-6 h-6 text-hk-accent/70" />
                    <h2 className="text-3xl font-bold font-serif text-hk-text tracking-wide">Finanzas</h2>
                </div>
                <button
                    onClick={() => handleOpenTx()}
                    className="flex items-center gap-2 px-5 py-2.5 bg-hk-accent/20 hover:bg-hk-accent/30 text-hk-accent hover:text-white rounded-lg transition-colors font-medium shadow-sm border border-hk-accent/20 hover:border-hk-accent/40"
                >
                    <Plus className="w-4 h-4" />
                    Añadir Movimiento
                </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar px-2 lg:px-8 pb-8">

                {/* Month Selector */}
                <div className="flex items-center justify-center gap-4 mb-6">
                    <button
                        onClick={() => setCurrentMonth(prev => subMonths(prev, 1))}
                        className="p-1.5 rounded-full hover:bg-white/5 text-hk-text-muted hover:text-white transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <h3 className="text-lg font-serif tracking-widest uppercase font-bold text-hk-text min-w-[160px] text-center">
                        {format(currentMonth, 'MMMM yyyy', { locale: es })}
                    </h3>
                    <button
                        onClick={() => setCurrentMonth(prev => addMonths(prev, 1))}
                        className="p-1.5 rounded-full hover:bg-white/5 text-hk-text-muted hover:text-white transition-colors"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 group">
                    <div className="bg-gradient-to-br from-black/40 to-black/20 p-6 rounded-2xl border border-white/5 shadow-lg relative overflow-hidden transition-all hover:border-white/10">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-hk-text-muted">Ingresos</h3>
                            <TrendingUp className="w-5 h-5 text-green-400 opacity-80" />
                        </div>
                        <p className="text-3xl font-serif font-bold text-green-400">${totalIncome.toFixed(2)}</p>
                    </div>

                    <div className="bg-gradient-to-br from-black/40 to-black/20 p-6 rounded-2xl border border-white/5 shadow-lg relative overflow-hidden transition-all hover:border-white/10">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-hk-text-muted">Gastos</h3>
                            <TrendingDown className="w-5 h-5 text-red-400 opacity-80" />
                        </div>
                        <p className="text-3xl font-serif font-bold text-red-400">${totalExpense.toFixed(2)}</p>
                    </div>

                    <div className="bg-gradient-to-br from-hk-accent/10 to-black/20 p-6 rounded-2xl border border-hk-accent/20 shadow-lg relative overflow-hidden transition-all hover:border-hk-accent/40">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-hk-accent/0 via-hk-accent/50 to-hk-accent/0 opacity-50" />
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-hk-text-muted">Balance Mensual</h3>
                            <Wallet className="w-5 h-5 text-hk-accent opacity-80" />
                        </div>
                        <p className={`text-3xl font-serif font-bold ${balance >= 0 ? 'text-hk-text' : 'text-red-400'}`}>
                            ${balance.toFixed(2)}
                        </p>
                    </div>
                </div>

                {/* Donut Chart Row */}
                <div className="mb-8 bg-black/20 border border-white/5 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                    <div className="flex items-center gap-2 mb-6">
                        <PieChart className="w-4 h-4 text-hk-text-muted" />
                        <h3 className="text-sm font-bold tracking-widest uppercase text-hk-text-muted">Gastos por Categoría</h3>
                    </div>

                    {totalExpense === 0 ? (
                        <div className="text-center text-hk-text-muted italic opacity-60 py-8">
                            No hay gastos registrados en este mes.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                            {/* Donut Canvas */}
                            <DonutChart data={expensesByCategory} total={totalExpense} />

                            {/* Legend */}
                            <div className="space-y-3 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                                {expensesByCategory.map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between group">
                                        <div className="flex items-center gap-3 flex-1 min-w-0 pr-4">
                                            <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                                            <span className="text-hk-text text-sm truncate">{item.name}</span>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm font-mono shrink-0">
                                            <span className="text-hk-text font-bold">${item.total.toFixed(2)}</span>
                                            <span className="text-hk-text-muted/60 w-12 text-right">
                                                {((item.total / totalExpense) * 100).toFixed(1)}%
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Transactions Table */}
                <div className="bg-black/20 border border-white/5 rounded-2xl overflow-hidden shadow-xl">
                    <div className="p-5 border-b border-white/5 bg-black/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <h3 className="text-lg font-bold font-serif text-hk-text flex items-center gap-2">
                            <RefreshCw className="w-4 h-4 text-hk-text-muted" /> Movimientos del Mes
                        </h3>

                        {/* Type Tabs */}
                        <div className="flex rounded-lg overflow-hidden border border-white/5 bg-black/20 p-1">
                            {(['ALL', 'INCOME', 'EXPENSE'] as const).map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setTypeFilter(tab)}
                                    className={`px-4 py-1.5 text-xs font-bold tracking-widest uppercase rounded transition-colors ${typeFilter === tab ? 'bg-hk-accent/20 text-hk-text' : 'text-hk-text-muted hover:text-white'
                                        }`}
                                >
                                    {tab === 'ALL' ? 'Todos' : tab === 'INCOME' ? 'Ingresos' : 'Gastos'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {displayTransactions.length === 0 ? (
                        <div className="p-12 text-center text-hk-text-muted italic opacity-60">
                            No hay movimientos para mostrar en este filtro.
                        </div>
                    ) : (
                        <ul className="divide-y divide-white/5">
                            {displayTransactions.map(tx => (
                                <li key={tx.id} className="p-4 hover:bg-white/[0.02] flex items-center justify-between transition-colors group">
                                    <div className="flex items-center gap-4 cursor-pointer flex-1" onClick={() => handleOpenTx(tx)}>
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border shadow-inner
                                            ${tx.type === 'INCOME' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                                            {tx.type === 'INCOME' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                                        </div>
                                        <div>
                                            <p className="font-bold text-hk-text flex items-center gap-2">
                                                {tx.title}
                                                {tx.is_recurring && <span title="Recurrente"><RefreshCw className="w-3 h-3 text-hk-accent" /></span>}
                                            </p>
                                            <div className="text-xs text-hk-text-muted/60 mt-0.5 flex items-center gap-2">
                                                <span>{tx.date && format(parseISO(tx.date), "d MMM yyyy", { locale: es })}</span>
                                                {tx.category_detail && (
                                                    <>
                                                        <span>•</span>
                                                        <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/5">
                                                            {tx.category_detail.name}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className={`text-lg font-bold font-serif ${tx.type === 'INCOME' ? 'text-green-400' : 'text-hk-text-muted'}`}>
                                            {tx.type === 'INCOME' ? '+' : '-'}${tx.amount}
                                        </span>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleOpenTx(tx)} className="p-1.5 text-hk-text-muted hover:text-white rounded hover:bg-white/10 transition-colors">
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); if (confirm('¿Eliminar transacción?')) deleteTxMutation.mutate(tx.id); }}
                                                className="p-1.5 text-hk-text-muted hover:text-red-400 rounded hover:bg-white/10 transition-colors">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            {/* Modal */}
            {isCreatingTx && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm shadow-2xl animate-in fade-in duration-200 p-4">
                    <div className="bg-hk-surface border border-white/10 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden relative max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between p-4 border-b border-white/5 bg-black/20 shrink-0">
                            <h2 className="text-xl font-bold font-serif text-hk-text">
                                {selectedTx ? 'Editar Movimiento' : 'Nuevo Movimiento'}
                            </h2>
                            <button onClick={() => setIsCreatingTx(false)} className="p-1.5 text-hk-text-muted hover:text-white rounded-md hover:bg-white/5">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-5 overflow-y-auto custom-scrollbar flex-1">
                            <form id="tx-form" onSubmit={handleTxSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs uppercase tracking-wider text-hk-text-muted/60 mb-1.5 font-bold">Tipo</label>
                                        <div className="flex rounded-lg overflow-hidden border border-white/5 bg-black/20 p-1">
                                            <button type="button"
                                                onClick={() => setTxFormData({ ...txFormData, type: 'EXPENSE' })}
                                                className={`flex-1 py-1.5 text-sm font-medium rounded transition-colors ${txFormData.type === 'EXPENSE' ? 'bg-red-500/20 text-red-400' : 'text-hk-text-muted hover:text-white'}`}>Gasto</button>
                                            <button type="button"
                                                onClick={() => setTxFormData({ ...txFormData, type: 'INCOME' })}
                                                className={`flex-1 py-1.5 text-sm font-medium rounded transition-colors ${txFormData.type === 'INCOME' ? 'bg-green-500/20 text-green-400' : 'text-hk-text-muted hover:text-white'}`}>Ingreso</button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs uppercase tracking-wider text-hk-text-muted/60 mb-1.5 font-bold">Monto ($)</label>
                                        <input type="number" step="0.01" min="0" required
                                            value={txFormData.amount} onChange={(e) => setTxFormData({ ...txFormData, amount: e.target.value })}
                                            className="w-full bg-black/20 border border-white/5 rounded-lg py-2 px-3 text-white text-lg font-mono focus:outline-none focus:border-hk-accent/50" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs uppercase tracking-wider text-hk-text-muted/60 mb-1.5 font-bold">Título</label>
                                    <input type="text" required placeholder="Ej. Supermercado, Salario..."
                                        value={txFormData.title} onChange={(e) => setTxFormData({ ...txFormData, title: e.target.value })}
                                        className="w-full bg-black/20 border border-white/5 rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:border-hk-accent/50" />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs uppercase tracking-wider text-hk-text-muted/60 mb-1.5 font-bold">Fecha</label>
                                        <input type="date" required
                                            value={txFormData.date} onChange={(e) => setTxFormData({ ...txFormData, date: e.target.value })}
                                            className="w-full bg-black/20 border border-white/5 rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:border-hk-accent/50" />
                                    </div>
                                    <div>
                                        <label className="block text-xs uppercase tracking-wider text-hk-text-muted/60 mb-1.5 font-bold">Categoría</label>
                                        <select
                                            value={txFormData.category || ''} onChange={(e) => setTxFormData({ ...txFormData, category: e.target.value ? Number(e.target.value) : null })}
                                            className="w-full bg-black/20 border border-white/5 rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:border-hk-accent/50 cursor-pointer"
                                        >
                                            <option value="">Ninguna</option>
                                            {categories?.filter(c => c.type === txFormData.type).map(cat => (
                                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="pt-2">
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors
                                            ${txFormData.is_recurring ? 'bg-hk-accent border-hk-accent text-white' : 'border-white/20 group-hover:border-hk-accent/50'}`}>
                                            {txFormData.is_recurring && <div className="w-2.5 h-2.5 rounded-sm bg-white" />}
                                        </div>
                                        <span className="text-sm font-medium text-hk-text">Es un pago recurrente</span>
                                        <input type="checkbox" className="hidden"
                                            checked={txFormData.is_recurring} onChange={(e) => setTxFormData({ ...txFormData, is_recurring: e.target.checked })} />
                                    </label>
                                    {txFormData.is_recurring && (
                                        <div className="mt-3 ml-7">
                                            <select
                                                required={txFormData.is_recurring}
                                                value={txFormData.recurrence_period || ''} onChange={(e) => setTxFormData({ ...txFormData, recurrence_period: e.target.value as any })}
                                                className="bg-black/20 border border-white/5 rounded-lg py-1.5 px-3 text-white text-sm focus:outline-none focus:border-hk-accent/50 cursor-pointer"
                                            >
                                                <option value="" disabled>Selecciona periodo...</option>
                                                <option value="WEEKLY">Semanal</option>
                                                <option value="MONTHLY">Mensual</option>
                                            </select>
                                        </div>
                                    )}
                                </div>
                            </form>
                        </div>
                        <div className="p-4 border-t border-white/5 bg-black/40 flex justify-end gap-3 shrink-0">
                            <button onClick={() => setIsCreatingTx(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-hk-text-muted hover:text-white transition-colors">Cancelar</button>
                            <button type="submit" form="tx-form" disabled={txMutation.isPending} className="flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold bg-hk-accent hover:bg-hk-accent/90 text-white transition-colors shadow-lg shadow-hk-accent/20">
                                {txMutation.isPending ? 'Guardando...' : <><Save className="w-3.5 h-3.5" /> Guardar</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

/* --- Canvas Donut Chart Component --- */
const DonutChart = ({ data, total }: { data: { name: string, total: number, color: string }[], total: number }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;

        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);

        const cx = width / 2;
        const cy = height / 2;
        const radius = Math.min(cx, cy) - 5; // 5px padding
        const holeRadius = radius * 0.7; // Inner hole

        ctx.clearRect(0, 0, width, height);

        if (total === 0) {
            // Empty state circle
            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, Math.PI * 2);
            ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--theme-surface') || '#222';
            ctx.fill();

            // Cut hole
            ctx.globalCompositeOperation = 'destination-out';
            ctx.beginPath();
            ctx.arc(cx, cy, holeRadius, 0, Math.PI * 2);
            ctx.fillStyle = 'black';
            ctx.fill();
            ctx.globalCompositeOperation = 'source-over';
            return;
        }

        let startAngle = -Math.PI / 2; // Start from top

        // Draw slices
        data.forEach(item => {
            const sliceAngle = (item.total / total) * 2 * Math.PI;

            // Adding a small gap between slices if there's more than 1 slice
            const gap = data.length > 1 ? 0.02 : 0;

            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.arc(cx, cy, radius, startAngle, startAngle + sliceAngle - gap);
            ctx.fillStyle = item.color;
            ctx.fill();
            startAngle += sliceAngle;
        });

        // Cut hole
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(cx, cy, holeRadius, 0, Math.PI * 2);
        ctx.fillStyle = 'black';
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';

    }, [data, total]);

    return (
        <div className="relative w-full aspect-square max-w-[240px] mx-auto flex-shrink-0">
            <canvas ref={canvasRef} className="w-full h-full block" />
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] sm:text-xs uppercase tracking-widest text-hk-text-muted/60 font-bold mb-1">Total Expr</span>
                <span className="text-xl sm:text-2xl font-serif font-bold text-hk-text">${total.toFixed(0)}</span>
            </div>
        </div>
    );
};
