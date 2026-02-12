
import React from 'react';
import { UserProfile, Diet, Goal } from '../types';
import { DAYS_OF_WEEK, CUISINES } from '../constants';
import { UserPlus, Edit2, Calendar, Trash2, Utensils } from 'lucide-react';

// --- USER LIST ---

interface UserListProps {
    users: UserProfile[];
    onAdd: () => void;
    onEdit: (u: UserProfile) => void;
}

export const UserList: React.FC<UserListProps> = ({ users, onAdd, onEdit }) => {
    return (
        <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Haushaltsprofile</h2>
            <button 
                onClick={onAdd}
                className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-emerald-700 transition"
            >
                <UserPlus size={18} className="mr-2" /> Mitglied hinzufügen
            </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {users.map(user => (
                    <div key={user.id} className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-xl font-bold text-slate-800 dark:text-white">{user.name}</h3>
                                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{user.diet}</p>
                            </div>
                            <button onClick={() => onEdit(user)} className="text-slate-400 dark:text-slate-500 hover:text-emerald-600 p-2 bg-slate-50 dark:bg-slate-700 rounded-full">
                                <Edit2 size={16} />
                            </button>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                            <span className="text-xs bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-2 py-1 rounded-md border border-emerald-100 dark:border-emerald-800">
                                {user.calories} kcal
                            </span>
                            <span className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-600">
                                {user.budget} € / Woche
                            </span>
                            <span className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-600">
                                {user.goal}
                            </span>
                            {user.favoriteCuisine && user.favoriteCuisine !== 'Keine Präferenz' && (
                                <span className="text-xs bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 px-2 py-1 rounded-md border border-orange-200 dark:border-orange-800 flex items-center">
                                   <Utensils size={10} className="mr-1"/> {user.favoriteCuisine}
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};


// --- USER EDIT ---

interface UserEditProps {
    tempUser: UserProfile;
    editingUserId: string | null;
    setTempUser: (u: UserProfile) => void;
    onSave: () => void;
    onCancel: () => void;
    onDelete: (id: string) => void;
}

export const UserEdit: React.FC<UserEditProps> = ({ tempUser, editingUserId, setTempUser, onSave, onCancel, onDelete }) => {
    const updateTempUser = (field: keyof UserProfile, value: any) => {
        setTempUser({ ...tempUser, [field]: value });
    };

    const updateTempUserHomeTime = (dayKey: string, checked: boolean) => {
        setTempUser({
            ...tempUser,
            homeTimes: { ...tempUser.homeTimes, [dayKey]: checked }
        });
    };

    return (
        <div className="animate-fade-in max-w-2xl mx-auto">
            <button onClick={onCancel} className="text-slate-500 hover:text-emerald-600 mb-4 flex items-center text-sm">
                ← Zurück zur Übersicht
            </button>
            
            <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg">
                <div className="flex justify-between items-center mb-6 border-b border-slate-100 dark:border-slate-700 pb-4">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{editingUserId ? 'Profil bearbeiten' : 'Neues Profil'}</h2>
                    {editingUserId && (
                        <button onClick={() => onDelete(tempUser.id)} className="text-red-500 hover:text-red-700 p-2">
                            <Trash2 size={20} />
                        </button>
                    )}
                </div>

                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Name</label>
                            <input 
                                type="text" 
                                value={tempUser.name} 
                                onChange={(e) => updateTempUser('name', e.target.value)}
                                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded focus:ring-2 focus:ring-emerald-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Ernährung</label>
                            <select 
                                value={tempUser.diet}
                                onChange={(e) => updateTempUser('diet', e.target.value)}
                                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded focus:ring-2 focus:ring-emerald-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                            >
                                {Object.values(Diet).map(d => <option key={d}>{d}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Ziel</label>
                            <select 
                                    value={tempUser.goal}
                                    onChange={(e) => updateTempUser('goal', e.target.value)}
                                    className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded focus:ring-2 focus:ring-emerald-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                            >
                                {Object.values(Goal).map(g => <option key={g}>{g}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Kcal Ziel</label>
                            <input 
                                type="number" 
                                value={tempUser.calories} 
                                onChange={(e) => updateTempUser('calories', parseInt(e.target.value))}
                                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded focus:ring-2 focus:ring-emerald-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Budget (€)</label>
                            <input 
                                type="number" 
                                value={tempUser.budget} 
                                onChange={(e) => updateTempUser('budget', parseInt(e.target.value))}
                                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded focus:ring-2 focus:ring-emerald-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                            />
                        </div>
                    </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Unverträglichkeiten / Abneigungen</label>
                            <input 
                                type="text" 
                                placeholder="z.B. Pilze, Erdnüsse..."
                                value={tempUser.dislikes} 
                                onChange={(e) => updateTempUser('dislikes', e.target.value)}
                                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded focus:ring-2 focus:ring-emerald-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Lieblingsküche</label>
                            <select 
                                value={tempUser.favoriteCuisine || 'Keine Präferenz'}
                                onChange={(e) => updateTempUser('favoriteCuisine', e.target.value)}
                                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded focus:ring-2 focus:ring-emerald-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                            >
                                {CUISINES.map(c => <option key={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg border border-slate-200 dark:border-slate-600">
                        <h4 className="font-medium text-slate-800 dark:text-white mb-3 flex items-center">
                            <Calendar size={16} className="mr-2 text-emerald-600"/> 
                            Standard-Anwesenheit
                        </h4>
                        <div className="grid grid-cols-7 gap-1 md:gap-2">
                            {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((dayShort, dIdx) => {
                                const fullDays = DAYS_OF_WEEK;
                                const dayName = fullDays[dIdx];
                                return (
                                    <div key={dayShort} className="flex flex-col gap-1 items-center">
                                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">{dayShort}</span>
                                        {['Frühstück', 'Mittagessen', 'Abendessen'].map(type => {
                                            const key = `${dayName}_${type}`;
                                            const isActive = tempUser.homeTimes[key] !== false;
                                            return (
                                                <button
                                                    key={key}
                                                    onClick={() => updateTempUserHomeTime(key, !isActive)}
                                                    className={`h-8 w-full md:w-12 rounded flex items-center justify-center text-[10px] font-bold transition ${isActive ? 'bg-emerald-500 text-white shadow-sm' : 'bg-slate-200 dark:bg-slate-600 text-slate-400 dark:text-slate-500'}`}
                                                    title={`${dayName} ${type}`}
                                                >
                                                    {type[0]}
                                                </button>
                                            )
                                        })}
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end space-x-3">
                        <button onClick={onCancel} className="px-6 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 font-medium">
                            Abbrechen
                        </button>
                        <button onClick={onSave} className="px-6 py-2 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 shadow-md">
                            Speichern
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};