
import React from 'react';
import { WeeklyPlan, Recipe, AppSettings } from '../types';
import { ChevronLeft, ChevronRight, Plus, Coffee, Sun, Moon, RotateCcw, Heart, Circle, CheckCircle2, Sparkles, Package } from 'lucide-react';
import { DAYS_OF_WEEK } from '../constants';

interface DashboardProps {
    activePlan?: WeeklyPlan;
    currentViewDate: Date;
    currentViewDateIso: string;
    toggleViewDate: (dir: 'prev' | 'next') => void;
    goToCurrentWeek: () => void;
    initiateGeneration: (date?: Date) => void;
    onCreateManually: () => void;
    setView: (view: any) => void;
    setActiveTabDay: (day: string) => void;
    getWeekRangeString: (iso: string) => string;
    onSelectRecipe: (recipe: Recipe) => void;
    onToggleMealCompletion: (dayName: string, mealType: string) => void;
    settings: AppSettings;
}

const mealMeta: Record<string, { icon: React.ReactNode; pillClass: string; label: string }> = {
    'Frühstück':   { icon: <Coffee size={13} />,  pillClass: 'meal-pill-breakfast', label: 'Frühstück' },
    'Mittagessen': { icon: <Sun size={13} />,     pillClass: 'meal-pill-lunch',     label: 'Mittag' },
    'Abendessen':  { icon: <Moon size={13} />,    pillClass: 'meal-pill-dinner',    label: 'Abend' },
    'Reste':       { icon: <Package size={13} />, pillClass: 'meal-pill-reste',     label: 'Reste' },
};

const Dashboard: React.FC<DashboardProps> = ({
    activePlan, currentViewDate, currentViewDateIso, toggleViewDate, goToCurrentWeek,
    initiateGeneration, onCreateManually, setView, setActiveTabDay, getWeekRangeString,
    onSelectRecipe, onToggleMealCompletion, settings
}) => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const [wy, wm, wd] = currentViewDateIso.split('-').map(Number);
    const weekStartLocal = new Date(wy, wm - 1, wd);
    const weekEndLocal = new Date(weekStartLocal);
    weekEndLocal.setDate(weekEndLocal.getDate() + 7);
    const isCurrentWeek = today >= weekStartLocal && today < weekEndLocal;

    const displayDays: { name: string; offset: number }[] = [];
    let startIndex = DAYS_OF_WEEK.indexOf(settings.weekStartDay);
    if (startIndex === -1) startIndex = 0;
    for (let i = 0; i < 7; i++) {
        const dayName = DAYS_OF_WEEK[(startIndex + i) % 7];
        if (!settings.includeWeekends && (dayName === 'Samstag' || dayName === 'Sonntag')) continue;
        displayDays.push({ name: dayName, offset: i });
    }

    const completedCount = activePlan
        ? activePlan.days.reduce((acc, d) => acc + d.meals.filter(m => m.completed).length, 0)
        : 0;
    const totalCount = activePlan
        ? activePlan.days.reduce((acc, d) => acc + d.meals.length, 0)
        : 0;

    return (
        <div className="space-y-6 animate-fade-in">

            {/* ── Header row ────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h2 className="section-title">
                        {isCurrentWeek ? 'Diese Woche' : 'Wochenübersicht'}
                    </h2>

                    {/* Week navigator */}
                    <div className="flex items-center gap-2 mt-3">
                        <div className="flex items-center rounded-full overflow-hidden border"
                             style={{ background: 'var(--c-surface)', borderColor: 'var(--c-border)' }}>
                            <button
                                onClick={() => toggleViewDate('prev')}
                                className="p-2.5 transition-colors hover:bg-surface-container-low"
                                style={{ color: 'var(--c-text-mid)' }}
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <span className="px-3 py-2 text-sm font-semibold min-w-[155px] text-center"
                                  style={{ color: 'var(--c-text)' }}>
                                {getWeekRangeString(currentViewDateIso)}
                            </span>
                            <button
                                onClick={() => toggleViewDate('next')}
                                className="p-2.5 transition-colors hover:bg-surface-container-low"
                                style={{ color: 'var(--c-text-mid)' }}
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>

                        {!isCurrentWeek && (
                            <button
                                onClick={goToCurrentWeek}
                                title="Zur aktuellen Woche"
                                className="p-2.5 rounded-full border transition-colors hover:bg-surface-container-low"
                                style={{ background: 'var(--c-surface)', borderColor: 'var(--c-border)', color: 'var(--c-text-mid)' }}
                            >
                                <RotateCcw size={16} />
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Progress badge when plan exists */}
                    {activePlan && totalCount > 0 && (
                        <div className="hidden sm:flex items-center gap-2 rounded-2xl px-3.5 py-2.5 border"
                             style={{ background: 'var(--c-surface)', borderColor: 'var(--c-border)' }}>
                            <div className="relative w-8 h-8">
                                <svg className="w-8 h-8 -rotate-90" viewBox="0 0 32 32">
                                    <circle cx="16" cy="16" r="12" fill="none" stroke="var(--c-surface-mid)" strokeWidth="3" />
                                    <circle
                                        cx="16" cy="16" r="12" fill="none"
                                        stroke="var(--c-primary)" strokeWidth="3"
                                        strokeDasharray={`${(completedCount / totalCount) * 75.4} 75.4`}
                                        strokeLinecap="round"
                                        className="transition-all duration-500"
                                    />
                                </svg>
                                <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold" style={{ color: 'var(--c-primary)' }}>
                                    {Math.round((completedCount / totalCount) * 100)}%
                                </span>
                            </div>
                            <div>
                                <p className="text-[10px] uppercase font-bold tracking-wide" style={{ color: 'var(--c-text-dim)' }}>Erledigt</p>
                                <p className="text-sm font-bold leading-none" style={{ color: 'var(--c-text)' }}>{completedCount} / {totalCount}</p>
                            </div>
                        </div>
                    )}

                    {!activePlan && (
                        <div className="flex gap-2">
                            <button
                                onClick={onCreateManually}
                                className="btn-ghost gap-2 text-sm"
                            >
                                <Plus size={15} />
                                Plan erstellen
                            </button>
                            <button
                                onClick={() => initiateGeneration(currentViewDate)}
                                className="btn-primary gap-2"
                            >
                                <Sparkles size={16} />
                                Plan generieren
                            </button>
                        </div>
                    )}

                    {activePlan && (
                        <button
                            onClick={() => setView('plan')}
                            className="btn-secondary gap-2"
                        >
                            Plan anzeigen
                        </button>
                    )}
                </div>
            </div>

            {/* ── Day cards grid ─────────────────────────────── */}
            {!activePlan ? (
                /* Empty state */
                <div className="card p-12 flex flex-col items-center text-center animate-fade-in stagger-1">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                         style={{ background: 'var(--c-surface-low)' }}>
                        <Sparkles className="h-7 w-7" style={{ color: 'var(--c-primary)' }} />
                    </div>
                    <h3 className="text-xl font-extrabold mb-2" style={{ color: 'var(--c-text)' }}>
                        Noch kein Plan
                    </h3>
                    <p className="text-sm max-w-xs mb-6" style={{ color: 'var(--c-text-mid)' }}>
                        Erstelle deinen KI-generierten Wochenplan für diese Woche.
                    </p>
                    <div className="flex gap-3 flex-wrap justify-center">
                        <button
                            onClick={onCreateManually}
                            className="btn-ghost gap-2"
                        >
                            <Plus size={16} />
                            Plan erstellen
                        </button>
                        <button
                            onClick={() => initiateGeneration(currentViewDate)}
                            className="btn-primary gap-2"
                        >
                            <Sparkles size={16} />
                            Plan generieren
                        </button>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {displayDays.map((d, dIdx) => {
                        const tileDate = new Date(currentViewDate);
                        tileDate.setDate(tileDate.getDate() + d.offset);
                        tileDate.setHours(0,0,0,0);

                        const isToday = tileDate.getTime() === today.getTime();
                        const dayData = activePlan.days.find(p => p.day === d.name);
                        const hasMeals = dayData && dayData.meals.length > 0;
                        const allDone = hasMeals && dayData!.meals.every(m => m.completed);

                        return (
                            <div
                                key={d.name}
                                className={`card card-hover p-4 flex flex-col animate-fade-in
                                    ${isToday ? 'ring-2' : ''}
                                    ${allDone ? 'opacity-70' : ''}
                                `}
                                style={isToday ? { ringColor: 'rgba(66,101,0,0.3)' } : {}}
                                data-today={isToday}
                                {...(isToday ? { style: { outline: '2px solid rgba(184,253,75,0.7)', outlineOffset: '-2px' } } : {})}
                            >
                                {/* Day header */}
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        {isToday && (
                                            <span className="w-2 h-2 rounded-full" style={{ background: '#b8fd4b' }} />
                                        )}
                                        <span className="font-bold text-sm"
                                              style={{ color: isToday ? 'var(--c-primary)' : 'var(--c-text)' }}>
                                            {d.name}
                                        </span>
                                    </div>
                                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                                          style={{ background: 'var(--c-surface-low)', color: 'var(--c-text-mid)' }}>
                                        {tileDate.getDate()}.{tileDate.getMonth()+1}.
                                    </span>
                                </div>

                                {hasMeals ? (
                                    <div className="flex-1 space-y-1.5">
                                        {[...dayData!.meals].sort((a, b) => {
                                            const order: Record<string, number> = { 'Frühstück': 0, 'Mittagessen': 1, 'Abendessen': 2, 'Reste': 3 };
                                            return (order[a.type] ?? 99) - (order[b.type] ?? 99);
                                        }).map((m, mIdx) => {
                                            const meta = mealMeta[m.type] || mealMeta['Abendessen'];
                                            return (
                                                <div
                                                    key={mIdx}
                                                    className={`flex items-center gap-2 p-1.5 rounded-xl transition-colors group
                                                        ${m.completed ? 'opacity-50' : ''}`}
                                                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--c-surface-low)')}
                                                    onMouseLeave={e => (e.currentTarget.style.background = '')}
                                                >
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); onToggleMealCompletion(d.name, m.type); }}
                                                        className="shrink-0 transition-colors"
                                                    >
                                                        {m.completed
                                                            ? <CheckCircle2 size={18} style={{ color: 'var(--c-primary)', fill: 'rgba(184,253,75,0.3)' }} />
                                                            : <Circle size={18} style={{ color: 'var(--c-border)' }} />
                                                        }
                                                    </button>

                                                    <span className={`shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold ${meta.pillClass}`}>
                                                        {meta.icon}
                                                    </span>

                                                    <button
                                                        onClick={() => onSelectRecipe(m.recipe)}
                                                        className={`flex-1 text-left text-xs font-medium leading-snug truncate transition-colors
                                                            ${m.completed ? 'line-through' : ''}`}
                                                        style={{ color: m.completed ? 'var(--c-text-dim)' : 'var(--c-text)' }}
                                                    >
                                                        {m.isLeftover && (
                                                            <span className="font-normal" style={{ color: '#6b4a8a' }}>Reste: </span>
                                                        )}
                                                        {m.recipe.name}
                                                        {m.recipe.isFavorite && (
                                                            <Heart size={10} className="inline ml-1 fill-red-400 text-red-400" />
                                                        )}
                                                    </button>
                                                </div>
                                            );
                                        })}

                                        <button
                                            onClick={() => { setActiveTabDay(d.name); setView('plan'); }}
                                            className="w-full mt-1 text-[11px] text-center py-1.5 rounded-lg transition-colors font-semibold"
                                            style={{ color: 'var(--c-primary)' }}
                                            onMouseEnter={e => (e.currentTarget.style.background = 'var(--c-surface-low)')}
                                            onMouseLeave={e => (e.currentTarget.style.background = '')}
                                        >
                                            Details →
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex-1 flex items-center justify-center">
                                        <span className="text-xs italic" style={{ color: 'var(--c-text-faint)' }}>Kein Plan</span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default Dashboard;
