import React from 'react';
import { ExamTimerItem } from '../types';
import { Clock, Play, Pause, AlertCircle, ChevronUp } from 'lucide-react';

interface TimerFloatingBarProps {
  timers: ExamTimerItem[];
  onOpenModal: () => void;
}

export const TimerFloatingBar: React.FC<TimerFloatingBarProps> = ({
  timers,
  onOpenModal,
}) => {
  const activeTimers = timers.filter((t) => t.isRunning || t.remainingSeconds > 0);
  const classroomTimer = timers.find((t) => t.type === 'classroom');
  const studentTimers = timers.filter((t) => t.type === 'student' && (t.isRunning || t.remainingSeconds > 0));

  const formatMinSec = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="fixed bottom-5 right-5 z-40 flex items-center gap-2">
      {/* 若有全班或個別計時進行中，顯示動態膠囊 */}
      {activeTimers.length > 0 ? (
        <button
          onClick={onOpenModal}
          className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-slate-900/95 border border-amber-500/60 shadow-2xl shadow-amber-950/60 text-white text-xs font-bold hover:scale-105 active:scale-95 transition-all group backdrop-blur-md"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-amber-400" />
            {classroomTimer ? (
              <span className="text-amber-300 font-mono text-sm">
                全班 {formatMinSec(classroomTimer.remainingSeconds)}
              </span>
            ) : (
              <span className="text-amber-300">
                {studentTimers.length} 位學生計時中
              </span>
            )}
          </div>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
            中控台
          </span>
        </button>
      ) : (
        /* 沒有正在跑的計時時，提供一個低調的常駐快速開啟按鈕 */
        <button
          onClick={onOpenModal}
          className="flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-slate-900/90 border border-slate-700/80 shadow-xl text-slate-300 hover:text-white hover:border-amber-500/50 text-xs font-bold transition-all backdrop-blur-md hover:scale-105 active:scale-95"
          title="開啟考試計時器 (支援全班統一與個別學生)"
        >
          <Clock className="w-4 h-4 text-amber-400" />
          <span className="hidden sm:inline">考試計時器</span>
        </button>
      )}
    </div>
  );
};
