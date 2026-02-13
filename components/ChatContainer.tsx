
import React, { useState, useRef, useEffect } from 'react';
import { Message } from '../types';

// Custom Waveform Component - Precise and clean like the reference
const WaveformBars: React.FC<{ progress: number; isOwn: boolean }> = ({ progress, isOwn }) => {
  // Pre-defined "waveform" for consistent aesthetic
  const bars = [15, 25, 35, 45, 30, 50, 60, 45, 35, 55, 65, 50, 40, 60, 45, 30, 40, 25, 20, 15];
  return (
    <div className="flex items-center gap-[2px] h-8 px-2">
      {bars.map((height, i) => {
        const isActive = (i / bars.length) * 100 < progress;
        return (
          <div
            key={i}
            style={{ height: `${height}%` }}
            className={`w-[2px] rounded-full transition-all duration-300 ${
              isActive 
                ? (isOwn ? 'bg-slate-900' : 'bg-white') 
                : (isOwn ? 'bg-slate-300' : 'bg-slate-700')
            }`}
          />
        );
      })}
    </div>
  );
};

interface VoicePlayerProps {
  url: string;
  isOwn: boolean;
}

const VoicePlayer: React.FC<VoicePlayerProps> = ({ url, isOwn }) => {
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
    <div className={`flex items-center gap-1 py-1.5 px-2 rounded-full transition-all ${
      isOwn ? 'bg-slate-100 shadow-sm' : 'bg-slate-800/80 border border-white/5'
    }`}>
      <audio ref={audioRef} src={url} onTimeUpdate={handleTimeUpdate} onEnded={() => { setIsPlaying(false); setProgress(0); }} className="hidden" />
      <button onClick={togglePlay} className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform active:scale-90 ${
        isOwn ? 'text-slate-900' : 'text-white'
      }`}>
        {isPlaying ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        )}
      </button>
      <WaveformBars progress={progress} isOwn={isOwn} />
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
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
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
    if (isProcessing || isRecording) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onload = (e) => {
          onSendMessage({ audio_url: e.target?.result as string });
          setIsProcessing(false);
        };
        reader.readAsDataURL(audioBlob);
      };

      recorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error(err);
      setIsProcessing(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      setIsProcessing(true); // Immediate lock to prevent spam
      setIsRecording(false);
      mediaRecorderRef.current.stop();
      // Kill microphone red dot immediately
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
    }
  };

  return (
    <div className="flex flex-col h-full relative overflow-hidden bg-black">
      <style>{`
        @keyframes smooth-fade-up {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-up {
          animation: smooth-fade-up 0.5s ease-out forwards;
        }
      `}</style>

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
            >
              {isFullScreen ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M8 3v5H3M21 8h-5V3M3 16h5v5M16 21v-5h5"/></svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
              )}
            </button>
         </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 scroll-smooth flex flex-col">
        {/* Forces content to start from bottom and grow upwards */}
        <div className="flex-1" />
        <div className="flex flex-col space-y-5">
          {messages.map((msg, idx) => {
            const isOwn = msg.sender === userName;
            const showSender = !isOwn && (idx === 0 || messages[idx - 1].sender !== msg.sender);
            
            return (
              <div key={msg.id || idx} className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} animate-fade-up`}>
                {showSender && <span className="text-[9px] font-black text-slate-600 mb-1.5 ml-3 uppercase tracking-[0.2em]">{msg.sender}</span>}
                <div className={`group relative max-w-[85%] rounded-[1.5rem] px-4 py-3 shadow-lg transition-all ${
                  isOwn ? 'bg-white text-black rounded-tr-sm' : 'bg-slate-900/90 backdrop-blur-md text-slate-100 rounded-tl-sm border border-white/5'
                }`}>
                  {msg.content && <p className="leading-relaxed text-[15px] font-medium">{msg.content}</p>}
                  {msg.image_url && <img src={msg.image_url} alt="attached" className="rounded-xl mt-2 max-h-80 w-full object-cover border border-white/5" />}
                  {msg.audio_url && <div className="mt-2"><VoicePlayer url={msg.audio_url} isOwn={isOwn} /></div>}
                  
                  <div className={`absolute bottom-[-16px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-[8px] font-black tracking-widest text-slate-600 ${isOwn ? 'right-0' : 'left-0'}`}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {isLocked && (
        <div className="absolute inset-0 bg-black/90 backdrop-blur-2xl z-40 flex flex-col items-center justify-center text-center p-12 pointer-events-none animate-in fade-in duration-700">
          <div className="w-20 h-20 rounded-[2rem] bg-rose-500/10 flex items-center justify-center text-rose-500 mb-8 border border-rose-500/20 shadow-[0_0_40px_rgba(239,68,68,0.15)]">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          <h3 className="font-black text-2xl uppercase tracking-[0.3em] text-white">Focus Mode</h3>
          <p className="text-slate-500 text-[10px] font-black mt-4 uppercase tracking-[0.4em] leading-relaxed max-w-[240px]">Collaboration resumes at the bell.</p>
        </div>
      )}

      <div className={`p-6 bg-black border-t border-white/5 transition-all duration-700 shrink-0 ${isLocked ? 'opacity-0 translate-y-10 pointer-events-none' : 'opacity-100 translate-y-0'}`}>
        <div className="max-w-4xl mx-auto flex items-end gap-3">
          <button disabled={isProcessing} onClick={() => fileInputRef.current?.click()} className="p-4 text-slate-500 hover:text-white transition-colors hover:bg-white/5 rounded-2xl disabled:opacity-20">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
          </button>
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
          
          <div className="flex-1 relative">
            <textarea 
              value={inputText} 
              disabled={isProcessing}
              onChange={(e) => setInputText(e.target.value)} 
              onKeyDown={handleKeyDown} 
              placeholder={isProcessing ? "Finalizing voice..." : "Type here..."} 
              rows={1} 
              className="w-full bg-slate-900/50 border border-white/5 rounded-[1.5rem] px-5 py-3.5 text-sm text-white focus:outline-none focus:border-white/20 resize-none transition-all placeholder-slate-800 disabled:opacity-50" 
            />
          </div>

          {inputText.trim() ? (
            <button onClick={handleSend} className="bg-white text-black p-4 rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          ) : (
            <button 
              onMouseDown={startRecording} 
              onMouseUp={stopRecording} 
              onMouseLeave={stopRecording}
              disabled={isProcessing}
              className={`p-4 rounded-2xl transition-all active:scale-95 disabled:opacity-20 ${
                isRecording 
                  ? 'bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.3)] scale-110' 
                  : 'bg-slate-900 text-slate-500 hover:bg-slate-800'
              }`}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatContainer;
