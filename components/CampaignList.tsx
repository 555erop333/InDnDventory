import React, { useState, useEffect } from 'react';
import { Plus, Users, LogOut, Sword, Crown, Trash2, Download, Upload } from 'lucide-react';
import DeleteCampaignModal from './DeleteCampaignModal';

interface Campaign {
  id: number;
  name: string;
  role: 'DM' | 'PLAYER';
  join_code: string;
}

interface CampaignListProps {
  token: string;
  username: string;
  onSelect: (id: number, role: 'DM' | 'PLAYER', name: string) => void;
  onLogout: () => void;
}

const CampaignList: React.FC<CampaignListProps> = ({ token, onSelect, onLogout }) => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [showJoin, setShowJoin] = useState<'create' | 'join' | false>(false);
  const [inputVal, setInputVal] = useState('');
  const [campaignToDelete, setCampaignToDelete] = useState<Campaign | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const importTargetRef = React.useRef<{ campaign: Campaign | null; mode: 'existing' | 'new' } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchCampaigns = async () => {
    const res = await fetch('/api/campaigns', { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setCampaigns(await res.json());
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleCreate = async () => {
    if (!inputVal) return;
    await fetch('/api/campaigns', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name: inputVal })
    });
    setInputVal('');
    setShowJoin(false);
    fetchCampaigns();
  };

  const handleJoin = async () => {
    if (!inputVal) return;
    await fetch('/api/campaigns/join', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ code: inputVal })
    });
    setInputVal('');
    setShowJoin(false);
    fetchCampaigns();
  };

  const requestDeleteCampaign = (campaign: Campaign) => {
    setCampaignToDelete(campaign);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteCampaign = async () => {
    if (!campaignToDelete) return;
    await fetch(`/api/campaigns/${campaignToDelete.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    setIsDeleteModalOpen(false);
    setCampaignToDelete(null);
    fetchCampaigns();
  };

  const handleExport = async (campaign: Campaign) => {
    try {
      setIsProcessing(true);
      const res = await fetch(`/api/campaigns/${campaign.id}/export`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Export failed');
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const safeName = campaign.name.replace(/[^a-z0-9-_]/gi, '_');
      const dateStamp = new Date().toISOString().replace(/[:.]/g, '-');
      link.download = `${safeName || 'campaign'}_${dateStamp}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('Не удалось экспортировать кампанию. Попробуйте ещё раз.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImportClick = (campaign: Campaign) => {
    importTargetRef.current = { campaign, mode: 'existing' };
    fileInputRef.current?.click();
  };

  const handleImportNewCampaignClick = () => {
    importTargetRef.current = { campaign: null, mode: 'new' };
    fileInputRef.current?.click();
  };

  const handleImportFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const target = importTargetRef.current;
    if (!file || !target) {
      e.target.value = '';
      return;
    }

    try {
      setIsProcessing(true);
      const text = await file.text();
      const payload = JSON.parse(text);
      const endpoint = target.mode === 'existing'
        ? `/api/campaigns/${target.campaign?.id}/import`
        : '/api/campaigns/import-new';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Import failed');
      alert(target.mode === 'existing' ? 'Кампания успешно импортирована.' : 'Создана новая кампания из файла.');
      fetchCampaigns();
    } catch (err) {
      console.error(err);
      alert('Ошибка импорта. Проверьте файл и попробуйте снова.');
    } finally {
      setIsProcessing(false);
      importTargetRef.current = null;
      e.target.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-dnd-dark p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8 border-b border-dnd-muted pb-4">
          <h1 className="text-2xl font-bold text-dnd-gold flex items-center gap-2">
            <Sword /> Ваши Кампании
          </h1>
          <button onClick={onLogout} className="text-dnd-muted hover:text-dnd-danger flex items-center gap-1 text-sm">
            <LogOut size={16} /> Выход
          </button>
        </div>
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <div
            className="bg-dnd-panel p-4 rounded border border-dnd-muted hover:border-dnd-gold transition cursor-pointer group"
            onClick={() => setShowJoin('create')}
          >
            <div className="flex items-center gap-3 text-dnd-gold font-bold mb-2">
              <Plus className="group-hover:scale-110 transition" /> Создать Кампанию (Для ДМ)
            </div>
          </div>
          <div
            className="bg-dnd-panel p-4 rounded border border-dnd-muted hover:border-dnd-accent transition cursor-pointer group"
            onClick={() => setShowJoin('join')}
          >
            <div className="flex items-center gap-3 text-dnd-accent font-bold mb-2">
              <Users className="group-hover:scale-110 transition" /> Присоединиться (Для Игроков)
            </div>
          </div>
        </div>
        {showJoin && (
          <div className="bg-black/30 p-4 rounded border border-dnd-muted mb-8 animate-fade-in">
            <label className="block text-xs text-dnd-muted mb-1">
              {showJoin === 'create' ? 'Название' : 'Код приглашения'}
            </label>
            <div className="flex gap-2">
              <input
                autoFocus
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                className="flex-1 bg-dnd-dark border border-dnd-muted rounded px-3 py-2 outline-none focus:border-dnd-gold"
              />
              <button
                onClick={showJoin === 'create' ? handleCreate : handleJoin}
                className="px-4 py-2 bg-dnd-gold text-dnd-dark rounded font-bold text-sm"
              >
                {showJoin === 'create' ? 'Создать' : 'Вступить'}
              </button>
              <button onClick={() => setShowJoin(false)} className="text-dnd-muted px-2">
                Отмена
              </button>
            </div>
            {showJoin === 'create' && (
              <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <span className="text-xs text-dnd-muted">Импорт файла создаст новую кампанию</span>
                <button
                  onClick={handleImportNewCampaignClick}
                  disabled={isProcessing}
                  className="px-4 py-1.5 bg-dnd-panel border border-dnd-accent text-dnd-accent rounded text-sm font-bold disabled:opacity-50"
                >
                  Импорт из файла
                </button>
              </div>
            )}
          </div>
        )}
        <div className="grid gap-3">
          {campaigns.map((c) => (
            <div
              key={c.id}
              className="bg-dnd-panel p-4 rounded border border-dnd-muted hover:bg-white/5 transition"
            >
              <div className="flex justify-between items-start gap-3">
                <div className="flex-1 cursor-pointer" onClick={() => onSelect(c.id, c.role, c.name)}>
                  <div className="font-bold text-lg text-dnd-text">{c.name}</div>
                  <div className="text-xs text-dnd-muted flex items-center gap-2">
                    {c.role === 'DM' ? (
                      <span className="text-dnd-gold flex items-center gap-1">
                        <Crown size={12} /> Вы Мастер
                      </span>
                    ) : (
                      <span className="text-dnd-accent flex items-center gap-1">
                        <Users size={12} /> Игрок
                      </span>
                    )}
                    {c.role === 'DM' && (
                      <span>
                        | Код: <span className="font-mono text-white select-all">{c.join_code}</span>
                      </span>
                    )}
                  </div>
                </div>
                {c.role === 'DM' && (
                  <div className="flex items-center gap-2">
                    <button
                      className="text-dnd-muted hover:text-dnd-gold transition"
                      title="Экспорт кампании"
                      disabled={isProcessing}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleExport(c);
                      }}
                    >
                      <Download size={16} />
                    </button>
                    <button
                      className="text-dnd-muted hover:text-dnd-accent transition"
                      title="Импорт кампании"
                      disabled={isProcessing}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleImportClick(c);
                      }}
                    >
                      <Upload size={16} />
                    </button>
                    <button
                      className="text-dnd-danger hover:text-white transition"
                      title="Удалить кампанию"
                      onClick={(e) => {
                        e.stopPropagation();
                        requestDeleteCampaign(c);
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={handleImportFileChange}
      />
      <DeleteCampaignModal
        isOpen={isDeleteModalOpen}
        onClose={() => { setIsDeleteModalOpen(false); setCampaignToDelete(null); }}
        onConfirm={confirmDeleteCampaign}
        campaignName={campaignToDelete?.name || ''}
      />
    </div>
  );
};

export default CampaignList;
