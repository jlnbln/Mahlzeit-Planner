
import React, { useState, useEffect } from 'react';
import { Recipe, Ingredient, UserProfile, AppSettings } from '../types';
import { DAYS_OF_WEEK } from '../constants';
import { X, Trash2, Plus, ArrowRight, Calendar, Check, Clock, Heart, Star, ShoppingCart, ChefHat, AlertTriangle } from 'lucide-react';

const StarRating = ({ rating, onRate, size = 20 }: { rating: number, onRate?: (r: number) => void, size?: number }) => {
  return (
    <div className="flex space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button 
          key={star}
          disabled={!onRate}
          onClick={() => onRate && onRate(star)}
          className={`${onRate ? 'cursor-pointer hover:scale-110 transition' : 'cursor-default'}`}
        >
          <Star 
            size={size} 
            className={`${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300 dark:text-slate-600'}`} 
          />
        </button>
      ))}
    </div>
  );
};

// --- RECIPE FORM MODAL (CREATE/EDIT) ---

export const RecipeFormModal = ({ onClose, onSave, initialRecipe }: { onClose: () => void, onSave: (r: Partial<Recipe>) => void, initialRecipe?: Recipe }) => {
    const [newRecipe, setNewRecipe] = useState<Partial<Recipe>>({
        name: '', calories: 500, cookingTime: 30, ingredients: [], instructions: [], tags: [], isFavorite: true
    });
    const [tagsString, setTagsString] = useState('');
    const [newIngredient, setNewIngredient] = useState<Ingredient>({ name: '', amount: 100, unit: 'g' });
    const [newInstruction, setNewInstruction] = useState('');

    useEffect(() => {
        if (initialRecipe) {
            setNewRecipe({ ...initialRecipe });
            setTagsString(initialRecipe.tags?.join(', ') || '');
        }
    }, [initialRecipe]);

    const handleSave = () => {
        if (!newRecipe.name) return alert("Bitte geben Sie einen Namen ein.");
        const parsedTags = tagsString.split(',')
            .map(t => t.trim())
            .filter(t => t);
        
        onSave({
            ...newRecipe,
            tags: parsedTags
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl p-6 flex flex-col max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                        {initialRecipe ? 'Rezept bearbeiten' : 'Eigenes Rezept hinzufügen'}
                    </h3>
                    <button onClick={onClose}><X className="text-slate-400" /></button>
                </div>
                
                <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Name</label>
                        <input className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded mt-1 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" 
                            value={newRecipe.name} onChange={e => setNewRecipe({...newRecipe, name: e.target.value})} />
                    </div>
                    
                    <div className="flex gap-4">
                        <div className="w-1/3">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Kalorien</label>
                            <input type="number" className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded mt-1 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" 
                                value={newRecipe.calories} onChange={e => setNewRecipe({...newRecipe, calories: parseInt(e.target.value) || 0})} />
                        </div>
                        <div className="w-1/3">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Dauer (Min)</label>
                            <input type="number" className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded mt-1 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" 
                                value={newRecipe.cookingTime} onChange={e => setNewRecipe({...newRecipe, cookingTime: parseInt(e.target.value) || 0})} />
                        </div>
                        <div className="w-1/3">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Tags (mit Komma trennen)</label>
                            <input 
                                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded mt-1 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" 
                                placeholder="Schnell, Vegan, Thermomix" 
                                value={tagsString} 
                                onChange={e => setTagsString(e.target.value)} 
                            />
                        </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded border border-slate-200 dark:border-slate-600">
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Zutaten</label>
                        <ul className="mb-2 space-y-1">
                            {newRecipe.ingredients?.map((ing, i) => (
                                <li key={i} className="text-sm flex justify-between bg-white dark:bg-slate-700 p-1 px-2 rounded border border-slate-100 dark:border-slate-600">
                                    <span className="dark:text-slate-200">{ing.amount} {ing.unit} {ing.name}</span>
                                    <button onClick={() => {
                                        const ni = [...(newRecipe.ingredients || [])]; ni.splice(i, 1); setNewRecipe({...newRecipe, ingredients: ni});
                                    }} className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                                </li>
                            ))}
                        </ul>
                        <div className="flex gap-2">
                            <input className="w-20 p-1 border dark:border-slate-600 rounded text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white" type="number" placeholder="Menge" value={newIngredient.amount} onChange={e => setNewIngredient({...newIngredient, amount: parseFloat(e.target.value)})} />
                            <input className="w-20 p-1 border dark:border-slate-600 rounded text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white" placeholder="Einheit" value={newIngredient.unit} onChange={e => setNewIngredient({...newIngredient, unit: e.target.value})} />
                            <input className="flex-1 p-1 border dark:border-slate-600 rounded text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white" placeholder="Zutat" value={newIngredient.name} onChange={e => setNewIngredient({...newIngredient, name: e.target.value})} />
                            <button onClick={() => {
                                if (!newIngredient.name) return;
                                setNewRecipe({...newRecipe, ingredients: [...(newRecipe.ingredients || []), newIngredient]});
                                setNewIngredient({ name: '', amount: 100, unit: 'g' });
                            }} className="bg-emerald-600 text-white p-1 rounded"><Plus size={18} /></button>
                        </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded border border-slate-200 dark:border-slate-600">
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Zubereitungsschritte</label>
                        <ol className="list-decimal pl-5 mb-2 space-y-1 text-sm dark:text-slate-300">
                            {newRecipe.instructions?.map((step, i) => (
                                <li key={i} className="pl-1 group relative">
                                    <span className="dark:text-slate-200">{step}</span>
                                    <button onClick={() => {
                                        const ni = [...(newRecipe.instructions || [])]; ni.splice(i, 1); setNewRecipe({...newRecipe, instructions: ni});
                                    }} className="absolute -left-5 text-red-400 opacity-0 group-hover:opacity-100"><Trash2 size={12} /></button>
                                </li>
                            ))}
                        </ol>
                        <div className="flex gap-2">
                            <textarea className="flex-1 p-2 border dark:border-slate-600 rounded text-sm h-16 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" placeholder="Schritt beschreibung..." value={newInstruction} onChange={e => setNewInstruction(e.target.value)} />
                            <button onClick={() => {
                                if (!newInstruction) return;
                                setNewRecipe({...newRecipe, instructions: [...(newRecipe.instructions || []), newInstruction]});
                                setNewInstruction('');
                            }} className="bg-emerald-600 text-white px-3 rounded h-auto self-end py-2">Hinzufügen</button>
                        </div>
                    </div>
                </div>

                <div className="mt-4 pt-4 border-t dark:border-slate-600 flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 text-slate-600 dark:text-slate-400">Abbrechen</button>
                    <button onClick={handleSave} className="px-6 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 font-bold">
                        {initialRecipe ? 'Änderungen speichern' : 'Rezept speichern'}
                    </button>
                </div>
            </div>
        </div>
    );
};


// --- GENERATION MODAL ---

export const GenerationModal = ({ onClose, users, onConfirm, initialDate, settings }: { onClose: () => void, users: UserProfile[], onConfirm: (date: Date, attendance: any) => void, initialDate?: Date, settings: AppSettings }) => {
    const getNextStartDay = () => {
        const d = new Date();
        const startDayIndex = DAYS_OF_WEEK.indexOf(settings.weekStartDay);
        const currentJsDay = d.getDay(); 
        const currentOurDay = (currentJsDay + 6) % 7;
        
        let daysToAdd = (startDayIndex - currentOurDay + 7) % 7;
        if (daysToAdd === 0) daysToAdd = 7; 
        
        d.setDate(d.getDate() + daysToAdd);
        d.setHours(0,0,0,0);
        return d;
    };
    
    const [genStep, setGenStep] = useState<1 | 2>(1);
    const [genTargetDate, setGenTargetDate] = useState<Date>(initialDate || getNextStartDay());
    const [tempGenAttendance, setTempGenAttendance] = useState<Record<string, any>>(() => {
        const initial: any = {};
        users.forEach(u => initial[u.id] = { ...u.homeTimes });
        return initial;
    });

    const toggleGenAttendance = (userId: string, key: string) => {
        setTempGenAttendance(prev => ({
            ...prev,
            [userId]: { ...prev[userId], [key]: !prev[userId][key] }
        }));
    };

    const displayDays = [];
    let sIndex = DAYS_OF_WEEK.indexOf(settings.weekStartDay);
    if (sIndex === -1) sIndex = 0;
    for(let i=0; i<7; i++) {
        const dName = DAYS_OF_WEEK[(sIndex + i) % 7];
        if (!settings.includeWeekends && (dName === 'Samstag' || dName === 'Sonntag')) continue;
        displayDays.push(dName);
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl p-6 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Wochenplan erstellen</h3>
                
                {genStep === 1 && (
                    <>
                        <p className="text-slate-500 dark:text-slate-400 mb-6">Für welche Woche möchten Sie den Plan erstellen?</p>
                        <div className="mb-8">
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Startdatum ({settings.weekStartDay})</label>
                            <input 
                                type="date"
                                className="w-full p-4 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-lg"
                                value={genTargetDate.toISOString().split('T')[0]}
                                onChange={(e) => {
                                    const d = new Date(e.target.value);
                                    if (!isNaN(d.getTime())) setGenTargetDate(d);
                                }}
                            />
                            <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-100 dark:border-emerald-800">
                                <p className="text-sm text-emerald-800 dark:text-emerald-300 font-medium flex items-center">
                                    <Calendar className="mr-2 h-4 w-4" />
                                    Woche vom {genTargetDate.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                </p>
                            </div>
                        </div>

                        <button 
                            onClick={() => setGenStep(2)} 
                            className="w-full py-4 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 flex items-center justify-center text-lg shadow-lg shadow-emerald-200 dark:shadow-emerald-900/40 transition transform hover:-translate-y-1"
                        >
                            Weiter <ArrowRight className="ml-2" />
                        </button>
                    </>
                )}

                {genStep === 2 && (
                    <div className="flex flex-col h-full overflow-hidden">
                        <p className="text-slate-500 dark:text-slate-400 mb-4">Wer isst wann mit?</p>
                        <div className="flex-1 overflow-y-auto mb-4 border rounded-xl border-slate-200 dark:border-slate-600">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 dark:bg-slate-700 sticky top-0">
                                    <tr>
                                        <th className="p-3 text-left font-bold text-slate-700 dark:text-slate-300">Name</th>
                                        {displayDays.map(d => <th key={d} className="p-2 font-bold text-slate-500 dark:text-slate-400 text-center">{d.substring(0,2)}</th>)}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                    {users.map(u => (
                                        <tr key={u.id}>
                                            <td className="p-3 font-medium text-slate-800 dark:text-slate-200">{u.name}</td>
                                            {displayDays.map(d => (
                                                <td key={d} className="p-2">
                                                    <div className="flex flex-col gap-1 items-center">
                                                        {['Frühstück', 'Mittagessen', 'Abendessen'].map(type => {
                                                            const key = `${d}_${type}`;
                                                            const isActive = tempGenAttendance[u.id]?.[key];
                                                            return (
                                                                <input 
                                                                    key={key} type="checkbox" checked={isActive || false}
                                                                    onChange={() => toggleGenAttendance(u.id, key)}
                                                                    className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-600 rounded accent-emerald-600"
                                                                />
                                                            )
                                                        })}
                                                    </div>
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="flex justify-between pt-2">
                            <button onClick={() => setGenStep(1)} className="text-slate-500 dark:text-slate-400 font-medium">Zurück</button>
                            <button onClick={() => onConfirm(genTargetDate, tempGenAttendance)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-bold">
                                Plan Generieren
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- REPLACEMENT MODAL ---

export const ReplacementModal = ({ candidates, targetName, onSelect, onClose }: { candidates: Recipe[], targetName: string, onSelect: (r: Recipe) => void, onClose: () => void }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
        <div className="bg-white dark:bg-slate-800 w-full max-w-3xl rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
           <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Alternative wählen</h3>
           <p className="text-slate-500 dark:text-slate-400 mb-6">Für: <span className="font-semibold text-slate-700 dark:text-slate-300">{targetName}</span></p>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {candidates.map((recipe, idx) => (
                   <div key={idx} onClick={() => onSelect(recipe)} className="border border-slate-200 dark:border-slate-600 rounded-xl p-4 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 cursor-pointer transition relative group">
                       <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 bg-emerald-600 text-white rounded-full p-1"><Check size={16} /></div>
                       <h4 className="font-bold text-slate-800 dark:text-white mb-2">{recipe.name}</h4>
                       <div className="flex gap-2 mb-2">
                           <span className="text-xs bg-slate-100 dark:bg-slate-700 dark:text-slate-300 px-2 py-1 rounded">{recipe.calories} kcal</span>
                           <span className="text-xs bg-slate-100 dark:bg-slate-700 dark:text-slate-300 px-2 py-1 rounded flex items-center"><Clock size={10} className="mr-1"/> {recipe.cookingTime || 30}m</span>
                           {recipe.tags.slice(0,2).map(t => (
                               <span key={t} className={`text-xs px-2 py-1 rounded border ${t.toLowerCase() === 'thermomix' ? 'bg-purple-50 border-purple-200 text-purple-700 dark:bg-purple-900/30 dark:border-purple-800 dark:text-purple-300' : 'bg-white dark:bg-slate-600 dark:text-slate-200 border-slate-200 dark:border-slate-500'}`}>
                                   {t}
                               </span>
                           ))}
                       </div>
                       <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{recipe.ingredients.map(i => i.name).join(', ')}</p>
                   </div>
               ))}
           </div>
           <button onClick={onClose} className="mt-6 w-full py-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600">Abbrechen</button>
        </div>
    </div>
);

// --- FAVORITE PICKER MODAL ---

export const FavoritePickerModal = ({ favorites, targetName, onSelect, onClose }: { favorites: Recipe[], targetName: string, onSelect: (r: Recipe) => void, onClose: () => void }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
        <div className="bg-white dark:bg-slate-800 w-full max-w-4xl rounded-2xl shadow-2xl p-6 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white">Favorit wählen</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Ersetze "{targetName}" durch...</p>
                </div>
                <button onClick={onClose}><X className="text-slate-400" /></button>
            </div>

            <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-1">
                {favorites.length === 0 ? (
                    <p className="col-span-3 text-center text-slate-400 py-10">Keine Favoriten gefunden.</p>
                ) : (
                    favorites.map((recipe, idx) => (
                        <div key={idx} onClick={() => onSelect(recipe)} className="border border-slate-200 dark:border-slate-600 rounded-xl p-4 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 cursor-pointer transition group">
                                <div className="flex justify-between items-start mb-2">
                                <h4 className="font-bold text-slate-800 dark:text-white line-clamp-1">{recipe.name}</h4>
                                <Heart className="h-4 w-4 text-red-500 fill-red-500 flex-shrink-0" />
                                </div>
                                <div className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-2">
                                    {recipe.ingredients.map(i => i.name).join(', ')}
                                </div>
                                <div className="flex gap-1 flex-wrap">
                                    <span className="text-[10px] bg-slate-100 dark:bg-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded">{recipe.calories} kcal</span>
                                    <span className="text-[10px] bg-slate-100 dark:bg-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded flex items-center"><Clock size={10} className="mr-1"/> {recipe.cookingTime || 30}m</span>
                                    {recipe.source === 'manual' && <span className="text-[10px] bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded border border-blue-100 dark:border-blue-800">EIGENES</span>}
                                    {recipe.tags.filter(t => t.toLowerCase() === 'thermomix').map(t => (
                                        <span key={t} className="text-[10px] bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-1.5 py-0.5 rounded border border-purple-100 dark:border-purple-800">Thermomix</span>
                                    ))}
                                </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    </div>
);

// --- RECIPE DETAIL MODAL ---

export const RecipeDetailModal = ({ recipe, onClose, onUpdate }: { recipe: Recipe, onClose: () => void, onUpdate: (p: Partial<Recipe>) => void }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
        <div className="bg-white dark:bg-slate-800 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl p-6 relative" onClick={e => e.stopPropagation()}>
            <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-slate-100 dark:bg-slate-700 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 z-10 text-slate-500 dark:text-slate-300">
                <X size={20} />
            </button>
            
            <div className="mt-2">
                <div className="flex items-center justify-between mb-2 pr-10">
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Rezept</span>
                        <button 
                        onClick={() => onUpdate({ isFavorite: !recipe.isFavorite })}
                        className={`p-2 rounded-full transition ${recipe.isFavorite ? 'bg-red-50 dark:bg-red-900/20 text-red-500' : 'text-slate-300 dark:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                        >
                        <Heart size={24} className={recipe.isFavorite ? 'fill-red-500' : ''} />
                        </button>
                </div>
                
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{recipe.name}</h2>
                
                <div className="flex items-center space-x-4 mb-4 py-2 border-y border-slate-50 dark:border-slate-700">
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase text-slate-400 font-bold mb-1">Bewertung</span>
                        <StarRating rating={recipe.rating || 0} onRate={(r) => onUpdate({ rating: r })} />
                    </div>
                    <div className="h-8 w-px bg-slate-100 dark:bg-slate-700"></div>
                    <div className="flex flex-col">
                            <span className="text-[10px] uppercase text-slate-400 font-bold mb-1">Kalorien</span>
                            <span className="font-bold text-slate-700 dark:text-slate-200">{recipe.calories} kcal</span>
                    </div>
                    <div className="h-8 w-px bg-slate-100 dark:bg-slate-700"></div>
                    <div className="flex flex-col">
                            <span className="text-[10px] uppercase text-slate-400 font-bold mb-1">Dauer</span>
                            <span className="font-bold text-slate-700 dark:text-slate-200 flex items-center"><Clock size={14} className="mr-1"/>{recipe.cookingTime || 30}m</span>
                    </div>
                </div>

                <div className="flex gap-2 mb-6 flex-wrap">
                    {recipe.tags.map(tag => (
                        <span key={tag} className={`text-xs px-2 py-1 rounded-full font-medium ${tag.toLowerCase() === 'thermomix' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300' : 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300'}`}>
                            {tag}
                        </span>
                    ))}
                </div>

                <div className="space-y-6">
                    <div>
                        <h3 className="text-lg font-semibold mb-3 flex items-center text-slate-800 dark:text-white"><ShoppingCart size={18} className="mr-2"/> Zutaten</h3>
                        <ul className="grid grid-cols-2 gap-2">
                            {recipe.ingredients.map((ing, i) => (
                                <li key={i} className="text-sm bg-slate-50 dark:bg-slate-700/50 p-2 rounded border border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-200">
                                    <span className="font-bold">{ing.amount} {ing.unit}</span> {ing.name}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold mb-3 flex items-center text-slate-800 dark:text-white"><ChefHat size={18} className="mr-2"/> Zubereitung</h3>
                        <ol className="space-y-4">
                            {recipe.instructions.map((step, i) => (
                                <li key={i} className="flex gap-3 text-slate-700 dark:text-slate-300">
                                    <span className="flex-shrink-0 w-6 h-6 bg-emerald-600 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">{i + 1}</span>
                                    <p className="text-sm leading-relaxed">{step}</p>
                                </li>
                            ))}
                        </ol>
                    </div>
                </div>
            </div>
        </div>
    </div>
);


// --- RESET CONFIRM MODAL ---

export const ResetConfirmModal = ({ onConfirm, onCancel }: { onConfirm: () => void, onCancel: () => void }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onCancel}>
        <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-2xl shadow-2xl p-6" onClick={e => e.stopPropagation()}>
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-center text-slate-900 dark:text-white mb-2">Sind Sie sicher?</h3>
            <p className="text-center text-slate-500 dark:text-slate-400 mb-6 text-sm">
                Diese Aktion kann nicht rückgängig gemacht werden. Alle Daten werden gelöscht und auf die Standardwerte zurückgesetzt.
            </p>
            <div className="flex space-x-3">
                <button onClick={onCancel} className="flex-1 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-lg">Abbrechen</button>
                <button onClick={onConfirm} className="flex-1 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700">Löschen</button>
            </div>
        </div>
    </div>
);
