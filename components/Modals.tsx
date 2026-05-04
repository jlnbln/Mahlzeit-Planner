
import React, { useState, useEffect } from 'react';
import { Recipe, Ingredient, UserProfile, AppSettings } from '../types';
import { DAYS_OF_WEEK } from '../constants';
import {
    X, Trash2, Plus, ArrowRight, Calendar, Check,
    Clock, Heart, Star, ShoppingCart, ChefHat,
    AlertTriangle, ChevronLeft, Bookmark, Upload,
    Link, FileText, Image, Loader2, Coffee, Sun, Moon, Sparkles, Package
} from 'lucide-react';
import { importRecipeFromSource } from '../services/aiService';

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
                    className={star <= rating ? 'fill-amber-400 text-amber-400' : 'text-[#c4c8be] dark:text-[#3a4835]'}
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
            className={`modal-sheet bg-white dark:bg-[#1e2a1e] w-full ${maxWidth} rounded-2xl shadow-modal
                overflow-hidden flex flex-col max-h-[90dvh] sm:max-h-[88vh]
                ${noPad ? '' : ''}`}
            onClick={e => e.stopPropagation()}
        >
            {children}
        </div>
    </div>
);

const ModalHeader = ({ title, sub, onClose }: { title: string; sub?: string; onClose: () => void }) => (
    <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-4 border-b border-[#e6e9e1] dark:border-[#2c3a2c] shrink-0">
        <div>
            <h3 className="font-sans text-xl font-bold text-[#2c302b] dark:text-[#e6ede6]">{title}</h3>
            {sub && <p className="text-sm text-[#595c57] dark:text-[#8a9089] mt-0.5">{sub}</p>}
        </div>
        <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#959b8e] hover:text-[#2c302b] dark:hover:text-[#F0EDE5] hover:bg-[#eff2ea] dark:hover:bg-[#232B1F] transition-colors shrink-0"
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
                    <label className="block text-sm font-medium text-[#2c302b] dark:text-[#e6ede6] mb-1.5">Rezeptname</label>
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
                        <label className="block text-sm font-medium text-[#2c302b] dark:text-[#e6ede6] mb-1.5">Kalorien</label>
                        <input
                            type="number"
                            className="input-field"
                            value={recipe.calories}
                            onChange={e => setRecipe(r => ({ ...r, calories: parseInt(e.target.value) || 0 }))}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[#2c302b] dark:text-[#e6ede6] mb-1.5">Dauer (Min)</label>
                        <input
                            type="number"
                            className="input-field"
                            value={recipe.cookingTime}
                            onChange={e => setRecipe(r => ({ ...r, cookingTime: parseInt(e.target.value) || 0 }))}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[#2c302b] dark:text-[#e6ede6] mb-1.5">Tags</label>
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
                    <label className="block text-sm font-semibold text-[#2c302b] dark:text-[#e6ede6] mb-2">Zutaten</label>
                    <div className="bg-[#f5f7f0] dark:bg-[#1e2a1e] rounded-xl border border-[#e6e9e1] dark:border-[#2c3a2c] p-3 space-y-2">
                        {(recipe.ingredients || []).map((ing, i) => (
                            <div key={i} className="flex items-center justify-between bg-white dark:bg-[#1e2a1e] rounded-lg px-3 py-2 text-sm border border-[#e6e9e1] dark:border-[#2c3a2c]">
                                <span className="text-[#2c302b] dark:text-[#e6ede6]">
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
                    <label className="block text-sm font-semibold text-[#2c302b] dark:text-[#e6ede6] mb-2">Zubereitungsschritte</label>
                    <div className="bg-[#f5f7f0] dark:bg-[#1e2a1e] rounded-xl border border-[#e6e9e1] dark:border-[#2c3a2c] p-3 space-y-2">
                        {(recipe.instructions || []).map((step, i) => (
                            <div key={i} className="flex items-start gap-2.5 bg-white dark:bg-[#1e2a1e] rounded-lg px-3 py-2 text-sm border border-[#e6e9e1] dark:border-[#2c3a2c] group">
                                <span className="shrink-0 w-5 h-5 rounded-full bg-[#426500] dark:bg-[#b8fd4b] text-white dark:text-[#3d5e00] flex items-center justify-center text-[10px] font-bold mt-0.5">{i+1}</span>
                                <p className="flex-1 text-[#2c302b] dark:text-[#e6ede6] leading-snug">{step}</p>
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

            <div className="flex justify-end gap-3 px-5 py-4 border-t border-[#e6e9e1] dark:border-[#2c3a2c] shrink-0">
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
                        <label className="block text-sm font-medium text-[#2c302b] dark:text-[#e6ede6] mb-2">
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

                    <div className="flex items-center gap-2.5 p-3.5 bg-[#eff2ea] dark:bg-[rgba(66,101,0,0.08)] rounded-xl border border-[#eff2ea] dark:border-[rgba(184,253,75,0.2)]">
                        <Calendar size={16} className="text-[#426500] dark:text-[#b8fd4b] shrink-0" />
                        <p className="text-sm text-[#395800] dark:text-[#b8fd4b] font-medium">
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
                        <p className="text-sm text-[#595c57] dark:text-[#8a9089] mb-3">
                            Wer isst wann mit? (3 Kästchen pro Tag = F, M, A)
                        </p>
                        <div className="border border-[#c4c8be] dark:border-[#2c3a2c] rounded-xl overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-[#f5f7f0] dark:bg-[#1e2a1e]">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-[#595c57] dark:text-[#8a9089] uppercase tracking-wide">
                                            Person
                                        </th>
                                        {displayDays.map(d => (
                                            <th key={d} className="px-2 py-3 text-center text-xs font-semibold text-[#595c57] dark:text-[#8a9089] uppercase tracking-wide">
                                                {d.substring(0,2)}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#f5f7f0] dark:divide-[#2A3427]">
                                    {users.map(u => (
                                        <tr key={u.id} className="hover:bg-[#f5f7f0] dark:hover:bg-[#232B1F] transition-colors">
                                            <td className="px-4 py-3 font-medium text-[#2c302b] dark:text-[#e6ede6]">{u.name}</td>
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
                                                                            ? 'bg-[#426500] dark:bg-[#b8fd4b]'
                                                                            : 'bg-[#e6e9e1] dark:bg-[#2c3a2c] hover:bg-[#d1d6cd]'
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

                    <div className="flex items-center justify-between px-5 py-4 border-t border-[#e6e9e1] dark:border-[#2c3a2c] shrink-0">
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

const ADD_MEAL_TYPES = ['Frühstück', 'Mittagessen', 'Abendessen', 'Reste'];

export const ReplacementModal = ({
    candidates, targetName, onSelect, onClose,
    isAddMode, planDays, initialDayName, onAdd
}: {
    candidates: Recipe[];
    targetName: string;
    onSelect: (r: Recipe) => void;
    onClose: () => void;
    isAddMode?: boolean;
    planDays?: string[];
    initialDayName?: string;
    onAdd?: (recipe: Recipe, dayName: string, mealType: string) => void;
}) => {
    const [targetDay, setTargetDay] = useState(initialDayName || planDays?.[0] || '');
    const [targetMealType, setTargetMealType] = useState(targetName || 'Abendessen');
    const [addedSet, setAddedSet] = useState<Set<string>>(new Set());

    const handleAdd = (recipe: Recipe) => {
        if (onAdd) {
            onAdd(recipe, targetDay, targetMealType);
            setAddedSet(prev => new Set(prev).add(recipe.name));
        }
    };

    if (isAddMode) {
        return (
            <ModalShell onClose={onClose} maxWidth="max-w-3xl">
                <ModalHeader title="Mahlzeiten hinzufügen" sub="Wähle Rezepte und weise sie Tagen zu" onClose={onClose} />

                {/* Day + meal type selector */}
                <div className="px-5 pt-4 pb-3 border-b border-[#e6e9e1] dark:border-[#2c3a2c] space-y-3">
                    <div>
                        <p className="text-xs font-semibold text-[#959b8e] dark:text-[#6a7069] uppercase tracking-wide mb-1.5">Tag</p>
                        <div className="flex gap-1.5 flex-wrap">
                            {(planDays || []).map(day => (
                                <button
                                    key={day}
                                    onClick={() => setTargetDay(day)}
                                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-all
                                        ${targetDay === day
                                            ? 'bg-[#426500] dark:bg-[#b8fd4b] text-white dark:text-[#3d5e00] border-[#426500] dark:border-[#b8fd4b]'
                                            : 'bg-white dark:bg-[#1e2a1e] text-[#595c57] dark:text-[#8a9089] border-[#c4c8be] dark:border-[#2c3a2c] hover:border-[#b8fd4b]'
                                        }`}
                                >
                                    {day}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-[#959b8e] dark:text-[#6a7069] uppercase tracking-wide mb-1.5">Mahlzeit</p>
                        <div className="flex gap-1.5 flex-wrap">
                            {ADD_MEAL_TYPES.map(mt => (
                                <button
                                    key={mt}
                                    onClick={() => setTargetMealType(mt)}
                                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-all
                                        ${targetMealType === mt
                                            ? 'bg-[#426500] dark:bg-[#b8fd4b] text-white dark:text-[#3d5e00] border-[#426500] dark:border-[#b8fd4b]'
                                            : 'bg-white dark:bg-[#1e2a1e] text-[#595c57] dark:text-[#8a9089] border-[#c4c8be] dark:border-[#2c3a2c] hover:border-[#b8fd4b]'
                                        }`}
                                >
                                    {mt}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {candidates.map((recipe, idx) => {
                            const isAdded = addedSet.has(recipe.name);
                            return (
                                <div
                                    key={idx}
                                    className={`relative p-4 rounded-xl border transition-all
                                        ${isAdded
                                            ? 'border-[#b8fd4b] dark:border-[#b8fd4b] bg-[#eff2ea] dark:bg-[rgba(66,101,0,0.06)]'
                                            : 'border-[#c4c8be] dark:border-[#2c3a2c]'
                                        }`}
                                >
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                        <h4 className="font-semibold text-[#2c302b] dark:text-[#e6ede6] leading-snug flex-1">
                                            {recipe.name}
                                        </h4>
                                        {isAdded ? (
                                            <span className="shrink-0 flex items-center gap-1 text-xs font-semibold text-[#395800] dark:text-[#b8fd4b]">
                                                <Check size={13} /> Hinzugefügt
                                            </span>
                                        ) : (
                                            <button
                                                onClick={() => handleAdd(recipe)}
                                                disabled={!targetDay}
                                                className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#426500] dark:bg-[#b8fd4b] text-white dark:text-[#3d5e00] text-xs font-semibold hover:bg-[#395800] dark:hover:bg-[#3AB560] transition-colors disabled:opacity-40"
                                            >
                                                <Plus size={12} /> Hinzufügen
                                            </button>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap gap-1.5 mb-2">
                                        <span className="tag-chip">{recipe.calories} kcal</span>
                                        <span className="tag-chip"><Clock size={11} className="mr-0.5" />{recipe.cookingTime || 30}m</span>
                                        {recipe.tags.slice(0,2).map(t => (
                                            <span key={t} className={`tag-chip ${t.toLowerCase() === 'thermomix' ? 'tag-chip-purple' : ''}`}>{t}</span>
                                        ))}
                                    </div>
                                    <p className="text-xs text-[#959b8e] dark:text-[#6a7069] line-clamp-2">
                                        {recipe.ingredients.map(i => i.name).join(', ')}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="px-5 py-4 border-t border-[#e6e9e1] dark:border-[#2c3a2c] shrink-0">
                    <button onClick={onClose} className="btn-primary w-full">Fertig</button>
                </div>
            </ModalShell>
        );
    }

    return (
        <ModalShell onClose={onClose} maxWidth="max-w-3xl">
            <ModalHeader title="Alternative wählen" sub={`Ersetzt: ${targetName}`} onClose={onClose} />

            <div className="flex-1 overflow-y-auto p-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {candidates.map((recipe, idx) => (
                        <button
                            key={idx}
                            onClick={() => onSelect(recipe)}
                            className="text-left p-4 rounded-xl border border-[#c4c8be] dark:border-[#2c3a2c] hover:border-[#b8fd4b] dark:hover:border-[#4FC475] hover:bg-[#eff2ea] dark:hover:bg-[rgba(79,196,117,0.06)] transition-all group"
                        >
                            <div className="flex items-start justify-between gap-2 mb-2">
                                <h4 className="font-semibold text-[#2c302b] dark:text-[#e6ede6] leading-snug group-hover:text-[#395800] dark:group-hover:text-[#4FC475] transition-colors">
                                    {recipe.name}
                                </h4>
                                <div className="shrink-0 w-6 h-6 rounded-full bg-[#eff2ea] dark:bg-[rgba(66,101,0,0.12)] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                                    <Check size={12} className="text-[#426500] dark:text-[#b8fd4b]" />
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-1.5 mb-2">
                                <span className="tag-chip">{recipe.calories} kcal</span>
                                <span className="tag-chip"><Clock size={11} className="mr-0.5" />{recipe.cookingTime || 30}m</span>
                                {recipe.tags.slice(0,2).map(t => (
                                    <span key={t} className={`tag-chip ${t.toLowerCase() === 'thermomix' ? 'tag-chip-purple' : ''}`}>{t}</span>
                                ))}
                            </div>
                            <p className="text-xs text-[#959b8e] dark:text-[#6a7069] line-clamp-2">
                                {recipe.ingredients.map(i => i.name).join(', ')}
                            </p>
                        </button>
                    ))}
                </div>
            </div>

            <div className="px-5 py-4 border-t border-[#e6e9e1] dark:border-[#2c3a2c] shrink-0">
                <button onClick={onClose} className="btn-ghost w-full">Abbrechen</button>
            </div>
        </ModalShell>
    );
};


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
                    <Heart className="h-10 w-10 text-[#c4c8be] dark:text-[#2A3427] mb-3" />
                    <p className="text-[#595c57] dark:text-[#8a9089]">Keine Favoriten vorhanden.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {favorites.map((recipe, idx) => (
                        <button
                            key={idx}
                            onClick={() => onSelect(recipe)}
                            className="text-left p-4 rounded-xl border border-[#c4c8be] dark:border-[#2c3a2c] hover:border-[#b8fd4b] dark:hover:border-[#4FC475] hover:bg-[#eff2ea] dark:hover:bg-[rgba(79,196,117,0.06)] transition-all group"
                        >
                            <div className="flex items-start justify-between gap-1 mb-2">
                                <h4 className="font-semibold text-sm text-[#2c302b] dark:text-[#e6ede6] line-clamp-2 leading-snug group-hover:text-[#395800] dark:group-hover:text-[#4FC475] transition-colors">
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
                            <p className="text-[11px] text-[#959b8e] dark:text-[#6a7069] line-clamp-2">
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
    <ModalShell onClose={onClose} maxWidth="max-w-4xl">
        <div className="flex items-center justify-between px-5 pt-5 pb-0 shrink-0">
            <span className="text-[10px] font-bold text-[#426500] dark:text-[#b8fd4b] uppercase tracking-widest">
                Rezept
            </span>
            <div className="flex items-center gap-1">
                <button
                    onClick={() => onUpdate({ isFavorite: !recipe.isFavorite })}
                    className={`p-2 rounded-xl transition-all ${recipe.isFavorite ? 'text-red-500 bg-red-50 dark:bg-red-900/20' : 'text-[#c4c8be] dark:text-[#3a4835] hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10'}`}
                >
                    <Heart size={20} className={recipe.isFavorite ? 'fill-red-500' : ''} />
                </button>
                <button
                    onClick={onClose}
                    className="p-2 rounded-xl text-[#959b8e] hover:text-[#2c302b] dark:hover:text-[#F0EDE5] hover:bg-[#eff2ea] dark:hover:bg-[#232B1F] transition-colors"
                >
                    <X size={18} />
                </button>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pt-2 pb-5">
            <div className="sm:flex sm:gap-6">
                {/* Left column: meta + ingredients */}
                <div className="sm:w-1/2 space-y-5">
                    {/* Title */}
                    <h2 className="font-sans text-2xl font-bold text-[#2c302b] dark:text-[#e6ede6] leading-tight">
                        {recipe.name}
                    </h2>

                    {/* Stats row */}
                    <div className="flex items-center gap-4 py-3 border-y border-[#e6e9e1] dark:border-[#2c3a2c]">
                        <div>
                            <p className="text-[10px] font-bold text-[#959b8e] dark:text-[#6a7069] uppercase tracking-wide mb-1">Bewertung</p>
                            <StarRating rating={recipe.rating || 0} onRate={r => onUpdate({ rating: r })} size={18} />
                        </div>
                        <div className="w-px h-8 bg-[#eff2ea] dark:bg-[#2c3a2c]" />
                        <div>
                            <p className="text-[10px] font-bold text-[#959b8e] dark:text-[#6a7069] uppercase tracking-wide mb-1">Kalorien</p>
                            <p className="font-bold text-[#2c302b] dark:text-[#e6ede6]">{recipe.calories} kcal</p>
                        </div>
                        <div className="w-px h-8 bg-[#eff2ea] dark:bg-[#2c3a2c]" />
                        <div>
                            <p className="text-[10px] font-bold text-[#959b8e] dark:text-[#6a7069] uppercase tracking-wide mb-1">Dauer</p>
                            <p className="font-bold text-[#2c302b] dark:text-[#e6ede6] flex items-center gap-1">
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
                        <h3 className="text-sm font-semibold text-[#2c302b] dark:text-[#e6ede6] mb-2.5 flex items-center gap-2">
                            <ShoppingCart size={15} className="text-[#426500] dark:text-[#b8fd4b]" /> Zutaten
                        </h3>
                        <div className="grid grid-cols-2 gap-2">
                            {recipe.ingredients.map((ing, i) => (
                                <div key={i} className="text-sm bg-[#f5f7f0] dark:bg-[#1e2a1e] p-2.5 rounded-lg border border-[#e6e9e1] dark:border-[#2c3a2c]">
                                    <span className="font-bold text-[#2c302b] dark:text-[#e6ede6]">{ing.amount} {ing.unit}</span>
                                    <span className="text-[#595c57] dark:text-[#8a9089]"> {ing.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right column: instructions */}
                <div className="sm:w-1/2 mt-5 sm:mt-0 sm:border-l sm:border-[#e6e9e1] sm:dark:border-[#2c3a2c] sm:pl-6">
                    <h3 className="text-sm font-semibold text-[#2c302b] dark:text-[#e6ede6] mb-2.5 flex items-center gap-2">
                        <ChefHat size={15} className="text-[#426500] dark:text-[#b8fd4b]" /> Zubereitung
                    </h3>
                    <ol className="space-y-3">
                        {recipe.instructions.map((step, i) => (
                            <li key={i} className="flex gap-3 text-sm text-[#2c302b] dark:text-[#e6ede6]">
                                <span className="shrink-0 w-6 h-6 rounded-full bg-[#426500] dark:bg-[#b8fd4b] text-white dark:text-[#3d5e00] flex items-center justify-center text-[11px] font-bold mt-0.5">
                                    {i + 1}
                                </span>
                                <p className="leading-relaxed text-[#2c302b] dark:text-[#e6ede6]">{step}</p>
                            </li>
                        ))}
                    </ol>
                </div>
            </div>
        </div>
    </ModalShell>
);


// ─── RECIPE IMPORT MODAL ─────────────────────────────────────────

export const RecipeImportModal = ({
    onImport, onClose
}: {
    onImport: (recipe: Partial<Recipe>) => void;
    onClose: () => void;
}) => {
    const [activeTab, setActiveTab] = useState<'url' | 'text' | 'image'>('text');
    const [urlInput, setUrlInput] = useState('');
    const [textInput, setTextInput] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState('');
    const [imageBase64, setImageBase64] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setImageFile(file);
        const reader = new FileReader();
        reader.onload = (ev) => {
            const dataUrl = ev.target?.result as string;
            setImagePreview(dataUrl);
            setImageBase64(dataUrl.split(',')[1]);
        };
        reader.readAsDataURL(file);
    };

    const handleImport = async () => {
        setError(null);
        setIsLoading(true);
        try {
            let result: Partial<Recipe>;
            if (activeTab === 'url') {
                if (!urlInput.trim()) { setError('Bitte eine URL eingeben.'); setIsLoading(false); return; }
                let fetchedText = '';
                try {
                    const res = await fetch(urlInput.trim());
                    const html = await res.text();
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, 'text/html');
                    fetchedText = doc.body.innerText || doc.body.textContent || '';
                } catch {
                    setError('Diese Website kann nicht direkt geladen werden. Bitte kopiere den Rezepttext und nutze die "Text"-Option.');
                    setIsLoading(false);
                    return;
                }
                result = await importRecipeFromSource('text', fetchedText);
            } else if (activeTab === 'text') {
                if (!textInput.trim()) { setError('Bitte Rezepttext einfügen.'); setIsLoading(false); return; }
                result = await importRecipeFromSource('text', textInput);
            } else {
                if (!imageFile || !imageBase64) { setError('Bitte ein Bild auswählen.'); setIsLoading(false); return; }
                result = await importRecipeFromSource('image', imageBase64, imageFile.type);
            }
            onImport(result);
        } catch (err: any) {
            setError(err.message || 'Fehler beim Importieren. Bitte versuche es erneut.');
        } finally {
            setIsLoading(false);
        }
    };

    const tabs = [
        { id: 'text' as const, label: 'Text', icon: <FileText size={15} /> },
        { id: 'url'  as const, label: 'Link', icon: <Link size={15} /> },
        { id: 'image' as const, label: 'Bild', icon: <Image size={15} /> },
    ];

    return (
        <ModalShell onClose={onClose} maxWidth="max-w-lg">
            <ModalHeader title="Rezept importieren" sub="Importiere ein Rezept aus Text, Link oder Bild" onClose={onClose} />

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {/* Tab switcher */}
                <div className="flex gap-1 bg-[#f5f7f0] dark:bg-[#1e2a1e] p-1 rounded-xl border border-[#e6e9e1] dark:border-[#2c3a2c]">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => { setActiveTab(tab.id); setError(null); }}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all
                                ${activeTab === tab.id
                                    ? 'bg-white dark:bg-[#1e2a1e] text-[#2c302b] dark:text-[#e6ede6] shadow-sm border border-[#e6e9e1] dark:border-[#2c3a2c]'
                                    : 'text-[#595c57] dark:text-[#8a9089] hover:text-[#2c302b] dark:hover:text-[#F0EDE5]'
                                }`}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab content */}
                {activeTab === 'text' && (
                    <div>
                        <label className="block text-sm font-medium text-[#2c302b] dark:text-[#e6ede6] mb-1.5">
                            Rezepttext einfügen
                        </label>
                        <textarea
                            className="input-field resize-none"
                            rows={8}
                            placeholder="Füge hier den kopierten Rezepttext ein – z.B. von einer Website, aus einem Buch oder einer Notiz…"
                            value={textInput}
                            onChange={e => setTextInput(e.target.value)}
                        />
                    </div>
                )}

                {activeTab === 'url' && (
                    <div>
                        <label className="block text-sm font-medium text-[#2c302b] dark:text-[#e6ede6] mb-1.5">
                            Rezept-URL
                        </label>
                        <input
                            className="input-field"
                            placeholder="https://www.chefkoch.de/rezepte/…"
                            value={urlInput}
                            onChange={e => setUrlInput(e.target.value)}
                        />
                        <p className="text-xs text-[#959b8e] dark:text-[#6a7069] mt-2">
                            Hinweis: Manche Websites verhindern das direkte Laden. Falls das nicht klappt, kopiere den Rezepttext und nutze die "Text"-Option.
                        </p>
                    </div>
                )}

                {activeTab === 'image' && (
                    <div>
                        <label className="block text-sm font-medium text-[#2c302b] dark:text-[#e6ede6] mb-1.5">
                            Rezeptbild hochladen
                        </label>
                        {imagePreview ? (
                            <div className="relative">
                                <img src={imagePreview} alt="Vorschau" className="w-full max-h-48 object-contain rounded-xl border border-[#e6e9e1] dark:border-[#2c3a2c] bg-[#f5f7f0] dark:bg-[#1e2a1e]" />
                                <button
                                    onClick={() => { setImageFile(null); setImagePreview(''); setImageBase64(''); }}
                                    className="absolute top-2 right-2 p-1.5 bg-white dark:bg-[#1e2a1e] rounded-lg border border-[#c4c8be] dark:border-[#2c3a2c] text-[#959b8e] hover:text-red-500 transition-colors"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        ) : (
                            <label className="flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed border-[#c4c8be] dark:border-[#2c3a2c] rounded-xl cursor-pointer hover:border-[#b8fd4b] dark:hover:border-[#4FC475] hover:bg-[#eff2ea] dark:hover:bg-[rgba(79,196,117,0.04)] transition-all">
                                <Upload size={28} className="text-[#c4c8be] dark:text-[#3a4835]" />
                                <span className="text-sm text-[#595c57] dark:text-[#8a9089]">Bild auswählen oder hierher ziehen</span>
                                <input type="file" accept="image/*" className="sr-only" onChange={handleFileChange} />
                            </label>
                        )}
                    </div>
                )}

                {error && (
                    <div className="flex items-start gap-2.5 p-3.5 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800/30">
                        <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
                        <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                    </div>
                )}
            </div>

            <div className="flex justify-end gap-3 px-5 py-4 border-t border-[#e6e9e1] dark:border-[#2c3a2c] shrink-0">
                <button onClick={onClose} className="btn-ghost" disabled={isLoading}>Abbrechen</button>
                <button onClick={handleImport} className="btn-primary gap-2" disabled={isLoading}>
                    {isLoading ? <><Loader2 size={16} className="animate-spin" /> Importiere…</> : <><Upload size={16} /> Importieren</>}
                </button>
            </div>
        </ModalShell>
    );
};


// ─── ADD MEAL MODAL ───────────────────────────────────────────────

export const AddMealModal = ({
    onSelectSource, onClose
}: {
    onSelectSource: (mealType: string, source: 'favorites' | 'ai' | 'auto') => void;
    onClose: () => void;
}) => {
    const [selectedMealType, setSelectedMealType] = useState<string | null>(null);

    const mealTypes = [
        { label: 'Frühstück',   icon: <Coffee size={20} />,  pill: 'meal-pill-breakfast' },
        { label: 'Mittagessen', icon: <Sun size={20} />,     pill: 'meal-pill-lunch' },
        { label: 'Abendessen',  icon: <Moon size={20} />,    pill: 'meal-pill-dinner' },
        { label: 'Reste',       icon: <Package size={20} />, pill: 'meal-pill-reste' },
    ];

    return (
        <ModalShell onClose={onClose} maxWidth="max-w-sm">
            <ModalHeader
                title="Mahlzeit hinzufügen"
                sub={selectedMealType ? `${selectedMealType} — Quelle wählen` : 'Welche Mahlzeit?'}
                onClose={onClose}
            />

            <div className="p-5 space-y-3">
                {!selectedMealType ? (
                    /* Step 1: pick meal type */
                    mealTypes.map(({ label, icon, pill }) => (
                        <button
                            key={label}
                            onClick={() => label === 'Reste' ? onSelectSource('Reste', 'auto') : setSelectedMealType(label)}
                            className="w-full flex items-center gap-4 p-4 rounded-xl border border-[#c4c8be] dark:border-[#2c3a2c] hover:border-[#b8fd4b] dark:hover:border-[#4FC475] hover:bg-[#eff2ea] dark:hover:bg-[rgba(79,196,117,0.06)] transition-all group"
                        >
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-sm font-semibold ${pill}`}>
                                {icon}
                            </span>
                            <span className="font-semibold text-[#2c302b] dark:text-[#e6ede6] group-hover:text-[#395800] dark:group-hover:text-[#4FC475] transition-colors">
                                {label}
                            </span>
                            <ArrowRight size={16} className="ml-auto text-[#c4c8be] dark:text-[#3a4835] group-hover:text-[#426500] dark:group-hover:text-[#4FC475] transition-colors" />
                        </button>
                    ))
                ) : (
                    /* Step 2: pick source */
                    <>
                        <button
                            onClick={() => onSelectSource(selectedMealType, 'favorites')}
                            className="w-full flex items-center gap-4 p-4 rounded-xl border border-[#c4c8be] dark:border-[#2c3a2c] hover:border-amber-400 dark:hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-all group"
                        >
                            <span className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center shrink-0">
                                <Bookmark size={18} className="text-amber-600 dark:text-amber-400" />
                            </span>
                            <div className="text-left">
                                <p className="font-semibold text-[#2c302b] dark:text-[#e6ede6]">Aus Favoriten</p>
                                <p className="text-xs text-[#595c57] dark:text-[#8a9089]">Gespeichertes Rezept auswählen</p>
                            </div>
                        </button>
                        <button
                            onClick={() => onSelectSource(selectedMealType, 'ai')}
                            className="w-full flex items-center gap-4 p-4 rounded-xl border border-[#c4c8be] dark:border-[#2c3a2c] hover:border-[#b8fd4b] dark:hover:border-[#4FC475] hover:bg-[#eff2ea] dark:hover:bg-[rgba(79,196,117,0.06)] transition-all group"
                        >
                            <span className="w-10 h-10 rounded-xl bg-[#eff2ea] dark:bg-[rgba(66,101,0,0.12)] flex items-center justify-center shrink-0">
                                <Sparkles size={18} className="text-[#426500] dark:text-[#b8fd4b]" />
                            </span>
                            <div className="text-left">
                                <p className="font-semibold text-[#2c302b] dark:text-[#e6ede6]">KI-Vorschläge</p>
                                <p className="text-xs text-[#595c57] dark:text-[#8a9089]">5 Ideen generieren lassen</p>
                            </div>
                        </button>
                        <button
                            onClick={() => setSelectedMealType(null)}
                            className="w-full text-sm text-[#959b8e] dark:text-[#6a7069] hover:text-[#2c302b] dark:hover:text-[#F0EDE5] transition-colors py-1"
                        >
                            ← Zurück
                        </button>
                    </>
                )}
            </div>
        </ModalShell>
    );
};


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
            <h3 className="font-sans text-xl font-bold text-[#2c302b] dark:text-[#e6ede6] mb-2">
                Bist du sicher?
            </h3>
            <p className="text-sm text-[#595c57] dark:text-[#8a9089] mb-6 leading-relaxed">
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

export const RegenerateConfirmModal = ({
    onConfirm, onCancel
}: {
    onConfirm: () => void;
    onCancel: () => void;
}) => (
    <ModalShell onClose={onCancel} maxWidth="max-w-sm">
        <div className="p-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="h-7 w-7 text-amber-500" />
            </div>
            <h3 className="font-sans text-xl font-bold text-[#2c302b] dark:text-[#e6ede6] mb-2">
                Plan ersetzen?
            </h3>
            <p className="text-sm text-[#595c57] dark:text-[#8a9089] mb-6 leading-relaxed">
                Für diese Woche existiert bereits ein Wochenplan. Die Rezepte des alten Plans werden automatisch ins Archiv verschoben.
            </p>
            <div className="flex gap-3">
                <button onClick={onCancel} className="btn-ghost flex-1">Abbrechen</button>
                <button onClick={onConfirm} className="btn-primary flex-1">
                    Ja, neuen Plan erstellen
                </button>
            </div>
        </div>
    </ModalShell>
);
