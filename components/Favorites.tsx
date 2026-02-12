
import React from 'react';
import { Recipe } from '../types';
import { Heart, Plus, Clock, Star, Edit2 } from 'lucide-react';

interface FavoritesProps {
    recipes: Recipe[];
    onSelectRecipe: (r: Recipe) => void;
    onEditRecipe: (r: Recipe) => void;
    onAddManual: () => void;
}

const Favorites: React.FC<FavoritesProps> = ({ recipes, onSelectRecipe, onEditRecipe, onAddManual }) => {
    return (
        <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center">
                    <Heart className="mr-3 text-red-500 fill-red-500" /> Deine Favoriten
                </h2>
                <button 
                    onClick={onAddManual}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center shadow-sm transition"
                >
                    <Plus size={18} className="mr-2" /> Rezept hinzufügen
                </button>
            </div>

            {recipes.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 border-dashed">
                    <Heart className="mx-auto h-12 w-12 text-slate-200 dark:text-slate-600 mb-4" />
                    <p className="text-slate-500 dark:text-slate-400">Noch keine Favoriten markiert.</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">Markiere Rezepte im Wochenplan oder füge eigene hinzu.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {recipes.map((recipe, idx) => (
                        <div key={idx} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition cursor-pointer overflow-hidden group">
                            <div className="p-5">
                                <div className="flex justify-between items-start mb-3">
                                    <h3 
                                        onClick={() => onSelectRecipe(recipe)}
                                        className="font-bold text-slate-800 dark:text-white line-clamp-2 hover:text-emerald-600 transition"
                                    >
                                        {recipe.name}
                                    </h3>
                                    <div className="flex gap-2 shrink-0 ml-2">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); onEditRecipe(recipe); }}
                                            className="p-1.5 text-slate-400 hover:text-emerald-600 bg-slate-50 dark:bg-slate-700 rounded-full transition"
                                            title="Bearbeiten"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <Heart className="h-5 w-5 text-red-500 fill-red-500" />
                                    </div>
                                </div>
                                <div 
                                    onClick={() => onSelectRecipe(recipe)}
                                    className="flex flex-wrap gap-2 mb-4"
                                >
                                    <span className="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-slate-600 dark:text-slate-300">{recipe.calories} kcal</span>
                                    <span className="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-slate-600 dark:text-slate-300 flex items-center"><Clock size={10} className="mr-1"/> {recipe.cookingTime || 30}m</span>
                                    {recipe.rating && (
                                        <div className="flex items-center bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded border border-yellow-100 dark:border-yellow-900/30">
                                            <Star size={10} className="text-yellow-500 fill-yellow-500 mr-1"/>
                                            <span className="text-xs font-bold text-yellow-700 dark:text-yellow-500">{recipe.rating}</span>
                                        </div>
                                    )}
                                    {recipe.source === 'manual' && (
                                        <span className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-1 rounded border border-blue-100 dark:border-blue-800 font-medium">
                                            Eigenes
                                        </span>
                                    )}
                                    {recipe.tags.slice(0,2).map(t => (
                                        <span key={t} className={`text-xs px-2 py-1 rounded border ${t.toLowerCase() === 'thermomix' ? 'bg-purple-50 border-purple-200 text-purple-700 dark:bg-purple-900/30 dark:border-purple-800 dark:text-purple-300' : 'bg-white dark:bg-slate-600 dark:text-slate-200 border-slate-200 dark:border-slate-500'}`}>
                                            {t}
                                        </span>
                                    ))}
                                </div>
                                <div 
                                    onClick={() => onSelectRecipe(recipe)}
                                    className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3"
                                >
                                    {recipe.ingredients.map(i => i.name).join(', ')}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Favorites;
