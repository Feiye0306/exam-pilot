import React, { useState } from 'react';
import { ExamTimerItem, Student } from '../types';
import { 
  Clock, 
  Play, 
  Pause, 
  RotateCcw, 
  Plus, 
  X, 
  Users, 
  User, 
  Trash2, 
  BellRing,
  Volume2
} from 'lucide-react';
import { playTimerBeep } from '../utils/audioAlert';

interface ClassroomTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  timers: ExamTimerItem[];
  onStartClassroomTimer: (minutes: number, title?: string) => void;
  onStartStudentTimer: (
    studentId: string, 
    studentName: string, 
    grade: string, 
    paperTitle: string, 
    subject: string, 
    minutes: number
  ) => void;
  onPauseTimer: (id: string) => void;
  onResumeTimer: (id: string) => void;
  onAddMinutes: (id: string, minutes: number) => void;
  onRemoveTimer: (id: string) => void;
  onSelectStudent?: (studentId: string) => void;
  students: Student[];
}

export const ClassroomTimerModal: React.FC<ClassroomTimerModalProps> = ({
  isOpen,
  onClose,
  timers,
  onStartClassroomTimer,
  onStartStudentTimer,
  onPauseTimer,
  onResumeTimer,
  onAddMinutes,
  onRemoveTimer,
  onSelectStudent,
  students,
}) => {
  const [selectedMinutes, setSelectedMinutes] = useState<number>(30);
  const [customTitle, setCustomTitle] = useState('全班段考加強');
  const [activeTab, setActiveTab] = useState<'classroom' | 'individual'>('classroom');

  // 個別計時表單
  const [selectedStudentForTimer, setSelectedStudentForTimer] = useState<string>('');
  const [studentMinutes, setStudentMinutes] = useState<number>(30);
  const [studentPaperTitle, setStudentPaperTitle] = useState('');

  if (!isOpen) return null;

  const classroomTimer = timers.find((t) => t.type === 'classroom');
  const studentTimers = timers.filter((t) => t.type === 'student');

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleStartIndividual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForTimer) {
      alert('請先選擇學生！');
      return;
    }
    const student = students.find((s) => s.id === selectedStudentForTimer);
    if (!student) return;

    onStartStudentTimer(
      student.id,
      student.name,
      student.grade,
      studentPaperTitle.trim() || '自訂測驗卷',
      '加強測驗',
      studentMinutes
    );
    setSelectedStudentForTimer('');
    setStudentPaperTitle('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/10">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>補習班考試計時器中控</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  即時聲響通知
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                支援全班統一倒數與個別臨時來生分開計時，時間到自動發出和弦音效提醒收卷
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => playTimerBeep()}
              className="p-2 rounded-xl text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors"
              title="測試提示音效"
            >
              <Volume2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 模式切換 Tabs */}
        <div className="flex bg-slate-800/80 p-1 rounded-xl border border-slate-700">
          <button
            onClick={() => setActiveTab('classroom')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'classroom'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>全班統一計時</span>
            {classroomTimer && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/40 text-amber-200">
                {classroomTimer.isRunning ? '進行中' : '暫停中'}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('individual')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'individual'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <User className="w-4 h-4" />
            <span>個別學生計時 ({studentTimers.length})</span>
          </button>
        </div>

        {/* Tab 1: 全班統一計時 */}
        {activeTab === 'classroom' && (
          <div className="space-y-4 overflow-y-auto pr-1">
            {/* 目前全班計時器狀態 (若正在跑) */}
            {classroomTimer ? (
              <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/50 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-amber-400">目前全班大時鐘</span>
                    <h3 className="text-base font-bold text-white mt-0.5">{classroomTimer.studentName}</h3>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    classroomTimer.isExpired
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse'
                      : classroomTimer.isRunning
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-slate-700 text-slate-300'
                  }`}>
                    {classroomTimer.isExpired ? '時間已屆滿！' : classroomTimer.isRunning ? '倒數計時中' : '已暫停'}
                  </span>
                </div>

                {/* 倒數大數字 */}
                <div className="text-center py-2">
                  <div className={`font-mono text-5xl sm:text-6xl font-black tracking-tight ${
                    classroomTimer.isExpired 
                      ? 'text-rose-500 animate-bounce' 
                      : classroomTimer.remainingSeconds < 300 
                      ? 'text-amber-400 animate-pulse' 
                      : 'text-white'
                  }`}>
                    {formatTime(classroomTimer.remainingSeconds)}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    總設定時間：{Math.round(classroomTimer.totalSeconds / 60)} 分鐘
                  </p>
                </div>

                {/* 控制按鈕列 */}
                <div className="flex items-center justify-center gap-2 pt-2">
                  {classroomTimer.isRunning ? (
                    <button
                      onClick={() => onPauseTimer(classroomTimer.id)}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all"
                    >
                      <Pause className="w-4 h-4" />
                      <span>暫停</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => onResumeTimer(classroomTimer.id)}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-900/30 transition-all"
                    >
                      <Play className="w-4 h-4" />
                      <span>繼續</span>
                    </button>
                  )}

                  <button
                    onClick={() => onAddMinutes(classroomTimer.id, 5)}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5 text-amber-400" />
                    <span>+5 分鐘</span>
                  </button>

                  <button
                    onClick={() => onAddMinutes(classroomTimer.id, 10)}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5 text-amber-400" />
                    <span>+10 分鐘</span>
                  </button>

                  <button
                    onClick={() => onRemoveTimer(classroomTimer.id)}
                    className="px-3.5 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 text-xs font-bold flex items-center gap-1 transition-all"
                    title="結束並清除全班計時器"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>結束計時</span>
                  </button>
                </div>
              </div>
            ) : (
              /* 尚未開始全班計時，顯示設定區 */
              <div className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700/80 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    測驗主題名稱 (選填)
                  </label>
                  <input
                    type="text"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder="例如：第一次段考考前總複習"
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-2">
                    選擇測驗時間 (分鐘)
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {[15, 20, 30, 40, 50, 60].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setSelectedMinutes(m)}
                        className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                          selectedMinutes === m
                            ? 'bg-amber-600 text-white border-amber-400 shadow-md'
                            : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500'
                        }`}
                      >
                        {m} 分鐘
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onStartClassroomTimer(selectedMinutes, customTitle)}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-slate-950 font-black text-sm shadow-xl shadow-amber-900/30 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  <Play className="w-4 h-4 fill-slate-950" />
                  <span>🚀 啟動全班統一計時 ({selectedMinutes} 分鐘)</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: 個別學生臨時計時 */}
        {activeTab === 'individual' && (
          <div className="space-y-4 overflow-y-auto pr-1 flex-1">
            {/* 新增個別學生計時 */}
            <form onSubmit={handleStartIndividual} className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/80 space-y-3">
              <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5" />
                <span>為臨時抵達或特定學生啟動專屬計時：</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">選擇學生</label>
                  <select
                    value={selectedStudentForTimer}
                    onChange={(e) => setSelectedStudentForTimer(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
                  >
                    <option value="">-- 請選擇學生 --</option>
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.grade})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">考卷名稱 (選填)</label>
                  <input
                    type="text"
                    placeholder="如：高一救底單元卷"
                    value={studentPaperTitle}
                    onChange={(e) => setStudentPaperTitle(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">作答時間 (分鐘)</label>
                  <div className="flex gap-1.5">
                    <input
                      type="number"
                      min={5}
                      max={120}
                      value={studentMinutes}
                      onChange={(e) => setStudentMinutes(Number(e.target.value))}
                      className="w-20 px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white text-center focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="flex-1 py-1.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition-all"
                    >
                      開始計時
                    </button>
                  </div>
                </div>
              </div>
            </form>

            {/* 正在計時中的個別學生列表 */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-400">
                目前正在個別計時的學生 ({studentTimers.length})：
              </div>

              {studentTimers.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs">
                  目前沒有個別學生正在計時。輔導老師也可在前台當前考卷卡片上一鍵啟動計時！
                </div>
              ) : (
                <div className="space-y-2">
                  {studentTimers.map((t) => (
                    <div
                      key={t.id}
                      className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-between gap-3 shadow-md"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white">{t.studentName}</span>
                          {t.grade && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300">
                              {t.grade}
                            </span>
                          )}
                          <span className="text-xs text-slate-400 truncate max-w-[140px] sm:max-w-xs">
                            {t.paperTitle}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {/* 倒數秒數 */}
                        <div className={`font-mono font-bold text-lg sm:text-xl ${
                          t.isExpired
                            ? 'text-rose-400 animate-bounce'
                            : t.remainingSeconds < 300
                            ? 'text-amber-400 animate-pulse'
                            : 'text-emerald-400'
                        }`}>
                          {formatTime(t.remainingSeconds)}
                        </div>

                        {/* 控制鍵 */}
                        <div className="flex items-center gap-1">
                          {t.isRunning ? (
                            <button
                              onClick={() => onPauseTimer(t.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-slate-700"
                              title="暫停"
                            >
                              <Pause className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => onResumeTimer(t.id)}
                              className="p-1.5 rounded-lg text-emerald-400 hover:bg-slate-700"
                              title="繼續"
                            >
                              <Play className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            onClick={() => onAddMinutes(t.id, 5)}
                            className="text-[11px] px-2 py-1 rounded bg-slate-700 text-slate-200 hover:bg-slate-600 font-semibold"
                            title="加5分鐘"
                          >
                            +5分
                          </button>

                          <button
                            onClick={() => onRemoveTimer(t.id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-700"
                            title="清除計時"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
