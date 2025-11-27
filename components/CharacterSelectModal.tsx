import React, { useState } from 'react';
import { Plus, User, Trash2, Check, X, Users, Edit2, BicepsFlexed, LogOut, UserMinus } from 'lucide-react';
import { InventoryState, CharacterStats } from '../types';

interface CharacterSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  characters: Record<string, InventoryState>;
  activeId: string;
  onSelect: (id: string) => void;
  onCreate: (name: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, stats: Partial<CharacterStats>) => void;
  currentUsername: string;
  isDm: boolean;
  onExit: () => void;
  onRemovePlayer?: (playerId: number, playerName: string) => void;
}

const CharacterSelectModal: React.FC<CharacterSelectModalProps> = ({
  isOpen,
  onClose,
  characters,
  activeId,
  onSelect,
  onCreate,
  onDelete,
  onUpdate,
  currentUsername,
  isDm,
  onExit,
  onRemovePlayer
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ name: string, strength: number }>({ name: '', strength: 10 });

  if (!isOpen) return null;

  const handleCreate = () => {
    if (newName.trim()) {
      onCreate(newName);
      setNewName('');
      setIsCreating(false);
    }
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    onDelete(id);
  };

  const startEditing = (e: React.MouseEvent, id: string, stats: CharacterStats) => {
    e.stopPropagation();
    setEditingId(id);
    setEditForm({ name: stats.name, strength: stats.strength });
  };

  const saveEditing = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    onUpdate(id, editForm);
    setEditingId(null);
  };

  const cancelEditing = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const characterEntries = Object.entries(characters) as [string, InventoryState][];
  const isGroupedView = isDm && characterEntries.some(([, char]) => char.ownerName && char.ownerName !== currentUsername);
  const grouped = characterEntries.reduce<Record<string, { ownerName: string; ownerId?: number; items: [string, InventoryState][] }>>((acc, [id, data]) => {
    const ownerName = data.ownerName || 'Неизвестно';
    const ownerKey = (data.ownerId ?? ownerName).toString();
    if (!acc[ownerKey]) acc[ownerKey] = { ownerName, ownerId: data.ownerId, items: [] };
    acc[ownerKey].items.push([id, data]);
    return acc;
  }, {});

  const renderCard = (id: string, charState: InventoryState, ownerName: string) => {
    const isActive = id === activeId;
    const isEditing = id === editingId;

    return (
      <div
        key={id}
        onClick={() => !isEditing && onSelect(id)}
        className={`relative group flex flex-col gap-2 p-3 rounded-lg border transition-all ${isActive ? 'bg-dnd-gold/10 border-dnd-gold' : 'bg-dnd-dark border-dnd-muted hover:border-dnd-text hover:bg-white/5'
          } ${!isEditing ? 'cursor-pointer' : ''}`}
      >
        {isEditing ? (
          <div className="flex flex-col gap-3 animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div>
              <label className="text-[10px] text-dnd-muted uppercase">Имя</label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="w-full bg-dnd-panel border border-dnd-accent rounded px-2 py-1 text-sm focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <BicepsFlexed size={16} className="text-dnd-muted" />
              <label className="text-[10px] text-dnd-muted uppercase">Сила</label>
              <input
                type="number"
                min="1"
                max="30"
                value={editForm.strength}
                onChange={(e) => setEditForm({ ...editForm, strength: parseInt(e.target.value) || 10 })}
                className="w-16 bg-dnd-panel border border-dnd-accent rounded px-2 py-1 text-sm focus:outline-none"
              />
            </div>
            <div className="flex gap-2 justify-end mt-1">
              <button onClick={(e) => saveEditing(e, id)} className="px-3 py-1 bg-dnd-success text-dnd-dark rounded text-xs font-bold flex items-center gap-1">
                <Check size={14} /> Сохранить
              </button>
              <button onClick={cancelEditing} className="px-3 py-1 bg-dnd-muted text-white rounded text-xs flex items-center gap-1">
                <X size={14} /> Отмена
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`${isActive ? 'bg-dnd-gold text-dnd-dark border-dnd-gold' : 'bg-dnd-panel text-dnd-muted border-dnd-muted'
                } w-10 h-10 rounded-full flex items-center justify-center border flex-shrink-0`}>
                <User size={20} />
              </div>
              <div>
                <div className={`font-bold ${isActive ? 'text-dnd-gold' : 'text-dnd-text'}`}>{charState.stats.name || 'Безымянный'}</div>
                <div className="text-xs text-dnd-muted flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                  <span className="flex items-center gap-1">
                    <span className="text-dnd-muted/70">Владелец:</span>
                    <span className="text-white/80 font-medium">{ownerName}</span>
                  </span>
                  <span className="hidden sm:inline">•</span>
                  <span>Сила: {charState.stats.strength}</span>
                  <span>•</span>
                  <span>Предметов: {charState.items.length}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {isActive && (
                <div className="text-dnd-gold mr-2" title="Активный персонаж">
                  <Check size={18} />
                </div>
              )}
              <button
                onClick={(e) => startEditing(e, id, charState.stats)}
                className="p-2 text-dnd-muted hover:text-dnd-accent hover:bg-dnd-accent/10 rounded transition opacity-0 group-hover:opacity-100"
                title="Редактировать имя/силу"
              >
                <Edit2 size={16} />
              </button>

              {!isActive && (
                <button
                  onClick={(e) => handleDelete(e, id)}
                  className="p-2 text-dnd-muted hover:text-dnd-danger hover:bg-dnd-danger/10 rounded transition opacity-0 group-hover:opacity-100"
                  title="Удалить персонажа"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-dnd-panel w-full max-w-md rounded-xl border border-dnd-gold shadow-2xl flex flex-col max-h-[80vh]">

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-dnd-muted">
          <div className="flex items-center gap-2 text-dnd-gold">
            <Users size={24} />
            <h2 className="text-xl font-bold">Управление героями</h2>
          </div>
          <button onClick={onClose} className="text-dnd-muted hover:text-white transition">
            <X size={24} />
          </button>
        </div>

        {/* Character List */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          {isGroupedView
            ? Object.entries(grouped).map(([owner, group]) => (
              <div key={owner} className="border border-dnd-muted/40 rounded-xl bg-black/20">
                <div className="px-3 py-2 border-b border-dnd-muted/30 flex items-center justify-between">
                  <div className="text-sm font-semibold text-dnd-gold flex items-center gap-2">
                    <Users size={16} /> {group.ownerName}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-dnd-muted">{group.items.length} персонажа(ей)</span>
                    {isDm && onRemovePlayer && group.ownerId && group.ownerName !== currentUsername && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onRemovePlayer(group.ownerId!, group.ownerName); }}
                        className="p-1.5 rounded-full border border-dnd-danger/30 text-dnd-danger/80 hover:text-dnd-danger hover:bg-dnd-danger/10 transition"
                        title="Удалить игрока"
                      >
                        <UserMinus size={14} />
                      </button>
                    )}
                  </div>
                </div>
                <div className="p-3 space-y-2">
                  {group.items.map(([id, charState]) => renderCard(id, charState, group.ownerName))}
                </div>
              </div>
            ))
            : characterEntries.map(([id, charState]) => renderCard(id, charState, charState.ownerName || 'Неизвестно'))}
        </div>

        {/* Create New Section */}
        <div className="p-4 border-t border-dnd-muted bg-dnd-dark/50 rounded-b-xl">
          {isCreating ? (
            <div className="flex flex-col gap-2 animate-fade-in">
              <label className="text-xs text-dnd-muted">Имя нового героя</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  autoFocus
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                  className="flex-1 bg-dnd-panel border border-dnd-gold rounded px-3 py-2 outline-none focus:ring-1 ring-dnd-gold text-sm"
                  placeholder="Гэндальф..."
                />
                <button
                  onClick={handleCreate}
                  className="bg-dnd-success text-dnd-dark rounded px-3 hover:brightness-110"
                >
                  <Check size={20} />
                </button>
                <button
                  onClick={() => setIsCreating(false)}
                  className="bg-dnd-panel border border-dnd-muted text-dnd-muted rounded px-3 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsCreating(true)}
              className="w-full py-3 rounded-lg border border-dashed border-dnd-muted text-dnd-muted hover:text-dnd-gold hover:border-dnd-gold hover:bg-dnd-gold/5 transition flex items-center justify-center gap-2"
            >
              <Plus size={20} />
              <span>Создать нового персонажа</span>
            </button>
          )}
          <button
            onClick={() => { onExit(); onClose(); }}
            className="mt-3 w-full bg-dnd-danger/10 hover:bg-dnd-danger/20 text-dnd-danger border border-dnd-danger/30 rounded-lg py-2 flex items-center justify-center gap-2 transition"
          >
            <LogOut size={16} />
            <span className="font-semibold text-sm">Выход</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default CharacterSelectModal;