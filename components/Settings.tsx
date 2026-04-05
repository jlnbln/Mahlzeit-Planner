
import React, { useState } from 'react';
import { AppSettings } from '../types';
import { Sun, Moon, ChefHat, ShoppingCart, AlertTriangle, Database, LogOut, Calendar, ChevronDown } from 'lucide-react';
import { DAYS_OF_WEEK } from '../constants';

interface SettingsProps {
    settings: AppSettings;
    onUpdateSettings: (s: AppSettings) => void;
    onRequestReset: () => void;
    onSignOut: () => void;
}

const Toggle = ({ on, onToggle }: { on: boolean; onToggle: () => void }) => (
    <button
        onClick={onToggle}
        className={`toggle ${on ? 'on bg-forest-500 dark:bg-[#4FC475]' : 'bg-clay-200 dark:bg-[#2A3427]'}`}
        role="switch"
        aria-checked={on}
    >
        <span className="toggle-thumb" />
    </button>
);

const SettingRow = ({ label, sub, control }: { label: string; sub?: string; control: React.ReactNode }) => (
    <div className="flex items-center justify-between gap-4 py-3.5">
        <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[#1C1A16] dark:text-[#F0EDE5]">{label}</p>
            {sub && <p className="text-xs text-[#A38E72] dark:text-[#6B6762] mt-0.5">{sub}</p>}
        </div>
        {control}
    </div>
);

const Section = ({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) => (
    <div className="card overflow-hidden">
        <div className="px-5 py-3 border-b border-clay-100 dark:border-[#2A3427] flex items-center gap-2 bg-clay-50 dark:bg-[#232B1F]">
            <span className="text-[#6E6A60] dark:text-[#9A9690]">{icon}</span>
            <h3 className="text-sm font-semibold text-[#1C1A16] dark:text-[#F0EDE5]">{title}</h3>
        </div>
        <div className="px-5 divide-y divide-clay-50 dark:divide-[#232B1F]">
            {children}
        </div>
    </div>
);

const SettingsView: React.FC<SettingsProps> = ({ settings, onUpdateSettings, onRequestReset, onSignOut }) => {
    const [showDangerZone, setShowDangerZone] = useState(false);

    return (
        <div className="max-w-lg mx-auto space-y-4 animate-fade-in">

            <h2 className="section-title">Einstellungen</h2>

            {/* Account */}
            <Section icon={<LogOut size={15} />} title="Konto">
                <div className="py-3.5">
                    <button
                        onClick={onSignOut}
                        className="btn-ghost w-full gap-2"
                    >
                        <LogOut size={16} /> Abmelden
                    </button>
                </div>
            </Section>

            {/* Appearance */}
            <Section icon={settings.theme === 'dark' ? <Moon size={15} /> : <Sun size={15} />} title="Erscheinungsbild">
                <SettingRow
                    label="Dark Mode"
                    sub="Dunkles Farbschema verwenden"
                    control={
                        <Toggle
                            on={settings.theme === 'dark'}
                            onToggle={() => onUpdateSettings({ ...settings, theme: settings.theme === 'light' ? 'dark' : 'light' })}
                        />
                    }
                />
            </Section>

            {/* Planning */}
            <Section icon={<Calendar size={15} />} title="Planung">
                <SettingRow
                    label="Wochenstart"
                    control={
                        <select
                            value={settings.weekStartDay}
                            onChange={(e) => onUpdateSettings({ ...settings, weekStartDay: e.target.value })}
                            className="input-field w-auto text-sm py-1.5 pr-8"
                        >
                            {DAYS_OF_WEEK.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    }
                />
                <SettingRow
                    label="Wochenende einplanen"
                    sub="Samstag & Sonntag einbeziehen"
                    control={
                        <Toggle
                            on={settings.includeWeekends}
                            onToggle={() => onUpdateSettings({ ...settings, includeWeekends: !settings.includeWeekends })}
                        />
                    }
                />
            </Section>

            {/* Kitchen */}
            <Section icon={<ChefHat size={15} />} title="Küchengeräte & Gewohnheiten">
                <SettingRow
                    label="Thermomix verwenden"
                    sub="Passende Rezepte bevorzugen"
                    control={
                        <Toggle
                            on={settings.useThermomix}
                            onToggle={() => onUpdateSettings({ ...settings, useThermomix: !settings.useThermomix })}
                        />
                    }
                />
                <SettingRow
                    label="Reste verwerten"
                    sub="Vortagesreste als Mittagessen einplanen"
                    control={
                        <Toggle
                            on={settings.useLeftovers}
                            onToggle={() => onUpdateSettings({ ...settings, useLeftovers: !settings.useLeftovers })}
                        />
                    }
                />
            </Section>

            {/* Shopping */}
            <Section icon={<ShoppingCart size={15} />} title="Einkauf">
                <SettingRow
                    label="Bevorzugter Supermarkt"
                    control={
                        <select
                            value={settings.preferredStore}
                            onChange={(e) => onUpdateSettings({ ...settings, preferredStore: e.target.value })}
                            className="input-field w-auto text-sm py-1.5 pr-8"
                        >
                            <option value="Rewe">Rewe</option>
                            <option value="Edeka">Edeka</option>
                            <option value="Aldi">Aldi</option>
                            <option value="Lidl">Lidl</option>
                            <option value="Kaufland">Kaufland</option>
                        </select>
                    }
                />
            </Section>

            {/* Danger zone */}
            <div className="card overflow-hidden">
                <button
                    onClick={() => setShowDangerZone(!showDangerZone)}
                    className="w-full px-5 py-3.5 flex items-center justify-between text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                >
                    <span className="flex items-center gap-2 text-sm font-semibold">
                        <AlertTriangle size={15} /> Gefahrenzone
                    </span>
                    <ChevronDown size={16} className={`transition-transform ${showDangerZone ? 'rotate-180' : ''}`} />
                </button>

                {showDangerZone && (
                    <div className="px-5 pb-5 animate-slide-up">
                        <div className="p-4 border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-900/10 rounded-xl">
                            <p className="text-xs text-red-700 dark:text-red-400 mb-3 flex items-start gap-2">
                                <Database size={14} className="mt-0.5 shrink-0" />
                                Dies löscht alle Benutzerprofile, Pläne und Rezepte unwiderruflich.
                            </p>
                            <button
                                onClick={onRequestReset}
                                className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors"
                            >
                                Alles zurücksetzen
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SettingsView;
