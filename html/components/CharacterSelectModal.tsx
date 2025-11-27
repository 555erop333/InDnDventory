import React, { useState } from 'react';
import { Plus, User, Trash2, Check, X, Users, Edit2, BicepsFlexed, Crown } from 'lucide-react';
import { InventoryState, CharacterStats } from '../types';

interface CharacterSelectModalProps {
  isOpen: boolean; onClose: () => void; characters: Record<string, InventoryState>; activeId: string;
  onSelect: (id: string) => void; onCreate: (name: string) => void; onDelete: (id: string) => void;
  onUpdate: (id: string, stats: Partial<CharacterStats>) => void; currentUsername: string; isDm: boolean;
}

const CharacterSelectModal: React.FC<CharacterSelectModalProps> = ({ isOpen, onClose, characters, activeId, onSelect, onCreate, onDelete, onUpdate, currentUsername, isDm }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{name: string, strength: number}>({ name: '', strength: 10 });

  if (!isOpen) return null;

  const handleCreate = () => { if (newName.trim()) { onCreate(newName); setNewName(''); setIsCreating(false); } };
  const startEditing = (e: React.MouseEvent, id: string, stats: CharacterStats) => { e.stopPropagation(); setEditingId(id); setEditForm({ name: stats.name, strength: stats.strength }); };
  const saveEditing = (e: React.MouseEvent, id: string) => { e.stopPropagation(); onUpdate(id, editForm); setEditingId(null); };
  
  const myCharacters = Object.entries(characters).filter(([_, char]) => char.ownerName === currentUsername || !char.ownerName);
  const otherCharacters = Object.entries(characters).filter(([_, char]) => char.ownerName && char.ownerName !== currentUsername);
  const playersMap: Record<string, typeof otherCharacters> = {};
  otherCharacters.forEach(entry => { const owner = entry[1].ownerName || 'Unknown'; if (!playersMap[owner]) playersMap[owner] = []; playersMap[owner].push(entry); });

  const renderCharacterRow = ([id, data]: [string, InventoryState], isMine: boolean) => {
      const isActive = id === activeId; const isEditing = id === editingId; const canEdit = isMine || isDm;
      return (
        <div key={id} onClick={() => !isEditing && onSelect(id)} className={`relative group flex flex-col gap-2 p-3 rounded-lg border transition-all mb-2 ${isActive ? 'bg-dnd-gold/10 border-dnd-gold' : 'bg-dnd-dark border-dnd-muted hover:border-dnd-text hover:bg-white/5'} ${!isEditing ? 'cursor-pointer' : ''}`}>
            {isEditing ? (
                <div className="flex flex-col gap-3 animate-fade-in" onClick={e => e.stopPropagation()}>
                    <input type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full bg-dnd-panel border border-dnd-accent rounded px-2 py-1 text-sm" />
                    <div className="flex items-center gap-2"><BicepsFlexed size={16} className="text-dnd-muted" /><input type="number" value={editForm.strength} onChange={e => setEditForm({...editForm, strength: parseInt(e.target.value) || 10})} className="w-16 bg-dnd-panel border border-dnd-accent rounded px-2 py-1 text-sm" /></div>
                    <div className="flex gap-2 justify-end"><button onClick={(e) => saveEditing(e, id)} className="px-3 py-1 bg-dnd-success text-dnd-dark rounded text-xs font-bold">Save</button><button onClick={(e) => { e.stopPropagation(); setEditingId(null); }} className="px-3 py-1 bg-dnd-muted text-white rounded text-xs">Cancel</button></div>
                </div>
            ) : (
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3"><div className={`w-10 h-10 rounded-full flex items-center justify-center border flex-shrink-0 ${isActive ? 'bg-dnd-gold text-dnd-dark border-dnd-gold' : 'bg-dnd-panel text-dnd-muted border-dnd-muted'}`}>{isMine ? <User size={20} /> : <Users size={20} />}</div><div><div className={`font-bold ${isActive ? 'text-dnd-gold' : 'text-dnd-text'}`}>{data.stats.name || 'Безымянный'}</div><div className="text-xs text-dnd-muted flex gap-2"><span>STR: {data.stats.strength}</span></div></div></div>
                    <div className="flex items-center gap-1">{canEdit && <button onClick={(e) => startEditing(e, id, data.stats)} className="p-2 text-dnd-muted hover:text-dnd-accent rounded"><Edit2 size={16} /></button>}{isMine && <button onClick={(e) => { e.stopPropagation(); onDelete(id); }} className="p-2 text-dnd-muted hover:text-dnd-danger rounded"><Trash2 size={16} /></button>}</div>
                </div>
            )}
        </div>
      );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-dnd-panel w-full max-w-md rounded-xl border border-dnd-gold shadow-2xl flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between p-4 border-b border-dnd-muted"><div className="flex items-center gap-2 text-dnd-gold"><Users size={24} /><h2 className="text-xl font-bold font-serif">Герои</h2></div><button onClick={onClose} className="text-dnd-muted hover:text-white"><X size={24} /></button></div>
        <div className="p-4 overflow-y-auto flex-1">
            <div className="mb-4"><h3 className="text-xs uppercase text-dnd-muted font-bold mb-2">Мои Персонажи</h3>{myCharacters.map(c => renderCharacterRow(c, true))}</div>
            {isDm && Object.keys(playersMap).length > 0 && (<div className="mt-6 pt-4 border-t border-dnd-muted/30"><h3 className="text-xs uppercase text-dnd-gold font-bold mb-3 flex items-center gap-1"><Crown size={12} /> Игроки</h3>{Object.entries(playersMap).map(([player, chars]) => (<div key={player} className="mb-4"><div className="text-sm text-dnd-text font-bold mb-2 px-2 py-1 bg-white/5 rounded">{player}</div><div className="pl-2 border-l border-dnd-muted/20">{chars.map(c => renderCharacterRow(c, false))}</div></div>))}</div>)}
        </div>
        <div className="p-4 border-t border-dnd-muted bg-dnd-dark/50 rounded-b-xl">{isCreating ? (<div className="flex flex-col gap-2"><input type="text" autoFocus value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleCreate()} className="bg-dnd-panel border border-dnd-gold rounded px-3 py-2 text-sm" placeholder="Имя..." /><button onClick={handleCreate} className="bg-dnd-success text-dnd-dark rounded px-3">OK</button></div>) : (<button onClick={() => setIsCreating(true)} className="w-full py-3 rounded-lg border border-dashed border-dnd-muted text-dnd-muted hover:text-dnd-gold flex items-center justify-center gap-2"><Plus size={20} /><span>Создать</span></button>)}</div>
      </div>
    </div>
  );
};
export default CharacterSelectModal;
