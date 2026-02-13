
import React, { useState } from 'react';
import { Room, TimerMode } from '../types';
import { getSupabase, isSupabaseConfigured, configureSupabase, getDetectedConfig } from '../services/supabaseClient';

interface JoinScreenProps {
  onJoin: (room: Room, name: string) => void;
}

const JoinScreen: React.FC<JoinScreenProps> = ({ onJoin }) => {
  const [isCreating, setIsCreating] = useState(true);
  const [name, setName] = useState('');
  const [roomName, setRoomName] = useState('');
  const [roomID, setRoomID] = useState('');
  const [password, setPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isConfigured = isSupabaseConfigured();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const client = getSupabase();
    if (!client) {
      setError('System connection failure. Verify backend setup.');
      return;
    }

    if (!name) return setError('Identify yourself');

    setLoading(true);
    try {
      if (isCreating) {
        if (!roomName) throw new Error('Specify a room title');
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
        if (!roomID) throw new Error('Room ID required');
        const { data, error: dbError } = await client
          .from('rooms')
          .select()
          .eq('id', roomID.toUpperCase())
          .single();

        if (dbError || !data) throw new Error('Unknown Room ID');
        if (data.password && data.password !== password) throw new Error('Incorrect Security Key');
        
        onJoin(data as Room, name);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-black">
      <div className="w-full max-w-md bg-slate-950 border border-white/5 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-32 -right-32 w-80 h-80 bg-white/5 rounded-full blur-[120px]"></div>

        <div className="text-center mb-10 relative">
          <div className="w-20 h-20 bg-white text-black rounded-[2rem] mx-auto mb-6 flex items-center justify-center text-4xl font-black shadow-2xl rotate-6 transition-transform hover:rotate-12 duration-500">P</div>
          <h2 className="text-3xl font-black text-white tracking-tighter italic">POMOCHAT</h2>
          <div className="flex items-center justify-center gap-2 mt-3">
             <div className={`w-1.5 h-1.5 rounded-full ${isConfigured ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-red-500'}`}></div>
             <p className="text-slate-500 text-[9px] font-black uppercase tracking-[0.3em]">
               {isConfigured ? 'Cloud Authorized' : 'Service Disconnected'}
             </p>
          </div>
        </div>

        <div className="flex bg-white/5 p-1 rounded-2xl mb-8 border border-white/5">
          <button onClick={() => setIsCreating(true)} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isCreating ? 'bg-white text-black' : 'text-slate-500'}`}>New Room</button>
          <button onClick={() => setIsCreating(false)} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!isCreating ? 'bg-white text-black' : 'text-slate-500'}`}>Connect</button>
        </div>

        {error && <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-[10px] font-black text-center uppercase tracking-widest animate-pulse">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Your Identity</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-white/20 transition-all placeholder-slate-800" placeholder="Display Name" />
          </div>

          {!isCreating ? (
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Access Code</label>
              <input type="text" value={roomID} onChange={(e) => setRoomID(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none uppercase" placeholder="XXXXXX" />
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Room Title</label>
              <input type="text" value={roomName} onChange={(e) => setRoomName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none" placeholder="E.g. Engineering Deep Work" />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Security Key</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none" placeholder="Optional Room Password" />
          </div>

          <button type="submit" disabled={loading} className="w-full bg-white text-black font-black py-5 rounded-2xl shadow-2xl hover:bg-slate-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2 tracking-[0.1em] text-xs">
            {loading ? 'AUTHORIZING...' : isCreating ? 'LAUNCH SESSION' : 'JOIN SESSION'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default JoinScreen;
