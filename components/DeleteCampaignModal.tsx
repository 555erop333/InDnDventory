import React, { useState } from 'react';

interface DeleteCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  campaignName: string;
}

const DeleteCampaignModal: React.FC<DeleteCampaignModalProps> = ({ isOpen, onClose, onConfirm, campaignName }) => {
  const [inputValue, setInputValue] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const requiredPhrase = 'РЕШЕНО';

  if (!isOpen) return null;

  const handleDelete = async () => {
    if (inputValue.trim() !== requiredPhrase || isDeleting) return;
    setIsDeleting(true);
    try {
      await onConfirm();
    } finally {
      setIsDeleting(false);
      setInputValue('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-dnd-panel w-full max-w-md rounded-xl border border-dnd-danger/60 shadow-2xl">
        <div className="p-4 border-b border-dnd-danger/40">
          <h3 className="text-xl font-bold text-dnd-danger">Удалить кампанию</h3>
          <p className="text-sm text-dnd-muted mt-1">
            Это действие удалит кампанию <span className="text-white font-semibold">{campaignName}</span> и всех игроков в ней.
          </p>
        </div>
        <div className="p-4 space-y-3">
          <p className="text-sm text-dnd-text">Введите <span className="font-bold text-dnd-danger">{requiredPhrase}</span>, чтобы подтвердить удаление.</p>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value.toUpperCase())}
            className="w-full bg-black/20 border border-dnd-danger/40 rounded px-3 py-2 text-white focus:border-dnd-danger outline-none"
            placeholder="РЕШЕНО"
          />
        </div>
        <div className="p-4 border-t border-dnd-danger/40 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 bg-dnd-panel border border-dnd-muted text-dnd-muted rounded hover:text-white">Отмена</button>
          <button
            onClick={handleDelete}
            disabled={inputValue.trim() !== requiredPhrase || isDeleting}
            className="px-4 py-2 bg-dnd-danger text-white rounded font-bold disabled:opacity-50"
          >
            {isDeleting ? 'Удаление...' : 'Удалить'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteCampaignModal;
