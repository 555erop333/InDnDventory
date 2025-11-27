import React, { useState } from 'react';

interface RemovePlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  playerName: string;
}

const RemovePlayerModal: React.FC<RemovePlayerModalProps> = ({ isOpen, onClose, onConfirm, playerName }) => {
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const requiredPhrase = 'РЕШЕНО';

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (inputValue.trim() !== requiredPhrase || isProcessing) return;
    setIsProcessing(true);
    try {
      await onConfirm();
    } finally {
      setInputValue('');
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (isProcessing) return;
    setInputValue('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-dnd-panel w-full max-w-md rounded-xl border border-dnd-danger/60 shadow-2xl">
        <div className="p-4 border-b border-dnd-danger/40">
          <h3 className="text-xl font-bold text-dnd-danger">Удалить игрока</h3>
          <p className="text-sm text-dnd-muted mt-1">
            Это действие удалит игрока <span className="text-white font-semibold">{playerName}</span> из кампании вместе со всеми его персонажами.
          </p>
        </div>
        <div className="p-4 space-y-3">
          <p className="text-sm text-dnd-text">
            Введите <span className="font-bold text-dnd-danger">{requiredPhrase}</span>, чтобы подтвердить удаление.
          </p>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value.toUpperCase())}
            className="w-full bg-black/20 border border-dnd-danger/40 rounded px-3 py-2 text-white focus:border-dnd-danger outline-none"
            placeholder="РЕШЕНО"
          />
        </div>
        <div className="p-4 border-t border-dnd-danger/40 flex justify-end gap-3">
          <button onClick={handleClose} className="px-4 py-2 bg-dnd-panel border border-dnd-muted text-dnd-muted rounded hover:text-white">
            Отмена
          </button>
          <button
            onClick={handleConfirm}
            disabled={inputValue.trim() !== requiredPhrase || isProcessing}
            className="px-4 py-2 bg-dnd-danger text-white rounded font-bold disabled:opacity-50"
          >
            {isProcessing ? 'Удаление...' : 'Удалить'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RemovePlayerModal;
