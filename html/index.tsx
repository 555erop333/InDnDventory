import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { Auth } from './components/Auth';
import { CampaignList } from './components/CampaignList';

const Root = () => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [campaignId, setCampaignId] = useState<number | null>(null);
  const [role, setRole] = useState<'DM' | 'PLAYER'>('PLAYER');
  const [username, setUsername] = useState<string>(localStorage.getItem('username') || '');

  const handleLogin = (t: string, u: string) => {
      localStorage.setItem('token', t);
      localStorage.setItem('username', u);
      setToken(t);
      setUsername(u);
  };

  const handleLogout = () => {
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      setToken(null);
      setCampaignId(null);
      setUsername('');
  };

  if (!token) {
    return <Auth onLogin={handleLogin} />;
  }

  if (campaignId === null) {
    return <CampaignList token={token} onSelect={(id, r) => { setCampaignId(id); setRole(r); }} onLogout={handleLogout} />;
  }

  return <App token={token} campaignId={campaignId} onBack={() => setCampaignId(null)} role={role} username={username} />;
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);