
import React, { useState, useRef, useEffect } from 'react';
import { Message } from '../types';

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
    <div className="flex flex-col h-full relative overflow-hidden">
      {/* Chat Header for Full Screen Toggle */}
      <div className="px-6 py-3 border-b border-white/5 flex justify-between items-center bg-black/50 z-20 shrink-0">
         <div className="flex items-center gap-2">
           <div className={`w-1.5 h-1.5 rounded-full ${isLocked ? 'bg-rose-500' : 'bg-emerald-500 shadow-[0_0_10px_#10b981]'}`}></div>
           <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
             {isLocked ? 'Focus Chat (Locked)' : 'Rest Chat (Open)'}
           </span>
         </div>
         {!isLocked && (
           <button 
             onClick={() => onToggleFullScreen(!isFullScreen)}
             className="p-2 hover:bg-white/5 rounded-lg transition-colors text-slate-500 hover:text-white"
             title={isFullScreen ? "Exit Full Screen" : "Full Screen Chat"}
           >
             {isFullScreen ? (
               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3v5H3M21 8h-5V3M3 16h5v5M16 21v-5h5"/></svg>
             ) : (
               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
             )}
           </button>
         )}
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-10 space-y-6">
        {messages.map((msg, idx) => {
          const isOwn = msg.sender === userName;
          const showSender = !isOwn && (idx === 0 || messages[idx - 1].sender !== msg.sender);
          
          return (
            <div key={msg.id || idx} className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2`}>
              {showSender && <span className="text-[9px] font-black text-slate-500 mb-1.5 ml-3 uppercase tracking-widest">{msg.sender}</span>}
              <div className={`max-w-[75%] rounded-2xl px-5 py-3.5 shadow-xl transition-all ${isOwn ? 'bg-white text-black rounded-tr-sm' : 'bg-slate-900 text-slate-100 rounded-tl-sm border border-white/5'}`}>
                {msg.content && <p className="leading-relaxed text-sm font-medium">{msg.content}</p>}
                {msg.image_url && <img src={msg.image_url} alt="attached" className="rounded-xl mt-3 max-h-72 w-full object-cover border border-white/5" />}
                {msg.audio_url && <audio src={msg.audio_url} controls className="h-9 mt-3 w-full brightness-90 contrast-125" />}
                <div className={`text-[8px] mt-2 font-black opacity-30 ${isOwn ? 'text-right' : 'text-left'}`}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {isLocked && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-xl z-40 flex flex-col items-center justify-center text-center p-12 pointer-events-none animate-in fade-in duration-500">
          <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center text-rose-500 mb-6 border border-white/10 shadow-[0_0_30px_rgba(255,255,255,0.05)]">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          <h3 className="font-black text-xl uppercase tracking-[0.2em] text-white">Focus Mode</h3>
          <p className="text-slate-500 text-[10px] font-black mt-3 uppercase tracking-[0.3em] leading-relaxed max-w-[240px]">Deep work is in progress. Chat will auto-unlock when the break begins.</p>
        </div>
      )}

      <div className={`p-6 bg-black border-t border-white/5 transition-opacity duration-500 shrink-0 ${isLocked ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <div className="max-w-4xl mx-auto flex items-end gap-4">
          <button onClick={() => fileInputRef.current?.click()} className="p-3 text-slate-500 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
          </button>
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
          
          <div className="flex-1 relative">
            <textarea 
              value={inputText} 
              onChange={(e) => setInputText(e.target.value)} 
              onKeyDown={handleKeyDown} 
              placeholder="Type your message..." 
              rows={1} 
              className="w-full bg-slate-900 border border-white/5 rounded-3xl px-6 py-4 text-sm text-white focus:outline-none focus:border-white/10 resize-none transition-all placeholder-slate-700" 
            />
          </div>

          {inputText.trim() ? (
            <button onClick={handleSend} className="bg-white text-black p-4 rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          ) : (
            <button onMouseDown={startRecording} onMouseUp={stopRecording} onMouseLeave={stopRecording} className={`p-4 rounded-full transition-all active:scale-95 ${isRecording ? 'bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.5)] scale-110' : 'bg-slate-900 text-slate-500 border border-white/5'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatContainer;
