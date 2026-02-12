
import React from 'react';
import { WeeklyPlan, Recipe, AppSettings } from '../types';
import { ChevronLeft, ChevronRight, Plus, Coffee, Sun, Moon, RotateCcw, Heart, Circle, CheckCircle2 } from 'lucide-react';
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

const Dashboard: React.FC<DashboardProps> = ({ 
    activePlan, currentViewDate, currentViewDateIso, toggleViewDate, goToCurrentWeek,
    initiateGeneration, setView, setActiveTabDay, getWeekRangeString,
    onSelectRecipe, onToggleMealCompletion, settings
}) => {
    // Calculate if we are in the current week view
    const isCurrentWeek = Math.abs(new Date().getTime() - new Date(currentViewDateIso).getTime()) < 604800000 / 2;

    // Determine the days to display based on settings
    const displayDays = [];
    let startIndex = DAYS_OF_WEEK.indexOf(settings.weekStartDay);
    if (startIndex === -1) startIndex = 0;

    for (let i = 0; i < 7; i++) {
        const dayName = DAYS_OF_WEEK[(startIndex + i) % 7];
        if (!settings.includeWeekends && (dayName === 'Samstag' || dayName === 'Sonntag')) {
            continue;
        }
        displayDays.push({ name: dayName, offset: i });
    }

    return (
        <div className="animate-fade-in space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Willkommen</h2>
                    <div className="flex items-center gap-2 mt-2">
                        <div className="flex items-center space-x-4 bg-white dark:bg-slate-800 rounded-lg p-1 shadow-sm border border-slate-200 dark:border-slate-700 w-fit">
                            <button onClick={() => toggleViewDate('prev')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-500 dark:text-slate-400"><ChevronLeft size={20} /></button>
                            <span className="font-medium text-slate-700 dark:text-slate-200 min-w-[140px] text-center">{getWeekRangeString(currentViewDateIso)}</span>
                            <button onClick={() => toggleViewDate('next')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-500 dark:text-slate-400"><ChevronRight size={20} /></button>
                        </div>
                        {!isCurrentWeek && (
                            <button 
                                onClick={goToCurrentWeek}
                                className="p-2.5 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm hover:text-emerald-600 dark:hover:text-emerald-400 transition"
                                title="Zur aktuellen Woche zurück"
                            >
                                <RotateCcw size={18} />
                            </button>
                        )}
                    </div>
                </div>
                {!activePlan && (
                        <button 
                        onClick={() => initiateGeneration(currentViewDate)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl shadow-lg shadow-emerald-200 dark:shadow-emerald-900/50 font-bold flex items-center transition transform hover:-translate-y-1"
                    >
                        <Plus className="mr-2 h-5 w-5" /> Plan erstellen
                    </button>
                )}
            </div>

            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4`}>
                {displayDays.map((d) => {
                    const tileDate = new Date(currentViewDate);
                    tileDate.setDate(tileDate.getDate() + d.offset);
                    
                    const dayData = activePlan ? activePlan.days.find(p => p.day === d.name) : null;
                    const hasMeals = dayData && dayData.meals.length > 0;

                    return (
                        <div key={d.name} className={`min-h-[160px] p-4 rounded-xl border flex flex-col justify-between ${hasMeals ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 opacity-70'}`}>
                            <div className="flex justify-between items-start mb-3">
                                <span className="font-bold text-slate-700 dark:text-slate-200">{d.name}</span>
                                <span className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">{tileDate.getDate()}.{tileDate.getMonth()+1}.</span>
                            </div>
                            
                            {hasMeals ? (
                                <div className="space-y-3">
                                    {dayData!.meals.map(m => (
                                        <div 
                                            key={m.type} 
                                            className="flex items-center gap-2 p-1.5 -mx-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group"
                                        >
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); onToggleMealCompletion(d.name, m.type); }}
                                                className={`shrink-0 transition-colors ${m.completed ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-600 hover:text-slate-400'}`}
                                            >
                                                {m.completed ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                                            </button>
                                            
                                            <div 
                                                className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer"
                                                onClick={() => onSelectRecipe(m.recipe)}
                                            >
                                                <div className={`text-slate-400 dark:text-slate-500 group-hover:text-emerald-500 transition-colors shrink-0 ${m.completed ? 'opacity-50' : ''}`}>
                                                    {m.type === 'Frühstück' && <Coffee size={16} />}
                                                    {m.type === 'Mittagessen' && <Sun size={16} />}
                                                    {m.type === 'Abendessen' && <Moon size={16} />}
                                                </div>
                                                <span className={`text-sm font-medium transition-all flex items-center truncate ${m.completed ? 'text-slate-400 dark:text-slate-500 line-through italic' : 'text-slate-700 dark:text-slate-300 group-hover:text-emerald-700 dark:group-hover:text-emerald-400'}`}>
                                                    {m.recipe.name}
                                                    {m.recipe.isFavorite && (
                                                        <Heart size={14} className="ml-1.5 fill-current text-current opacity-80" />
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                    <button 
                                        onClick={() => { setActiveTabDay(d.name); setView('plan'); }}
                                        className="w-full mt-2 text-xs text-center text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 py-1 rounded transition"
                                    >
                                        Details bearbeiten
                                    </button>
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-slate-600">
                                    <span className="text-sm italic">Kein Plan</span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Dashboard;
