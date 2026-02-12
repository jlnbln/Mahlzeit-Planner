
import React, { useState } from 'react';
import { AppSettings } from '../types';
import { Settings, Sun, ChefHat, ShoppingCart, AlertTriangle, Database, LogOut, Calendar } from 'lucide-react';
import { DAYS_OF_WEEK } from '../constants';

interface SettingsProps {
    settings: AppSettings;
    onUpdateSettings: (s: AppSettings) => void;
    onRequestReset: () => void;
    onSignOut: () => void;
}

const SettingsView: React.FC<SettingsProps> = ({ settings, onUpdateSettings, onRequestReset, onSignOut }) => {
    const [showDangerZone, setShowDangerZone] = useState(false);

    return (
        <div className="animate-fade-in max-w-md mx-auto">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6 flex items-center">
                    <Settings className="mr-3 text-emerald-600" /> Einstellungen
                </h2>
                
                <div className="space-y-6">
                    {/* Account Section */}
                     <div className="pb-4 border-b border-slate-100 dark:border-slate-700">
                        <button 
                            onClick={onSignOut}
                            className="w-full py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-medium hover:bg-slate-200 dark:hover:bg-slate-600 flex items-center justify-center transition"
                        >
                            <LogOut size={18} className="mr-2" /> Abmelden
                        </button>
                    </div>

                    {/* Appearance Section */}
                    <div className="pb-4 border-b border-slate-100 dark:border-slate-700">
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center">
                            <Sun size={18} className="mr-2 text-slate-400" /> Erscheinungsbild
                        </h3>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-600 dark:text-slate-300">Dark Mode</span>
                            <button 
                                onClick={() => onUpdateSettings({ ...settings, theme: settings.theme === 'light' ? 'dark' : 'light' })}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.theme === 'dark' ? 'bg-emerald-600' : 'bg-slate-200'}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${settings.theme === 'dark' ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>
                    </div>

                    {/* Planning Logic Section */}
                    <div className="pb-4 border-b border-slate-100 dark:border-slate-700">
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center">
                            <Calendar size={18} className="mr-2 text-slate-400" /> Planung
                        </h3>
                         <div className="mb-4">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Wochenstart</label>
                            <select 
                                value={settings.weekStartDay}
                                onChange={(e) => onUpdateSettings({ ...settings, weekStartDay: e.target.value })}
                                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                            >
                                {DAYS_OF_WEEK.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                            <p className="text-xs text-slate-400 mt-1">Die Woche wird ab diesem Tag angezeigt und geplant.</p>
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <span className="block text-sm text-slate-600 dark:text-slate-300">Wochenende einplanen</span>
                                <span className="text-xs text-slate-400">Samstag & Sonntag in Plan aufnehmen.</span>
                            </div>
                            <button 
                                onClick={() => onUpdateSettings({ ...settings, includeWeekends: !settings.includeWeekends })}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.includeWeekends ? 'bg-emerald-600' : 'bg-slate-200'}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${settings.includeWeekends ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>
                    </div>

                    {/* Kitchen Section */}
                    <div className="pb-4 border-b border-slate-100 dark:border-slate-700">
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center">
                            <ChefHat size={18} className="mr-2 text-slate-400" /> Küchengeräte & Gewohnheiten
                        </h3>
                        
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <span className="block text-sm text-slate-600 dark:text-slate-300">Thermomix verwenden</span>
                            </div>
                            <button 
                                onClick={() => onUpdateSettings({ ...settings, useThermomix: !settings.useThermomix })}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.useThermomix ? 'bg-emerald-600' : 'bg-slate-200'}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${settings.useThermomix ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <span className="block text-sm text-slate-600 dark:text-slate-300">Reste verwerten</span>
                            </div>
                            <button 
                                onClick={() => onUpdateSettings({ ...settings, useLeftovers: !settings.useLeftovers })}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.useLeftovers ? 'bg-emerald-600' : 'bg-slate-200'}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${settings.useLeftovers ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>
                    </div>

                    {/* Shopping Section */}
                    <div className="pb-4 border-b border-slate-100 dark:border-slate-700">
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center">
                            <ShoppingCart size={18} className="mr-2 text-slate-400" /> Einkauf
                        </h3>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Bevorzugter Supermarkt</label>
                            <select 
                                value={settings.preferredStore}
                                onChange={(e) => onUpdateSettings({ ...settings, preferredStore: e.target.value })}
                                className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                            >
                                <option value="Rewe">Rewe (Empfohlen)</option>
                                <option value="Edeka">Edeka</option>
                                <option value="Aldi">Aldi</option>
                                <option value="Lidl">Lidl</option>
                                <option value="Kaufland">Kaufland</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <button 
                            onClick={() => setShowDangerZone(!showDangerZone)}
                            className="flex items-center w-full justify-between text-sm font-bold text-red-600 hover:text-red-700"
                        >
                            <span>Gefahrenzone</span>
                            <AlertTriangle size={16} />
                        </button>
                        
                        {showDangerZone && (
                            <div className="mt-4 p-4 border border-red-200 bg-red-50 dark:bg-red-900/20 rounded-xl">
                                <h4 className="font-bold text-red-700 dark:text-red-400 mb-2 flex items-center">
                                    <Database size={16} className="mr-2"/> Datenbank zurücksetzen
                                </h4>
                                <p className="text-xs text-red-600/80 dark:text-red-300 mb-4">
                                    Dies löscht alle Benutzer, Pläne und gespeicherten Rezepte unwiderruflich.
                                </p>
                                <button 
                                    onClick={onRequestReset}
                                    className="w-full py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700"
                                >
                                    Alles zurücksetzen
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsView;
