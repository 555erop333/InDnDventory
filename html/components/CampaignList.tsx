import React, { useState, useEffect } from 'react';
import { Plus, Users, LogOut, Sword, Crown } from 'lucide-react';

interface Campaign { id: number; name: string; role: 'DM' | 'PLAYER'; join_code: string; }
interface CampaignListProps { token: string; onSelect: (id: number, role: 'DM' | 'PLAYER') => void; onLogout: () => void; }

export const CampaignList: React.FC<CampaignListProps> = ({ token, onSelect, onLogout }) => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [showJoin, setShowJoin] = useState<'create' | 'join' | false>(false);
  const [inputVal, setInputVal] = useState('');

  const fetchCampaigns = async () => {
    const res = await fetch('/api/campaigns', { headers: { 'Authorization': `Bearer ${token}` } });
    if (res.ok) setCampaigns(await res.json());
  };

  useEffect(() => { fetchCampaigns(); }, []);

  const handleCreate = async () => {
    if (!inputVal) return;
    await fetch('/api/campaigns', { method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ name: inputVal }) });
    setInputVal(''); setShowJoin(false); fetchCampaigns();
  };

  const handleJoin = async () => {
    if (!inputVal) return;
    await fetch('/api/campaigns/join', { method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ code: inputVal }) });
    setInputVal(''); setShowJoin(false); fetchCampaigns();
  };

  return (
    <div className="min-h-screen bg-dnd-dark p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8 border-b border-dnd-muted pb-4">
          <h1 className="text-2xl font-serif font-bold text-dnd-gold flex items-center gap-2"><Sword /> Ваши Кампании</h1>
          <button onClick={onLogout} className="text-dnd-muted hover:text-dnd-danger flex items-center gap-1 text-sm"><LogOut size={16} /> Выход</button>
        </div>
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <div className="bg-dnd-panel p-4 rounded border border-dnd-muted hover:border-dnd-gold transition cursor-pointer group" onClick={() => setShowJoin('create')}>
             <div className="flex items-center gap-3 text-dnd-gold font-bold mb-2"><Plus className="group-hover:scale-110 transition" /> Создать Кампанию (Для ДМ)</div>
          </div>
          <div className="bg-dnd-panel p-4 rounded border border-dnd-muted hover:border-dnd-accent transition cursor-pointer group" onClick={() => setShowJoin('join')}>
             <div className="flex items-center gap-3 text-dnd-accent font-bold mb-2"><Users className="group-hover:scale-110 transition" /> Присоединиться (Для Игроков)</div>
          </div>
        </div>
        {showJoin && (
          <div className="bg-black/30 p-4 rounded border border-dnd-muted mb-8 animate-fade-in">
            <label className="block text-xs text-dnd-muted mb-1">{showJoin === 'create' ? 'Название' : 'Код приглашения'}</label>
            <div className="flex gap-2">
                <input autoFocus type="text" value={inputVal} onChange={e => setInputVal(e.target.value)} className="flex-1 bg-dnd-dark border border-dnd-muted rounded px-3 py-2 outline-none focus:border-dnd-gold" />
                <button onClick={showJoin === 'create' ? handleCreate : handleJoin} className="bg-dnd-gold text-dnd-dark px-4 rounded font-bold">OK</button>
                <button onClick={() => setShowJoin(false)} className="text-dnd-muted px-2">Отмена</button>
            </div>
          </div>
        )}
        <div className="grid gap-3">
          {campaigns.map(c => (
            <div key={c.id} onClick={() => onSelect(c.id, c.role)} className="bg-dnd-panel p-4 rounded border border-dnd-muted hover:bg-white/5 cursor-pointer flex justify-between items-center transition">
              <div>
                <div className="font-bold text-lg text-dnd-text">{c.name}</div>
                <div className="text-xs text-dnd-muted flex items-center gap-2">
                   {c.role === 'DM' ? <span className="text-dnd-gold flex items-center gap-1"><Crown size={12}/> Вы Мастер</span> : <span className="text-dnd-accent flex items-center gap-1"><Users size={12}/> Игрок</span>}
                   {c.role === 'DM' && <span>| Код: <span className="font-mono text-white select-all">{c.join_code}</span></span>}
                </div>
              </div>
              <div className="text-dnd-muted opacity-50">➔</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
