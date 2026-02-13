
import React, { useState } from 'react';
import { Room, TimerMode } from '../types';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';

interface JoinScreenProps {
  onJoin: (room: Room, name: string) => void;
}

const JoinScreen: React.FC<JoinScreenProps> = ({ onJoin }) => {
  const [isCreating, setIsCreating] = useState(true);
  const [name, setName] = useState('');
  const [roomName, setRoomName] = useState('');
  const [roomID, setRoomID] = useState('');
  const [password, setPassword] = useState('');
  const [studyTime, setStudyTime] = useState(25);
  const [breakTime, setBreakTime] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!isSupabaseConfigured) {
      setError('Backend Error: SUPABASE_URL and SUPABASE_ANON_KEY environment variables are missing.');
      return;
    }

    if (!name) return setError('Enter your name');

    setLoading(true);
    try {
      if (isCreating) {
        if (!roomName) throw new Error('Enter a room name');
        const id = Math.random().toString(36).substr(2, 6).toUpperCase();
        
        const { data, error: dbError } = await supabase
          .from('rooms')
          .insert([{
            id,
            name: roomName,
            password,
            study_duration: studyTime,
            break_duration: breakTime,
            time_left: studyTime * 60,
            timer_mode: TimerMode.STUDY,
            is_active: false
          }])
          .select()
          .single();

        if (dbError) throw dbError;
        onJoin(data as Room, name);
      } else {
        if (!roomID) throw new Error('Enter a room ID');
        const { data, error: dbError } = await supabase
          .from('rooms')
          .select()
          .eq('id', roomID.toUpperCase())
          .single();

        if (dbError || !data) throw new Error('Room not found');
        if (data.password && data.password !== password) throw new Error('Incorrect password');
        
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
      <div className="w-full max-w-md bg-slate-950 border border-white/5 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-600/10 rounded-full blur-[100px]"></div>

        <div className="text-center mb-8 relative">
          <div className="w-20 h-20 bg-white text-black rounded-3xl mx-auto mb-6 flex items-center justify-center text-4xl font-black shadow-2xl rotate-3">P</div>
          <h2 className="text-3xl font-black text-white tracking-tighter italic">POMOCHAT PRO</h2>
          <p className="text-slate-500 mt-2 text-xs font-bold uppercase tracking-widest">Supabase Backend Connected</p>
        </div>

        <div className="flex bg-white/5 p-1 rounded-2xl mb-8 border border-white/5">
          <button onClick={() => setIsCreating(true)} className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isCreating ? 'bg-white text-black shadow-lg' : 'text-slate-500'}`}>Create</button>
          <button onClick={() => setIsCreating(false)} className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!isCreating ? 'bg-white text-black shadow-lg' : 'text-slate-500'}`}>Join</button>
        </div>

        {error && <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-[10px] font-black text-center uppercase tracking-wider">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Identity</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-white focus:outline-none focus:border-white/30 transition-all placeholder-slate-700" placeholder="Your Name" />
          </div>

          {!isCreating && (
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Room ID</label>
              <input type="text" value={roomID} onChange={(e) => setRoomID(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-white focus:outline-none uppercase" placeholder="XXXXXX" />
            </div>
          )}

          {isCreating && (
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Room Title</label>
              <input type="text" value={roomName} onChange={(e) => setRoomName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-white focus:outline-none" placeholder="Deep Work Session" />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Privacy Key</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-white focus:outline-none" placeholder="Optional Password" />
          </div>

          <button type="submit" disabled={loading} className="w-full bg-white text-black font-black py-4 rounded-2xl shadow-xl hover:bg-slate-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? 'SYNCHRONIZING...' : isCreating ? 'CREATE BACKEND ROOM' : 'CONNECT TO ROOM'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default JoinScreen;
