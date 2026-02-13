
import React, { useState } from 'react';
import { TimerMode } from '../types';

interface TimerProps {
  mode: TimerMode;
  timeLeft: number;
  totalTime: number;
  isActive: boolean;
  studyDuration: number;
  breakDuration: number;
  onToggle: () => void;
  onReset: () => void;
  onUpdateDurations: (study: number, breakDur: number) => void;
}

const Timer: React.FC<TimerProps> = ({ 
  mode, timeLeft, totalTime, isActive, studyDuration, breakDuration, 
  onToggle, onReset, onUpdateDurations 
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [localStudy, setLocalStudy] = useState(studyDuration);
  const [localBreak, setLocalBreak] = useState(breakDuration);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const percentage = (timeLeft / totalTime) * 100;
  const strokeDashoffset = 283 - (283 * (100 - percentage)) / 100;
  const isStudy = mode === TimerMode.STUDY;

  const handleSave = () => {
    onUpdateDurations(localStudy, localBreak);
    setShowSettings(false);
  };

  return (
    <div className="flex flex-col items-center group w-full relative">
      {/* Settings Modal/Panel Overlay */}
      {showSettings && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900/95 backdrop-blur-2xl border border-white/10 w-full rounded-[2rem] p-8 shadow-3xl animate-in zoom-in-95 fade-in duration-200">
            <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6 text-center">Session Config</h3>
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Focus Time</label>
                  <span className="text-rose-500 font-mono text-xs font-black">{localStudy} MIN</span>
                </div>
                <input 
                  type="range" min="1" max="60" value={localStudy} 
                  onChange={(e) => setLocalStudy(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-white/5 rounded-full appearance-none cursor-pointer accent-rose-500" 
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Break Time</label>
                  <span className="text-emerald-500 font-mono text-xs font-black">{localBreak} MIN</span>
                </div>
                <input 
                  type="range" min="1" max="30" value={localBreak} 
                  onChange={(e) => setLocalBreak(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-white/5 rounded-full appearance-none cursor-pointer accent-emerald-500" 
                />
              </div>
            </div>
            <div className="mt-8 flex gap-3">
              <button 
                onClick={handleSave}
                className="flex-1 py-3.5 bg-white text-black text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-200 transition-all"
              >
                Apply Globally
              </button>
              <button 
                onClick={() => setShowSettings(false)}
                className="flex-1 py-3.5 bg-slate-800 text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-700 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={`relative w-72 h-72 md:w-80 md:h-80 flex items-center justify-center transition-opacity duration-300 ${showSettings ? 'opacity-10 pointer-events-none' : ''}`}>
        <div className={`absolute inset-10 blur-3xl rounded-full opacity-20 transition-colors duration-1000 ${isStudy ? 'bg-rose-600' : 'bg-emerald-600'}`}></div>
        
        <svg className="absolute w-full h-full -rotate-90">
          <circle cx="50%" cy="50%" r="42%" className="stroke-white/5 fill-none" strokeWidth="10" />
          <circle
            cx="50%" cy="50%" r="42%"
            className={`fill-none transition-all duration-1000 ease-in-out ${isStudy ? 'stroke-rose-500' : 'stroke-emerald-500'}`}
            strokeWidth="10"
            strokeDasharray="283"
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>

        <div className="text-center z-10 select-none">
          <p className={`text-[10px] font-black uppercase tracking-[0.4em] mb-1 transition-colors duration-500 ${isStudy ? 'text-rose-500' : 'text-emerald-500'}`}>
            {isStudy ? 'FOCUS SESSION' : 'SHORT BREAK'}
          </p>
          <h2 className="text-7xl font-black font-mono tracking-tighter text-white tabular-nums">
            {formatTime(timeLeft)}
          </h2>
          <div className="w-12 h-1 bg-white/10 mx-auto my-4 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-1000 ${isStudy ? 'bg-rose-500' : 'bg-emerald-500'}`}
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className={`flex gap-3 mt-12 transition-all ${showSettings ? 'opacity-0 scale-90' : ''}`}>
        <button
          onClick={onToggle}
          className={`px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center gap-3 active:scale-95 ${
            isActive 
              ? 'bg-slate-900 text-slate-400 border border-white/5 hover:text-white' 
              : 'bg-white text-black shadow-[0_20px_40px_rgba(255,255,255,0.1)] hover:bg-slate-100'
          }`}
        >
          {isActive ? (
            <><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg> PAUSE</>
          ) : (
            <><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg> START</>
          )}
        </button>
        
        <button
          onClick={onReset}
          className="p-4 bg-slate-900 border border-white/5 text-slate-500 hover:text-white rounded-2xl transition-all hover:bg-slate-800 active:scale-90"
          title="Reset Global Timer"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
        </button>

        <button
          onClick={() => setShowSettings(true)}
          className="p-4 bg-slate-900 border border-white/5 text-slate-500 hover:text-white rounded-2xl transition-all hover:bg-slate-800 active:scale-90"
          title="Timer Settings"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
        </button>
      </div>
    </div>
  );
};

export default Timer;
