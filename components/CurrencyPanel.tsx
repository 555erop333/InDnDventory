import React, { useState } from 'react';
import { Currency } from '../types';
import { Coins, Plus, Minus, Wallet } from 'lucide-react';

interface CurrencyPanelProps {
  currency: Currency;
  onUpdate: (newCurrency: Currency) => void;
}

const CurrencyPanel: React.FC<CurrencyPanelProps> = ({ currency, onUpdate }) => {
  const [amount, setAmount] = useState<string>('');

  // Helper to update only GP, keeping others 0 to enforce single currency rule visually
  const updateGold = (newGp: number) => {
    onUpdate({
      pp: 0,
      gp: Math.max(0, parseFloat(newGp.toFixed(2))), // Prevent negative
      sp: 0,
      cp: 0
    });
  };

  const handleTransaction = (isAdding: boolean) => {
    const val = parseFloat(amount);
    if (!val || isNaN(val)) return;

    const currentGp = currency.gp || 0;
    const newGp = isAdding ? currentGp + val : currentGp - val;

    updateGold(newGp);
    setAmount(''); // Clear input after transaction
  };

  const handleQuickChange = (val: number) => {
    const currentGp = currency.gp || 0;
    updateGold(currentGp + val);
  };

  return (
    <div className="bg-gradient-to-b from-dnd-panel to-black/40 p-5 rounded-xl border border-dnd-gold/30 mb-4 shadow-lg relative overflow-hidden group">

      {/* Decorative Glow */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-dnd-gold/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center gap-2 text-dnd-gold mb-4 relative z-10">
        <div className="p-1.5 bg-dnd-gold/10 rounded border border-dnd-gold/30">
          <Wallet size={16} />
        </div>
        <span className="font-bold tracking-wide text-lg">Кошель</span>
      </div>

      {/* Main Balance Display */}
      <div className="bg-black/40 rounded-lg border border-dnd-gold/20 p-4 text-center mb-4 relative overflow-hidden">
        <div className="text-4xl font-bold font-mono text-dnd-gold drop-shadow-[0_0_10px_rgba(234,179,8,0.3)]">
          {(currency.gp || 0).toLocaleString('ru-RU')} <span className="text-lg text-dnd-muted/70">зм</span>
        </div>
      </div>

      {/* Calculator Controls */}
      <div className="space-y-3 relative z-10">
        {/* Input Area */}
        <div className="flex gap-2">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Сумма..."
            className="flex-1 bg-dnd-dark border border-dnd-muted rounded-lg px-3 py-2 text-lg font-mono text-white placeholder-dnd-muted/50 outline-none focus:border-dnd-gold focus:ring-1 ring-dnd-gold/50 transition"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleTransaction(true);
            }}
          />
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => handleTransaction(false)}
            className="bg-dnd-danger/10 hover:bg-dnd-danger/20 border border-dnd-danger/30 text-dnd-danger py-2 rounded-lg flex items-center justify-center gap-2 font-bold transition active:scale-95"
          >
            <Minus size={18} />
            <span>Убавить</span>
          </button>
          <button
            onClick={() => handleTransaction(true)}
            className="bg-dnd-success/10 hover:bg-dnd-success/20 border border-dnd-success/30 text-dnd-success py-2 rounded-lg flex items-center justify-center gap-2 font-bold transition active:scale-95"
          >
            <Plus size={18} />
            <span>Добавить</span>
          </button>
        </div>

        {/* Quick Presets */}
        <div className="pt-2 border-t border-white/5">
          <div className="text-[10px] text-dnd-muted uppercase tracking-wider mb-2 font-bold text-center">Быстрые действия</div>
          <div className="grid grid-cols-4 gap-2">
            {[1, 10, 50, 100].map((val) => (
              <button
                key={val}
                onClick={() => handleQuickChange(val)}
                className="bg-dnd-panel hover:bg-dnd-gold hover:text-dnd-dark border border-dnd-muted hover:border-dnd-gold text-xs py-1.5 rounded transition text-dnd-muted font-mono font-bold"
              >
                +{val}
              </button>
            ))}
            {[-1, -10, -50, -100].map((val) => (
              <button
                key={val}
                onClick={() => handleQuickChange(val)}
                className="bg-dnd-panel hover:bg-dnd-danger hover:text-white border border-dnd-muted hover:border-dnd-danger text-xs py-1.5 rounded transition text-dnd-muted font-mono font-bold"
              >
                {val}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CurrencyPanel;