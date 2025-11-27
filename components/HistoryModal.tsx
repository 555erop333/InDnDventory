import React, { useState } from 'react';
import { X, History, Clock, PlusCircle, Trash2, Edit3, Coins } from 'lucide-react';
import { HistoryEntry } from '../types';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryEntry[];
  onClear: () => void;
  showCharacterName?: boolean;
  title?: string;
}

const HistoryModal: React.FC<HistoryModalProps> = ({ isOpen, onClose, history, onClear, showCharacterName = false, title = 'История Изменений' }) => {
  const [secretClickCount, setSecretClickCount] = useState(0);

  if (!isOpen) return null;

  const getIcon = (type: HistoryEntry['type']) => {
    switch (type) {
      case 'add': return <PlusCircle size={16} className="text-dnd-success" />;
      case 'remove': return <Trash2 size={16} className="text-dnd-danger" />;
      case 'update': return <Edit3 size={16} className="text-dnd-accent" />;
      case 'currency': return <Coins size={16} className="text-dnd-gold" />;
      default: return <Clock size={16} className="text-dnd-muted" />;
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long'
    });
  };

  const handleSecretClick = () => {
    const next = secretClickCount + 1;
    if (next >= 10) {
      onClear();
      setSecretClickCount(0);
    } else {
      setSecretClickCount(next);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-dnd-panel w-full max-w-lg rounded-xl border border-dnd-gold shadow-2xl flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-dnd-muted">
          <div className="flex items-center gap-2 text-dnd-gold">
            <History size={24} />
            <h2 className="text-xl font-bold">{title}</h2>
          </div>
          <button onClick={onClose} className="text-dnd-muted hover:text-white transition">
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {history.length === 0 ? (
            <div className="text-center text-dnd-muted py-10 opacity-50">
              <History size={48} className="mx-auto mb-2" />
              <p>История пуста</p>
            </div>
          ) : (
            history.map((entry, index) => {
              const showDate = index === 0 ||
                new Date(entry.timestamp).getDate() !== new Date(history[index - 1].timestamp).getDate();

              return (
                <div key={entry.id}>
                  {showDate && (
                    <div className="text-xs text-dnd-muted text-center my-2 border-b border-dnd-muted/20 pb-1 font-bold">
                      {formatDate(entry.timestamp)}
                    </div>
                  )}
                  <div className="flex gap-3 items-start p-2 rounded hover:bg-white/5 transition">
                    <div className="mt-1 opacity-80">
                      {getIcon(entry.type)}
                    </div>
                    <div className="flex-1">
                      {showCharacterName && entry.characterName && (
                        <p className="text-xs text-dnd-gold font-bold mb-0.5">[{entry.characterName}]</p>
                      )}
                      <p className="text-sm text-dnd-text leading-tight">{entry.description}</p>
                      <span className="text-[10px] text-dnd-muted">{formatTime(entry.timestamp)}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-dnd-muted bg-dnd-dark/30 rounded-b-xl flex justify-center items-center">
          <span
            onClick={handleSecretClick}
            className="text-xs text-dnd-muted select-none cursor-default"
          >
            Всего записей: {history.length}
          </span>
        </div>
      </div>
    </div>
  );
};

export default HistoryModal;