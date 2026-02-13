
import React, { useState, useEffect, useCallback } from 'react';
import { TimerMode, Room, Message } from './types';
import JoinScreen from './components/JoinScreen';
import Timer from './components/Timer';
import ChatContainer from './components/ChatContainer';
import { getSupabase, isSupabaseConfigured } from './services/supabaseClient';

const App: React.FC = () => {
  const [userName, setUserName] = useState<string>('');
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [timerMode, setTimerMode] = useState<TimerMode>(TimerMode.STUDY);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isChatFullScreen, setIsChatFullScreen] = useState(false);

  // Sync state with Supabase
  useEffect(() => {
    if (!currentRoom || !isSupabaseConfigured()) return;
    const client = getSupabase();

    const fetchInitialData = async () => {
      const { data: msgData } = await client
        .from('messages')
        .select()
        .eq('room_id', currentRoom.id)
        .order('created_at', { ascending: true });
      if (msgData) setMessages(msgData as Message[]);

      const { data: roomData } = await client
        .from('rooms')
        .select()
        .eq('id', currentRoom.id)
        .single();
      if (roomData) {
        setTimerMode(roomData.timer_mode);
        setTimeLeft(roomData.time_left);
        setIsActive(roomData.is_active);
      }
    };
    fetchInitialData();

    const messageSub = client
      .channel(`room_messages_${currentRoom.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `room_id=eq.${currentRoom.id}` }, (payload) => {
        setMessages(prev => [...prev, payload.new as Message]);
      })
      .subscribe();

    const roomSub = client
      .channel(`room_state_${currentRoom.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${currentRoom.id}` }, (payload) => {
        const update = payload.new as Room;
        setTimerMode(update.timer_mode);
        setTimeLeft(update.time_left);
        setIsActive(update.is_active);
        setCurrentRoom(prev => prev ? { ...prev, study_duration: update.study_duration, break_duration: update.break_duration } : null);
        
        // Removed auto-minimize/fullscreen logic per user request for manual control
      })
      .subscribe();

    return () => {
      messageSub.unsubscribe();
      roomSub.unsubscribe();
    };
  }, [currentRoom?.id]);

  const syncRoomState = useCallback(async (state: Partial<Room>) => {
    if (!currentRoom || !isSupabaseConfigured()) return;
    const client = getSupabase();
    await client.from('rooms').update(state).eq('id', currentRoom.id);
  }, [currentRoom]);

  // Timer Tick
  useEffect(() => {
    let interval: any = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (isActive && timeLeft === 0) {
      const isFinishingStudy = timerMode === TimerMode.STUDY;
      const nextMode = isFinishingStudy ? TimerMode.BREAK : TimerMode.STUDY;
      const nextTime = nextMode === TimerMode.STUDY 
        ? currentRoom!.study_duration * 60 
        : currentRoom!.break_duration * 60;
      
      setTimerMode(nextMode);
      setTimeLeft(nextTime);
      
      const shouldAutoStart = isFinishingStudy;
      setIsActive(shouldAutoStart);
      
      // Auto-restore layout ONLY when moving to break and user wasn't in manual full screen
      if (!shouldAutoStart && isMinimized && !isChatFullScreen) {
        setIsMinimized(false);
      }

      syncRoomState({ 
        timer_mode: nextMode, 
        time_left: nextTime, 
        is_active: shouldAutoStart 
      });
      
      try { new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3').play(); } catch (e) {}
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, timerMode, currentRoom, syncRoomState]);

  const handleJoin = (room: Room, name: string) => {
    setCurrentRoom(room);
    setUserName(name);
    setTimerMode(room.timer_mode);
    setTimeLeft(room.time_left);
    setIsActive(room.is_active);
  };

  const sendMessage = async (msg: Partial<Message>) => {
    if (!currentRoom || !isSupabaseConfigured()) return;
    const client = getSupabase();
    await client.from('messages').insert([{
      room_id: currentRoom.id,
      sender: userName,
      content: msg.content,
      image_url: msg.image_url,
      audio_url: msg.audio_url
    }]);
  };

  const toggleTimer = () => {
    const nextActive = !isActive;
    syncRoomState({ is_active: nextActive, time_left: timeLeft });
  };

  const resetTimer = () => {
    if (isActive && timerMode === TimerMode.STUDY) return;
    const initialTime = currentRoom!.study_duration * 60;
    syncRoomState({ is_active: false, time_left: initialTime, timer_mode: TimerMode.STUDY });
  };

  const updateDurations = (studyMin: number, breakMin: number) => {
    const newTime = timerMode === TimerMode.STUDY ? studyMin * 60 : breakMin * 60;
    syncRoomState({ study_duration: studyMin, break_duration: breakMin, time_left: newTime, is_active: false });
  };

  if (!currentRoom) return <JoinScreen onJoin={handleJoin} />;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-screen bg-black text-slate-100 overflow-hidden font-inter select-none">
      {/* Top Bar for Minimized Timer */}
      {isMinimized && (
        <div className="w-full bg-slate-950/90 backdrop-blur-md border-b border-white/5 py-2 px-6 flex items-center justify-between z-50 animate-in slide-in-from-top duration-300 shadow-2xl">
           <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${timerMode === TimerMode.STUDY ? 'bg-rose-500' : 'bg-emerald-500'} ${isActive ? 'animate-pulse' : ''}`}></div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                {timerMode === TimerMode.STUDY ? 'Focus' : 'Break'}
              </span>
           </div>
           <div className="text-xl font-black font-mono tracking-tighter tabular-nums text-white">
             {formatTime(timeLeft)}
           </div>
           <button onClick={() => { setIsMinimized(false); setIsChatFullScreen(false); }} className="text-[10px] font-black uppercase tracking-widest text-indigo-500 hover:text-indigo-400 transition-colors bg-indigo-500/10 px-3 py-1 rounded-lg">
             Restore
           </button>
        </div>
      )}

      <header className="px-6 py-4 flex justify-between items-center bg-slate-950/80 backdrop-blur-xl border-b border-white/5 z-30 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center font-black text-black text-xs rotate-3">P</div>
          <div>
            <h1 className="font-black text-xs tracking-widest uppercase">{currentRoom.name}</h1>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">ID: {currentRoom.id}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
           {!isMinimized && (
             <button onClick={() => setIsMinimized(true)} className="text-[9px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors mr-2">Minimize</button>
           )}
          <button onClick={() => window.location.reload()} className="px-4 py-2 bg-red-500/10 text-red-500 rounded-xl border border-red-500/20 hover:bg-red-500 hover:text-white transition-all text-[9px] font-black tracking-widest uppercase">
            Exit
          </button>
        </div>
      </header>

      <main className={`flex-1 flex overflow-hidden ${isMinimized || isChatFullScreen ? 'flex-col' : 'flex-col md:flex-row'}`}>
        {(!isMinimized && !isChatFullScreen) && (
          <aside className="w-full md:w-[420px] shrink-0 p-8 flex flex-col items-center justify-center border-r border-white/5 bg-black overflow-y-auto">
            <Timer 
              mode={timerMode}
              timeLeft={timeLeft}
              totalTime={timerMode === TimerMode.STUDY ? currentRoom.study_duration * 60 : currentRoom.break_duration * 60}
              isActive={isActive}
              studyDuration={currentRoom.study_duration}
              breakDuration={currentRoom.break_duration}
              onToggle={toggleTimer}
              onReset={resetTimer}
              onUpdateDurations={updateDurations}
            />
          </aside>
        )}

        <section className="flex-1 bg-black relative flex flex-col min-h-0">
          <ChatContainer 
            messages={messages} 
            userName={userName} 
            onSendMessage={sendMessage}
            isLocked={timerMode === TimerMode.STUDY}
            isFullScreen={isChatFullScreen}
            onToggleFullScreen={(val) => {
              setIsChatFullScreen(val);
              setIsMinimized(val);
            }}
          />
        </section>
      </main>
    </div>
  );
};

export default App;
