import React, { useState } from 'react';
import { Shield, User, Lock, LogIn, AlertCircle } from 'lucide-react';

interface AuthProps {
  onLogin: (token: string, username: string) => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const endpoint = isLogin ? '/api/login' : '/api/register';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      
      if (!res.ok) {
         if (data.error === 'User exists') {
             throw new Error('Такой пользователь уже существует. Попробуйте войти.');
         } else if (data.error === 'User not found') {
             throw new Error('Пользователь не найден.');
         } else if (data.error === 'Wrong password') {
             throw new Error('Неверный пароль.');
         }
         throw new Error(data.error || 'Произошла ошибка');
      }
      
      if (isLogin) {
        onLogin(data.token, data.username);
      } else {
        // Автоматический вход после регистрации
        const loginRes = await fetch('/api/login', {
           method: 'POST', headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ username, password })
        });
        if (loginRes.ok) {
            const loginData = await loginRes.json();
            onLogin(loginData.token, loginData.username);
        } else {
            setIsLogin(true);
            setError('Аккаунт создан. Теперь войдите.');
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dnd-dark flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/dark-leather.png')] opacity-50 pointer-events-none"></div>
      <div className="absolute -top-20 -left-20 w-64 h-64 bg-dnd-gold/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-dnd-accent/5 rounded-full blur-3xl"></div>

      <div className="bg-dnd-panel border border-dnd-muted p-8 rounded-2xl shadow-2xl max-w-md w-full relative z-10 backdrop-blur-sm">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-dnd-panel to-black rounded-full flex items-center justify-center mx-auto mb-4 border border-dnd-gold/30 shadow-lg shadow-dnd-gold/10">
            <Shield className="text-dnd-gold drop-shadow-lg" size={40} />
          </div>
          <h1 className="text-3xl font-bold text-dnd-gold font-serif tracking-wide">D&D Master</h1>
          <p className="text-dnd-muted text-sm mt-2 font-sans">Хранилище инвентаря и героев</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[10px] tracking-widest text-dnd-muted uppercase mb-1 font-bold ml-1">Имя героя (Логин)</label>
            <div className="relative group">
              <User className="absolute left-3 top-3 text-dnd-muted group-focus-within:text-dnd-gold transition" size={18} />
              <input 
                type="text" 
                required 
                disabled={loading}
                value={username} 
                onChange={e => setUsername(e.target.value)} 
                className="w-full bg-black/30 border border-dnd-muted rounded-lg pl-10 p-2.5 text-white focus:border-dnd-gold focus:ring-1 focus:ring-dnd-gold outline-none transition disabled:opacity-50"
                placeholder="Введите имя..."
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] tracking-widest text-dnd-muted uppercase mb-1 font-bold ml-1">Пароль</label>
            <div className="relative group">
              <Lock className="absolute left-3 top-3 text-dnd-muted group-focus-within:text-dnd-gold transition" size={18} />
              <input 
                type="password" 
                required 
                disabled={loading}
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                className="w-full bg-black/30 border border-dnd-muted rounded-lg pl-10 p-2.5 text-white focus:border-dnd-gold focus:ring-1 focus:ring-dnd-gold outline-none transition disabled:opacity-50"
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-dnd-danger text-sm bg-dnd-danger/10 p-3 rounded-lg border border-dnd-danger/20 animate-fade-in">
                <AlertCircle size={16} className="flex-shrink-0" />
                <span>{error}</span>
            </div>
          )}

          <button 
            disabled={loading} 
            className="w-full bg-gradient-to-r from-dnd-gold to-yellow-700 hover:brightness-110 text-dnd-dark font-bold py-3 rounded-lg transition flex items-center justify-center gap-2 shadow-lg shadow-dnd-gold/20 disabled:opacity-70 disabled:cursor-not-allowed transform active:scale-[0.98]"
          >
            {loading ? 'Магия творится...' : (isLogin ? 'Войти в таверну' : 'Создать аккаунт')}
            {!loading && <LogIn size={18} />}
          </button>
        </form>

        <div className="mt-6 text-center pt-4 border-t border-dnd-muted/30">
          <button 
            onClick={() => { setError(''); setIsLogin(!isLogin); }} 
            className="text-dnd-accent text-sm hover:text-white transition flex items-center justify-center gap-1 mx-auto"
          >
            {isLogin ? 'Впервые здесь? Создать аккаунт' : 'Уже есть аккаунт? Войти'}
          </button>
        </div>
      </div>
    </div>
  );
};
