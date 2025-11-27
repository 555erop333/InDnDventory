import React, { useMemo, useState, useEffect } from 'react';
import { X, Share2, Package, Users } from 'lucide-react';
import { InventoryState, Item } from '../types';

interface TransferItemModalProps {
    isOpen: boolean;
    onClose: () => void;
    characters: Record<string, InventoryState>;
    excludeId: string;
    item: Item | null;
    onConfirm: (targetId: string) => void;
}

const TransferItemModal: React.FC<TransferItemModalProps> = ({
    isOpen,
    onClose,
    characters,
    excludeId,
    item,
    onConfirm
}) => {
    const [selectedId, setSelectedId] = useState('');

    useEffect(() => {
        if (!isOpen) {
            setSelectedId('');
        }
    }, [isOpen]);

    const targets = useMemo(() => (
        (Object.entries(characters) as [string, InventoryState][]) 
            .filter(([id]) => id !== excludeId)
            .map(([id, data]) => ({
                id,
                name: data.stats.name,
                ownerName: data.ownerName,
                itemsCount: data.items.length
            }))
    ), [characters, excludeId]);

    if (!isOpen || !item) return null;

    const handleConfirm = () => {
        if (!selectedId) return;
        onConfirm(selectedId);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-dnd-panel w-full max-w-md rounded-xl border border-dnd-gold shadow-2xl flex flex-col max-h-[80vh]">
                <div className="flex items-center justify-between p-4 border-b border-dnd-muted">
                    <div className="flex items-center gap-2 text-dnd-gold">
                        <Share2 size={22} />
                        <div>
                            <h2 className="text-lg font-bold">Передать предмет</h2>
                            <p className="text-xs text-dnd-muted">{item.name}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-dnd-muted hover:text-white transition">
                        <X size={22} />
                    </button>
                </div>

                <div className="p-4 flex-1 overflow-y-auto space-y-4">
                    <div className="bg-black/20 border border-dnd-muted/30 rounded-lg p-3 text-sm text-dnd-muted flex items-center gap-2">
                        <Package size={18} className="text-dnd-gold" />
                        <div>
                            <p className="text-dnd-text font-semibold">{item.name}</p>
                            <p>Количество: {item.quantity}</p>
                        </div>
                    </div>

                    {targets.length === 0 ? (
                        <div className="text-center text-dnd-muted text-sm py-6">
                            Нет доступных персонажей для передачи
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <p className="text-xs uppercase text-dnd-muted font-bold flex items-center gap-2">
                                <Users size={14} />
                                Выберите получателя
                            </p>
                            <div className="space-y-2">
                                {targets.map(target => (
                                    <label
                                        key={target.id}
                                        className={`flex items-center justify-between gap-2 p-3 rounded-lg border cursor-pointer transition ${selectedId === target.id ? 'border-dnd-gold bg-dnd-gold/10 text-dnd-gold' : 'border-dnd-muted/30 bg-black/20 hover:border-dnd-gold/60'}`}
                                    >
                                        <div>
                                            <p className="font-semibold text-dnd-text">{target.name}</p>
                                            <p className="text-xs text-dnd-muted flex gap-2">
                                                {target.ownerName && <span>Игрок: {target.ownerName}</span>}
                                                <span>Предметов: {target.itemsCount}</span>
                                            </p>
                                        </div>
                                        <input
                                            type="radio"
                                            name="transfer-target"
                                            value={target.id}
                                            checked={selectedId === target.id}
                                            onChange={() => setSelectedId(target.id)}
                                            className="accent-dnd-gold"
                                        />
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-dnd-muted flex gap-2">
                    <button
                        onClick={handleConfirm}
                        disabled={!selectedId || targets.length === 0}
                        className="flex-1 bg-dnd-gold hover:bg-dnd-gold/90 text-dnd-dark font-bold rounded py-2 transition disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        Передать
                    </button>
                    <button
                        onClick={onClose}
                        className="flex-1 bg-dnd-panel hover:bg-dnd-muted border border-dnd-muted text-dnd-text rounded py-2 transition"
                    >
                        Отмена
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TransferItemModal;
