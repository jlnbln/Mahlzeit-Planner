
import React from 'react';
import { ShoppingList, AppSettings } from '../types';
import { Check } from 'lucide-react';

interface ShoppingListProps {
    shoppingList: ShoppingList;
    settings: AppSettings;
    setShoppingList: (list: ShoppingList) => void;
}

const ShoppingListView: React.FC<ShoppingListProps> = ({ shoppingList, settings, setShoppingList }) => {
    const toggleItem = (index: number) => {
        const newItems = [...shoppingList.items];
        newItems[index].checked = !newItems[index].checked;
        setShoppingList({ ...shoppingList, items: newItems });
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

            {/* ── List ─────────────────────────────────────── */}
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
                                        <button
                                            key={realIndex}
                                            onClick={() => toggleItem(realIndex)}
                                            className="w-full flex items-center gap-3.5 px-5 py-3.5 transition-colors text-left border-t"
                                            style={{ borderColor: 'var(--c-bg)' }}
                                            onMouseEnter={e => (e.currentTarget.style.background = 'var(--c-bg)')}
                                            onMouseLeave={e => (e.currentTarget.style.background = '')}
                                        >
                                            {/* Checkbox */}
                                            <div className={`checkbox-custom shrink-0 ${item.checked ? 'checked' : ''}`}>
                                                {item.checked && <Check size={12} className="text-white" />}
                                            </div>

                                            {/* Name + amount */}
                                            <div className={`flex-1 flex items-center justify-between transition-opacity ${item.checked ? 'opacity-40' : ''}`}>
                                                <span className={`font-semibold text-sm ${item.checked ? 'line-through' : ''}`}
                                                      style={{ color: 'var(--c-text)' }}>
                                                    {item.name}
                                                </span>
                                                <span className="text-sm ml-3 shrink-0 font-medium" style={{ color: 'var(--c-text-mid)' }}>
                                                    {item.amount} {item.unit}
                                                </span>
                                            </div>
                                        </button>
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
        </div>
    );
};

export default ShoppingListView;
