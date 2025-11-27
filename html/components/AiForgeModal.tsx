import React, { useState } from 'react';
import { X, Sparkles, Loader2, Save } from 'lucide-react';
import { generateFantasyItem, GeneratedItemData } from '../services/geminiService';
import { Item, ItemCategory, Rarity } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface AiForgeModalProps { isOpen: boolean; onClose: () => void; onAddItem: (item: Item) => void; }

const AiForgeModal: React.FC<AiForgeModalProps> = ({ isOpen, onClose, onAddItem }) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedItem, setGeneratedItem] = useState<GeneratedItemData | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!prompt.trim()) return; setLoading(true); setGeneratedItem(null);
    try { const itemData = await generateFantasyItem(prompt); setGeneratedItem(itemData); } 
    catch (e) { alert("Ошибка генерации"); } finally { setLoading(false); }
  };

  const parseCost = (costLabel: string): number => {
    const lower = costLabel.toLowerCase();
    const num = parseFloat(lower.replace(/[^0-9.]/g, '')) || 0;
    if (lower.includes('пм') || lower.includes('pp')) return num * 10;
    if (lower.includes('зм') || lower.includes('gp')) return num;
    if (lower.includes('см') || lower.includes('sp')) return num * 0.1;
    if (lower.includes('мм') || lower.includes('cp')) return num * 0.01;
    return num;
  };

  const handleSave = () => {
    if (!generatedItem) return;
    const newItem: Item = { 
        id: uuidv4(), name: generatedItem.name, description: generatedItem.description, 
        quantity: 1, weight: generatedItem.weight, cost: parseCost(generatedItem.costLabel), 
        costLabel: generatedItem.costLabel, category: generatedItem.category as ItemCategory, 
        rarity: generatedItem.rarity as Rarity, isMagic: generatedItem.isMagic, 
        attunement: generatedItem.attunement, isJunk: false 
    };
    onAddItem(newItem); onClose(); setPrompt(''); setGeneratedItem(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-dnd-panel w-full max-w-2xl rounded-xl border border-dnd-gold shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-dnd-muted"><div className="flex items-center gap-2 text-dnd-gold"><Sparkles size={24} /><h2 className="text-xl font-bold font-serif">AI Кузница</h2></div><button onClick={onClose} className="text-dnd-muted hover:text-white"><X size={24} /></button></div>
        <div className="p-6 overflow-y-auto flex-1">
          {!generatedItem ? (
            <div className="space-y-4"><p className="text-dnd-text">Опишите предмет...</p><textarea className="w-full bg-dnd-dark border border-dnd-muted rounded-lg p-3 text-dnd-text h-32 resize-none" value={prompt} onChange={(e) => setPrompt(e.target.value)} /><button onClick={handleGenerate} disabled={loading || !prompt.trim()} className="w-full bg-dnd-gold hover:bg-yellow-600 text-dnd-dark font-bold py-3 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50">{loading ? <Loader2 className="animate-spin" /> : <Sparkles size={20} />} Выковать</button></div>
          ) : (
            <div className="flex flex-col gap-4"><h3 className="text-2xl font-serif text-dnd-gold font-bold">{generatedItem.name}</h3><p className="text-dnd-text italic">{generatedItem.description}</p><div className="flex justify-end gap-2"><button onClick={() => setGeneratedItem(null)} className="px-4 py-2 text-dnd-muted">Назад</button><button onClick={handleSave} className="px-6 py-2 bg-dnd-success text-dnd-dark font-bold rounded flex items-center gap-2"><Save size={18} /> Сохранить</button></div></div>
          )}
        </div>
      </div>
    </div>
  );
};
export default AiForgeModal;
