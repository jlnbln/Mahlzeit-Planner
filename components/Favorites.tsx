
import React from 'react';
import { Recipe } from '../types';
import { Heart, Plus, Clock, Star, Edit2, ChefHat } from 'lucide-react';

interface FavoritesProps {
    recipes: Recipe[];
    onSelectRecipe: (r: Recipe) => void;
    onEditRecipe: (r: Recipe) => void;
    onAddManual: () => void;
}

const Favorites: React.FC<FavoritesProps> = ({ recipes, onSelectRecipe, onEditRecipe, onAddManual }) => {
    return (
        <div className="space-y-6 animate-fade-in">

            {/* ── Header ───────────────────────────────────── */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="section-title flex items-center gap-2">
                        Deine Favoriten
                        <Heart className="h-6 w-6 fill-red-400 text-red-400" />
                    </h2>
                    {recipes.length > 0 && (
                        <p className="text-sm text-[#6E6A60] dark:text-[#9A9690] mt-1">
                            {recipes.length} gespeicherte Rezepte
                        </p>
                    )}
                </div>
                <button onClick={onAddManual} className="btn-primary gap-2 text-sm py-2.5 px-4">
                    <Plus size={16} />
                    <span className="hidden sm:inline">Rezept hinzufügen</span>
                    <span className="sm:hidden">Neu</span>
                </button>
            </div>

            {/* ── Empty state ───────────────────────────────── */}
            {recipes.length === 0 ? (
                <div className="card p-12 flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-4">
                        <Heart className="h-7 w-7 text-red-300 dark:text-red-800" />
                    </div>
                    <h3 className="font-display text-xl font-bold text-[#1C1A16] dark:text-[#F0EDE5] mb-2">
                        Noch keine Favoriten
                    </h3>
                    <p className="text-sm text-[#6E6A60] dark:text-[#9A9690] max-w-xs mb-6">
                        Markiere Rezepte im Wochenplan als Favorit oder füge eigene Rezepte hinzu.
                    </p>
                    <button onClick={onAddManual} className="btn-primary gap-2">
                        <Plus size={16} /> Erstes Rezept hinzufügen
                    </button>
                </div>
            ) : (
                /* ── Recipe grid ──────────────────────────── */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {recipes.map((recipe, idx) => (
                        <div
                            key={idx}
                            className="card card-hover overflow-hidden animate-fade-in"
                            style={{ animationDelay: `${idx * 0.04}s` }}
                        >
                            {/* Color accent top bar based on source */}
                            <div className={`h-1 ${recipe.source === 'manual' ? 'bg-blue-400 dark:bg-blue-500' : 'bg-forest-400 dark:bg-[#4FC475]'}`} />

                            <div className="p-5">
                                {/* Header */}
                                <div className="flex items-start justify-between gap-2 mb-3">
                                    <button
                                        onClick={() => onSelectRecipe(recipe)}
                                        className="flex-1 text-left"
                                    >
                                        <h3 className="font-display font-bold text-[#1C1A16] dark:text-[#F0EDE5] leading-snug line-clamp-2 hover:text-forest-600 dark:hover:text-[#4FC475] transition-colors">
                                            {recipe.name}
                                        </h3>
                                    </button>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onEditRecipe(recipe); }}
                                            className="p-1.5 rounded-lg text-[#A38E72] dark:text-[#6B6762] hover:text-forest-500 dark:hover:text-[#4FC475] hover:bg-forest-50 dark:hover:bg-[rgba(79,196,117,0.08)] transition-colors"
                                            title="Bearbeiten"
                                        >
                                            <Edit2 size={15} />
                                        </button>
                                        <Heart className="h-4 w-4 fill-red-400 text-red-400" />
                                    </div>
                                </div>

                                {/* Meta chips */}
                                <div className="flex flex-wrap gap-1.5 mb-3" onClick={() => onSelectRecipe(recipe)}>
                                    <span className="tag-chip cursor-pointer">{recipe.calories} kcal</span>
                                    <span className="tag-chip cursor-pointer">
                                        <Clock size={11} className="mr-0.5" />
                                        {recipe.cookingTime || 30}m
                                    </span>
                                    {recipe.rating && recipe.rating > 0 && (
                                        <span className="tag-chip tag-chip-amber cursor-pointer">
                                            <Star size={11} className="mr-0.5 fill-current" /> {recipe.rating}
                                        </span>
                                    )}
                                    {recipe.source === 'manual' && (
                                        <span className="tag-chip tag-chip-blue cursor-pointer">
                                            <ChefHat size={11} className="mr-0.5" /> Eigenes
                                        </span>
                                    )}
                                    {recipe.tags.filter(t => t.toLowerCase() === 'thermomix').map(t => (
                                        <span key={t} className="tag-chip tag-chip-purple cursor-pointer">{t}</span>
                                    ))}
                                </div>

                                {/* Ingredients preview */}
                                <p
                                    onClick={() => onSelectRecipe(recipe)}
                                    className="text-xs text-[#A38E72] dark:text-[#6B6762] line-clamp-2 cursor-pointer"
                                >
                                    {recipe.ingredients.map(i => i.name).join(', ')}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Favorites;
