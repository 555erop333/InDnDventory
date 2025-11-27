import React, { useState, useEffect, useRef } from 'react';
import { Item, ItemCategory, Rarity } from '../types';
import { Trash2, ChevronDown, ChevronUp, Sparkles, Edit2, Check, X, Image as ImageIcon, Coins, Share } from 'lucide-react';

interface InventoryItemProps {
    item: Item;
    onUpdate: (id: string, updates: Partial<Item>) => void;
    onDelete: (id: string) => void;
    onTransfer?: (item: Item) => void;
    initialEditMode?: boolean;
}

const InventoryItem: React.FC<InventoryItemProps> = ({ item, onUpdate, onDelete, onTransfer, initialEditMode = false }) => {
    const [expanded, setExpanded] = useState(initialEditMode);
    const [isEditing, setIsEditing] = useState(initialEditMode);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [formData, setFormData] = useState<Item>({ ...item });
    const nameInputRef = useRef<HTMLInputElement>(null);

    // Sync form data only if NOT editing to prevent overwriting user input
    useEffect(() => {
        if (!isEditing) {
            setFormData({ ...item });
        }
    }, [item, isEditing]);

    useEffect(() => {
        if (isEditing && nameInputRef.current) {
            nameInputRef.current.focus();
            // Don't select all every time, just focus is enough often, but select is good for quick replace
            // nameInputRef.current.select(); 
        }
    }, [isEditing]);

    const increment = (e: React.MouseEvent) => { e.stopPropagation(); onUpdate(item.id, { quantity: item.quantity + 1 }); };
    const decrement = (e: React.MouseEvent) => { e.stopPropagation(); if (item.quantity > 1) onUpdate(item.id, { quantity: item.quantity - 1 }); };
    const handleTransfer = (e: React.MouseEvent) => { e.stopPropagation(); onTransfer?.(item); };
    const handleSave = (e?: React.MouseEvent) => { e?.stopPropagation(); onUpdate(item.id, formData); setIsEditing(false); };
    const handleCancel = (e?: React.MouseEvent) => { e?.stopPropagation(); setFormData({ ...item }); setIsEditing(false); };
    const toggleExpand = () => { if (!isEditing && !isDeleting) { setExpanded(!expanded); setShowDeleteConfirm(false); } };
    const handleEditStart = (e: React.MouseEvent) => { e.stopPropagation(); setIsEditing(true); setShowDeleteConfirm(false); setExpanded(true); };
    const confirmDelete = (e: React.MouseEvent) => { e.stopPropagation(); setIsDeleting(true); setTimeout(() => { onDelete(item.id); }, 650); };
    const toggleJunk = (e: React.MouseEvent) => { e.stopPropagation(); onUpdate(item.id, { isJunk: !item.isJunk }); };

    return (
        <div className={`bg-dnd-panel border-l-4 rounded mb-2 overflow-hidden transition-all shadow-sm ${item.isMagic ? 'border-l-dnd-gold' : 'border-l-dnd-muted'} ${!isEditing && !isDeleting ? 'hover:bg-white/5' : ''} ${isDeleting ? 'animate-crumble pointer-events-none' : ''} ${item.isJunk ? 'opacity-70 bg-black/20' : ''}`}>
            <div className="flex items-center p-3 cursor-pointer gap-3 min-h-[48px]" onClick={toggleExpand}>
                <div className="text-dnd-muted">{expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}</div>
                {isEditing ? (
                    <input ref={nameInputRef} type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} onClick={(e) => e.stopPropagation()} onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }} className="flex-1 min-w-0 bg-dnd-dark border border-dnd-muted rounded px-3 py-1 focus:border-dnd-gold outline-none text-base" placeholder="Название" />
                ) : (
                    <div className="flex-1 flex items-center gap-3 overflow-hidden">
                        <span className={`font-bold truncate text-base ${item.isMagic ? 'text-dnd-gold' : 'text-dnd-text'} ${item.isJunk ? 'line-through text-dnd-muted' : ''}`}>{item.name}</span>
                        {item.isMagic && <Sparkles size={14} className="text-dnd-gold flex-shrink-0" />}
                        {item.attunement && <span className="text-[10px] px-1.5 py-0.5 rounded bg-dnd-danger/20 text-dnd-danger border border-dnd-danger/50 font-bold">A</span>}
                        {item.isJunk && <span className="text-[10px] px-1.5 py-0.5 rounded bg-dnd-gold/10 text-dnd-gold border border-dnd-gold/30 ml-2">На продажу</span>}
                    </div>
                )}
                <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="flex items-center bg-dnd-dark rounded border border-dnd-muted/50 h-8">
                        <button onClick={decrement} disabled={isEditing} className="px-2 hover:bg-white/10 text-dnd-muted hover:text-white transition disabled:opacity-30 flex items-center h-full">-</button>
                        <span className="px-1 min-w-[1.5rem] text-center text-sm font-mono font-bold">{isEditing ? <input type="number" min="1" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })} onClick={(e) => e.stopPropagation()} className="w-8 bg-transparent text-center outline-none" /> : item.quantity}</span>
                        <button onClick={increment} disabled={isEditing} className="px-2 hover:bg-white/10 text-dnd-muted hover:text-white transition disabled:opacity-30 flex items-center h-full">+</button>
                    </div>
                    {isEditing ? (
                        <div className="flex items-center gap-2"><button onClick={handleSave} className="p-1.5 bg-dnd-success text-dnd-dark rounded"><Check size={16} /></button><button onClick={handleCancel} className="p-1.5 bg-dnd-danger text-white rounded"><X size={16} /></button></div>
                    ) : (
                        <div className="flex items-center gap-1.5">
                            {onTransfer && (
                                <button onClick={handleTransfer} className="p-1.5 text-dnd-muted hover:text-dnd-accent transition hover:bg-dnd-accent/10 rounded" title="Передать игроку">
                                    <Share size={16} />
                                </button>
                            )}
                            <button onClick={toggleJunk} className={`p-1.5 rounded transition ${item.isJunk ? 'text-dnd-gold bg-dnd-gold/10' : 'text-dnd-muted hover:text-dnd-text hover:bg-white/5'}`}><Coins size={16} /></button>
                            <button onClick={handleEditStart} className="p-1.5 text-dnd-muted hover:text-dnd-accent transition"><Edit2 size={16} /></button>
                            {showDeleteConfirm ? (
                                <div className="flex items-center gap-1 animate-fade-in" onClick={(e) => e.stopPropagation()}>
                                    <button onClick={confirmDelete} className="p-1 bg-dnd-danger text-white rounded text-xs font-bold px-2">Да</button>
                                    <button onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(false); }} className="p-1 bg-dnd-muted text-white rounded text-xs px-2">Нет</button>
                                </div>
                            ) : (
                                <button onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(true); }} className="p-1.5 text-dnd-muted hover:text-dnd-danger transition hover:bg-dnd-danger/10 rounded"><Trash2 size={16} /></button>
                            )}
                        </div>
                    )}
                </div>
            </div>
            {(expanded || isEditing) && (
                <div className="p-4 pt-0 border-t border-dnd-muted/20 mt-2">
                    {isEditing ? (
                        <div className="space-y-3 mt-3 animate-fade-in" onClick={(e) => e.stopPropagation()}>
                            <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full bg-dnd-dark border border-dnd-muted rounded p-2 text-sm h-20" />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-dnd-muted">
                                <label className="flex flex-col gap-1">
                                    <span>Тип предмета</span>
                                    <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value as ItemCategory })} className="w-full bg-dnd-dark border border-dnd-muted rounded p-2 text-sm text-dnd-text">{Object.values(ItemCategory).map(c => <option key={c} value={c}>{c}</option>)}</select>
                                </label>
                                <label className="flex flex-col gap-1">
                                    <span>Редкость</span>
                                    <select value={formData.rarity} onChange={(e) => setFormData({ ...formData, rarity: e.target.value as Rarity })} className="w-full bg-dnd-dark border border-dnd-muted rounded p-2 text-sm text-dnd-text">{Object.values(Rarity).map(r => <option key={r} value={r}>{r}</option>)}</select>
                                </label>
                                <label className="flex flex-col gap-1">
                                    <span>Вес (фнт)</span>
                                    <input type="number" value={formData.weight} onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) || 0 })} className="w-full bg-dnd-dark border border-dnd-muted rounded p-2 text-sm text-dnd-text" />
                                </label>
                                <label className="flex flex-col gap-1">
                                    <span>Цена (зм)</span>
                                    <input type="number" value={formData.cost} onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })} className="w-full bg-dnd-dark border border-dnd-muted rounded p-2 text-sm text-dnd-text" />
                                </label>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col sm:flex-row gap-4 mt-3 animate-fade-in">
                            <div className="flex-1">
                                <div className="flex gap-2 mb-2 text-xs">
                                    <span className="px-2 py-0.5 bg-white/5 rounded text-dnd-accent border border-white/10">{item.rarity}</span>
                                    <span className="px-2 py-0.5 bg-white/5 rounded text-dnd-muted border border-white/10">{item.category}</span>
                                </div>
                                <p className="text-sm text-dnd-text/90 italic leading-relaxed mb-3">{item.description || "Нет описания..."}</p>
                                <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-dnd-muted">
                                    <div className="flex justify-between border-b border-dnd-muted/20 pb-1"><span>Вес:</span> <span className="text-dnd-text">{item.weight} фнт</span></div>
                                    <div className="flex justify-between border-b border-dnd-muted/20 pb-1"><span>Цена:</span> <span className="text-dnd-gold">{item.cost} зм</span></div>
                                </div>
                            </div>
                            {item.imageUrl ? (<div className="w-full sm:w-24 h-24 bg-black/40 rounded border border-dnd-muted/30 flex-shrink-0 overflow-hidden"><img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" /></div>) : (<div className="hidden sm:flex w-24 h-24 bg-black/20 rounded border border-dnd-muted/10 items-center justify-center text-dnd-muted/20"><ImageIcon size={32} /></div>)}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
export default InventoryItem;