
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

    return (
        <div className="animate-fade-in space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Einkaufsliste ({settings.preferredStore})</h2>
                <div className="text-right">
                        <span className="block text-xs text-slate-500 dark:text-slate-400 uppercase">Geschätzt</span>
                        <span className="text-xl font-bold text-emerald-700 dark:text-emerald-400">{shoppingList.estimatedTotal.toFixed(2)} €</span>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                {Array.from(new Set(shoppingList.items.map(i => i.category))).map(category => (
                    <div key={category}>
                            <div className="bg-slate-50 dark:bg-slate-700/50 px-6 py-2 border-y border-slate-100 dark:border-slate-700 font-semibold text-sm text-slate-600 dark:text-slate-300">
                            {category}
                            </div>
                            <div className="p-2">
                            {shoppingList.items.filter(i => i.category === category).map((item, idx) => {
                                const realIndex = shoppingList.items.indexOf(item);
                                return (
                                    <div 
                                        key={idx} 
                                        onClick={() => toggleItem(realIndex)}
                                        className="flex items-center p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg cursor-pointer group"
                                    >
                                        <div className={`w-5 h-5 rounded border flex items-center justify-center mr-4 transition ${item.checked ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 dark:border-slate-600'}`}>
                                            {item.checked && <Check size={14} className="text-white" />}
                                        </div>
                                        <div className={item.checked ? 'opacity-40 line-through' : ''}>
                                            <span className="font-medium text-slate-800 dark:text-slate-200">{item.name}</span>
                                            <span className="text-slate-500 dark:text-slate-400 text-sm ml-2">{item.amount} {item.unit}</span>
                                        </div>
                                    </div>
                                )
                            })}
                            </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ShoppingListView;
