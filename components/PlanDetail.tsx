
import React, { useState } from 'react';
import { WeeklyPlan, Recipe, AppSettings } from '../types';
import { RefreshCw, ShoppingCart, Download, GripVertical, Bookmark, Heart, Clock, Star } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface PlanDetailProps {
    plan: WeeklyPlan;
    activeTabDay: string;
    setActiveTabDay: (day: string) => void;
    settings: AppSettings;
    initiateGeneration: () => void;
    handleGenerateShoppingList: () => void;
    handleExportICal: () => void;
    openReplaceModal: (d: number, t: string, n: string) => void;
    openFavoriteReplaceModal: (d: number, t: string, n: string) => void;
    setSelectedRecipe: (r: Recipe) => void;
    onPlanUpdate: (p: WeeklyPlan) => void;
}

const formatDateGerman = (isoDate: string) => {
    return new Date(isoDate).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

const PlanDetail: React.FC<PlanDetailProps> = ({
    plan, activeTabDay, setActiveTabDay, settings,
    initiateGeneration, handleGenerateShoppingList, handleExportICal,
    openReplaceModal, openFavoriteReplaceModal, setSelectedRecipe, onPlanUpdate
}) => {
    const [draggedItem, setDraggedItem] = useState<{ dayIndex: number, mealIndex: number, type: string } | null>(null);

    const handleDragStart = (e: React.DragEvent, dayIndex: number, mealIndex: number, type: string) => {
        setDraggedItem({ dayIndex, mealIndex, type });
        e.dataTransfer.effectAllowed = 'move';
    };
  
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };
  
    const handleDrop = (e: React.DragEvent, targetDayIndex: number, targetMealIndex: number, targetType: string) => {
        e.preventDefault();
        if (!draggedItem) return;
        if (draggedItem.dayIndex === targetDayIndex && draggedItem.mealIndex === targetMealIndex) return;
  
        const planToUpdate = { ...plan };
        planToUpdate.days = planToUpdate.days.map(d => ({ ...d, meals: d.meals.map(m => ({ ...m })) }));
        
        const sourceMeal = planToUpdate.days[draggedItem.dayIndex].meals[draggedItem.mealIndex];
        const targetMeal = planToUpdate.days[targetDayIndex].meals[targetMealIndex];
  
        const tempRecipe = sourceMeal.recipe;
        sourceMeal.recipe = targetMeal.recipe;
        targetMeal.recipe = tempRecipe;
  
        onPlanUpdate(planToUpdate);
        setDraggedItem(null);
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                 <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">Wochenplan Detail</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Woche vom {formatDateGerman(plan.startDate)}</p>
                 </div>
                 <div className="flex flex-wrap gap-2">
                    <button onClick={initiateGeneration} className="flex items-center px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg shadow-sm hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 font-medium text-sm">
                        <RefreshCw size={16} className="mr-2" /> Wochenplan erstellen
                    </button>
                    <button onClick={handleGenerateShoppingList} className="flex items-center px-4 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-medium text-sm">
                        <ShoppingCart size={16} className="mr-2" /> Einkaufsliste generieren
                    </button>
                    <button onClick={handleExportICal} className="flex items-center px-4 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-medium text-sm" title="Als .ics Datei herunterladen">
                        <Download size={16} className="mr-2" /> iCal Export
                    </button>
                 </div>
            </div>

            {/* Day Tabs */}
            <div className="flex overflow-x-auto pb-2 space-x-2 scrollbar-hide">
                {plan.days.map((day) => (
                    <button
                        key={day.day}
                        onClick={() => setActiveTabDay(day.day)}
                        className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition ${activeTabDay === day.day ? 'bg-emerald-600 text-white shadow-md' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                    >
                        {day.day}
                    </button>
                ))}
            </div>

            {/* Active Day Content */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden min-h-[500px]">
                {plan.days.filter(d => d.day === activeTabDay).map((day) => {
                     const globalDayIndex = plan.days.indexOf(day);
                     
                     return (
                        <div key={day.day} className="p-6">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6 flex items-center">
                                <span className="w-2 h-8 bg-emerald-500 rounded-full mr-3"></span>
                                {day.day}
                            </h3>
                            <div className="space-y-8">
                                {day.meals.map((meal, mIdx) => (
                                    <div 
                                        key={mIdx} 
                                        className="relative group border border-transparent hover:border-emerald-200 dark:hover:border-emerald-700 rounded-xl p-2 transition-all bg-white dark:bg-slate-800 hover:shadow-md"
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, globalDayIndex, mIdx, meal.type)}
                                        onDragOver={handleDragOver}
                                        onDrop={(e) => handleDrop(e, globalDayIndex, mIdx, meal.type)}
                                    >
                                        <div className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600 cursor-grab opacity-0 group-hover:opacity-100">
                                            <GripVertical size={20} />
                                        </div>
                                        <div className="pl-8 pr-2">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-700 px-2 py-1 rounded">{meal.type}</span>
                                                <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition">
                                                    <button 
                                                        onClick={() => openFavoriteReplaceModal(globalDayIndex, meal.type, meal.recipe.name)}
                                                        className="p-1 text-yellow-600 hover:bg-yellow-50 bg-white dark:bg-slate-700 rounded shadow-sm border border-slate-100 dark:border-slate-600 mr-1" title="Durch Favorit ersetzen"
                                                    >
                                                        <Bookmark size={14} />
                                                    </button>
                                                    <button 
                                                        onClick={() => openReplaceModal(globalDayIndex, meal.type, meal.recipe.name)}
                                                        className="p-1 text-slate-400 hover:text-emerald-600 bg-white dark:bg-slate-700 rounded shadow-sm border border-slate-100 dark:border-slate-600" title="Gericht ersetzen"
                                                    >
                                                        <RefreshCw size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                            <div 
                                                onClick={() => setSelectedRecipe(meal.recipe)}
                                                className="cursor-pointer"
                                            >
                                                <div className="flex justify-between items-start">
                                                    <h4 className="text-lg font-bold text-slate-800 dark:text-white">{meal.recipe.name}</h4>
                                                    {meal.recipe.isFavorite && <Heart size={16} className="text-red-500 fill-red-500 mt-1" />}
                                                </div>
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    <span className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-md">
                                                        {meal.recipe.calories} kcal
                                                    </span>
                                                    <span className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-md flex items-center">
                                                        <Clock size={10} className="mr-1"/> {meal.recipe.cookingTime || 30}m
                                                    </span>
                                                    {meal.recipe.rating && meal.recipe.rating > 0 && (
                                                         <span className="text-xs px-2 py-1 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-500 border border-yellow-200 dark:border-yellow-900/30 rounded-md flex items-center">
                                                            <Star size={10} className="fill-yellow-500 text-yellow-500 mr-1"/> {meal.recipe.rating}
                                                         </span>
                                                    )}
                                                    {meal.recipe.tags.slice(0, 3).map(tag => (
                                                        <span key={tag} className={`text-xs px-2 py-1 rounded-md ${tag.toLowerCase() === 'thermomix' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300' : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'}`}>
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {day.meals.length === 0 && (
                                    <div className="p-8 text-center border-2 border-dashed border-slate-100 dark:border-slate-700 rounded-xl">
                                        <p className="text-slate-400 italic">Keine Mahlzeiten geplant (Niemand zu Hause).</p>
                                    </div>
                                )}
                            </div>
                        </div>
                     )
                })}
            </div>
        </div>
    );
};

export default PlanDetail;
