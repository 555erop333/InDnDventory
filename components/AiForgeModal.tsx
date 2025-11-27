import React, { useState } from 'react';
import { X, Sparkles, Loader2, Image as ImageIcon, Save } from 'lucide-react';
import { generateFantasyItem, generateItemImage, GeneratedItemData } from '../services/geminiService';
import { Item, ItemCategory, Rarity } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface AiForgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddItem: (item: Item) => void;
}

const AiForgeModal: React.FC<AiForgeModalProps> = ({ isOpen, onClose, onAddItem }) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingImg, setLoadingImg] = useState(false);
  const [generatedItem, setGeneratedItem] = useState<GeneratedItemData | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setGeneratedItem(null);
    setGeneratedImage(null);
    try {
      const itemData = await generateFantasyItem(prompt);
      setGeneratedItem(itemData);
    } catch (e) {
      console.error(e);
      alert("Не удалось сгенерировать предмет. Попробуйте снова.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!generatedItem) return;
    setLoadingImg(true);
    try {
      const img = await generateItemImage(`${generatedItem.name}, ${generatedItem.description}`);
      setGeneratedImage(img);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingImg(false);
    }
  };

  const parseCost = (costLabel: string): number => {
    const lower = costLabel.toLowerCase();
    const num = parseFloat(lower.replace(/[^0-9.]/g, '')) || 0;

    // Russian abbreviations
    if (lower.includes('пм') || lower.includes('pp')) return num * 10;
    if (lower.includes('зм') || lower.includes('gp')) return num;
    if (lower.includes('см') || lower.includes('sp')) return num * 0.1;
    if (lower.includes('мм') || lower.includes('cp')) return num * 0.01;

    return num; // Default to GP/ЗМ
  };

  const handleSave = () => {
    if (!generatedItem) return;
    const newItem: Item = {
      id: uuidv4(),
      name: generatedItem.name,
      description: generatedItem.description,
      quantity: 1,
      weight: generatedItem.weight,
      cost: parseCost(generatedItem.costLabel),
      costLabel: generatedItem.costLabel,
      category: generatedItem.category as ItemCategory,
      rarity: generatedItem.rarity as Rarity,
      isMagic: generatedItem.isMagic,
      attunement: generatedItem.attunement,
      imageUrl: generatedImage || undefined,
      isJunk: false
    };
    onAddItem(newItem);
    onClose();
    // Reset
    setPrompt('');
    setGeneratedItem(null);
    setGeneratedImage(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-dnd-panel w-full max-w-2xl rounded-xl border border-dnd-gold shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-dnd-muted">
          <div className="flex items-center gap-2 text-dnd-gold">
            <Sparkles size={24} />
            <h2 className="text-xl font-bold">Магическая Кузница (AI)</h2>
          </div>
          <button onClick={onClose} className="text-dnd-muted hover:text-white transition">
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {!generatedItem ? (
            <div className="space-y-4">
              <p className="text-dnd-text">Опишите предмет, который вы хотите создать. AI сгенерирует название, характеристики и описание.</p>
              <textarea
                className="w-full bg-dnd-dark border border-dnd-muted rounded-lg p-3 text-dnd-text focus:border-dnd-gold outline-none h-32 resize-none"
                placeholder="Например: Пылающий меч, который говорит на древнем эльфийском..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
              <button
                onClick={handleGenerate}
                disabled={loading || !prompt.trim()}
                className="w-full bg-dnd-gold hover:bg-yellow-600 text-dnd-dark font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" /> : <Sparkles size={20} />}
                Выковать Предмет
              </button>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row gap-6 animate-fade-in">
              {/* Item Details */}
              <div className="flex-1 space-y-3">
                <h3 className="text-2xl text-dnd-gold font-bold">{generatedItem.name}</h3>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="px-2 py-1 bg-dnd-dark rounded border border-dnd-muted text-dnd-accent">{generatedItem.rarity}</span>
                  <span className="px-2 py-1 bg-dnd-dark rounded border border-dnd-muted">{generatedItem.category}</span>
                  {generatedItem.attunement && <span className="px-2 py-1 bg-dnd-dark rounded border border-dnd-danger text-dnd-danger">Требует настройки</span>}
                </div>
                <p className="text-dnd-text text-sm italic leading-relaxed border-l-2 border-dnd-muted pl-3">
                  {generatedItem.description}
                </p>
                <div className="grid grid-cols-2 gap-4 text-sm mt-4 bg-dnd-dark p-3 rounded">
                  <div><span className="text-dnd-muted">Вес:</span> {generatedItem.weight} фнт</div>
                  <div><span className="text-dnd-muted">Цена:</span> {generatedItem.costLabel}</div>
                </div>
              </div>

              {/* Image Gen */}
              <div className="w-full md:w-1/3 flex flex-col gap-3">
                <div className="aspect-square bg-dnd-dark rounded-lg border border-dnd-muted flex items-center justify-center overflow-hidden relative group">
                  {generatedImage ? (
                    <img src={generatedImage} alt="Generated" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-dnd-muted text-center p-4">
                      <ImageIcon size={40} className="mx-auto mb-2 opacity-50" />
                      <span className="text-xs">Изображение отсутствует</span>
                    </div>
                  )}
                  {loadingImg && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <Loader2 className="animate-spin text-dnd-gold" size={32} />
                    </div>
                  )}
                </div>
                <button
                  onClick={handleGenerateImage}
                  disabled={loadingImg}
                  className="w-full py-2 border border-dnd-accent text-dnd-accent rounded hover:bg-dnd-accent/10 transition text-sm flex items-center justify-center gap-2"
                >
                  <ImageIcon size={16} />
                  Сгенерировать Арт
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {generatedItem && (
          <div className="p-4 border-t border-dnd-muted flex justify-end gap-3">
            <button
              onClick={() => setGeneratedItem(null)}
              className="px-4 py-2 text-dnd-muted hover:text-white transition"
            >
              Назад
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-dnd-success hover:bg-green-600 text-dnd-dark font-bold rounded flex items-center gap-2"
            >
              <Save size={18} />
              Добавить в Инвентарь
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AiForgeModal;