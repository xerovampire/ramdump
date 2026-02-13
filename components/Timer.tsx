
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
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  const isStudy = mode === TimerMode.STUDY;
  const canReset = !(isActive && isStudy);

  const handleSave = () => {
    onUpdateDurations(localStudy, localBreak);
    setShowSettings(false);
  };

  // Ultra-soft glow colors
  const glowColor = isStudy ? 'rgba(244, 63, 94, 0.15)' : 'rgba(16, 185, 129, 0.15)';

  return (
    <div className="flex flex-col items-center group w-full relative">
      {showSettings && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-950/95 backdrop-blur-2xl border border-white/10 w-full rounded-[2.5rem] p-8 shadow-3xl animate-in zoom-in-95 fade-in duration-300">
            <h3 className="text-xs font-black text-white uppercase tracking-widest mb-8 text-center">Settings</h3>
            <div className="space-y-8">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Focus</label>
                  <span className="text-rose-500 font-mono text-xs font-black">{localStudy}m</span>
                </div>
                <input type="range" min="1" max="60" value={localStudy} onChange={(e) => setLocalStudy(parseInt(e.target.value))} className="w-full h-1 bg-white/5 rounded-full appearance-none cursor-pointer accent-rose-500" />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Break</label>
                  <span className="text-emerald-500 font-mono text-xs font-black">{localBreak}m</span>
                </div>
                <input type="range" min="1" max="30" value={localBreak} onChange={(e) => setLocalBreak(parseInt(e.target.value))} className="w-full h-1 bg-white/5 rounded-full appearance-none cursor-pointer accent-emerald-500" />
              </div>
            </div>
            <div className="mt-10 flex gap-4">
              <button onClick={handleSave} className="flex-1 py-4 bg-white text-black text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-200 transition-all active:scale-95">Save</button>
              <button onClick={() => setShowSettings(false)} className="flex-1 py-4 bg-slate-900 text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-800 transition-all active:scale-95">Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className={`relative w-72 h-72 flex items-center justify-center transition-all duration-700 ${showSettings ? 'opacity-5 pointer-events-none scale-90' : 'opacity-100'}`}>
        {/* Soft radial background glow without sharp edges */}
        <div 
          className="absolute inset-[-60px] blur-[120px] rounded-full pointer-events-none"
          style={{ 
            background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`,
            opacity: isActive ? 1 : 0.4,
            transition: 'opacity 1s ease'
          }}
        ></div>
        
        <svg viewBox="0 0 100 100" className="absolute w-full h-full -rotate-90 select-none overflow-visible">
          {/* Main Track */}
          <circle cx="50" cy="50" r="45" className="stroke-white/[0.04] fill-none" strokeWidth="5.5" />
          
          {/* Progress Circle - Solid and smooth, no breathe animation */}
          <circle 
            cx="50" cy="50" r="45" 
            className={`fill-none transition-all duration-1000 ease-linear ${isStudy ? 'stroke-rose-500' : 'stroke-emerald-500'}`} 
            strokeWidth="5.5" 
            strokeDasharray={circumference} 
            style={{ 
                strokeDashoffset,
                filter: isActive ? `drop-shadow(0 0 6px ${isStudy ? 'rgba(244,63,94,0.3)' : 'rgba(16,185,129,0.3)'})` : 'none'
            }} 
            strokeLinecap="round" 
          />
        </svg>

        <div className="text-center z-10 select-none">
          <p className={`text-[10px] font-black uppercase tracking-[0.4em] mb-4 transition-all duration-700 ${isStudy ? 'text-rose-500' : 'text-emerald-500'} ${isActive ? 'opacity-100' : 'opacity-40'}`}>
            {isStudy ? 'Focusing' : 'Resting'}
          </p>
          <h2 className={`text-6xl font-black font-mono tracking-tighter text-white tabular-nums leading-none transition-transform duration-500`}>
            {formatTime(timeLeft)}
          </h2>
        </div>
      </div>

      <div className={`flex gap-4 mt-16 transition-all duration-700 ${showSettings ? 'opacity-0 scale-90' : 'opacity-100'}`}>
        <button
          onClick={onToggle}
          className={`group px-12 py-5 rounded-[2.5rem] font-black uppercase tracking-widest text-[11px] transition-all duration-300 flex items-center gap-4 active:scale-90 shadow-2xl relative overflow-hidden ${
            isActive 
              ? 'bg-slate-900 text-slate-100 border border-white/10' 
              : 'bg-white text-black hover:scale-105'
          }`}
        >
          {isActive ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          )}
          <span>{isActive ? 'Pause' : 'Start'}</span>
        </button>
        
        <button
          onClick={onReset}
          disabled={!canReset}
          className={`p-5 rounded-[2.5rem] border border-white/5 transition-all duration-300 active:scale-75 ${
            canReset 
              ? 'bg-slate-900 text-slate-500 hover:text-white hover:bg-slate-800' 
              : 'bg-slate-950 text-slate-800 cursor-not-allowed opacity-30'
          }`}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
        </button>

        <button
          onClick={() => setShowSettings(true)}
          className="p-5 bg-slate-900 border border-white/5 text-slate-500 hover:text-white rounded-[2.5rem] transition-all duration-300 active:scale-75"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65(6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
        </button>
      </div>
    </div>
  );
};

export default Timer;
