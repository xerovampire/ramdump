
import React, { useState, useRef, useEffect } from 'react';
import { Message } from '../types';

interface ChatContainerProps {
  messages: Message[];
  userName: string;
  onSendMessage: (msg: Partial<Message>) => void;
  isLocked: boolean;
}

const ChatContainer: React.FC<ChatContainerProps> = ({ messages, userName, onSendMessage, isLocked }) => {
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
      reader.onload = (event) => {
        onSendMessage({ image_url: event.target?.result as string });
      };
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
    <div className="flex flex-col h-full relative">
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
        {messages.map((msg, idx) => {
          const isOwn = msg.sender === userName;
          const showSender = !isOwn && (idx === 0 || messages[idx - 1].sender !== msg.sender);
          
          return (
            <div key={msg.id} className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-1`}>
              {showSender && <span className="text-[10px] font-black text-slate-600 mb-1 ml-3 uppercase tracking-widest">{msg.sender}</span>}
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${isOwn ? 'bg-white text-black rounded-br-none' : 'bg-slate-900 text-slate-100 rounded-bl-none'}`}>
                {msg.content && <p className="leading-snug">{msg.content}</p>}
                {msg.image_url && <img src={msg.image_url} alt="attached" className="rounded-xl mt-2 max-h-60" />}
                {msg.audio_url && <audio src={msg.audio_url} controls className="h-8 mt-2 brightness-90" />}
                <p className={`text-[8px] mt-2 font-black opacity-50 ${isOwn ? 'text-right' : 'text-left'}`}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {isLocked && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-20 flex flex-col items-center justify-center text-center p-10 pointer-events-none">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-white mb-4 border border-white/10">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          <h3 className="font-black text-lg uppercase tracking-widest">Chat Locked</h3>
          <p className="text-slate-500 text-xs font-bold mt-2 uppercase tracking-tighter">Focus until the break</p>
        </div>
      )}

      <div className={`p-4 bg-black border-t border-white/5 ${isLocked ? 'opacity-20' : ''}`}>
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <button onClick={() => fileInputRef.current?.click()} className="p-3 text-slate-500 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
          </button>
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
          <textarea value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyDown={handleKeyDown} placeholder="Message..." rows={1} className="flex-1 bg-slate-900 border-none rounded-2xl px-4 py-3 text-sm text-white resize-none" />
          {inputText ? (
            <button onClick={handleSend} className="p-3 text-indigo-500"><svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="rotate-45"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg></button>
          ) : (
            <button onMouseDown={startRecording} onMouseUp={stopRecording} onMouseLeave={stopRecording} className={`p-3 rounded-full ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'text-slate-500'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatContainer;
