
import React from 'react';
import { WeeklyPlan, Recipe, AppSettings } from '../types';
import { ChevronLeft, ChevronRight, Plus, Coffee, Sun, Moon, RotateCcw, Heart, Circle, CheckCircle2, Sparkles } from 'lucide-react';
import { DAYS_OF_WEEK } from '../constants';

interface DashboardProps {
    activePlan?: WeeklyPlan;
    currentViewDate: Date;
    currentViewDateIso: string;
    toggleViewDate: (dir: 'prev' | 'next') => void;
    goToCurrentWeek: () => void;
    initiateGeneration: (date?: Date) => void;
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
};

const Dashboard: React.FC<DashboardProps> = ({
    activePlan, currentViewDate, currentViewDateIso, toggleViewDate, goToCurrentWeek,
    initiateGeneration, setView, setActiveTabDay, getWeekRangeString,
    onSelectRecipe, onToggleMealCompletion, settings
}) => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const isCurrentWeek = Math.abs(today.getTime() - new Date(currentViewDateIso).getTime()) < 604800000 / 2;

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
                        <div className="flex items-center bg-white dark:bg-[#1C231A] rounded-xl border border-clay-200 dark:border-[#2A3427] shadow-card overflow-hidden">
                            <button
                                onClick={() => toggleViewDate('prev')}
                                className="p-2.5 text-[#6E6A60] dark:text-[#9A9690] hover:bg-clay-50 dark:hover:bg-[#232B1F] hover:text-[#1C1A16] dark:hover:text-[#F0EDE5] transition-colors"
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <span className="px-3 py-2 text-sm font-medium text-[#1C1A16] dark:text-[#F0EDE5] min-w-[155px] text-center">
                                {getWeekRangeString(currentViewDateIso)}
                            </span>
                            <button
                                onClick={() => toggleViewDate('next')}
                                className="p-2.5 text-[#6E6A60] dark:text-[#9A9690] hover:bg-clay-50 dark:hover:bg-[#232B1F] hover:text-[#1C1A16] dark:hover:text-[#F0EDE5] transition-colors"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>

                        {!isCurrentWeek && (
                            <button
                                onClick={goToCurrentWeek}
                                title="Zur aktuellen Woche"
                                className="p-2.5 bg-white dark:bg-[#1C231A] border border-clay-200 dark:border-[#2A3427] rounded-xl shadow-card text-[#6E6A60] dark:text-[#9A9690] hover:text-forest-500 dark:hover:text-[#4FC475] transition-colors"
                            >
                                <RotateCcw size={16} />
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Progress badge when plan exists */}
                    {activePlan && totalCount > 0 && (
                        <div className="hidden sm:flex items-center gap-2 bg-white dark:bg-[#1C231A] border border-clay-200 dark:border-[#2A3427] rounded-xl px-3.5 py-2.5 shadow-card">
                            <div className="relative w-8 h-8">
                                <svg className="w-8 h-8 -rotate-90" viewBox="0 0 32 32">
                                    <circle cx="16" cy="16" r="12" fill="none" stroke="#E8DFD0" strokeWidth="3" className="dark:stroke-[#2A3427]" />
                                    <circle
                                        cx="16" cy="16" r="12" fill="none"
                                        stroke="#1A5C38" strokeWidth="3"
                                        strokeDasharray={`${(completedCount / totalCount) * 75.4} 75.4`}
                                        strokeLinecap="round"
                                        className="dark:stroke-[#4FC475] transition-all duration-500"
                                    />
                                </svg>
                                <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-forest-500 dark:text-[#4FC475]">
                                    {Math.round((completedCount / totalCount) * 100)}%
                                </span>
                            </div>
                            <div>
                                <p className="text-[10px] text-[#A38E72] dark:text-[#6B6762] uppercase font-semibold tracking-wide">Erledigt</p>
                                <p className="text-sm font-semibold text-[#1C1A16] dark:text-[#F0EDE5] leading-none">{completedCount} / {totalCount}</p>
                            </div>
                        </div>
                    )}

                    {!activePlan && (
                        <button
                            onClick={() => initiateGeneration(currentViewDate)}
                            className="btn-primary gap-2"
                        >
                            <Sparkles size={16} />
                            Plan erstellen
                        </button>
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
                    <div className="w-16 h-16 rounded-2xl bg-forest-50 dark:bg-[rgba(79,196,117,0.1)] flex items-center justify-center mb-4">
                        <Sparkles className="h-7 w-7 text-forest-400 dark:text-[#4FC475]" />
                    </div>
                    <h3 className="font-display text-xl font-bold text-[#1C1A16] dark:text-[#F0EDE5] mb-2">
                        Noch kein Plan
                    </h3>
                    <p className="text-sm text-[#6E6A60] dark:text-[#9A9690] max-w-xs mb-6">
                        Erstelle deinen KI-generierten Wochenplan für diese Woche.
                    </p>
                    <button
                        onClick={() => initiateGeneration(currentViewDate)}
                        className="btn-primary gap-2"
                    >
                        <Plus size={16} />
                        Plan erstellen
                    </button>
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
                                    ${isToday ? 'ring-2 ring-forest-500/30 dark:ring-[#4FC475]/30' : ''}
                                    ${allDone ? 'opacity-70' : ''}
                                `}
                                style={{ animationDelay: `${dIdx * 0.05}s` }}
                            >
                                {/* Day header */}
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        {isToday && (
                                            <span className="w-1.5 h-1.5 rounded-full bg-forest-500 dark:bg-[#4FC475]" />
                                        )}
                                        <span className={`font-semibold text-sm ${isToday ? 'text-forest-600 dark:text-[#4FC475]' : 'text-[#1C1A16] dark:text-[#F0EDE5]'}`}>
                                            {d.name}
                                        </span>
                                    </div>
                                    <span className="text-xs text-[#A38E72] dark:text-[#6B6762] bg-clay-100 dark:bg-[#232B1F] px-2 py-0.5 rounded-md font-medium">
                                        {tileDate.getDate()}.{tileDate.getMonth()+1}.
                                    </span>
                                </div>

                                {hasMeals ? (
                                    <div className="flex-1 space-y-1.5">
                                        {dayData!.meals.map((m, mIdx) => {
                                            const meta = mealMeta[m.type] || mealMeta['Abendessen'];
                                            return (
                                                <div
                                                    key={mIdx}
                                                    className={`flex items-center gap-2 p-1.5 rounded-lg transition-colors group
                                                        hover:bg-clay-50 dark:hover:bg-[#232B1F]
                                                        ${m.completed ? 'opacity-50' : ''}`}
                                                >
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); onToggleMealCompletion(d.name, m.type); }}
                                                        className="shrink-0 transition-colors"
                                                    >
                                                        {m.completed
                                                            ? <CheckCircle2 size={18} className="text-forest-500 dark:text-[#4FC475] fill-forest-100 dark:fill-[rgba(79,196,117,0.2)]" />
                                                            : <Circle size={18} className="text-clay-300 dark:text-[#3A4635] group-hover:text-clay-400" />
                                                        }
                                                    </button>

                                                    <span className={`shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold ${meta.pillClass}`}>
                                                        {meta.icon}
                                                    </span>

                                                    <button
                                                        onClick={() => onSelectRecipe(m.recipe)}
                                                        className={`flex-1 text-left text-xs font-medium leading-snug truncate transition-colors
                                                            ${m.completed
                                                                ? 'line-through text-[#A38E72] dark:text-[#6B6762]'
                                                                : 'text-[#1C1A16] dark:text-[#F0EDE5] group-hover:text-forest-600 dark:group-hover:text-[#4FC475]'
                                                            }`}
                                                    >
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
                                            className="w-full mt-1 text-[11px] text-center text-forest-500 dark:text-[#4FC475] hover:bg-forest-50 dark:hover:bg-[rgba(79,196,117,0.08)] py-1.5 rounded-lg transition-colors font-medium"
                                        >
                                            Details →
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex-1 flex items-center justify-center">
                                        <span className="text-xs text-clay-400 dark:text-[#6B6762] italic">Kein Plan</span>
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
