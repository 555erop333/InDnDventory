import React, { useState, useEffect, useMemo, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Plus, Search, Backpack, Sparkles, Coins, Menu, History as HistoryIcon, LogOut, Save, Wifi, WifiOff, Crown, Bell } from 'lucide-react';
import { CharacterStats, Currency, InventoryState, Item, ItemCategory, Rarity, HistoryEntry, Notification } from './types';
import StatsPanel from './components/StatsPanel';
import CurrencyPanel from './components/CurrencyPanel';
import InventoryItem from './components/InventoryItem';
import AiForgeModal from './components/AiForgeModal';
import CharacterSelectModal from './components/CharacterSelectModal';
import HistoryModal from './components/HistoryModal';

const INITIAL_ITEM_STATE: InventoryState = {
  stats: { name: 'Новый Герой', strength: 10 },
  currency: { pp: 0, gp: 10, sp: 0, cp: 0 },
  items: [],
  history: []
};

interface AppProps {
  token: string;
  campaignId: number;
  onBack: () => void;
  role: 'DM' | 'PLAYER';
  username: string;
}

const App: React.FC<AppProps> = ({ token, campaignId, onBack, role, username }) => {
  const [allCharacters, setAllCharacters] = useState<Record<string, InventoryState>>({});
  const [activeCharacterId, setActiveCharacterId] = useState<string>('');
  const [inventory, setInventory] = useState<InventoryState>(INITIAL_ITEM_STATE);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // UI State
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isCharModalOpen, setIsCharModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<ItemCategory | 'All'>('All');
  const [lastAddedId, setLastAddedId] = useState<string | null>(null);

  const isDm = role === 'DM';

  const fetchData = async () => {
      try {
        const res = await fetch(`/api/campaigns/${campaignId}/characters`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (!res.ok) throw new Error('Failed');
        const data = await res.json();
        
        if (Object.keys(data).length > 0) {
           setAllCharacters(prev => {
               // 1. Check for notifications
               if (isDm) {
                   Object.entries(data).forEach(([id, char]: [string, any]) => {
                       const oldChar = prev[id];
                       if (oldChar && char.ownerName !== username) {
                           const lastEntry = char.history?.[0];
                           if (lastEntry && (!oldChar.history?.[0] || lastEntry.id !== oldChar.history[0].id)) {
                               addNotification(`${char.ownerName}: ${lastEntry.description}`, 'info');
                           }
                       }
                   });
               }
               
               // 2. Merge Strategy:
               // We want to update `allCharacters` with new data from server.
               // However, if we are currently editing `activeCharacterId` (i.e. `inventory` state),
               // we probably don't want to clobber `allCharacters[activeCharacterId]` with server data IF we are the ones generating the new data.
               // But since `inventory` state is separate from `allCharacters`, `allCharacters` acts as a cache/storage.
               // `inventory` IS the view.
               // So updating `allCharacters` is safe. 
               // The "throws me out" issue happens if `data` is missing `activeCharacterId` or if we overwrite `inventory`.
               // We do NOT overwrite `inventory` here.
               
               return { ...prev, ...data };
           });

           // 3. Initial Load logic
           if (!activeCharacterId) {
               const myChars = Object.keys(data).filter(k => data[k].ownerName === username);
               const targetId = myChars.length > 0 ? myChars[0] : Object.keys(data)[0];
               setActiveCharacterId(targetId);
               setInventory(data[targetId]);
           }
        } else {
           if (!activeCharacterId) createDefaultOnServer();
        }
      } catch (e) { setSaveError(true); }
  };

  useEffect(() => { fetchData(); const interval = setInterval(fetchData, 5000); return () => clearInterval(interval); }, [campaignId, token]);

  const createDefaultOnServer = () => {
      const newId = uuidv4();
      const newChar = { ...INITIAL_ITEM_STATE, stats: { ...INITIAL_ITEM_STATE.stats, name: isDm ? 'Мастер Игры' : 'Мой Герой' } };
      setAllCharacters({ [newId]: newChar }); setActiveCharacterId(newId); setInventory(newChar); saveCharacterToServer(newId, newChar);
  };

  const saveCharacterToServer = async (id: string, data: InventoryState) => {
      setIsSaving(true); setSaveError(false);
      try { await fetch('/api/characters', { method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ id, campaignId, data }) }); } catch (e) { setSaveError(true); } finally { setIsSaving(false); }
  };

  // Sync inventory changes to allCharacters cache and Server
  useEffect(() => { 
      if (!activeCharacterId) return; 
      
      // Update local cache immediately so CharacterSelectModal looks right
      setAllCharacters(prev => ({ ...prev, [activeCharacterId]: inventory })); 
      
      // Debounce save to server
      const timer = setTimeout(() => saveCharacterToServer(activeCharacterId, inventory), 1000); 
      return () => clearTimeout(timer); 
  }, [inventory, activeCharacterId]);

  const addNotification = (message: string, type: Notification['type']) => {
      const id = uuidv4(); setNotifications(prev => [...prev, { id, message, type }]); setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 5000);
  };

  const switchCharacter = (id: string) => { 
      if (allCharacters[id]) { 
          setActiveCharacterId(id); 
          setInventory(allCharacters[id]); 
          setIsCharModalOpen(false); 
      } 
  };
  
  const createNewCharacter = (name: string) => { const newId = uuidv4(); const newCharState = { ...INITIAL_ITEM_STATE, history: [{ id: uuidv4(), type: 'system', description: `Персонаж "${name}" создан`, timestamp: Date.now() }], stats: { ...INITIAL_ITEM_STATE.stats, name: name } } as InventoryState; setAllCharacters(prev => ({ ...prev, [newId]: newCharState })); setActiveCharacterId(newId); setInventory(newCharState); setIsCharModalOpen(false); saveCharacterToServer(newId, newCharState); };
  const handleUpdateCharacter = (id: string, updates: Partial<CharacterStats>) => { setAllCharacters(prev => { const char = prev[id]; const updated = { ...char, stats: { ...char.stats, ...updates } }; if (id === activeCharacterId) setInventory(updated); saveCharacterToServer(id, updated); return { ...prev, [id]: updated }; }); };
  const deleteCharacter = (id: string) => { alert("Удаление персонажей с сервера пока недоступно."); };

  const logAction = (type: HistoryEntry['type'], description: string) => { const entry: HistoryEntry = { id: uuidv4(), type, description, timestamp: Date.now(), author: username, characterName: inventory.stats.name }; setInventory(prev => ({ ...prev, history: [entry, ...(prev.history || [])].slice(0, 50) })); };
  const addItem = (newItem: Item) => { logAction('add', `Добавлен: ${newItem.name}`); setInventory(prev => ({ ...prev, items: [newItem, ...prev.items] })); };
  const updateItem = (id: string, updates: Partial<Item>) => { const item = inventory.items.find(i => i.id === id); if (item && updates.quantity !== undefined && updates.quantity !== item.quantity) logAction('update', `${item.name}: x${updates.quantity}`); setInventory(prev => ({ ...prev, items: prev.items.map(i => i.id === id ? { ...i, ...updates } : i) })); };
  const deleteItem = (id: string) => { const item = inventory.items.find(i => i.id === id); if (item) logAction('remove', `Удален: ${item.name}`); setInventory(prev => ({ ...prev, items: prev.items.filter(i => i.id !== id) })); };
  const updateCurrency = (newC: Currency) => { const diff = newC.gp - inventory.currency.gp; if (Math.abs(diff) >= 0.01) logAction('currency', `${diff > 0 ? 'Получено' : 'Потрачено'}: ${Math.abs(diff).toFixed(2)} зм`); setInventory(prev => ({ ...prev, currency: newC })); };
  const sellJunk = () => { const junk = inventory.items.filter(i => i.isJunk); if (junk.length === 0) return; const val = junk.reduce((s, i) => s + (i.cost * i.quantity), 0); logAction('currency', `Продан хлам (${junk.length}) на ${val} зм`); setInventory(prev => ({ ...prev, currency: { ...prev.currency, gp: prev.currency.gp + val }, items: prev.items.filter(i => !i.isJunk) })); };
  const handleManualAdd = () => { const newId = uuidv4(); const newItem: Item = { id: newId, name: 'Новый предмет', description: '', quantity: 1, weight: 0, cost: 0, costLabel: '0 зм', category: filterCategory !== 'All' ? filterCategory : ItemCategory.MISC, rarity: Rarity.COMMON, isMagic: false, attunement: false, isJunk: false }; setLastAddedId(newId); addItem(newItem); };

  const globalHistory = useMemo(() => { if (!isDm) return inventory.history; const allLogs: HistoryEntry[] = []; Object.values(allCharacters).forEach(char => { if (char.history) char.history.forEach(h => allLogs.push({ ...h, characterName: char.stats.name })); }); return allLogs.sort((a, b) => b.timestamp - a.timestamp).slice(0, 100); }, [allCharacters, isDm, inventory.history]);
  const totalWeight = useMemo(() => { return inventory.items.reduce((sum, i) => sum + (i.weight * i.quantity), 0) + (Object.values(inventory.currency) as number[]).reduce((a,b) => a+b, 0) / 50; }, [inventory]);
  const filteredItems = useMemo(() => inventory.items.filter(item => { return (item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.description.toLowerCase().includes(searchQuery.toLowerCase())) && (filterCategory === 'All' || item.category === filterCategory); }), [inventory.items, searchQuery, filterCategory]);

  const currentOwner = allCharacters[activeCharacterId]?.ownerName || username;
  const isOwner = currentOwner === username;
  const canEdit = isOwner || isDm;

  return (
    <div className="min-h-screen bg-dnd-dark text-dnd-text flex flex-col lg:flex-row lg:h-screen lg:overflow-hidden">
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
          {notifications.map(n => (<div key={n.id} className="bg-dnd-panel border border-dnd-gold/50 text-white p-3 rounded shadow-lg animate-fade-in pointer-events-auto flex gap-3 items-start max-w-sm"><Bell size={16} className="text-dnd-gold mt-1 flex-shrink-0" /><div className="text-sm">{n.message}</div></div>))}
      </div>
      <aside className="lg:w-80 w-full p-4 bg-black/20 lg:overflow-y-auto lg:h-full border-r border-dnd-muted/30 z-10 flex-shrink-0 flex flex-col">
        <div className="flex items-center justify-between mb-6 px-2"><div className="flex items-center gap-3 text-white font-serif font-bold text-xl truncate">{isDm ? <Crown size={24} className="text-dnd-gold" /> : <Backpack className="text-dnd-gold" size={24} />}<span className="truncate">{inventory.stats.name}</span></div><button onClick={() => setIsCharModalOpen(true)} className="flex items-center gap-2 px-3 py-1.5 bg-dnd-panel hover:bg-dnd-muted/50 border border-dnd-muted rounded text-xs transition flex-shrink-0"><Menu size={14} className="text-dnd-gold" /><span>Меню</span></button></div>
        {!isOwner && (<div className="mb-4 bg-dnd-accent/10 border border-dnd-accent text-dnd-accent p-2 rounded text-xs text-center font-bold">Вы просматриваете инвентарь: {currentOwner}</div>)}
        <CurrencyPanel currency={inventory.currency} onUpdate={updateCurrency} />
        <button onClick={sellJunk} disabled={!canEdit} className="w-full mb-4 bg-dnd-gold/10 hover:bg-dnd-gold/20 border border-dnd-gold text-dnd-gold rounded-lg p-3 flex items-center justify-between group transition-all disabled:opacity-50"><div className="flex items-center gap-2"><Coins size={20} /><span className="font-bold text-sm">Продать хлам</span></div></button>
        <div className="mt-auto pt-4 border-t border-dnd-muted/20 text-xs flex items-center justify-between text-dnd-muted"><span className="flex items-center gap-1">{saveError ? <WifiOff size={12} className="text-dnd-danger" /> : <Wifi size={12} className="text-dnd-success" />} {saveError ? 'Ошибка' : 'Онлайн'}</span>{isSaving && <span className="text-dnd-gold animate-pulse flex items-center gap-1"><Save size={12} /> ...</span>}</div>
      </aside>
      <main className="flex-1 flex flex-col min-w-0 lg:h-full relative">
        <header className="p-4 border-b border-dnd-muted/30 bg-dnd-dark flex gap-4 items-center justify-between shadow-md z-20 sticky top-0">
            <div className="relative flex-1 max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-dnd-muted" size={16} /><input type="text" placeholder="Поиск..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-dnd-panel border border-dnd-muted rounded-full pl-10 pr-4 py-2 focus:border-dnd-accent outline-none text-sm" /></div>
            <div className="flex items-center gap-2"><button onClick={onBack} className="bg-dnd-danger/10 hover:bg-dnd-danger/20 text-dnd-danger w-9 h-9 flex items-center justify-center rounded-full border border-dnd-danger/30 transition mr-2" title="Выход"><LogOut size={16} /></button><button onClick={() => setIsHistoryModalOpen(true)} className="bg-dnd-panel hover:bg-dnd-muted text-dnd-muted hover:text-dnd-gold w-9 h-9 flex items-center justify-center rounded-full border border-dnd-muted transition"><HistoryIcon size={18} /></button>{canEdit && <button onClick={handleManualAdd} className="bg-dnd-panel hover:bg-dnd-muted text-white w-9 h-9 flex items-center justify-center rounded-full border border-dnd-muted transition"><Plus size={20} /></button>}{canEdit && <button onClick={() => setIsAiModalOpen(true)} className="bg-gradient-to-r from-dnd-gold to-yellow-600 text-dnd-dark font-bold w-9 h-9 sm:w-auto sm:px-4 sm:py-2 flex items-center justify-center rounded-full gap-2 hover:brightness-110 transition shadow-lg shadow-dnd-gold/20 text-sm"><Sparkles size={18} /><span className="hidden sm:inline">AI Кузница</span></button>}</div>
        </header>
        <div className="bg-dnd-dark border-b border-dnd-muted/30 overflow-x-auto"><div className="flex items-center gap-2 p-3 min-w-max px-4"><button onClick={() => setFilterCategory('All')} className={`px-4 py-1.5 rounded-full text-sm font-bold border transition-all ${filterCategory === 'All' ? 'bg-dnd-gold text-dnd-dark border-dnd-gold' : 'bg-dnd-panel text-dnd-muted border-dnd-muted hover:border-dnd-text hover:text-dnd-text'}`}>Все</button>{(Object.values(ItemCategory) as ItemCategory[]).map(cat => (<button key={cat} onClick={() => setFilterCategory(cat)} className={`px-4 py-1.5 rounded-full text-sm font-bold border transition-all whitespace-nowrap ${filterCategory === cat ? 'bg-dnd-gold text-dnd-dark border-dnd-gold' : 'bg-dnd-panel text-dnd-muted border-dnd-muted hover:border-dnd-text hover:text-dnd-text'}`}>{cat}</button>))}</div></div>
        <div className="flex-1 lg:overflow-y-auto p-4 scrollbar-thin">{!canEdit && <div className="text-center text-dnd-muted bg-black/20 p-2 rounded mb-4 border border-dnd-muted/20">Только чтение</div>}<div className="w-full max-w-5xl mx-auto pb-4">{filteredItems.map(item => (<InventoryItem key={item.id} item={item} onUpdate={(id, u) => canEdit && updateItem(id, u)} onDelete={(id) => canEdit && deleteItem(id)} initialEditMode={item.id === lastAddedId} />))}</div></div>
        <StatsPanel stats={inventory.stats} currentWeight={totalWeight} />
      </main>
      <AiForgeModal isOpen={isAiModalOpen} onClose={() => setIsAiModalOpen(false)} onAddItem={addItem} />
      <CharacterSelectModal isOpen={isCharModalOpen} onClose={() => setIsCharModalOpen(false)} characters={allCharacters} activeId={activeCharacterId} onSelect={switchCharacter} onCreate={createNewCharacter} onDelete={deleteCharacter} onUpdate={handleUpdateCharacter} currentUsername={username} isDm={isDm} />
      <HistoryModal isOpen={isHistoryModalOpen} onClose={() => setIsHistoryModalOpen(false)} history={isDm ? globalHistory : inventory.history || []} onClear={() => setInventory(p => ({ ...p, history: [] }))} />
    </div>
  );
};
export default App;