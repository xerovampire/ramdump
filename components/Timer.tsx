
import React from 'react';
import { TimerMode } from '../types';

interface TimerProps {
  mode: TimerMode;
  timeLeft: number;
  totalTime: number;
  isActive: boolean;
  onToggle: () => void;
  onReset: () => void;
}

const Timer: React.FC<TimerProps> = ({ mode, timeLeft, totalTime, isActive, onToggle, onReset }) => {
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const percentage = (timeLeft / totalTime) * 100;
  const strokeDashoffset = 283 - (283 * (100 - percentage)) / 100;
  const isStudy = mode === TimerMode.STUDY;

  return (
    <div className="flex flex-col items-center group">
      <div className="relative w-72 h-72 md:w-80 md:h-80 flex items-center justify-center">
        {/* Glow Layer */}
        <div className={`absolute inset-10 blur-3xl rounded-full opacity-20 transition-colors duration-1000 ${isStudy ? 'bg-rose-600' : 'bg-emerald-600'}`}></div>
        
        {/* Progress Ring */}
        <svg className="absolute w-full h-full -rotate-90 filter drop-shadow-[0_0_8px_rgba(0,0,0,0.5)]">
          <circle
            cx="50%"
            cy="50%"
            r="42%"
            className="stroke-slate-900 fill-none"
            strokeWidth="12"
          />
          <circle
            cx="50%"
            cy="50%"
            r="42%"
            className={`fill-none transition-all duration-1000 ease-in-out ${isStudy ? 'stroke-rose-500' : 'stroke-emerald-500'}`}
            strokeWidth="12"
            strokeDasharray="283"
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>

        <div className="text-center z-10 select-none">
          <p className={`text-[10px] font-black uppercase tracking-[0.4em] mb-1 transition-colors duration-500 ${isStudy ? 'text-rose-500' : 'text-emerald-500'}`}>
            {isStudy ? 'Focusing' : 'Resting'}
          </p>
          <h2 className="text-7xl font-black font-mono tracking-tighter text-white tabular-nums drop-shadow-lg">
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

      <div className="flex gap-4 mt-12">
        <button
          onClick={onToggle}
          className={`px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all flex items-center gap-3 shadow-2xl active:scale-95 ${
            isActive 
              ? 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white' 
              : 'bg-white text-black shadow-white/10 hover:bg-slate-100'
          }`}
        >
          {isActive ? (
            <><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg> PAUSE</>
          ) : (
            <><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg> START</>
          )}
        </button>
        <button
          onClick={onReset}
          className="p-4 bg-slate-900 border border-slate-800 text-slate-500 hover:text-white rounded-2xl transition-all hover:bg-slate-800 active:scale-90"
          title="Reset"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
        </button>
      </div>
    </div>
  );
};

export default Timer;
