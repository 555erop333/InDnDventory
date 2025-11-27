import React from 'react';
import { CharacterStats } from '../types';
import { Weight } from 'lucide-react';

interface StatsPanelProps { stats: CharacterStats; currentWeight: number; }

const StatsPanel: React.FC<StatsPanelProps> = ({ stats, currentWeight }) => {
  const maxCapacity = stats.strength * 15;
  const encumbered = stats.strength * 5; 
  const weightPercent = Math.min((currentWeight / maxCapacity) * 100, 100);
  let barColor = 'bg-dnd-success';
  let statusText = 'Норма';
  let statusColor = 'text-dnd-muted';

  if (currentWeight > encumbered) { barColor = 'bg-dnd-gold'; statusText = 'Нагружен'; statusColor = 'text-dnd-gold'; }
  if (currentWeight > maxCapacity) { barColor = 'bg-dnd-danger'; statusText = 'Перегруз'; statusColor = 'text-dnd-danger'; }

  return (
    <div className="bg-dnd-panel border-t border-dnd-muted/50 p-3 flex items-center gap-4 shadow-lg z-30 sticky bottom-0">
        <div className="flex items-center gap-3 min-w-max">
            <div className={`p-2 rounded-full transition-colors ${currentWeight > maxCapacity ? 'bg-dnd-danger text-white' : 'bg-dnd-dark text-dnd-muted'}`}><Weight size={18} /></div>
            <div className="flex flex-col">
                <span className="text-[10px] uppercase text-dnd-muted leading-none mb-0.5">Общий вес</span>
                <div className="flex items-baseline gap-1">
                    <span className={`text-lg font-bold leading-none ${currentWeight > maxCapacity ? 'text-dnd-danger' : 'text-dnd-text'}`}>{currentWeight.toFixed(1)}</span>
                    <span className="text-xs text-dnd-muted">/ {maxCapacity} фнт</span>
                </div>
            </div>
        </div>
        <div className="flex-1 flex flex-col justify-center gap-1">
            <div className="w-full bg-dnd-dark h-2.5 rounded-full overflow-hidden relative border border-dnd-muted/20">
                 <div className={`absolute top-0 left-0 h-full ${barColor} transition-all duration-500`} style={{ width: `${weightPercent}%` }} />
                <div className="absolute top-0 bottom-0 w-0.5 bg-white/30 z-10" style={{ left: `${(encumbered/maxCapacity)*100}%` }} />
            </div>
             <div className="flex justify-between text-[10px] text-dnd-muted px-0.5 select-none"><span>0</span><span className="hidden sm:inline">Нагрузка ({encumbered})</span><span>Макс ({maxCapacity})</span></div>
        </div>
        <div className={`hidden sm:flex flex-col items-end min-w-[80px] text-right`}><span className="text-[10px] uppercase text-dnd-muted leading-none mb-0.5">Состояние</span><span className={`text-sm font-bold ${statusColor}`}>{statusText}</span></div>
    </div>
  );
};
export default StatsPanel;
