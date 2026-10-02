import React from 'react';
import { ExamTimerItem } from '../types';
import { BellRing, CheckCircle, Clock, Volume2, X } from 'lucide-react';
import { playTimerBeep } from '../utils/audioAlert';

interface TimerAlertModalProps {
  alertItem: ExamTimerItem | null;
  onClose: () => void;
  onGoToGrade?: (studentId: string) => void;
  onAddMinutes?: (id: string, mins: number) => void;
}

export const TimerAlertModal: React.FC<TimerAlertModalProps> = ({
  alertItem,
  onClose,
  onGoToGrade,
  onAddMinutes,
}) => {
  if (!alertItem) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border-2 border-rose-500/80 rounded-3xl max-w-md w-full p-6 shadow-2xl text-center space-y-4 animate-scale-up ring-4 ring-rose-500/20">
        
        {/* 閃爍鈴鐺圖示 */}
        <div className="w-16 h-16 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto ring-4 ring-rose-500/10 animate-bounce">
          <BellRing className="w-8 h-8" />
        </div>

        <div>
          <span className="text-xs font-bold text-rose-400 uppercase tracking-widest bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/30">
            作答時間已屆滿！
          </span>
          <h2 className="text-xl font-black text-white mt-2">
            {alertItem.type === 'classroom' ? '全班考試時間到！' : `【${alertItem.studentName}】時間已到！`}
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xs mx-auto">
            {alertItem.paperTitle ? `《${alertItem.paperTitle}》` : ''} 
            建議作答時間 ({Math.round(alertItem.totalSeconds / 60)} 分鐘) 已結束，請輔導老師提醒收卷！
          </p>
        </div>

        {/* 動作按鈕 */}
        <div className="space-y-2 pt-2">
          {alertItem.studentId && onGoToGrade && (
            <button
              onClick={() => {
                onGoToGrade(alertItem.studentId!);
                onClose();
              }}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-sm shadow-lg shadow-emerald-900/30 transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              <span>立即前往該生 ➔ 拍照登分</span>
            </button>
          )}

          <div className="flex gap-2">
            {onAddMinutes && (
              <button
                onClick={() => {
                  onAddMinutes(alertItem.id, 5);
                  onClose();
                }}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 font-bold text-xs transition-all flex items-center justify-center gap-1"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>延長 5 分鐘</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-bold text-xs transition-all"
            >
              知道了 (關閉提醒)
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
