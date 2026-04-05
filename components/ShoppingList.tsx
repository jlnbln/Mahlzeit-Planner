
import React from 'react';
import { ShoppingList, AppSettings } from '../types';
import { Check, ShoppingCart } from 'lucide-react';

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

    return (
        <div className="space-y-5 animate-fade-in">

            {/* ── Header ───────────────────────────────────── */}
            <div className="flex items-end justify-between">
                <div>
                    <h2 className="section-title">Einkaufsliste</h2>
                    <p className="text-sm text-[#6E6A60] dark:text-[#9A9690] mt-1">
                        {settings.preferredStore} · {checkedCount} von {totalCount} erledigt
                    </p>
                </div>
                <div className="text-right">
                    <span className="block text-xs text-[#A38E72] dark:text-[#6B6762] uppercase font-semibold tracking-wide mb-0.5">Geschätzt</span>
                    <span className="text-2xl font-bold text-forest-500 dark:text-[#4FC475] font-display">
                        {shoppingList.estimatedTotal.toFixed(2)} €
                    </span>
                </div>
            </div>

            {/* ── Progress bar ─────────────────────────────── */}
            <div className="h-1.5 bg-clay-200 dark:bg-[#2A3427] rounded-full overflow-hidden">
                <div
                    className="h-full bg-forest-500 dark:bg-[#4FC475] rounded-full transition-all duration-500"
                    style={{ width: `${totalCount > 0 ? (checkedCount / totalCount) * 100 : 0}%` }}
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
                                ${catIdx === 0 ? '' : 'border-t border-clay-100 dark:border-[#2A3427]'}
                                bg-clay-50 dark:bg-[#232B1F]`}
                            >
                                <span className="text-xs font-semibold uppercase tracking-wide text-[#6E6A60] dark:text-[#9A9690]">
                                    {category}
                                </span>
                                <span className="text-xs text-[#A38E72] dark:text-[#6B6762]">
                                    {items.filter(i => i.checked).length}/{items.length}
                                </span>
                            </div>

                            {/* Items */}
                            <div className="divide-y divide-clay-50 dark:divide-[#232B1F]">
                                {items.map((item) => {
                                    const realIndex = shoppingList.items.indexOf(item);
                                    return (
                                        <button
                                            key={realIndex}
                                            onClick={() => toggleItem(realIndex)}
                                            className="w-full flex items-center gap-3.5 px-5 py-3.5 hover:bg-clay-50 dark:hover:bg-[#232B1F] transition-colors text-left"
                                        >
                                            {/* Checkbox */}
                                            <div className={`checkbox-custom shrink-0 ${item.checked ? 'checked' : ''}`}>
                                                {item.checked && <Check size={12} className="text-white" />}
                                            </div>

                                            {/* Name + amount */}
                                            <div className={`flex-1 flex items-center justify-between transition-opacity ${item.checked ? 'opacity-40' : ''}`}>
                                                <span className={`font-medium text-[#1C1A16] dark:text-[#F0EDE5] text-sm ${item.checked ? 'line-through' : ''}`}>
                                                    {item.name}
                                                </span>
                                                <span className="text-sm text-[#6E6A60] dark:text-[#9A9690] ml-3 shrink-0">
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
                    <div className="px-5 py-6 flex flex-col items-center gap-2 border-t border-clay-100 dark:border-[#2A3427]">
                        <div className="w-10 h-10 rounded-full bg-forest-50 dark:bg-[rgba(79,196,117,0.12)] flex items-center justify-center">
                            <Check className="text-forest-500 dark:text-[#4FC475]" size={20} />
                        </div>
                        <p className="text-sm font-medium text-[#6E6A60] dark:text-[#9A9690]">Alles eingekauft!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ShoppingListView;
