
import React, { useState, useRef, useEffect } from 'react';
import { Message } from '../types';

interface VoicePlayerProps {
  url: string;
}

const VoicePlayer: React.FC<VoicePlayerProps> = ({ url }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) audioRef.current.pause();
      else audioRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const p = (audioRef.current.currentTime / audioRef.current.duration) * 100;
      setProgress(p || 0);
    }
  };

  return (
    <div className="flex items-center gap-3 bg-white/5 hover:bg-white/10 transition-colors p-2 pr-4 rounded-2xl border border-white/5 min-w-[180px]">
      <audio ref={audioRef} src={url} onTimeUpdate={handleTimeUpdate} onEnded={() => setIsPlaying(false)} className="hidden" />
      <button onClick={togglePlay} className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center shadow-lg active:scale-90 transition-transform">
        {isPlaying ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="ml-1"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        )}
      </button>
      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div className="h-full bg-indigo-500 transition-all duration-100 ease-linear" style={{ width: `${progress}%` }} />
      </div>
      <span className="text-[9px] font-black text-slate-500">VOICE</span>
    </div>
  );
};

interface ChatContainerProps {
  messages: Message[];
  userName: string;
  onSendMessage: (msg: Partial<Message>) => void;
  isLocked: boolean;
  isFullScreen: boolean;
  onToggleFullScreen: (val: boolean) => void;
}

const ChatContainer: React.FC<ChatContainerProps> = ({ 
  messages, userName, onSendMessage, isLocked, isFullScreen, onToggleFullScreen 
}) => {
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (inputText.trim()) {
      onSendMessage({ content: inputText });
      setInputText('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => onSendMessage({ image_url: event.target?.result as string });
      reader.readAsDataURL(file);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onload = (e) => onSendMessage({ audio_url: e.target?.result as string });
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach(t => t.stop());
      };
      recorder.start();
      setIsRecording(true);
    } catch (err) { console.error(err); }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="flex flex-col h-full relative overflow-hidden bg-black">
      <div className="px-6 py-3 border-b border-white/5 flex justify-between items-center bg-slate-950/40 backdrop-blur-sm z-20 shrink-0">
         <div className="flex items-center gap-2">
           <div className={`w-1.5 h-1.5 rounded-full ${isLocked ? 'bg-rose-500' : 'bg-emerald-500 shadow-[0_0_10px_#10b981]'}`}></div>
           <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
             {isLocked ? 'Focus Locked' : 'Resting Open'}
           </span>
         </div>
         <div className="flex items-center gap-1">
            <button 
              onClick={() => onToggleFullScreen(!isFullScreen)}
              className="p-2 hover:bg-white/5 rounded-lg transition-colors text-slate-500 hover:text-white"
              title={isFullScreen ? "Exit Full Screen" : "Full Screen Chat"}
            >
              {isFullScreen ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M8 3v5H3M21 8h-5V3M3 16h5v5M16 21v-5h5"/></svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
              )}
            </button>
         </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-10 space-y-8 scroll-smooth">
        {messages.map((msg, idx) => {
          const isOwn = msg.sender === userName;
          const showSender = !isOwn && (idx === 0 || messages[idx - 1].sender !== msg.sender);
          
          return (
            <div key={msg.id || idx} className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both`}>
              {showSender && <span className="text-[9px] font-black text-slate-600 mb-2 ml-3 uppercase tracking-[0.2em]">{msg.sender}</span>}
              <div className={`group relative max-w-[85%] rounded-[1.75rem] px-5 py-4 shadow-2xl transition-all ${
                isOwn ? 'bg-white text-black rounded-tr-sm' : 'bg-slate-900/80 backdrop-blur-sm text-slate-100 rounded-tl-sm border border-white/5'
              }`}>
                {msg.content && <p className="leading-relaxed text-[15px] font-medium selection:bg-indigo-500 selection:text-white">{msg.content}</p>}
                {msg.image_url && <img src={msg.image_url} alt="attached" className="rounded-2xl mt-3 max-h-80 w-full object-cover border border-white/5 shadow-inner" />}
                {msg.audio_url && <div className="mt-3"><VoicePlayer url={msg.audio_url} /></div>}
                
                <div className={`absolute bottom-[-20px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-[8px] font-black tracking-widest text-slate-600 ${isOwn ? 'right-0' : 'left-0'}`}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {isLocked && (
        <div className="absolute inset-0 bg-black/85 backdrop-blur-xl z-40 flex flex-col items-center justify-center text-center p-12 pointer-events-none animate-in fade-in zoom-in-95 duration-700">
          <div className="w-24 h-24 rounded-[2.5rem] bg-rose-500/10 flex items-center justify-center text-rose-500 mb-8 border border-rose-500/20 shadow-[0_0_40px_rgba(239,68,68,0.15)] animate-pulse">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          <h3 className="font-black text-2xl uppercase tracking-[0.3em] text-white italic">Focusing</h3>
          <p className="text-slate-500 text-[10px] font-black mt-4 uppercase tracking-[0.4em] leading-relaxed max-w-[280px]">Deep work protocol active. Chat will resume automatically during break.</p>
        </div>
      )}

      <div className={`p-6 bg-black border-t border-white/5 transition-all duration-700 shrink-0 ${isLocked ? 'opacity-0 translate-y-10 pointer-events-none' : 'opacity-100 translate-y-0'}`}>
        <div className="max-w-4xl mx-auto flex items-end gap-3">
          <button onClick={() => fileInputRef.current?.click()} className="p-4 text-slate-500 hover:text-white transition-colors hover:bg-white/5 rounded-2xl">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
          </button>
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
          
          <div className="flex-1 relative">
            <textarea 
              value={inputText} 
              onChange={(e) => setInputText(e.target.value)} 
              onKeyDown={handleKeyDown} 
              placeholder="Send a message..." 
              rows={1} 
              className="w-full bg-slate-900/50 border border-white/5 rounded-[1.75rem] px-6 py-4 text-sm text-white focus:outline-none focus:border-white/10 resize-none transition-all placeholder-slate-700" 
            />
          </div>

          {inputText.trim() ? (
            <button onClick={handleSend} className="bg-white text-black p-4 rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          ) : (
            <button onMouseDown={startRecording} onMouseUp={stopRecording} onMouseLeave={stopRecording} className={`p-4 rounded-2xl transition-all active:scale-95 ${isRecording ? 'bg-red-500 text-white shadow-[0_0_25px_rgba(239,68,68,0.4)] scale-110' : 'bg-slate-900 text-slate-500 hover:bg-slate-800'}`}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatContainer;
