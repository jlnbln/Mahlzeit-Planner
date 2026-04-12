
import React, { useState } from 'react';
import { Recipe } from '../types';
import { Heart, Plus, Clock, Star, Edit2, ChefHat, Search, X, Upload, ChevronDown } from 'lucide-react';

interface FavoritesProps {
    recipes: Recipe[];
    onSelectRecipe: (r: Recipe) => void;
    onEditRecipe: (r: Recipe) => void;
    onAddManual: () => void;
    onImportRecipe: () => void;
}

const COMMON_TAGS = ['schnell', 'vegetarisch', 'vegan'];

const Favorites: React.FC<FavoritesProps> = ({ recipes, onSelectRecipe, onEditRecipe, onAddManual, onImportRecipe }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [calorieFilter, setCalorieFilter] = useState<string | null>(null);
    const [timeFilter, setTimeFilter] = useState<string | null>(null);
    const [sourceFilter, setSourceFilter] = useState<string | null>(null);
    const [thermomixFilter, setThermomixFilter] = useState<boolean | null>(null);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [openCategory, setOpenCategory] = useState<string | null>(null);

    // Derive available tags
    const hasThermomix = recipes.some(r => r.tags.some(t => t.toLowerCase() === 'thermomix'));
    const existingCommonTags = COMMON_TAGS.filter(ct =>
        recipes.some(r => r.tags.some(t => t.toLowerCase() === ct))
    );
    const weitereTags = Array.from(new Set(
        recipes.flatMap(r => r.tags.filter(t =>
            t.toLowerCase() !== 'thermomix' &&
            !COMMON_TAGS.includes(t.toLowerCase())
        ))
    )).sort() as string[];

    // Case-insensitive tag matching (AND logic)
    const tagMatchesAll = (recipeTags: string[], filters: string[]) =>
        filters.every(ft => recipeTags.some(rt => rt.toLowerCase() === ft.toLowerCase()));

    const filtered = recipes.filter(r => {
        if (searchTerm && !r.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        const cal = r.calories || 0;
        if (calorieFilter === '<300' && cal >= 300) return false;
        if (calorieFilter === '300-500' && (cal < 300 || cal > 500)) return false;
        if (calorieFilter === '>500' && cal <= 500) return false;
        const time = r.cookingTime || 30;
        if (timeFilter === '<20' && time >= 20) return false;
        if (timeFilter === '20-40' && (time < 20 || time > 40)) return false;
        if (timeFilter === '>40' && time <= 40) return false;
        if (sourceFilter === 'manual' && r.source !== 'manual') return false;
        if (sourceFilter === 'ai' && r.source === 'manual') return false;
        if (thermomixFilter === true && !r.tags.some(t => t.toLowerCase() === 'thermomix')) return false;
        if (thermomixFilter === false && r.tags.some(t => t.toLowerCase() === 'thermomix')) return false;
        if (selectedTags.length > 0 && !tagMatchesAll(r.tags, selectedTags)) return false;
        return true;
    });

    const activeFilterCount = (calorieFilter ? 1 : 0)
        + (timeFilter ? 1 : 0)
        + (sourceFilter ? 1 : 0)
        + (thermomixFilter !== null ? 1 : 0)
        + selectedTags.length;

    const isFiltering = searchTerm !== '' || activeFilterCount > 0;

    const clearAllFilters = () => {
        setCalorieFilter(null);
        setTimeFilter(null);
        setSourceFilter(null);
        setThermomixFilter(null);
        setSelectedTags([]);
        setOpenCategory(null);
    };

    const toggleCategory = (id: string) =>
        setOpenCategory(prev => prev === id ? null : id);

    const toggleTag = (tag: string) =>
        setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);

    type FilterOption = { label: string; active: boolean; onToggle: () => void; };
    type Category = { id: string; label: string; activeCount: number; options: FilterOption[]; };

    const categories: Category[] = [
        {
            id: 'calories',
            label: 'Kalorien',
            activeCount: calorieFilter ? 1 : 0,
            options: [
                { label: '≤ 300 kcal', active: calorieFilter === '<300', onToggle: () => setCalorieFilter(v => v === '<300' ? null : '<300') },
                { label: '300–500 kcal', active: calorieFilter === '300-500', onToggle: () => setCalorieFilter(v => v === '300-500' ? null : '300-500') },
                { label: '> 500 kcal', active: calorieFilter === '>500', onToggle: () => setCalorieFilter(v => v === '>500' ? null : '>500') },
            ],
        },
        {
            id: 'time',
            label: 'Zeit',
            activeCount: timeFilter ? 1 : 0,
            options: [
                { label: '≤ 20 min', active: timeFilter === '<20', onToggle: () => setTimeFilter(v => v === '<20' ? null : '<20') },
                { label: '20–40 min', active: timeFilter === '20-40', onToggle: () => setTimeFilter(v => v === '20-40' ? null : '20-40') },
                { label: '> 40 min', active: timeFilter === '>40', onToggle: () => setTimeFilter(v => v === '>40' ? null : '>40') },
            ],
        },
        {
            id: 'source',
            label: 'Quelle',
            activeCount: sourceFilter ? 1 : 0,
            options: [
                { label: 'Eigenes', active: sourceFilter === 'manual', onToggle: () => setSourceFilter(v => v === 'manual' ? null : 'manual') },
                { label: 'KI-generiert', active: sourceFilter === 'ai', onToggle: () => setSourceFilter(v => v === 'ai' ? null : 'ai') },
            ],
        },
        ...(hasThermomix ? [{
            id: 'thermomix',
            label: 'Thermomix',
            activeCount: thermomixFilter !== null ? 1 : 0,
            options: [
                { label: 'Mit Thermomix', active: thermomixFilter === true, onToggle: () => setThermomixFilter(v => v === true ? null : true) },
                { label: 'Ohne Thermomix', active: thermomixFilter === false, onToggle: () => setThermomixFilter((v: boolean | null) => v === false ? null : false) },
            ] as FilterOption[],
        }] : []),
        ...(existingCommonTags.length > 0 ? [{
            id: 'common',
            label: 'Beliebt',
            activeCount: selectedTags.filter(t => COMMON_TAGS.includes(t.toLowerCase())).length,
            options: existingCommonTags.map(ct => ({
                label: ct.charAt(0).toUpperCase() + ct.slice(1),
                active: selectedTags.some(t => t.toLowerCase() === ct),
                onToggle: () => toggleTag(ct),
            })) as FilterOption[],
        }] : []),
        ...(weitereTags.length > 0 ? [{
            id: 'other',
            label: 'Weitere Tags',
            activeCount: selectedTags.filter(t => weitereTags.some(wt => wt.toLowerCase() === t.toLowerCase())).length,
            options: weitereTags.map(t => ({
                label: t,
                active: selectedTags.some(s => s.toLowerCase() === t.toLowerCase()),
                onToggle: () => toggleTag(t),
            })) as FilterOption[],
        }] : []),
    ];

    const openCategoryData = openCategory ? categories.find(c => c.id === openCategory) : null;

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
                            {isFiltering ? `${filtered.length} von ${recipes.length}` : recipes.length} gespeicherte Rezepte
                        </p>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={onImportRecipe} className="btn-ghost text-sm py-2 px-3 gap-1.5">
                        <Upload size={15} />
                        <span className="hidden sm:inline">Importieren</span>
                    </button>
                    <button onClick={onAddManual} className="btn-primary gap-2 text-sm py-2.5 px-4">
                        <Plus size={16} />
                        <span className="hidden sm:inline">Rezept hinzufügen</span>
                        <span className="sm:hidden">Neu</span>
                    </button>
                </div>
            </div>

            {/* ── Empty state (no recipes at all) ──────────── */}
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
                    <div className="flex gap-3 flex-wrap justify-center">
                        <button onClick={onImportRecipe} className="btn-ghost gap-2">
                            <Upload size={16} /> Importieren
                        </button>
                        <button onClick={onAddManual} className="btn-primary gap-2">
                            <Plus size={16} /> Erstes Rezept hinzufügen
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    {/* ── Search ───────────────────────────── */}
                    <div className="space-y-3">
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A38E72] dark:text-[#6B6762] pointer-events-none" />
                            <input
                                className="input-field pl-9 pr-9"
                                placeholder="Rezepte suchen…"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A38E72] hover:text-[#1C1A16] dark:hover:text-[#F0EDE5] transition-colors"
                                >
                                    <X size={15} />
                                </button>
                            )}
                        </div>

                        {/* ── Category filter bar ───────────── */}
                        <div className="flex gap-2 flex-wrap items-center">
                            {categories.map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => toggleCategory(cat.id)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all whitespace-nowrap
                                        ${openCategory === cat.id || cat.activeCount > 0
                                            ? 'bg-forest-500 dark:bg-[#4FC475] text-white dark:text-[#071B10] border-forest-500 dark:border-[#4FC475]'
                                            : 'bg-white dark:bg-[#1C231A] text-[#6E6A60] dark:text-[#9A9690] border-clay-200 dark:border-[#2A3427] hover:border-forest-400 dark:hover:border-[#4FC475]'
                                        }`}
                                >
                                    {cat.label}
                                    {cat.activeCount > 0 && (
                                        <span className="w-4 h-4 rounded-full bg-white/30 dark:bg-black/20 text-[10px] flex items-center justify-center font-bold leading-none">
                                            {cat.activeCount}
                                        </span>
                                    )}
                                    <ChevronDown
                                        size={12}
                                        className={`transition-transform duration-200 ${openCategory === cat.id ? 'rotate-180' : ''}`}
                                    />
                                </button>
                            ))}
                            {activeFilterCount > 0 && (
                                <button
                                    onClick={clearAllFilters}
                                    className="text-xs text-[#A38E72] dark:text-[#6B6762] hover:text-[#1C1A16] dark:hover:text-[#F0EDE5] transition-colors underline self-center"
                                >
                                    Zurücksetzen
                                </button>
                            )}
                        </div>

                        {/* ── Expanded category panel ───────── */}
                        {openCategoryData && (
                            <div className="bg-white dark:bg-[#1C231A] border border-clay-200 dark:border-[#2A3427] rounded-xl p-3 flex flex-wrap gap-2">
                                {openCategoryData.options.map(opt => (
                                    <button
                                        key={opt.label}
                                        onClick={opt.onToggle}
                                        className={`tag-chip cursor-pointer transition-all ${
                                            opt.active
                                                ? 'bg-forest-500 dark:bg-[#4FC475] text-white dark:text-[#071B10] border-forest-500 dark:border-[#4FC475]'
                                                : 'hover:border-forest-400 dark:hover:border-[#4FC475] hover:text-forest-600 dark:hover:text-[#4FC475]'
                                        }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* ── No results ───────────────────────── */}
                    {filtered.length === 0 ? (
                        <div className="card p-10 flex flex-col items-center text-center">
                            <Search className="h-8 w-8 text-clay-300 dark:text-[#3A4635] mb-3" />
                            <p className="font-semibold text-[#1C1A16] dark:text-[#F0EDE5] mb-1">Keine Rezepte gefunden</p>
                            <p className="text-sm text-[#6E6A60] dark:text-[#9A9690]">Versuche andere Suchbegriffe oder Filter.</p>
                        </div>
                    ) : (
                        /* ── Recipe grid ──────────────────── */
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filtered.map((recipe, idx) => (
                                <div
                                    key={recipe.id || idx}
                                    className="card card-hover overflow-hidden animate-fade-in"
                                    style={{ animationDelay: `${idx * 0.04}s` }}
                                >
                                    <div className={`h-1 ${recipe.source === 'manual' ? 'bg-blue-400 dark:bg-blue-500' : 'bg-forest-400 dark:bg-[#4FC475]'}`} />

                                    <div className="p-5">
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
                </>
            )}
        </div>
    );
};

export default Favorites;
