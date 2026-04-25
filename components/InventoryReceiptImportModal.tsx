
import React, { useState } from 'react';
import { InventoryItem } from '../types';
import { X, Upload, Loader2, AlertTriangle, FileText, Check } from 'lucide-react';
import { importInventoryFromReceipt } from '../services/aiService';

interface Props {
    onImport: (items: InventoryItem[]) => void;
    onClose: () => void;
}

const ModalShell = ({ children, onClose }: { children: React.ReactNode; onClose: () => void }) => (
    <div className="modal-backdrop" onClick={onClose}>
        <div
            className="modal-sheet bg-white dark:bg-[#1e2a1e] w-full max-w-lg rounded-2xl shadow-modal overflow-hidden flex flex-col max-h-[90dvh] sm:max-h-[88vh]"
            onClick={e => e.stopPropagation()}
        >
            {children}
        </div>
    </div>
);

const InventoryReceiptImportModal: React.FC<Props> = ({ onImport, onClose }) => {
    const [file, setFile] = useState<File | null>(null);
    const [fileBase64, setFileBase64] = useState('');
    const [preview, setPreview] = useState<string | null>(null); // image preview URL or null for PDF
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [previewItems, setPreviewItems] = useState<InventoryItem[] | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (!f) return;
        setFile(f);
        setError(null);
        setPreviewItems(null);

        const reader = new FileReader();
        reader.onload = (ev) => {
            const dataUrl = ev.target?.result as string;
            setFileBase64(dataUrl.split(',')[1]);
            if (f.type.startsWith('image/')) {
                setPreview(dataUrl);
            } else {
                setPreview(null); // PDF — no image preview
            }
        };
        reader.readAsDataURL(f);
    };

    const handleAnalyze = async () => {
        if (!file || !fileBase64) { setError('Bitte eine Datei auswählen.'); return; }
        setError(null);
        setIsLoading(true);
        try {
            const type = file.type === 'application/pdf' ? 'pdf' : 'image';
            const items = await importInventoryFromReceipt(type, fileBase64, file.type);
            if (items.length === 0) throw new Error('Keine Lebensmittel erkannt. Versuche ein klareres Foto oder PDF.');
            setPreviewItems(items);
        } catch (err: any) {
            setError(err.message || 'Fehler beim Analysieren. Bitte erneut versuchen.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirm = () => {
        if (previewItems) onImport(previewItems);
    };

    return (
        <ModalShell onClose={onClose}>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#e6e9e1] dark:border-[#2c3a2c] shrink-0">
                <div>
                    <h2 className="font-bold text-base" style={{ color: 'var(--c-text)' }}>Beleg importieren</h2>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--c-text-dim)' }}>Rechnung oder Quittung als PDF oder Foto</p>
                </div>
                <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full" style={{ color: 'var(--c-text-mid)' }}>
                    <X size={18} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {/* File picker */}
                {!previewItems && (
                    <>
                        {file ? (
                            <div className="flex items-center gap-3 p-3 rounded-xl border border-[#e6e9e1] dark:border-[#2c3a2c]">
                                {preview ? (
                                    <img src={preview} alt="Vorschau" className="w-16 h-16 object-cover rounded-lg border border-[#e6e9e1] dark:border-[#2c3a2c]" />
                                ) : (
                                    <div className="w-16 h-16 rounded-lg flex items-center justify-center" style={{ background: 'var(--c-surface-low)' }}>
                                        <FileText size={28} style={{ color: 'var(--c-primary)' }} />
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--c-text)' }}>{file.name}</p>
                                    <p className="text-xs" style={{ color: 'var(--c-text-dim)' }}>
                                        {(file.size / 1024).toFixed(0)} KB · {file.type === 'application/pdf' ? 'PDF' : 'Bild'}
                                    </p>
                                </div>
                                <button
                                    onClick={() => { setFile(null); setFileBase64(''); setPreview(null); }}
                                    className="p-1.5 rounded-lg border border-[#c4c8be] dark:border-[#2c3a2c]"
                                    style={{ color: 'var(--c-text-dim)' }}
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        ) : (
                            <label className="flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed border-[#c4c8be] dark:border-[#2c3a2c] rounded-xl cursor-pointer hover:border-[#b8fd4b] dark:hover:border-[#4FC475] hover:bg-[#eff2ea] dark:hover:bg-[rgba(79,196,117,0.04)] transition-all">
                                <Upload size={28} className="text-[#c4c8be] dark:text-[#3a4835]" />
                                <div className="text-center">
                                    <span className="text-sm font-medium" style={{ color: 'var(--c-text-mid)' }}>PDF oder Bild auswählen</span>
                                    <p className="text-xs mt-1" style={{ color: 'var(--c-text-dim)' }}>Kassenbon, Rechnung, Foto (.pdf, .jpg, .png)</p>
                                </div>
                                <input type="file" accept="image/*,application/pdf" className="sr-only" onChange={handleFileChange} />
                            </label>
                        )}
                    </>
                )}

                {/* Analyzed items preview */}
                {previewItems && (
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: '#b8fd4b' }}>
                                <Check size={13} style={{ color: '#3d5e00' }} />
                            </div>
                            <p className="text-sm font-bold" style={{ color: 'var(--c-text)' }}>
                                {previewItems.length} Artikel erkannt
                            </p>
                        </div>
                        <div className="card overflow-hidden max-h-64 overflow-y-auto">
                            {previewItems.map((item, i) => (
                                <div key={i} className="flex items-center justify-between px-4 py-2.5 border-b last:border-b-0" style={{ borderColor: 'var(--c-bg)' }}>
                                    <span className="text-sm font-medium" style={{ color: 'var(--c-text)' }}>{item.name}</span>
                                    <span className="text-sm ml-3 shrink-0" style={{ color: 'var(--c-text-dim)' }}>
                                        {item.amount} {item.unit}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={() => setPreviewItems(null)}
                            className="text-xs underline"
                            style={{ color: 'var(--c-text-dim)' }}
                        >
                            Andere Datei auswählen
                        </button>
                    </div>
                )}

                {error && (
                    <div className="flex items-start gap-2.5 p-3.5 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800/30">
                        <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
                        <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                    </div>
                )}
            </div>

            <div className="flex justify-end gap-3 px-5 py-4 border-t border-[#e6e9e1] dark:border-[#2c3a2c] shrink-0">
                <button onClick={onClose} className="btn-ghost" disabled={isLoading}>Abbrechen</button>
                {previewItems ? (
                    <button onClick={handleConfirm} className="btn-primary gap-2">
                        <Check size={16} /> Zum Inventar hinzufügen
                    </button>
                ) : (
                    <button onClick={handleAnalyze} className="btn-primary gap-2" disabled={!file || isLoading}>
                        {isLoading
                            ? <><Loader2 size={16} className="animate-spin" /> Analysiere…</>
                            : <><Upload size={16} /> Analysieren</>
                        }
                    </button>
                )}
            </div>
        </ModalShell>
    );
};

export default InventoryReceiptImportModal;
