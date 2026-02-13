
import React, { useState, useEffect } from 'react';
import { Room, TimerMode } from '../types';
import { getSupabase, isSupabaseConfigured, configureSupabase, getDetectedConfig } from '../services/supabaseClient';

interface JoinScreenProps {
  onJoin: (room: Room, name: string) => void;
}

const JoinScreen: React.FC<JoinScreenProps> = ({ onJoin }) => {
  const [isCreating, setIsCreating] = useState(true);
  const [showConfig, setShowConfig] = useState(false);
  const [name, setName] = useState('');
  const [roomName, setRoomName] = useState('');
  const [roomID, setRoomID] = useState('');
  const [password, setPassword] = useState('');
  
  // Manual config state
  const config = getDetectedConfig();
  const [manualUrl, setManualUrl] = useState(config.url);
  const [manualKey, setManualKey] = useState(config.key);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isConfigured = isSupabaseConfigured();

  useEffect(() => {
    if (!isConfigured) {
      setShowConfig(true);
    }
  }, [isConfigured]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Explicitly apply manual settings if the environment hasn't picked them up
    if (manualUrl && manualKey && !isConfigured) {
      configureSupabase(manualUrl, manualKey);
    }

    const client = getSupabase();
    if (!client) {
      setError('Backend credentials missing. Check settings below.');
      setShowConfig(true);
      return;
    }

    if (!name) return setError('Please enter your display name');

    setLoading(true);
    try {
      if (isCreating) {
        if (!roomName) throw new Error('Please enter a room name');
        const id = Math.random().toString(36).substr(2, 6).toUpperCase();
        
        const { data, error: dbError } = await client
          .from('rooms')
          .insert([{
            id,
            name: roomName,
            password,
            study_duration: 25,
            break_duration: 5,
            time_left: 25 * 60,
            timer_mode: TimerMode.STUDY,
            is_active: false
          }])
          .select()
          .single();

        if (dbError) throw dbError;
        onJoin(data as Room, name);
      } else {
        if (!roomID) throw new Error('Please enter a room ID');
        const { data, error: dbError } = await client
          .from('rooms')
          .select()
          .eq('id', roomID.toUpperCase())
          .single();

        if (dbError || !data) throw new Error('Room not found. Check ID.');
        if (data.password && data.password !== password) throw new Error('Incorrect password');
        
        onJoin(data as Room, name);
      }
    } catch (err: any) {
      setError(err.message || 'Connection failed. Check your Supabase URL/Key.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-black">
      <div className="w-full max-w-md bg-slate-950 border border-white/5 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-600/10 rounded-full blur-[100px]"></div>

        <div className="text-center mb-8 relative">
          <div className="w-20 h-20 bg-white text-black rounded-3xl mx-auto mb-6 flex items-center justify-center text-4xl font-black shadow-2xl rotate-3">P</div>
          <h2 className="text-3xl font-black text-white tracking-tighter italic">POMOCHAT PRO</h2>
          <div className="flex items-center justify-center gap-2 mt-2">
             <div className={`w-1.5 h-1.5 rounded-full ${isConfigured ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-amber-500'}`}></div>
             <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">
               {isConfigured ? 'Connected to Cloud' : 'Backend Configuration Required'}
             </p>
          </div>
        </div>

        {showConfig && (
          <div className="mb-8 p-6 bg-indigo-500/5 border border-indigo-500/20 rounded-3xl space-y-4 animate-in fade-in slide-in-from-top-2">
            <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest text-center">Troubleshoot Backend</h3>
            
            {!isConfigured && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                <p className="text-[9px] text-amber-500 font-bold uppercase leading-relaxed tracking-wider text-center">
                  Tip: In Vite/Vercel frontends, environment variables must be prefixed with <span className="bg-amber-500 text-black px-1 rounded">VITE_</span> to be visible in the browser.
                </p>
              </div>
            )}

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[8px] font-black text-slate-600 uppercase ml-2">Supabase URL</label>
                <input 
                  type="text" 
                  value={manualUrl} 
                  onChange={(e) => setManualUrl(e.target.value)}
                  className="w-full bg-black border border-white/5 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-800 focus:outline-none focus:border-white/20" 
                  placeholder="https://xyz.supabase.co" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[8px] font-black text-slate-600 uppercase ml-2">Anon Key</label>
                <input 
                  type="password" 
                  value={manualKey} 
                  onChange={(e) => setManualKey(e.target.value)}
                  className="w-full bg-black border border-white/5 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-800 focus:outline-none focus:border-white/20" 
                  placeholder="eyJhbGciOi..." 
                />
              </div>
            </div>
            
            <button 
              onClick={() => {
                configureSupabase(manualUrl, manualKey);
                window.location.reload();
              }}
              className="w-full py-2 bg-indigo-600/20 text-indigo-400 rounded-xl text-[9px] font-black uppercase tracking-widest border border-indigo-600/30 hover:bg-indigo-600/30 transition-all"
            >
              Update & Reload App
            </button>
          </div>
        )}

        <div className="flex bg-white/5 p-1 rounded-2xl mb-8 border border-white/5">
          <button onClick={() => setIsCreating(true)} className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isCreating ? 'bg-white text-black shadow-lg' : 'text-slate-500'}`}>Create</button>
          <button onClick={() => setIsCreating(false)} className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!isCreating ? 'bg-white text-black shadow-lg' : 'text-slate-500'}`}>Join</button>
        </div>

        {error && <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-[10px] font-black text-center uppercase tracking-wider animate-bounce">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Your Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-white focus:outline-none focus:border-white/30 transition-all placeholder-slate-700" placeholder="Display Name" />
          </div>

          {!isCreating && (
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Room ID</label>
              <input type="text" value={roomID} onChange={(e) => setRoomID(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-white focus:outline-none uppercase" placeholder="XXXXXX" />
            </div>
          )}

          {isCreating && (
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Room Name</label>
              <input type="text" value={roomName} onChange={(e) => setRoomName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-white focus:outline-none" placeholder="Deep Work Session" />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Passcode</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-white focus:outline-none" placeholder="Optional Room Key" />
          </div>

          <button type="submit" disabled={loading} className="w-full bg-white text-black font-black py-4 rounded-2xl shadow-xl hover:bg-slate-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? 'CONNECTING...' : isCreating ? 'LAUNCH SESSION' : 'JOIN SESSION'}
          </button>
        </form>
        
        <button 
          onClick={() => setShowConfig(!showConfig)}
          className="w-full mt-6 text-[9px] font-black text-slate-600 uppercase tracking-widest hover:text-slate-400 transition-colors"
        >
          {showConfig ? 'Hide Settings' : 'Settings & Troubleshooting'}
        </button>
      </div>
    </div>
  );
};

export default JoinScreen;
