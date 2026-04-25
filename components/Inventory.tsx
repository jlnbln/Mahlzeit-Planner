
import React, { useState } from 'react';
import { Inventory, InventoryItem, UserProfile } from '../types';
import { INVENTORY_CATEGORIES } from '../constants';
import { parseGermanNumber } from '../utils/units';
import { Plus, Trash2, ChevronDown, ChevronRight, Package, Edit2, Check, X, FileText, Sparkles } from 'lucide-react';

interface InventoryViewProps {
    inventory: Inventory;
    users: UserProfile[];
    setInventory: (inv: Inventory) => void;
    onImportReceipt: () => void;
    onGenerateRecipes: () => void;
}

const InventoryView: React.FC<InventoryViewProps> = ({
    inventory,
    users: _users,
    setInventory,
    onImportReceipt,
    onGenerateRecipes,
}) => {
    const [showAddForm, setShowAddForm] = useState(false);
    const [newName, setNewName] = useState('');
    const [newAmount, setNewAmount] = useState('');
    const [newUnit, setNewUnit] = useState('');
    const [newCategory, setNewCategory] = useState(INVENTORY_CATEGORIES[0]);

    // Collapsible category state — all open by default
    const [closedCats, setClosedCats] = useState<Set<string>>(new Set());

    // Inline editing state
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editAmount, setEditAmount] = useState('');

    const toggleCategory = (cat: string) => {
        setClosedCats(prev => {
            const next = new Set(prev);
            if (next.has(cat)) next.delete(cat);
            else next.add(cat);
            return next;
        });
    };

    const addItem = () => {
        if (!newName.trim()) return;
        const item: InventoryItem = {
            id: `inv_${Date.now()}_${Math.random()}`,
            name: newName.trim(),
            amount: parseGermanNumber(newAmount) || 1,
            unit: newUnit.trim() || 'Stück',
            category: newCategory,
            addedAt: new Date().toISOString(),
        };
        setInventory({ items: [...inventory.items, item] });
        setNewName('');
        setNewAmount('');
        setNewUnit('');
        setNewCategory(INVENTORY_CATEGORIES[0]);
    };

    const deleteItem = (id: string) => {
        setInventory({ items: inventory.items.filter(i => i.id !== id) });
    };

    const startEdit = (item: InventoryItem) => {
        setEditingId(item.id);
        setEditAmount(String(item.amount));
    };

    const commitEdit = (item: InventoryItem) => {
        const parsed = parseGermanNumber(editAmount);
        if (parsed <= 0) {
            deleteItem(item.id);
        } else {
            setInventory({
                items: inventory.items.map(i =>
                    i.id === item.id ? { ...i, amount: parsed } : i
                ),
            });
        }
        setEditingId(null);
    };

    const adjustAmount = (item: InventoryItem, delta: number) => {
        const newAmt = Math.max(0, item.amount + delta);
        if (newAmt === 0) {
            deleteItem(item.id);
        } else {
            setInventory({
                items: inventory.items.map(i =>
                    i.id === item.id ? { ...i, amount: newAmt } : i
                ),
            });
        }
    };

    // Derive ordered categories present in inventory
    const presentCats = INVENTORY_CATEGORIES.filter(cat =>
        inventory.items.some(i => i.category === cat)
    );
    // Also include any categories not in the canonical list (e.g. from old data)
    const extraCats = Array.from(new Set(inventory.items.map(i => i.category)))
        .filter(c => !INVENTORY_CATEGORIES.includes(c));
    const allCats = [...presentCats, ...extraCats];

    const totalCount = inventory.items.length;

    return (
        <div className="space-y-5 animate-fade-in">

            {/* ── Header ─────────────────────────────────────── */}
            <div className="flex items-end justify-between">
                <div>
                    <h2 className="section-title">Inventar</h2>
                    <p className="text-sm mt-1 font-medium" style={{ color: 'var(--c-text-mid)' }}>
                        {totalCount} {totalCount === 1 ? 'Artikel' : 'Artikel'} vorrätig
                    </p>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'var(--c-surface-low)' }}>
                        <Package size={18} style={{ color: 'var(--c-primary)' }} />
                    </div>
                </div>
            </div>

            {/* ── Action buttons ──────────────────────────────── */}
            <div className="flex flex-wrap gap-2">
                <button
                    onClick={() => setShowAddForm(v => !v)}
                    className="btn-secondary flex items-center gap-1.5 text-sm"
                >
                    <Plus size={15} />
                    Hinzufügen
                </button>
                <button
                    onClick={onImportReceipt}
                    className="btn-secondary flex items-center gap-1.5 text-sm"
                >
                    <FileText size={15} />
                    Beleg importieren
                </button>
                <button
                    onClick={onGenerateRecipes}
                    className="btn-secondary flex items-center gap-1.5 text-sm"
                    disabled={totalCount === 0}
                >
                    <Sparkles size={15} />
                    Rezepte vorschlagen
                </button>
            </div>

            {/* ── Add form ────────────────────────────────────── */}
            {showAddForm && (
                <div className="card p-4 space-y-3">
                    <input
                        className="input-field"
                        placeholder="Artikelname (z.B. Kartoffeln)"
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
                            className="input-field flex-1"
                            value={newCategory}
                            onChange={e => setNewCategory(e.target.value)}
                        >
                            {INVENTORY_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
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

            {/* ── Category list ────────────────────────────────── */}
            {totalCount > 0 && (
                <div className="card overflow-hidden">
                    {allCats.map((cat, catIdx) => {
                        const items = inventory.items.filter(i => i.category === cat);
                        if (items.length === 0) return null;
                        const isOpen = !closedCats.has(cat);
                        return (
                            <div key={cat}>
                                {/* Category header — clickable to toggle */}
                                <button
                                    className={`w-full px-5 py-2.5 flex items-center justify-between transition-colors
                                        ${catIdx === 0 ? '' : 'border-t'}`}
                                    style={{ background: 'var(--c-surface-low)', borderColor: 'var(--c-border-soft)' }}
                                    onClick={() => toggleCategory(cat)}
                                >
                                    <div className="flex items-center gap-2">
                                        {isOpen
                                            ? <ChevronDown size={14} style={{ color: 'var(--c-text-dim)' }} />
                                            : <ChevronRight size={14} style={{ color: 'var(--c-text-dim)' }} />
                                        }
                                        <span className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--c-text-mid)' }}>
                                            {cat}
                                        </span>
                                    </div>
                                    <span className="text-xs font-semibold" style={{ color: 'var(--c-text-dim)' }}>
                                        {items.length}
                                    </span>
                                </button>

                                {/* Items — only shown when category is open */}
                                {isOpen && (
                                    <div>
                                        {items.map((item) => (
                                            <div
                                                key={item.id}
                                                className="flex items-center gap-3 px-5 py-3 border-t"
                                                style={{ borderColor: 'var(--c-bg)' }}
                                            >
                                                {/* Name */}
                                                <span className="flex-1 text-sm font-semibold" style={{ color: 'var(--c-text)' }}>
                                                    {item.name}
                                                </span>

                                                {/* Amount controls */}
                                                <div className="flex items-center gap-1.5 shrink-0">
                                                    <button
                                                        onClick={() => adjustAmount(item, -1)}
                                                        className="w-6 h-6 rounded flex items-center justify-center text-base font-bold leading-none transition-colors"
                                                        style={{ background: 'var(--c-surface-low)', color: 'var(--c-text-mid)' }}
                                                    >
                                                        −
                                                    </button>

                                                    {editingId === item.id ? (
                                                        <input
                                                            className="input-field text-center text-sm font-semibold"
                                                            style={{ width: '4.5rem', padding: '2px 6px' }}
                                                            value={editAmount}
                                                            onChange={e => setEditAmount(e.target.value)}
                                                            onBlur={() => commitEdit(item)}
                                                            onKeyDown={e => { if (e.key === 'Enter') commitEdit(item); if (e.key === 'Escape') setEditingId(null); }}
                                                            autoFocus
                                                        />
                                                    ) : (
                                                        <button
                                                            onClick={() => startEdit(item)}
                                                            className="flex items-center gap-1 text-sm font-semibold rounded px-1.5 py-0.5 transition-colors hover:bg-[var(--c-surface-low)]"
                                                            style={{ color: 'var(--c-text)', minWidth: '4rem', justifyContent: 'center' }}
                                                        >
                                                            <span>{item.amount}</span>
                                                            <span style={{ color: 'var(--c-text-dim)' }}>{item.unit}</span>
                                                            <Edit2 size={10} style={{ color: 'var(--c-text-faint)', marginLeft: '2px' }} />
                                                        </button>
                                                    )}

                                                    {editingId === item.id ? (
                                                        <button
                                                            onClick={() => commitEdit(item)}
                                                            className="w-6 h-6 rounded flex items-center justify-center transition-colors"
                                                            style={{ background: '#b8fd4b', color: '#3d5e00' }}
                                                        >
                                                            <Check size={12} />
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => adjustAmount(item, 1)}
                                                            className="w-6 h-6 rounded flex items-center justify-center text-base font-bold leading-none transition-colors"
                                                            style={{ background: 'var(--c-surface-low)', color: 'var(--c-text-mid)' }}
                                                        >
                                                            +
                                                        </button>
                                                    )}
                                                </div>

                                                {/* Delete */}
                                                <button
                                                    onClick={() => deleteItem(item.id)}
                                                    className="shrink-0 p-1 rounded opacity-30 hover:opacity-100 transition-opacity"
                                                    style={{ color: 'var(--c-text-mid)' }}
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {totalCount === 0 && !showAddForm && (
                <div className="card px-5 py-12 flex flex-col items-center gap-3">
                    <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: 'var(--c-surface-low)' }}>
                        <Package size={24} style={{ color: 'var(--c-text-dim)' }} />
                    </div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--c-text-mid)' }}>Inventar ist leer</p>
                    <p className="text-xs text-center" style={{ color: 'var(--c-text-dim)' }}>
                        Füge Artikel manuell hinzu oder importiere einen Einkaufsbeleg.
                    </p>
                </div>
            )}
        </div>
    );
};

export default InventoryView;
