
import React, { useState } from 'react';
import { Recipe } from '../types';
import { Archive, Clock, Star, Search, X, ChevronDown, Trash2, Bookmark } from 'lucide-react';

interface ArchiveProps {
    recipes: Recipe[];
    onSelectRecipe: (r: Recipe) => void;
    onRemoveFromArchive: (r: Recipe) => void;
    onRestoreToFavorites: (r: Recipe) => void;
}

const COMMON_TAGS = ['schnell', 'vegetarisch', 'vegan'];

const ArchiveView: React.FC<ArchiveProps> = ({ recipes, onSelectRecipe, onRemoveFromArchive, onRestoreToFavorites }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [calorieFilter, setCalorieFilter] = useState<string | null>(null);
    const [timeFilter, setTimeFilter] = useState<string | null>(null);
    const [sourceFilter, setSourceFilter] = useState<string | null>(null);
    const [thermomixFilter, setThermomixFilter] = useState<boolean | null>(null);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [openCategory, setOpenCategory] = useState<string | null>(null);

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
                        Archiv
                        <Archive className="h-6 w-6" style={{ color: 'var(--c-primary)' }} />
                    </h2>
                    {recipes.length > 0 && (
                        <p className="text-sm mt-1 font-medium" style={{ color: 'var(--c-text-mid)' }}>
                            {isFiltering ? `${filtered.length} von ${recipes.length}` : recipes.length} archivierte Rezepte
                        </p>
                    )}
                </div>
            </div>

            {/* ── Empty state ──────────────────────────────── */}
            {recipes.length === 0 ? (
                <div className="card p-12 flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                         style={{ background: 'var(--c-surface-low)' }}>
                        <Archive className="h-7 w-7" style={{ color: 'var(--c-text-dim)' }} />
                    </div>
                    <h3 className="text-xl font-extrabold mb-2" style={{ color: 'var(--c-text)' }}>
                        Noch keine archivierten Rezepte
                    </h3>
                    <p className="text-sm max-w-xs" style={{ color: 'var(--c-text-mid)' }}>
                        Wenn du einen Wochenplan neu generierst, werden die Rezepte des alten Plans automatisch hier gespeichert.
                    </p>
                </div>
            ) : (
                <>
                    {/* ── Search ───────────────────────────── */}
                    <div className="space-y-3">
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--c-text-dim)' }} />
                            <input
                                className="input-field pl-9 pr-9"
                                placeholder="Rezepte suchen…"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                                    style={{ color: 'var(--c-text-dim)' }}
                                >
                                    <X size={15} />
                                </button>
                            )}
                        </div>

                        {/* ── Category filter bar ───────────── */}
                        <div className="flex gap-2 flex-wrap items-center">
                            {categories.map(cat => {
                                const isActiveOrOpen = openCategory === cat.id || cat.activeCount > 0;
                                return (
                                    <button
                                        key={cat.id}
                                        onClick={() => toggleCategory(cat.id)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold border transition-all whitespace-nowrap"
                                        style={isActiveOrOpen
                                            ? { background: 'var(--c-primary)', color: 'var(--c-on-primary)', borderColor: 'var(--c-primary)' }
                                            : { background: 'var(--c-surface)', color: 'var(--c-text-mid)', borderColor: 'var(--c-border)' }
                                        }
                                    >
                                        {cat.label}
                                        {cat.activeCount > 0 && (
                                            <span className="w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold leading-none"
                                                  style={{ background: 'rgba(255,255,255,0.3)' }}>
                                                {cat.activeCount}
                                            </span>
                                        )}
                                        <ChevronDown
                                            size={12}
                                            className={`transition-transform duration-200 ${openCategory === cat.id ? 'rotate-180' : ''}`}
                                        />
                                    </button>
                                );
                            })}
                            {activeFilterCount > 0 && (
                                <button
                                    onClick={clearAllFilters}
                                    className="text-xs underline self-center transition-colors"
                                    style={{ color: 'var(--c-text-dim)' }}
                                >
                                    Zurücksetzen
                                </button>
                            )}
                        </div>

                        {/* ── Expanded category panel ───────── */}
                        {openCategoryData && (
                            <div className="rounded-2xl p-3 flex flex-wrap gap-2 border"
                                 style={{ background: 'var(--c-surface)', borderColor: 'var(--c-border)' }}>
                                {openCategoryData.options.map(opt => (
                                    <button
                                        key={opt.label}
                                        onClick={opt.onToggle}
                                        className="tag-chip cursor-pointer transition-all"
                                        style={opt.active
                                            ? { background: 'var(--c-primary)', color: 'var(--c-on-primary)', borderColor: 'var(--c-primary)' }
                                            : {}
                                        }
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
                            <Search className="h-8 w-8 mb-3" style={{ color: 'var(--c-text-faint)' }} />
                            <p className="font-bold mb-1" style={{ color: 'var(--c-text)' }}>Keine Rezepte gefunden</p>
                            <p className="text-sm" style={{ color: 'var(--c-text-mid)' }}>Versuche andere Suchbegriffe oder Filter.</p>
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
                                    <div className="h-1.5 rounded-t-xl"
                                         style={{ background: 'var(--c-text-dim)' }} />

                                    <div className="p-5">
                                        <div className="flex items-start justify-between gap-2 mb-3">
                                            <button
                                                onClick={() => onSelectRecipe(recipe)}
                                                className="flex-1 text-left"
                                            >
                                                <h3 className="font-bold leading-snug line-clamp-2 transition-colors"
                                                    style={{ color: 'var(--c-text)' }}
                                                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--c-primary)')}
                                                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--c-text)')}
                                                >
                                                    {recipe.name}
                                                </h3>
                                            </button>
                                            <div className="flex items-center gap-1 shrink-0">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); onRestoreToFavorites(recipe); }}
                                                    className="p-1.5 rounded-lg transition-colors"
                                                    style={{ color: 'var(--c-text-dim)' }}
                                                    title="Zu Favoriten hinzufügen"
                                                    onMouseEnter={e => { e.currentTarget.style.color = 'var(--c-primary)'; e.currentTarget.style.background = 'var(--c-surface-low)'; }}
                                                    onMouseLeave={e => { e.currentTarget.style.color = 'var(--c-text-dim)'; e.currentTarget.style.background = ''; }}
                                                >
                                                    <Bookmark size={15} />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); onRemoveFromArchive(recipe); }}
                                                    className="p-1.5 rounded-lg transition-colors"
                                                    style={{ color: 'var(--c-text-dim)' }}
                                                    title="Aus Archiv entfernen"
                                                    onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = 'var(--c-surface-low)'; }}
                                                    onMouseLeave={e => { e.currentTarget.style.color = 'var(--c-text-dim)'; e.currentTarget.style.background = ''; }}
                                                >
                                                    <Trash2 size={15} />
                                                </button>
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
                                            {recipe.tags.filter(t => t.toLowerCase() === 'thermomix').map(t => (
                                                <span key={t} className="tag-chip tag-chip-purple cursor-pointer">{t}</span>
                                            ))}
                                        </div>

                                        <p
                                            onClick={() => onSelectRecipe(recipe)}
                                            className="text-xs line-clamp-2 cursor-pointer"
                                            style={{ color: 'var(--c-text-dim)' }}
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

export default ArchiveView;
