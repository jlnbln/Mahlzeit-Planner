
import React, { useState } from 'react';
import { WeeklyPlan, Recipe, AppSettings } from '../types';
import { RefreshCw, ShoppingCart, Download, GripVertical, Bookmark, Heart, Clock, Star, Plus, Trash2 } from 'lucide-react';

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
    onAddMealClick: (dayIndex: number) => void;
    onDeleteMeal: (dayIndex: number, mealIndex: number) => void;
}

const formatDateGerman = (isoDate: string) =>
    new Date(isoDate).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });

const mealTypeColor: Record<string, string> = {
    'Frühstück':   'meal-pill-breakfast',
    'Mittagessen': 'meal-pill-lunch',
    'Abendessen':  'meal-pill-dinner',
    'Reste':       'meal-pill-reste',
};

const MEAL_ORDER: Record<string, number> = {
    'Frühstück': 0, 'Mittagessen': 1, 'Abendessen': 2, 'Reste': 3,
};

const PlanDetail: React.FC<PlanDetailProps> = ({
    plan, activeTabDay, setActiveTabDay, settings,
    initiateGeneration, handleGenerateShoppingList, handleExportICal,
    openReplaceModal, openFavoriteReplaceModal, setSelectedRecipe, onPlanUpdate, onAddMealClick, onDeleteMeal
}) => {
    const [draggedItem, setDraggedItem] = useState<{ dayIndex: number; mealIndex: number; type: string } | null>(null);

    const handleDragStart = (e: React.DragEvent, dayIndex: number, mealIndex: number, type: string) => {
        setDraggedItem({ dayIndex, mealIndex, type });
        e.dataTransfer.effectAllowed = 'move';
    };
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };
    const handleDrop = (e: React.DragEvent, targetDayIndex: number, targetMealIndex: number) => {
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

    const activeDay = plan.days.find(d => d.day === activeTabDay);

    return (
        <div className="space-y-5 animate-fade-in">

            {/* ── Action bar ────────────────────────────────── */}
            <div className="card p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <h2 className="section-title text-xl">Wochenplan</h2>
                        <p className="text-sm text-[#595c57] dark:text-[#8a9089] mt-0.5">
                            Woche vom {formatDateGerman(plan.startDate)}
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={initiateGeneration}
                            className="btn-secondary text-sm py-2 px-3 gap-2"
                        >
                            <RefreshCw size={14} /> Neu erstellen
                        </button>
                        <button
                            onClick={handleGenerateShoppingList}
                            className="btn-ghost text-sm py-2 px-3 gap-2"
                        >
                            <ShoppingCart size={14} /> Einkaufsliste
                        </button>
                        <button
                            onClick={handleExportICal}
                            className="btn-ghost text-sm py-2 px-3 gap-2"
                            title="Als .ics exportieren"
                        >
                            <Download size={14} /> iCal
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Day tabs ──────────────────────────────────── */}
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                {plan.days.map(day => (
                    <button
                        key={day.day}
                        onClick={() => setActiveTabDay(day.day)}
                        className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-all duration-150 shrink-0
                            ${activeTabDay === day.day
                                ? 'bg-[#426500] text-white dark:bg-[#b8fd4b] dark:text-[#3d5e00] shadow-[0_2px_8px_rgba(184,253,75,0.35)]'
                                : 'bg-white dark:bg-[#1e2a1e] text-[#595c57] dark:text-[#8a9089] border border-[#c4c8be] dark:border-[#2c3a2c] hover:bg-[#f5f7f0] dark:hover:bg-[#232B1F]'
                            }`}
                    >
                        {day.day}
                    </button>
                ))}
            </div>

            {/* ── Active day ────────────────────────────────── */}
            {activeDay && (
                <div className="card p-5 sm:p-6 animate-slide-up">
                    <h3 className="font-sans text-xl font-bold text-[#2c302b] dark:text-[#e6ede6] mb-5 flex items-center gap-3">
                        <span className="w-1 h-7 bg-[#426500] dark:bg-[#b8fd4b] rounded-full" />
                        {activeDay.day}
                    </h3>

                    {activeDay.meals.length === 0 ? (
                        <div className="py-10 flex flex-col items-center border-2 border-dashed border-[#c4c8be] dark:border-[#2c3a2c] rounded-xl">
                            <p className="text-[#959b8e] dark:text-[#6a7069] italic text-sm mb-4">
                                Keine Mahlzeiten geplant.
                            </p>
                            <button
                                onClick={() => onAddMealClick(plan.days.indexOf(activeDay))}
                                className="btn-secondary text-sm py-2 px-4 gap-2"
                            >
                                <Plus size={15} /> Mahlzeit hinzufügen
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {[...activeDay.meals]
                                .sort((a, b) => (MEAL_ORDER[a.type] ?? 99) - (MEAL_ORDER[b.type] ?? 99))
                                .map((meal) => {
                                const globalDayIndex = plan.days.indexOf(activeDay);
                                const originalIndex = activeDay.meals.indexOf(meal);
                                const pillClass = mealTypeColor[meal.type] || 'meal-pill-dinner';

                                return (
                                    <div
                                        key={originalIndex}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, globalDayIndex, originalIndex, meal.type)}
                                        onDragOver={handleDragOver}
                                        onDrop={(e) => handleDrop(e, globalDayIndex, originalIndex)}
                                        className="group relative flex items-start gap-3 p-3 rounded-xl border border-transparent hover:border-[#c4c8be] dark:hover:border-[#2A3427] hover:bg-[#f5f7f0]/50 dark:hover:bg-[#232B1F]/50 transition-all"
                                    >
                                        {/* Drag handle */}
                                        <div className="drag-handle mt-1 opacity-0 group-hover:opacity-100 transition-opacity text-[#c4c8be] dark:text-[#3a4835]">
                                            <GripVertical size={16} />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            {/* Meal type + actions */}
                                            <div className="flex items-center justify-between mb-2">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ${pillClass}`}>
                                                    {meal.type}
                                                </span>
                                                <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => openFavoriteReplaceModal(globalDayIndex, meal.type, meal.recipe.name)}
                                                        className="p-1.5 rounded-lg bg-white dark:bg-[#1e2a1e] border border-[#c4c8be] dark:border-[#2c3a2c] text-[#959b8e] hover:text-amber-600 dark:hover:text-amber-400 transition-colors shadow-sm"
                                                        title="Durch Favorit ersetzen"
                                                    >
                                                        <Bookmark size={13} />
                                                    </button>
                                                    <button
                                                        onClick={() => openReplaceModal(globalDayIndex, meal.type, meal.recipe.name)}
                                                        className="p-1.5 rounded-lg bg-white dark:bg-[#1e2a1e] border border-[#c4c8be] dark:border-[#2c3a2c] text-[#959b8e] hover:text-[#426500] dark:hover:text-[#b8fd4b] transition-colors shadow-sm"
                                                        title="KI-Alternative"
                                                    >
                                                        <RefreshCw size={13} />
                                                    </button>
                                                    <button
                                                        onClick={() => onDeleteMeal(globalDayIndex, originalIndex)}
                                                        className="p-1.5 rounded-lg bg-white dark:bg-[#1e2a1e] border border-[#c4c8be] dark:border-[#2c3a2c] text-[#959b8e] hover:text-red-500 dark:hover:text-red-400 transition-colors shadow-sm"
                                                        title="Mahlzeit entfernen"
                                                    >
                                                        <Trash2 size={13} />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Recipe info */}
                                            <button
                                                onClick={() => setSelectedRecipe(meal.recipe)}
                                                className="w-full text-left"
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <h4 className="font-semibold text-[#2c302b] dark:text-[#e6ede6] hover:text-[#395800] dark:hover:text-[#b8fd4b] transition-colors leading-snug">
                                                        {meal.isLeftover && (
                                                            <span className="text-[#6B4A8A] dark:text-[#C0A0E0] font-normal">Reste: </span>
                                                        )}
                                                        {meal.recipe.name}
                                                    </h4>
                                                    {meal.recipe.isFavorite && (
                                                        <Heart size={14} className="shrink-0 mt-0.5 fill-red-400 text-red-400" />
                                                    )}
                                                </div>

                                                <div className="flex flex-wrap gap-1.5 mt-2">
                                                    <span className="tag-chip">
                                                        {meal.recipe.calories} kcal
                                                    </span>
                                                    <span className="tag-chip">
                                                        <Clock size={11} className="mr-0.5" />
                                                        {meal.recipe.cookingTime || 30}m
                                                    </span>
                                                    {meal.recipe.rating && meal.recipe.rating > 0 && (
                                                        <span className="tag-chip tag-chip-amber">
                                                            <Star size={11} className="mr-0.5 fill-current" />
                                                            {meal.recipe.rating}
                                                        </span>
                                                    )}
                                                    {meal.recipe.tags.slice(0, 3).map(tag => (
                                                        <span
                                                            key={tag}
                                                            className={`tag-chip ${tag.toLowerCase() === 'thermomix' ? 'tag-chip-purple' : ''}`}
                                                        >
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                            <button
                                onClick={() => onAddMealClick(plan.days.indexOf(activeDay))}
                                className="btn-secondary w-full text-sm py-2.5 gap-2 mt-1"
                            >
                                <Plus size={15} /> Mahlzeit hinzufügen
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default PlanDetail;
