
import React, { useState, useRef, useEffect } from 'react';
import { Message } from '../types';

// Custom Symmetric Waveform
const WaveformBars: React.FC<{ progress: number; isOwn: boolean }> = ({ progress, isOwn }) => {
  const heights = [20, 30, 40, 60, 80, 70, 90, 100, 80, 60, 40, 30, 20, 35, 50, 45, 30, 20];
  return (
    <div className="flex items-center gap-[3px] h-10 px-4">
      {heights.map((h, i) => {
        const isActive = (i / heights.length) * 100 < progress;
        return (
          <div
            key={i}
            style={{ height: `${h * 0.4}%` }}
            className={`w-[2.5px] rounded-full transition-all duration-300 ${
              isActive 
                ? (isOwn ? 'bg-indigo-600' : 'bg-indigo-400') 
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
    <div className={`flex items-center gap-1 py-2 px-3 rounded-[2.5rem] shadow-xl transition-all ${
      isOwn ? 'bg-slate-100' : 'bg-slate-900/90 border border-white/10'
    }`}>
      <audio ref={audioRef} src={url} onTimeUpdate={handleTimeUpdate} onEnded={() => { setIsPlaying(false); setProgress(0); }} className="hidden" />
      <button onClick={togglePlay} className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform active:scale-90 ${
        isOwn ? 'text-slate-900 hover:bg-black/5' : 'text-white hover:bg-white/5'
      }`}>
        {isPlaying ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="ml-1"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        )}
      </button>
      <div className={`mx-2 rounded-full py-1 px-1 ${isOwn ? 'bg-indigo-50/50' : 'bg-white/5'}`}>
        <WaveformBars progress={progress} isOwn={isOwn} />
      </div>
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
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
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
      setTimeout(() => textareaRef.current?.focus(), 10);
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
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onload = (e) => {
          onSendMessage({ audio_url: e.target?.result as string });
          setIsProcessing(false);
          textareaRef.current?.focus();
        };
        reader.readAsDataURL(audioBlob);
      };
      recorder.start();
      setIsRecording(true);
    } catch (err) { console.error(err); setIsProcessing(false); }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      setIsProcessing(true);
      setIsRecording(false);
      mediaRecorderRef.current.stop();
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
          0% { opacity: 0; transform: translateY(12px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-up { animation: smooth-fade-up 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>

      {/* Image Preview Overlay */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-4 animate-in fade-in duration-300"
          onClick={() => setPreviewImage(null)}
        >
          <button className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors p-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
          <img src={previewImage} className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-[0_0_100px_rgba(255,255,255,0.1)] scale-100 hover:scale-[1.02] transition-transform duration-500" alt="preview" />
          <p className="mt-8 text-slate-500 text-[10px] font-black uppercase tracking-[0.4em]">Tap anywhere to close</p>
        </div>
      )}

      <div className="px-6 py-3 border-b border-white/5 flex justify-between items-center bg-slate-950/40 backdrop-blur-sm z-20 shrink-0">
         <div className="flex items-center gap-2">
           <div className={`w-1.5 h-1.5 rounded-full ${isLocked ? 'bg-rose-500' : 'bg-emerald-500 shadow-[0_0_10px_#10b981]'}`}></div>
           <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
             {isLocked ? 'Focus Active' : 'Resting Open'}
           </span>
         </div>
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

      <div className="flex-1 overflow-y-auto px-6 py-6 scroll-smooth flex flex-col no-scrollbar">
        <div className="flex-1" />
        <div className="flex flex-col space-y-6">
          {messages.map((msg, idx) => {
            const isOwn = msg.sender === userName;
            const showSender = !isOwn && (idx === 0 || messages[idx - 1].sender !== msg.sender);
            const isVoice = !!msg.audio_url;
            const isImageOnly = !!msg.image_url && !msg.content && !msg.audio_url;
            
            return (
              <div key={msg.id || idx} className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} animate-fade-up`}>
                {showSender && <span className="text-[9px] font-black text-slate-700 mb-1.5 ml-3 uppercase tracking-[0.2em]">{msg.sender}</span>}
                
                {isVoice ? (
                  <div className="relative group">
                    <VoicePlayer url={msg.audio_url!} isOwn={isOwn} />
                    <div className={`absolute bottom-[-18px] opacity-40 text-[8px] font-black tracking-widest text-slate-600 ${isOwn ? 'right-2' : 'left-2'}`}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ) : isImageOnly ? (
                  /* Image Only - Removed standard bubble like voice notes */
                  <div className="relative group max-w-[85%]">
                    <img 
                      src={msg.image_url} 
                      onClick={() => setPreviewImage(msg.image_url!)}
                      alt="shared" 
                      className={`rounded-2xl max-h-96 w-auto object-cover cursor-pointer hover:opacity-90 transition-all border border-white/5 shadow-2xl ${isOwn ? 'hover:scale-[1.02]' : 'hover:scale-[1.02]'}`}
                    />
                    <div className={`absolute bottom-[-18px] opacity-40 text-[8px] font-black tracking-widest text-slate-600 ${isOwn ? 'right-2' : 'left-2'}`}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ) : (
                  /* Text/Image Hybrid Bubble */
                  <div className={`group relative max-w-[85%] rounded-[1.75rem] px-5 py-4 shadow-lg transition-all ${
                    isOwn ? 'bg-white text-black rounded-tr-sm' : 'bg-slate-900/90 backdrop-blur-md text-slate-100 rounded-tl-sm border border-white/5'
                  }`}>
                    {msg.content && <p className="leading-relaxed text-[15px] font-medium">{msg.content}</p>}
                    {msg.image_url && (
                      <img 
                        src={msg.image_url} 
                        onClick={() => setPreviewImage(msg.image_url!)}
                        alt="attached" 
                        className="rounded-xl mt-3 max-h-80 w-full object-cover border border-white/5 cursor-pointer" 
                      />
                    )}
                    <div className={`absolute bottom-[-18px] opacity-40 text-[8px] font-black tracking-widest text-slate-600 ${isOwn ? 'right-2' : 'left-2'}`}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {isLocked && (
        <div className="absolute inset-0 bg-black/95 backdrop-blur-3xl z-40 flex flex-col items-center justify-center text-center p-12 pointer-events-none animate-in fade-in duration-700">
          <div className="w-20 h-20 rounded-[2rem] bg-rose-500/10 flex items-center justify-center text-rose-500 mb-8 border border-rose-500/20 shadow-[0_0_50px_rgba(239,68,68,0.2)]">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          <h3 className="font-black text-2xl uppercase tracking-[0.3em] text-white">Focus Session</h3>
          <p className="text-slate-600 text-[10px] font-black mt-4 uppercase tracking-[0.4em] max-w-[200px] leading-loose">Interruptions restricted until timer completion.</p>
        </div>
      )}

      <div className={`p-6 bg-[#050505] border-t border-white/5 transition-all duration-700 shrink-0 ${isLocked ? 'opacity-0 translate-y-10 pointer-events-none' : 'opacity-100 translate-y-0'}`}>
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <button disabled={isProcessing} onClick={() => fileInputRef.current?.click()} className="p-3 text-slate-600 hover:text-white transition-colors hover:bg-white/5 rounded-xl disabled:opacity-20">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
          </button>
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
          
          <div className="flex-1 relative flex items-center bg-[#0d1117] border border-white/5 rounded-[2rem] transition-all focus-within:border-white/20 px-6">
            <textarea 
              ref={textareaRef}
              value={inputText} 
              disabled={isProcessing}
              onChange={(e) => setInputText(e.target.value)} 
              onKeyDown={handleKeyDown} 
              placeholder={isProcessing ? "Processing..." : "Type here..."} 
              rows={1} 
              className="w-full bg-transparent py-4 text-[15px] text-white focus:outline-none resize-none placeholder-slate-700 disabled:opacity-50" 
            />
            {inputText.trim() && (
              <button onClick={handleSend} className="text-indigo-500 ml-2 p-1 hover:scale-110 transition-transform">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              </button>
            )}
          </div>

          <button 
            onMouseDown={startRecording} 
            onMouseUp={stopRecording} 
            onMouseLeave={stopRecording}
            disabled={isProcessing}
            className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all active:scale-95 disabled:opacity-20 ${
              isRecording 
                ? 'bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)]' 
                : 'bg-[#161b22] text-slate-500 hover:bg-[#21262d] hover:text-white'
            }`}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatContainer;
