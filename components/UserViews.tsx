
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
                            <h3 className="text-lg font-extrabold" style={{ color: 'var(--c-text)' }}>
                                {user.name}
                            </h3>
                            <p className="text-sm mt-0.5 font-medium" style={{ color: 'var(--c-text-mid)' }}>{user.diet}</p>
                        </div>
                        <button
                            onClick={() => onEdit(user)}
                            className="p-2 rounded-xl transition-colors"
                            style={{ color: 'var(--c-text-dim)' }}
                            onMouseEnter={e => { e.currentTarget.style.color = 'var(--c-primary)'; e.currentTarget.style.background = 'var(--c-surface-low)'; }}
                            onMouseLeave={e => { e.currentTarget.style.color = 'var(--c-text-dim)'; e.currentTarget.style.background = ''; }}
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
                className="flex items-center gap-1.5 text-sm font-semibold transition-colors"
                style={{ color: 'var(--c-text-mid)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--c-primary)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--c-text-mid)')}
            >
                <ChevronLeft size={16} /> Zurück zur Übersicht
            </button>

            <div className="card p-6 sm:p-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-6 pb-5 border-b" style={{ borderColor: 'var(--c-border-soft)' }}>
                    <h2 className="text-2xl font-extrabold" style={{ color: 'var(--c-text)', letterSpacing: '-0.02em' }}>
                        {editingUserId ? 'Profil bearbeiten' : 'Neues Profil'}
                    </h2>
                    {editingUserId && (
                        <button
                            onClick={() => onDelete(tempUser.id)}
                            className="p-2 rounded-xl transition-colors"
                            style={{ color: '#b3261e' }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(179,38,30,0.08)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = ''; }}
                        >
                            <Trash2 size={18} />
                        </button>
                    )}
                </div>

                <div className="space-y-5">
                    {/* Row 1: Name + Diet */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--c-text)' }}>Name</label>
                            <input
                                type="text"
                                value={tempUser.name}
                                onChange={e => update('name', e.target.value)}
                                className="input-field"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--c-text)' }}>Ernährung</label>
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
                            <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--c-text)' }}>Ziel</label>
                            <select
                                value={tempUser.goal}
                                onChange={e => update('goal', e.target.value)}
                                className="input-field"
                            >
                                {Object.values(Goal).map(g => <option key={g}>{g}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--c-text)' }}>Kcal Ziel</label>
                            <input
                                type="number"
                                value={tempUser.calories}
                                onChange={e => update('calories', parseInt(e.target.value) || 0)}
                                className="input-field"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--c-text)' }}>Budget (€ / Woche)</label>
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
                            <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--c-text)' }}>Abneigungen / Unverträglichkeiten</label>
                            <input
                                type="text"
                                placeholder="z.B. Pilze, Erdnüsse..."
                                value={tempUser.dislikes}
                                onChange={e => update('dislikes', e.target.value)}
                                className="input-field"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--c-text)' }}>Lieblingsküche</label>
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
                    <div className="rounded-2xl p-4 border" style={{ background: 'var(--c-surface-low)', borderColor: 'var(--c-border-soft)' }}>
                        <h4 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--c-text)' }}>
                            <Calendar size={15} style={{ color: 'var(--c-primary)' }} />
                            Standard-Anwesenheit
                        </h4>
                        <div className="grid grid-cols-7 gap-1">
                            {dayShorts.map((dayShort, dIdx) => {
                                const dayName = DAYS_OF_WEEK[dIdx];
                                return (
                                    <div key={dayShort} className="flex flex-col items-center gap-1">
                                        <span className="text-[10px] font-bold mb-0.5" style={{ color: 'var(--c-text-dim)' }}>
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
                                                    className="w-full aspect-square rounded-lg flex items-center justify-center text-[9px] font-bold transition-all duration-150"
                                                    style={isActive
                                                        ? { background: '#b8fd4b', color: '#3d5e00' }
                                                        : { background: '#e6e9e1', color: '#959b8e' }
                                                    }
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
