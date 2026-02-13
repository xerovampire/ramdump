
import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  const [isMaster, setIsMaster] = useState(false);

  // Initial Fetch & Real-time Subscriptions
  useEffect(() => {
    if (!currentRoom || !isSupabaseConfigured()) return;
    const client = getSupabase();

    // 1. Fetch initial messages
    const fetchInitialData = async () => {
      const { data: msgData } = await client
        .from('messages')
        .select()
        .eq('room_id', currentRoom.id)
        .order('created_at', { ascending: true });
      if (msgData) setMessages(msgData as Message[]);

      // Sync local state with actual DB state on load
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

    // 2. Subscribe to new messages
    const messageSub = client
      .channel(`room_messages_${currentRoom.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `room_id=eq.${currentRoom.id}` }, (payload) => {
        setMessages(prev => [...prev, payload.new as Message]);
      })
      .subscribe();

    // 3. Subscribe to room updates (Timer state)
    const roomSub = client
      .channel(`room_state_${currentRoom.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${currentRoom.id}` }, (payload) => {
        const update = payload.new as Room;
        // EVERYONE listens to the DB. If someone else paused, we pause.
        setTimerMode(update.timer_mode);
        setTimeLeft(update.time_left);
        setIsActive(update.is_active);
        // Refresh local durations if they changed
        setCurrentRoom(prev => prev ? { ...prev, study_duration: update.study_duration, break_duration: update.break_duration } : null);
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
    await client
      .from('rooms')
      .update(state)
      .eq('id', currentRoom.id);
  }, [currentRoom]);

  // Local Timer Tick
  useEffect(() => {
    let interval: any = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      const nextMode = timerMode === TimerMode.STUDY ? TimerMode.BREAK : TimerMode.STUDY;
      const nextTime = nextMode === TimerMode.STUDY 
        ? currentRoom!.study_duration * 60 
        : currentRoom!.break_duration * 60;
      
      setTimerMode(nextMode);
      setTimeLeft(nextTime);
      setIsActive(false);

      // Only the "Master" (the one who initiated the start usually) or anyone can trigger the switch in DB
      syncRoomState({
        timer_mode: nextMode,
        time_left: nextTime,
        is_active: false
      });
      
      try {
        new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3').play();
      } catch (e) {}
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, timerMode, currentRoom, syncRoomState]);

  // Periodic drift correction from the user who is "Master"
  useEffect(() => {
    if (!isMaster || !isActive) return;
    const heartbeat = setInterval(() => {
      syncRoomState({ time_left: timeLeft });
    }, 5000);
    return () => clearInterval(heartbeat);
  }, [isMaster, isActive, timeLeft, syncRoomState]);

  const handleJoin = (room: Room, name: string) => {
    setCurrentRoom(room);
    setUserName(name);
    setTimerMode(room.timer_mode);
    setTimeLeft(room.time_left);
    setIsActive(room.is_active);
    // In this collaborative version, anyone can be master if they start the clock
    setIsMaster(true); 
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
    // Push change to DB, subscription will update our local state
    syncRoomState({ is_active: nextActive, time_left: timeLeft });
  };

  const resetTimer = () => {
    const initialTime = currentRoom!.study_duration * 60;
    syncRoomState({ is_active: false, time_left: initialTime, timer_mode: TimerMode.STUDY });
  };

  const updateDurations = (studyMin: number, breakMin: number) => {
    const newTime = timerMode === TimerMode.STUDY ? studyMin * 60 : breakMin * 60;
    syncRoomState({ 
      study_duration: studyMin, 
      break_duration: breakMin,
      time_left: newTime,
      is_active: false // Pause on change to prevent glitches
    });
  };

  if (!currentRoom) {
    return <JoinScreen onJoin={handleJoin} />;
  }

  return (
    <div className="flex flex-col h-screen bg-black text-slate-100 overflow-hidden font-inter">
      <header className="px-6 py-4 flex justify-between items-center bg-slate-950/50 backdrop-blur-xl border-b border-white/5 z-30">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center font-black text-black">P</div>
          <div>
            <h1 className="font-black text-sm tracking-widest uppercase">{currentRoom.name}</h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
              ID: {currentRoom.id} • SYNCED SESSION
            </p>
          </div>
        </div>
        <button onClick={() => window.location.reload()} className="px-5 py-2.5 bg-red-500/10 text-red-500 rounded-xl border border-red-500/20 hover:bg-red-500 hover:text-white transition-all text-[10px] font-black tracking-widest uppercase">
          LEAVE
        </button>
      </header>

      <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
        <aside className="w-full md:w-[450px] p-8 flex flex-col items-center justify-center border-r border-white/5 bg-black relative">
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
          
          <div className="mt-12 text-center px-6 max-w-xs">
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Real-time Sync Active</p>
            </div>
            <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
              Any changes to the timer will reflect instantly for all participants in this room.
            </p>
          </div>
        </aside>

        <section className="flex-1 bg-black relative">
          <ChatContainer 
            messages={messages} 
            userName={userName} 
            onSendMessage={sendMessage}
            isLocked={timerMode === TimerMode.STUDY && isActive}
          />
        </section>
      </main>
    </div>
  );
};

export default App;
