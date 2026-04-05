
import React from 'react';
import { UserProfile, Diet, Goal } from '../types';
import { DAYS_OF_WEEK, CUISINES } from '../constants';
import { UserPlus, Edit2, Calendar, Trash2, Utensils, ChevronLeft } from 'lucide-react';

// ─── USER LIST ────────────────────────────────────────────────────

interface UserListProps {
    users: UserProfile[];
    onAdd: () => void;
    onEdit: (u: UserProfile) => void;
}

const goalColor: Record<string, string> = {
    'Gewicht halten': 'tag-chip',
    'Abnehmen':       'tag-chip tag-chip-amber',
    'Muskelaufbau':   'tag-chip tag-chip-blue',
};

export const UserList: React.FC<UserListProps> = ({ users, onAdd, onEdit }) => (
    <div className="space-y-5 animate-fade-in">
        <div className="flex items-center justify-between">
            <h2 className="section-title">Haushaltsprofile</h2>
            <button onClick={onAdd} className="btn-primary gap-2 text-sm py-2.5 px-4">
                <UserPlus size={16} />
                <span className="hidden sm:inline">Mitglied hinzufügen</span>
                <span className="sm:hidden">Neu</span>
            </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {users.map((user, idx) => (
                <div
                    key={user.id}
                    className="card card-hover p-5 animate-fade-in"
                    style={{ animationDelay: `${idx * 0.06}s` }}
                >
                    <div className="flex items-start justify-between mb-3">
                        <div>
                            <h3 className="font-display text-lg font-bold text-[#1C1A16] dark:text-[#F0EDE5]">
                                {user.name}
                            </h3>
                            <p className="text-sm text-[#6E6A60] dark:text-[#9A9690] mt-0.5">{user.diet}</p>
                        </div>
                        <button
                            onClick={() => onEdit(user)}
                            className="p-2 rounded-xl text-[#A38E72] dark:text-[#6B6762] hover:text-forest-500 dark:hover:text-[#4FC475] hover:bg-forest-50 dark:hover:bg-[rgba(79,196,117,0.08)] transition-colors"
                        >
                            <Edit2 size={16} />
                        </button>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                        <span className="tag-chip">{user.calories} kcal</span>
                        <span className="tag-chip">{user.budget} € / Woche</span>
                        <span className={goalColor[user.goal] || 'tag-chip'}>{user.goal}</span>
                        {user.favoriteCuisine && user.favoriteCuisine !== 'Keine Präferenz' && (
                            <span className="tag-chip tag-chip-amber">
                                <Utensils size={10} className="mr-1" />
                                {user.favoriteCuisine}
                            </span>
                        )}
                    </div>
                </div>
            ))}
        </div>
    </div>
);


// ─── USER EDIT ────────────────────────────────────────────────────

interface UserEditProps {
    tempUser: UserProfile;
    editingUserId: string | null;
    setTempUser: (u: UserProfile) => void;
    onSave: () => void;
    onCancel: () => void;
    onDelete: (id: string) => void;
}

export const UserEdit: React.FC<UserEditProps> = ({ tempUser, editingUserId, setTempUser, onSave, onCancel, onDelete }) => {
    const update = (field: keyof UserProfile, value: any) =>
        setTempUser({ ...tempUser, [field]: value });

    const updateHomeTime = (key: string, checked: boolean) =>
        setTempUser({ ...tempUser, homeTimes: { ...tempUser.homeTimes, [key]: checked } });

    const dayShorts = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
    const mealTypes = ['Frühstück', 'Mittagessen', 'Abendessen'];
    const mealInitials = ['F', 'M', 'A'];

    return (
        <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
            <button
                onClick={onCancel}
                className="flex items-center gap-1.5 text-sm text-[#6E6A60] dark:text-[#9A9690] hover:text-forest-500 dark:hover:text-[#4FC475] transition-colors"
            >
                <ChevronLeft size={16} /> Zurück zur Übersicht
            </button>

            <div className="card p-6 sm:p-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-6 pb-5 border-b border-clay-100 dark:border-[#2A3427]">
                    <h2 className="font-display text-2xl font-bold text-[#1C1A16] dark:text-[#F0EDE5]">
                        {editingUserId ? 'Profil bearbeiten' : 'Neues Profil'}
                    </h2>
                    {editingUserId && (
                        <button
                            onClick={() => onDelete(tempUser.id)}
                            className="p-2 rounded-xl text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                            <Trash2 size={18} />
                        </button>
                    )}
                </div>

                <div className="space-y-5">
                    {/* Row 1: Name + Diet */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-[#1C1A16] dark:text-[#F0EDE5] mb-1.5">Name</label>
                            <input
                                type="text"
                                value={tempUser.name}
                                onChange={e => update('name', e.target.value)}
                                className="input-field"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#1C1A16] dark:text-[#F0EDE5] mb-1.5">Ernährung</label>
                            <select
                                value={tempUser.diet}
                                onChange={e => update('diet', e.target.value)}
                                className="input-field"
                            >
                                {Object.values(Diet).map(d => <option key={d}>{d}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Row 2: Goal + Kcal + Budget */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-[#1C1A16] dark:text-[#F0EDE5] mb-1.5">Ziel</label>
                            <select
                                value={tempUser.goal}
                                onChange={e => update('goal', e.target.value)}
                                className="input-field"
                            >
                                {Object.values(Goal).map(g => <option key={g}>{g}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#1C1A16] dark:text-[#F0EDE5] mb-1.5">Kcal Ziel</label>
                            <input
                                type="number"
                                value={tempUser.calories}
                                onChange={e => update('calories', parseInt(e.target.value) || 0)}
                                className="input-field"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#1C1A16] dark:text-[#F0EDE5] mb-1.5">Budget (€ / Woche)</label>
                            <input
                                type="number"
                                value={tempUser.budget}
                                onChange={e => update('budget', parseInt(e.target.value) || 0)}
                                className="input-field"
                            />
                        </div>
                    </div>

                    {/* Row 3: Dislikes + Cuisine */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-[#1C1A16] dark:text-[#F0EDE5] mb-1.5">Abneigungen / Unverträglichkeiten</label>
                            <input
                                type="text"
                                placeholder="z.B. Pilze, Erdnüsse..."
                                value={tempUser.dislikes}
                                onChange={e => update('dislikes', e.target.value)}
                                className="input-field"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#1C1A16] dark:text-[#F0EDE5] mb-1.5">Lieblingsküche</label>
                            <select
                                value={tempUser.favoriteCuisine || 'Keine Präferenz'}
                                onChange={e => update('favoriteCuisine', e.target.value)}
                                className="input-field"
                            >
                                {CUISINES.map(c => <option key={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Attendance grid */}
                    <div className="bg-clay-50 dark:bg-[#232B1F] rounded-xl p-4 border border-clay-100 dark:border-[#2A3427]">
                        <h4 className="text-sm font-semibold text-[#1C1A16] dark:text-[#F0EDE5] mb-3 flex items-center gap-2">
                            <Calendar size={15} className="text-forest-500 dark:text-[#4FC475]" />
                            Standard-Anwesenheit
                        </h4>
                        <div className="grid grid-cols-7 gap-1">
                            {dayShorts.map((dayShort, dIdx) => {
                                const dayName = DAYS_OF_WEEK[dIdx];
                                return (
                                    <div key={dayShort} className="flex flex-col items-center gap-1">
                                        <span className="text-[10px] font-bold text-[#A38E72] dark:text-[#6B6762] mb-0.5">
                                            {dayShort}
                                        </span>
                                        {mealTypes.map((type, tIdx) => {
                                            const key = `${dayName}_${type}`;
                                            const isActive = tempUser.homeTimes[key] !== false;
                                            return (
                                                <button
                                                    key={key}
                                                    onClick={() => updateHomeTime(key, !isActive)}
                                                    title={`${dayName} ${type}`}
                                                    className={`w-full aspect-square rounded-lg flex items-center justify-center text-[9px] font-bold transition-all duration-150
                                                        ${isActive
                                                            ? 'bg-forest-500 dark:bg-[#4FC475] text-white dark:text-[#071B10]'
                                                            : 'bg-clay-200 dark:bg-[#2A3427] text-[#A38E72] dark:text-[#6B6762] hover:bg-clay-300'
                                                        }`}
                                                >
                                                    {mealInitials[tIdx]}
                                                </button>
                                            );
                                        })}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-2">
                        <button onClick={onCancel} className="btn-ghost">Abbrechen</button>
                        <button onClick={onSave} className="btn-primary">Speichern</button>
                    </div>
                </div>
            </div>
        </div>
    );
};
