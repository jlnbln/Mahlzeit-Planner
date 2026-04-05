
import React, { useState, useEffect } from 'react';
import { Recipe, Ingredient, UserProfile, AppSettings } from '../types';
import { DAYS_OF_WEEK } from '../constants';
import {
    X, Trash2, Plus, ArrowRight, Calendar, Check,
    Clock, Heart, Star, ShoppingCart, ChefHat,
    AlertTriangle, ChevronLeft, Bookmark
} from 'lucide-react';

// ─── Star Rating ──────────────────────────────────────────────────

const StarRating = ({ rating, onRate, size = 20 }: { rating: number; onRate?: (r: number) => void; size?: number }) => (
    <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map(star => (
            <button
                key={star}
                disabled={!onRate}
                onClick={() => onRate && onRate(star)}
                className={`star-btn ${!onRate ? 'cursor-default' : ''}`}
            >
                <Star
                    size={size}
                    className={star <= rating ? 'fill-amber-400 text-amber-400' : 'text-clay-200 dark:text-[#3A4635]'}
                />
            </button>
        ))}
    </div>
);

// ─── Modal Shell ──────────────────────────────────────────────────

const ModalShell = ({
    children, onClose, maxWidth = 'max-w-lg', noPad = false
}: {
    children: React.ReactNode;
    onClose: () => void;
    maxWidth?: string;
    noPad?: boolean;
}) => (
    <div className="modal-backdrop" onClick={onClose}>
        <div
            className={`modal-sheet bg-white dark:bg-[#1C231A] w-full ${maxWidth} rounded-2xl shadow-modal
                overflow-hidden flex flex-col max-h-[90dvh] sm:max-h-[88vh]
                ${noPad ? '' : ''}`}
            onClick={e => e.stopPropagation()}
        >
            {children}
        </div>
    </div>
);

const ModalHeader = ({ title, sub, onClose }: { title: string; sub?: string; onClose: () => void }) => (
    <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-4 border-b border-clay-100 dark:border-[#2A3427] shrink-0">
        <div>
            <h3 className="font-display text-xl font-bold text-[#1C1A16] dark:text-[#F0EDE5]">{title}</h3>
            {sub && <p className="text-sm text-[#6E6A60] dark:text-[#9A9690] mt-0.5">{sub}</p>}
        </div>
        <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#A38E72] hover:text-[#1C1A16] dark:hover:text-[#F0EDE5] hover:bg-clay-100 dark:hover:bg-[#232B1F] transition-colors shrink-0"
        >
            <X size={18} />
        </button>
    </div>
);


// ─── RECIPE FORM MODAL ────────────────────────────────────────────

export const RecipeFormModal = ({
    onClose, onSave, initialRecipe
}: {
    onClose: () => void;
    onSave: (r: Partial<Recipe>) => void;
    initialRecipe?: Recipe;
}) => {
    const [recipe, setRecipe] = useState<Partial<Recipe>>({
        name: '', calories: 500, cookingTime: 30, ingredients: [], instructions: [], tags: [], isFavorite: true
    });
    const [tagsString, setTagsString] = useState('');
    const [newIng, setNewIng] = useState<Ingredient>({ name: '', amount: 100, unit: 'g' });
    const [newStep, setNewStep] = useState('');

    useEffect(() => {
        if (initialRecipe) {
            setRecipe({ ...initialRecipe });
            setTagsString(initialRecipe.tags?.join(', ') || '');
        }
    }, [initialRecipe]);

    const handleSave = () => {
        if (!recipe.name) return alert("Bitte einen Namen eingeben.");
        onSave({ ...recipe, tags: tagsString.split(',').map(t => t.trim()).filter(Boolean) });
    };

    const addIngredient = () => {
        if (!newIng.name) return;
        setRecipe(r => ({ ...r, ingredients: [...(r.ingredients || []), newIng] }));
        setNewIng({ name: '', amount: 100, unit: 'g' });
    };

    const addStep = () => {
        if (!newStep) return;
        setRecipe(r => ({ ...r, instructions: [...(r.instructions || []), newStep] }));
        setNewStep('');
    };

    return (
        <ModalShell onClose={onClose} maxWidth="max-w-2xl">
            <ModalHeader
                title={initialRecipe ? 'Rezept bearbeiten' : 'Eigenes Rezept hinzufügen'}
                onClose={onClose}
            />

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
                {/* Name */}
                <div>
                    <label className="block text-sm font-medium text-[#1C1A16] dark:text-[#F0EDE5] mb-1.5">Rezeptname</label>
                    <input
                        className="input-field"
                        placeholder="z.B. Spaghetti Carbonara"
                        value={recipe.name}
                        onChange={e => setRecipe(r => ({ ...r, name: e.target.value }))}
                    />
                </div>

                {/* Kcal + Zeit + Tags */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                        <label className="block text-sm font-medium text-[#1C1A16] dark:text-[#F0EDE5] mb-1.5">Kalorien</label>
                        <input
                            type="number"
                            className="input-field"
                            value={recipe.calories}
                            onChange={e => setRecipe(r => ({ ...r, calories: parseInt(e.target.value) || 0 }))}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[#1C1A16] dark:text-[#F0EDE5] mb-1.5">Dauer (Min)</label>
                        <input
                            type="number"
                            className="input-field"
                            value={recipe.cookingTime}
                            onChange={e => setRecipe(r => ({ ...r, cookingTime: parseInt(e.target.value) || 0 }))}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[#1C1A16] dark:text-[#F0EDE5] mb-1.5">Tags</label>
                        <input
                            className="input-field"
                            placeholder="Schnell, Vegan…"
                            value={tagsString}
                            onChange={e => setTagsString(e.target.value)}
                        />
                    </div>
                </div>

                {/* Ingredients */}
                <div>
                    <label className="block text-sm font-semibold text-[#1C1A16] dark:text-[#F0EDE5] mb-2">Zutaten</label>
                    <div className="bg-clay-50 dark:bg-[#232B1F] rounded-xl border border-clay-100 dark:border-[#2A3427] p-3 space-y-2">
                        {(recipe.ingredients || []).map((ing, i) => (
                            <div key={i} className="flex items-center justify-between bg-white dark:bg-[#1C231A] rounded-lg px-3 py-2 text-sm border border-clay-100 dark:border-[#2A3427]">
                                <span className="text-[#1C1A16] dark:text-[#F0EDE5]">
                                    <span className="font-semibold">{ing.amount} {ing.unit}</span> {ing.name}
                                </span>
                                <button
                                    onClick={() => setRecipe(r => ({ ...r, ingredients: (r.ingredients || []).filter((_, idx) => idx !== i) }))}
                                    className="text-red-400 hover:text-red-600 ml-2"
                                >
                                    <Trash2 size={13} />
                                </button>
                            </div>
                        ))}
                        <div className="flex gap-2 pt-1">
                            <input
                                type="number"
                                className="input-field w-20 text-sm py-2"
                                placeholder="100"
                                value={newIng.amount}
                                onChange={e => setNewIng(p => ({ ...p, amount: parseFloat(e.target.value) }))}
                            />
                            <input
                                className="input-field w-20 text-sm py-2"
                                placeholder="g"
                                value={newIng.unit}
                                onChange={e => setNewIng(p => ({ ...p, unit: e.target.value }))}
                            />
                            <input
                                className="input-field flex-1 text-sm py-2"
                                placeholder="Zutat"
                                value={newIng.name}
                                onChange={e => setNewIng(p => ({ ...p, name: e.target.value }))}
                                onKeyDown={e => e.key === 'Enter' && addIngredient()}
                            />
                            <button onClick={addIngredient} className="btn-primary py-2 px-3">
                                <Plus size={16} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Instructions */}
                <div>
                    <label className="block text-sm font-semibold text-[#1C1A16] dark:text-[#F0EDE5] mb-2">Zubereitungsschritte</label>
                    <div className="bg-clay-50 dark:bg-[#232B1F] rounded-xl border border-clay-100 dark:border-[#2A3427] p-3 space-y-2">
                        {(recipe.instructions || []).map((step, i) => (
                            <div key={i} className="flex items-start gap-2.5 bg-white dark:bg-[#1C231A] rounded-lg px-3 py-2 text-sm border border-clay-100 dark:border-[#2A3427] group">
                                <span className="shrink-0 w-5 h-5 rounded-full bg-forest-500 dark:bg-[#4FC475] text-white dark:text-[#071B10] flex items-center justify-center text-[10px] font-bold mt-0.5">{i+1}</span>
                                <p className="flex-1 text-[#1C1A16] dark:text-[#F0EDE5] leading-snug">{step}</p>
                                <button
                                    onClick={() => setRecipe(r => ({ ...r, instructions: (r.instructions || []).filter((_, idx) => idx !== i) }))}
                                    className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Trash2 size={13} />
                                </button>
                            </div>
                        ))}
                        <div className="flex gap-2 pt-1">
                            <textarea
                                className="input-field flex-1 text-sm py-2 resize-none"
                                rows={2}
                                placeholder="Schritt beschreiben…"
                                value={newStep}
                                onChange={e => setNewStep(e.target.value)}
                            />
                            <button onClick={addStep} className="btn-primary py-2 px-3 self-end">
                                <Plus size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-3 px-5 py-4 border-t border-clay-100 dark:border-[#2A3427] shrink-0">
                <button onClick={onClose} className="btn-ghost">Abbrechen</button>
                <button onClick={handleSave} className="btn-primary">
                    {initialRecipe ? 'Änderungen speichern' : 'Rezept speichern'}
                </button>
            </div>
        </ModalShell>
    );
};


// ─── GENERATION MODAL ─────────────────────────────────────────────

export const GenerationModal = ({
    onClose, users, onConfirm, initialDate, settings
}: {
    onClose: () => void;
    users: UserProfile[];
    onConfirm: (date: Date, attendance: any) => void;
    initialDate?: Date;
    settings: AppSettings;
}) => {
    const getNextStartDay = () => {
        const d = new Date();
        const startDayIndex = DAYS_OF_WEEK.indexOf(settings.weekStartDay);
        const currentOurDay = (d.getDay() + 6) % 7;
        let daysToAdd = (startDayIndex - currentOurDay + 7) % 7;
        if (daysToAdd === 0) daysToAdd = 7;
        d.setDate(d.getDate() + daysToAdd);
        d.setHours(0,0,0,0);
        return d;
    };

    const [step, setStep] = useState<1 | 2>(1);
    const [targetDate, setTargetDate] = useState<Date>(initialDate || getNextStartDay());
    const [attendance, setAttendance] = useState<Record<string, any>>(() => {
        const init: any = {};
        users.forEach(u => init[u.id] = { ...u.homeTimes });
        return init;
    });

    const displayDays: string[] = [];
    let sIdx = DAYS_OF_WEEK.indexOf(settings.weekStartDay);
    if (sIdx === -1) sIdx = 0;
    for (let i = 0; i < 7; i++) {
        const d = DAYS_OF_WEEK[(sIdx + i) % 7];
        if (!settings.includeWeekends && (d === 'Samstag' || d === 'Sonntag')) continue;
        displayDays.push(d);
    }

    const toggleAtt = (userId: string, key: string) =>
        setAttendance(prev => ({ ...prev, [userId]: { ...prev[userId], [key]: !prev[userId][key] } }));

    return (
        <ModalShell onClose={onClose} maxWidth="max-w-2xl">
            <ModalHeader
                title="Wochenplan erstellen"
                sub={step === 1 ? 'Schritt 1 von 2: Zeitraum wählen' : 'Schritt 2 von 2: Anwesenheit prüfen'}
                onClose={onClose}
            />

            {/* Step 1 */}
            {step === 1 && (
                <div className="p-5 space-y-5 animate-fade-in">
                    <div>
                        <label className="block text-sm font-medium text-[#1C1A16] dark:text-[#F0EDE5] mb-2">
                            Startdatum ({settings.weekStartDay})
                        </label>
                        <input
                            type="date"
                            className="input-field text-base"
                            value={targetDate.toISOString().split('T')[0]}
                            onChange={e => {
                                const d = new Date(e.target.value);
                                if (!isNaN(d.getTime())) setTargetDate(d);
                            }}
                        />
                    </div>

                    <div className="flex items-center gap-2.5 p-3.5 bg-forest-50 dark:bg-[rgba(79,196,117,0.08)] rounded-xl border border-forest-100 dark:border-[rgba(79,196,117,0.2)]">
                        <Calendar size={16} className="text-forest-500 dark:text-[#4FC475] shrink-0" />
                        <p className="text-sm text-forest-700 dark:text-[#4FC475] font-medium">
                            Woche vom {targetDate.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                        </p>
                    </div>

                    <button
                        onClick={() => setStep(2)}
                        className="btn-primary w-full gap-2 py-3.5 text-base"
                    >
                        Weiter <ArrowRight size={18} />
                    </button>
                </div>
            )}

            {/* Step 2 */}
            {step === 2 && (
                <div className="flex flex-col overflow-hidden animate-fade-in">
                    <div className="flex-1 overflow-auto p-5">
                        <p className="text-sm text-[#6E6A60] dark:text-[#9A9690] mb-3">
                            Wer isst wann mit? (3 Kästchen pro Tag = F, M, A)
                        </p>
                        <div className="border border-clay-200 dark:border-[#2A3427] rounded-xl overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-clay-50 dark:bg-[#232B1F]">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-[#6E6A60] dark:text-[#9A9690] uppercase tracking-wide">
                                            Person
                                        </th>
                                        {displayDays.map(d => (
                                            <th key={d} className="px-2 py-3 text-center text-xs font-semibold text-[#6E6A60] dark:text-[#9A9690] uppercase tracking-wide">
                                                {d.substring(0,2)}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-clay-50 dark:divide-[#2A3427]">
                                    {users.map(u => (
                                        <tr key={u.id} className="hover:bg-clay-50 dark:hover:bg-[#232B1F] transition-colors">
                                            <td className="px-4 py-3 font-medium text-[#1C1A16] dark:text-[#F0EDE5]">{u.name}</td>
                                            {displayDays.map(d => (
                                                <td key={d} className="px-2 py-3">
                                                    <div className="flex flex-col gap-1 items-center">
                                                        {['Frühstück', 'Mittagessen', 'Abendessen'].map(type => {
                                                            const key = `${d}_${type}`;
                                                            const isOn = attendance[u.id]?.[key] || false;
                                                            return (
                                                                <button
                                                                    key={key}
                                                                    onClick={() => toggleAtt(u.id, key)}
                                                                    className={`w-4 h-4 rounded transition-all duration-150
                                                                        ${isOn
                                                                            ? 'bg-forest-500 dark:bg-[#4FC475]'
                                                                            : 'bg-clay-200 dark:bg-[#2A3427] hover:bg-clay-300'
                                                                        }`}
                                                                    title={`${d} ${type}`}
                                                                />
                                                            );
                                                        })}
                                                    </div>
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="flex items-center justify-between px-5 py-4 border-t border-clay-100 dark:border-[#2A3427] shrink-0">
                        <button onClick={() => setStep(1)} className="btn-ghost gap-1.5">
                            <ChevronLeft size={16} /> Zurück
                        </button>
                        <button onClick={() => onConfirm(targetDate, attendance)} className="btn-primary gap-2">
                            Plan generieren <ArrowRight size={16} />
                        </button>
                    </div>
                </div>
            )}
        </ModalShell>
    );
};


// ─── REPLACEMENT MODAL ────────────────────────────────────────────

export const ReplacementModal = ({
    candidates, targetName, onSelect, onClose
}: {
    candidates: Recipe[];
    targetName: string;
    onSelect: (r: Recipe) => void;
    onClose: () => void;
}) => (
    <ModalShell onClose={onClose} maxWidth="max-w-3xl">
        <ModalHeader title="Alternative wählen" sub={`Ersetzt: ${targetName}`} onClose={onClose} />

        <div className="flex-1 overflow-y-auto p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {candidates.map((recipe, idx) => (
                    <button
                        key={idx}
                        onClick={() => onSelect(recipe)}
                        className="text-left p-4 rounded-xl border border-clay-200 dark:border-[#2A3427] hover:border-forest-400 dark:hover:border-[#4FC475] hover:bg-forest-50 dark:hover:bg-[rgba(79,196,117,0.06)] transition-all group"
                    >
                        <div className="flex items-start justify-between gap-2 mb-2">
                            <h4 className="font-semibold text-[#1C1A16] dark:text-[#F0EDE5] leading-snug group-hover:text-forest-700 dark:group-hover:text-[#4FC475] transition-colors">
                                {recipe.name}
                            </h4>
                            <div className="shrink-0 w-6 h-6 rounded-full bg-forest-50 dark:bg-[rgba(79,196,117,0.12)] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                                <Check size={12} className="text-forest-500 dark:text-[#4FC475]" />
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mb-2">
                            <span className="tag-chip">{recipe.calories} kcal</span>
                            <span className="tag-chip"><Clock size={11} className="mr-0.5" />{recipe.cookingTime || 30}m</span>
                            {recipe.tags.slice(0,2).map(t => (
                                <span key={t} className={`tag-chip ${t.toLowerCase() === 'thermomix' ? 'tag-chip-purple' : ''}`}>{t}</span>
                            ))}
                        </div>
                        <p className="text-xs text-[#A38E72] dark:text-[#6B6762] line-clamp-2">
                            {recipe.ingredients.map(i => i.name).join(', ')}
                        </p>
                    </button>
                ))}
            </div>
        </div>

        <div className="px-5 py-4 border-t border-clay-100 dark:border-[#2A3427] shrink-0">
            <button onClick={onClose} className="btn-ghost w-full">Abbrechen</button>
        </div>
    </ModalShell>
);


// ─── FAVORITE PICKER MODAL ────────────────────────────────────────

export const FavoritePickerModal = ({
    favorites, targetName, onSelect, onClose
}: {
    favorites: Recipe[];
    targetName: string;
    onSelect: (r: Recipe) => void;
    onClose: () => void;
}) => (
    <ModalShell onClose={onClose} maxWidth="max-w-4xl">
        <ModalHeader title="Favorit wählen" sub={`Ersetze: ${targetName}`} onClose={onClose} />

        <div className="flex-1 overflow-y-auto p-5">
            {favorites.length === 0 ? (
                <div className="py-12 flex flex-col items-center text-center">
                    <Heart className="h-10 w-10 text-clay-200 dark:text-[#2A3427] mb-3" />
                    <p className="text-[#6E6A60] dark:text-[#9A9690]">Keine Favoriten vorhanden.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {favorites.map((recipe, idx) => (
                        <button
                            key={idx}
                            onClick={() => onSelect(recipe)}
                            className="text-left p-4 rounded-xl border border-clay-200 dark:border-[#2A3427] hover:border-forest-400 dark:hover:border-[#4FC475] hover:bg-forest-50 dark:hover:bg-[rgba(79,196,117,0.06)] transition-all group"
                        >
                            <div className="flex items-start justify-between gap-1 mb-2">
                                <h4 className="font-semibold text-sm text-[#1C1A16] dark:text-[#F0EDE5] line-clamp-2 leading-snug group-hover:text-forest-700 dark:group-hover:text-[#4FC475] transition-colors">
                                    {recipe.name}
                                </h4>
                                <Heart className="shrink-0 h-3.5 w-3.5 fill-red-400 text-red-400 mt-0.5" />
                            </div>
                            <div className="flex flex-wrap gap-1 mb-2">
                                <span className="tag-chip text-[10px] py-0.5">{recipe.calories} kcal</span>
                                <span className="tag-chip text-[10px] py-0.5"><Clock size={9} className="mr-0.5" />{recipe.cookingTime || 30}m</span>
                                {recipe.source === 'manual' && <span className="tag-chip tag-chip-blue text-[10px] py-0.5">Eigenes</span>}
                                {recipe.tags.filter(t => t.toLowerCase() === 'thermomix').map(t => (
                                    <span key={t} className="tag-chip tag-chip-purple text-[10px] py-0.5">{t}</span>
                                ))}
                            </div>
                            <p className="text-[11px] text-[#A38E72] dark:text-[#6B6762] line-clamp-2">
                                {recipe.ingredients.map(i => i.name).join(', ')}
                            </p>
                        </button>
                    ))}
                </div>
            )}
        </div>
    </ModalShell>
);


// ─── RECIPE DETAIL MODAL ──────────────────────────────────────────

export const RecipeDetailModal = ({
    recipe, onClose, onUpdate
}: {
    recipe: Recipe;
    onClose: () => void;
    onUpdate: (p: Partial<Recipe>) => void;
}) => (
    <ModalShell onClose={onClose} maxWidth="max-w-lg">
        <div className="flex items-center justify-between px-5 pt-5 pb-0 shrink-0">
            <span className="text-[10px] font-bold text-forest-500 dark:text-[#4FC475] uppercase tracking-widest">
                Rezept
            </span>
            <div className="flex items-center gap-1">
                <button
                    onClick={() => onUpdate({ isFavorite: !recipe.isFavorite })}
                    className={`p-2 rounded-xl transition-all ${recipe.isFavorite ? 'text-red-500 bg-red-50 dark:bg-red-900/20' : 'text-clay-300 dark:text-[#3A4635] hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10'}`}
                >
                    <Heart size={20} className={recipe.isFavorite ? 'fill-red-500' : ''} />
                </button>
                <button
                    onClick={onClose}
                    className="p-2 rounded-xl text-[#A38E72] hover:text-[#1C1A16] dark:hover:text-[#F0EDE5] hover:bg-clay-100 dark:hover:bg-[#232B1F] transition-colors"
                >
                    <X size={18} />
                </button>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pt-2 pb-5 space-y-5">
            {/* Title */}
            <h2 className="font-display text-2xl font-bold text-[#1C1A16] dark:text-[#F0EDE5] leading-tight">
                {recipe.name}
            </h2>

            {/* Stats row */}
            <div className="flex items-center gap-4 py-3 border-y border-clay-100 dark:border-[#2A3427]">
                <div>
                    <p className="text-[10px] font-bold text-[#A38E72] dark:text-[#6B6762] uppercase tracking-wide mb-1">Bewertung</p>
                    <StarRating rating={recipe.rating || 0} onRate={r => onUpdate({ rating: r })} size={18} />
                </div>
                <div className="w-px h-8 bg-clay-100 dark:bg-[#2A3427]" />
                <div>
                    <p className="text-[10px] font-bold text-[#A38E72] dark:text-[#6B6762] uppercase tracking-wide mb-1">Kalorien</p>
                    <p className="font-bold text-[#1C1A16] dark:text-[#F0EDE5]">{recipe.calories} kcal</p>
                </div>
                <div className="w-px h-8 bg-clay-100 dark:bg-[#2A3427]" />
                <div>
                    <p className="text-[10px] font-bold text-[#A38E72] dark:text-[#6B6762] uppercase tracking-wide mb-1">Dauer</p>
                    <p className="font-bold text-[#1C1A16] dark:text-[#F0EDE5] flex items-center gap-1">
                        <Clock size={13} />{recipe.cookingTime || 30}m
                    </p>
                </div>
            </div>

            {/* Tags */}
            {recipe.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {recipe.tags.map(tag => (
                        <span
                            key={tag}
                            className={`tag-chip ${tag.toLowerCase() === 'thermomix' ? 'tag-chip-purple' : ''}`}
                        >
                            {tag}
                        </span>
                    ))}
                </div>
            )}

            {/* Ingredients */}
            <div>
                <h3 className="text-sm font-semibold text-[#1C1A16] dark:text-[#F0EDE5] mb-2.5 flex items-center gap-2">
                    <ShoppingCart size={15} className="text-forest-500 dark:text-[#4FC475]" /> Zutaten
                </h3>
                <div className="grid grid-cols-2 gap-2">
                    {recipe.ingredients.map((ing, i) => (
                        <div key={i} className="text-sm bg-clay-50 dark:bg-[#232B1F] p-2.5 rounded-lg border border-clay-100 dark:border-[#2A3427]">
                            <span className="font-bold text-[#1C1A16] dark:text-[#F0EDE5]">{ing.amount} {ing.unit}</span>
                            <span className="text-[#6E6A60] dark:text-[#9A9690]"> {ing.name}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Instructions */}
            <div>
                <h3 className="text-sm font-semibold text-[#1C1A16] dark:text-[#F0EDE5] mb-2.5 flex items-center gap-2">
                    <ChefHat size={15} className="text-forest-500 dark:text-[#4FC475]" /> Zubereitung
                </h3>
                <ol className="space-y-3">
                    {recipe.instructions.map((step, i) => (
                        <li key={i} className="flex gap-3 text-sm text-[#1C1A16] dark:text-[#F0EDE5]">
                            <span className="shrink-0 w-6 h-6 rounded-full bg-forest-500 dark:bg-[#4FC475] text-white dark:text-[#071B10] flex items-center justify-center text-[11px] font-bold mt-0.5">
                                {i + 1}
                            </span>
                            <p className="leading-relaxed text-[#1C1A16] dark:text-[#F0EDE5]">{step}</p>
                        </li>
                    ))}
                </ol>
            </div>
        </div>
    </ModalShell>
);


// ─── RESET CONFIRM MODAL ──────────────────────────────────────────

export const ResetConfirmModal = ({
    onConfirm, onCancel
}: {
    onConfirm: () => void;
    onCancel: () => void;
}) => (
    <ModalShell onClose={onCancel} maxWidth="max-w-sm">
        <div className="p-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="h-7 w-7 text-red-500" />
            </div>
            <h3 className="font-display text-xl font-bold text-[#1C1A16] dark:text-[#F0EDE5] mb-2">
                Bist du sicher?
            </h3>
            <p className="text-sm text-[#6E6A60] dark:text-[#9A9690] mb-6 leading-relaxed">
                Diese Aktion löscht alle Daten unwiderruflich und setzt alles auf die Standardwerte zurück.
            </p>
            <div className="flex gap-3">
                <button onClick={onCancel} className="btn-ghost flex-1">Abbrechen</button>
                <button
                    onClick={onConfirm}
                    className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-colors"
                >
                    Löschen
                </button>
            </div>
        </div>
    </ModalShell>
);
