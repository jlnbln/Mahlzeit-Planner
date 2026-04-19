
import React, { useState } from 'react';
import { ShoppingList, ShoppingItem, AppSettings } from '../types';
import { Check, Trash2, Plus, X } from 'lucide-react';

interface ShoppingListProps {
    shoppingList: ShoppingList;
    settings: AppSettings;
    setShoppingList: (list: ShoppingList) => void;
}

const CATEGORIES = [
    'Obst & Gemüse',
    'Fleisch & Fisch',
    'Milchprodukte',
    'Backwaren',
    'Tiefkühl',
    'Getränke',
    'Konserven',
    'Gewürze',
    'Sonstiges',
];

const ShoppingListView: React.FC<ShoppingListProps> = ({ shoppingList, settings, setShoppingList }) => {
    const [showAddForm, setShowAddForm] = useState(false);
    const [newName, setNewName] = useState('');
    const [newAmount, setNewAmount] = useState('');
    const [newUnit, setNewUnit] = useState('');
    const [newCategory, setNewCategory] = useState(CATEGORIES[0]);

    const toggleItem = (index: number) => {
        const newItems = [...shoppingList.items];
        newItems[index].checked = !newItems[index].checked;
        setShoppingList({ ...shoppingList, items: newItems });
    };

    const deleteItem = (index: number) => {
        const newItems = shoppingList.items.filter((_, i) => i !== index);
        setShoppingList({ ...shoppingList, items: newItems });
    };

    const addItem = () => {
        if (!newName.trim()) return;
        const item: ShoppingItem = {
            name: newName.trim(),
            amount: parseFloat(newAmount) || 1,
            unit: newUnit.trim(),
            category: newCategory,
            checked: false,
        };
        setShoppingList({ ...shoppingList, items: [...shoppingList.items, item] });
        setNewName('');
        setNewAmount('');
        setNewUnit('');
        setNewCategory(CATEGORIES[0]);
    };

    const clearAll = () => {
        if (confirm('Einkaufsliste wirklich leeren?')) {
            setShoppingList({ items: [], estimatedTotal: 0 });
        }
    };

    const categories = Array.from(new Set(shoppingList.items.map(i => i.category)));
    const checkedCount = shoppingList.items.filter(i => i.checked).length;
    const totalCount = shoppingList.items.length;
    const progress = totalCount > 0 ? (checkedCount / totalCount) * 100 : 0;

    return (
        <div className="space-y-5 animate-fade-in">

            {/* ── Header ───────────────────────────────────── */}
            <div className="flex items-end justify-between">
                <div>
                    <h2 className="section-title">Einkaufsliste</h2>
                    <p className="text-sm mt-1 font-medium" style={{ color: 'var(--c-text-mid)' }}>
                        {settings.preferredStore} · {checkedCount} von {totalCount} erledigt
                    </p>
                </div>
                <div className="text-right">
                    <span className="block text-xs uppercase font-bold tracking-wide mb-0.5" style={{ color: 'var(--c-text-dim)' }}>Geschätzt</span>
                    <span className="text-2xl font-extrabold" style={{ color: 'var(--c-primary)', letterSpacing: '-0.02em' }}>
                        {shoppingList.estimatedTotal.toFixed(2)} €
                    </span>
                </div>
            </div>

            {/* ── Progress bar ─────────────────────────────── */}
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--c-surface-mid)' }}>
                <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${progress}%`, background: progress === 100 ? '#b8fd4b' : '#426500' }}
                />
            </div>

            {/* ── Action buttons ────────────────────────────── */}
            <div className="flex gap-2">
                <button
                    onClick={() => setShowAddForm(v => !v)}
                    className="btn-secondary flex items-center gap-1.5 text-sm"
                >
                    <Plus size={15} />
                    Artikel hinzufügen
                </button>
                <button
                    onClick={clearAll}
                    className="btn-secondary flex items-center gap-1.5 text-sm"
                    style={{ color: 'var(--c-text-mid)' }}
                >
                    <Trash2 size={15} />
                    Liste leeren
                </button>
            </div>

            {/* ── Add form ─────────────────────────────────── */}
            {showAddForm && (
                <div className="card p-4 space-y-3">
                    <input
                        className="input-field"
                        placeholder="Artikelname"
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && addItem()}
                        autoFocus
                    />
                    <div className="flex gap-2">
                        <input
                            className="input-field"
                            style={{ width: '5rem' }}
                            placeholder="Menge"
                            type="number"
                            min="0"
                            value={newAmount}
                            onChange={e => setNewAmount(e.target.value)}
                        />
                        <input
                            className="input-field"
                            style={{ width: '6rem' }}
                            placeholder="Einheit"
                            value={newUnit}
                            onChange={e => setNewUnit(e.target.value)}
                        />
                        <select
                            className="input-field"
                            value={newCategory}
                            onChange={e => setNewCategory(e.target.value)}
                        >
                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div className="flex gap-2 justify-end">
                        <button className="btn-secondary text-sm" onClick={() => setShowAddForm(false)}>
                            Schließen
                        </button>
                        <button className="btn-primary text-sm" onClick={addItem} disabled={!newName.trim()}>
                            Hinzufügen
                        </button>
                    </div>
                </div>
            )}

            {/* ── List ─────────────────────────────────────── */}
            {totalCount > 0 && (
                <div className="card overflow-hidden">
                    {categories.map((category, catIdx) => {
                        const items = shoppingList.items.filter(i => i.category === category);
                        return (
                            <div key={category}>
                                {/* Category header */}
                                <div className={`px-5 py-2.5 flex items-center justify-between
                                    ${catIdx === 0 ? '' : 'border-t'}`}
                                     style={{ background: 'var(--c-surface-low)', borderColor: 'var(--c-border-soft)' }}
                                >
                                    <span className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--c-text-mid)' }}>
                                        {category}
                                    </span>
                                    <span className="text-xs font-semibold" style={{ color: 'var(--c-text-dim)' }}>
                                        {items.filter(i => i.checked).length}/{items.length}
                                    </span>
                                </div>

                                {/* Items */}
                                <div>
                                    {items.map((item) => {
                                        const realIndex = shoppingList.items.indexOf(item);
                                        return (
                                            <div
                                                key={realIndex}
                                                className="w-full flex items-center gap-3.5 px-5 py-3.5 border-t"
                                                style={{ borderColor: 'var(--c-bg)' }}
                                            >
                                                {/* Checkbox */}
                                                <button
                                                    onClick={() => toggleItem(realIndex)}
                                                    className={`checkbox-custom shrink-0 ${item.checked ? 'checked' : ''}`}
                                                >
                                                    {item.checked && <Check size={12} className="text-white" />}
                                                </button>

                                                {/* Name + amount */}
                                                <div
                                                    onClick={() => toggleItem(realIndex)}
                                                    className={`flex-1 flex items-center justify-between transition-opacity cursor-pointer ${item.checked ? 'opacity-40' : ''}`}
                                                >
                                                    <span className={`font-semibold text-sm ${item.checked ? 'line-through' : ''}`}
                                                          style={{ color: 'var(--c-text)' }}>
                                                        {item.name}
                                                    </span>
                                                    <span className="text-sm ml-3 shrink-0 font-medium" style={{ color: 'var(--c-text-mid)' }}>
                                                        {item.amount} {item.unit}
                                                    </span>
                                                </div>

                                                {/* Delete */}
                                                <button
                                                    onClick={() => deleteItem(realIndex)}
                                                    className="shrink-0 p-1 rounded opacity-30 hover:opacity-100 transition-opacity"
                                                    style={{ color: 'var(--c-text-mid)' }}
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}

                    {/* All done state */}
                    {checkedCount === totalCount && totalCount > 0 && (
                        <div className="px-5 py-6 flex flex-col items-center gap-2 border-t" style={{ borderColor: 'var(--c-border-soft)' }}>
                            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: '#b8fd4b' }}>
                                <Check style={{ color: '#3d5e00' }} size={22} />
                            </div>
                            <p className="text-sm font-bold" style={{ color: 'var(--c-primary)' }}>Alles eingekauft!</p>
                        </div>
                    )}
                </div>
            )}

            {totalCount === 0 && (
                <div className="card px-5 py-10 flex flex-col items-center gap-2">
                    <p className="text-sm font-medium" style={{ color: 'var(--c-text-dim)' }}>Die Liste ist leer.</p>
                </div>
            )}
        </div>
    );
};

export default ShoppingListView;
