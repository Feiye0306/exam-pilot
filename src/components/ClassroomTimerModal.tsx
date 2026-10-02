import React, { useState, useMemo } from 'react';
import { ExamTimerItem, Student } from '../types';
import { 
  Clock, 
  Play, 
  Pause, 
  Plus, 
  X, 
  Users, 
  User, 
  Trash2, 
  BellRing,
  Volume2,
  Timer as TimerIcon,
  Flame,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { playTimerBeep } from '../utils/audioAlert';

interface ClassroomTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  timers: ExamTimerItem[];
  onStartClassroomTimer: (minutes: number, title?: string) => void;
  onStartGroupTimer?: (grade: string, minutes: number, title?: string) => void;
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
  onStartGroupTimer,
  onStartStudentTimer,
  onPauseTimer,
  onResumeTimer,
  onAddMinutes,
  onRemoveTimer,
  onSelectStudent,
  students,
}) => {
  // 自動從現有學生中統計所有年級清單
  const gradeList = useMemo(() => {
    const map: Record<string, number> = {};
    students.forEach((s) => {
      const g = s.grade || '未分年級';
      map[g] = (map[g] || 0) + 1;
    });
    return Object.entries(map).map(([grade, count]) => ({ grade, count }));
  }, [students]);

  // 新增計時設定區塊狀態
  const [targetType, setTargetType] = useState<'grade' | 'student'>('grade');
  const [selectedGrade, setSelectedGrade] = useState<string>(gradeList[0]?.grade || '高一');
  const [gradeMinutes, setGradeMinutes] = useState<number>(30);
  const [gradeCustomTitle, setGradeCustomTitle] = useState('');

  // 個別學生計時設定
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [studentMinutes, setStudentMinutes] = useState<number>(30);
  const [studentPaperTitle, setStudentPaperTitle] = useState('');

  if (!isOpen) return null;

  // 格式化秒數 mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // 分離計時器類別
  const runningTimers = timers.filter((t) => t.isRunning && !t.isExpired);
  const expiredTimers = timers.filter((t) => t.isExpired);
  const pausedTimers = timers.filter((t) => !t.isRunning && !t.isExpired && t.remainingSeconds > 0);

  // 啟動年級統一計時
  const handleStartGradeTimer = (e: React.FormEvent) => {
    e.preventDefault();
    const title = gradeCustomTitle.trim() || `${selectedGrade} 全體統一測驗`;
    if (onStartGroupTimer) {
      onStartGroupTimer(selectedGrade, gradeMinutes, title);
    } else {
      onStartClassroomTimer(gradeMinutes, title);
    }
    setGradeCustomTitle('');
  };

  // 啟動個別學生計時
  const handleStartIndividualTimer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) {
      alert('請先選擇一位學生！');
      return;
    }
    const student = students.find((s) => s.id === selectedStudentId);
    if (!student) return;

    onStartStudentTimer(
      student.id,
      student.name,
      student.grade,
      studentPaperTitle.trim() || '課堂加強測驗',
      '加強測驗',
      studentMinutes
    );
    setSelectedStudentId('');
    setStudentPaperTitle('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-3xl w-full p-5 sm:p-6 shadow-2xl space-y-5 max-h-[92vh] flex flex-col">
        
        {/* 頂部 Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/10">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white">
                  補習班考試計時器中控
                </h2>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold">
                  {timers.length > 0 ? `🔥 ${timers.length} 個計時進行中` : '目前無計時'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                一覽全場各年級與個別學生的即時倒數，時間到自動播放提示音收卷
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => playTimerBeep()}
              className="p-2 rounded-xl text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors"
              title="測試提示鈴響"
            >
              <Volume2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="關閉"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 捲動內容區塊 */}
        <div className="flex-1 overflow-y-auto space-y-6 pr-1">

          {/* ============================================================== */}
          {/* 區塊 1: 🔥【打開即看】目前正在計時中的即時看板 (Live Timers) */}
          {/* ============================================================== */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-amber-400" />
                <span>現場倒數即時監控 ({timers.length})</span>
              </h3>
              {timers.length > 0 && (
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="text-emerald-400 font-medium">● 進行中: {runningTimers.length}</span>
                  {expiredTimers.length > 0 && (
                    <span className="text-rose-400 font-bold animate-pulse">● 需收卷: {expiredTimers.length}</span>
                  )}
                  {pausedTimers.length > 0 && (
                    <span className="text-slate-400">● 暫停: {pausedTimers.length}</span>
                  )}
                </div>
              )}
            </div>

            {/* 無任何計時中的乾淨提示 */}
            {timers.length === 0 ? (
              <div className="p-6 rounded-2xl bg-slate-800/40 border border-dashed border-slate-700 text-center space-y-2">
                <Clock className="w-8 h-8 text-slate-500 mx-auto" />
                <p className="text-sm font-semibold text-slate-300">目前沒有任何正在計時的項目</p>
                <p className="text-xs text-slate-500">
                  請點擊下方「按年級統一計時」或「個別學生計時」立即發起測驗！
                </p>
              </div>
            ) : (
              /* 計時卡片列表 (大字體即時倒數，一目了然) */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {timers.map((t) => {
                  const isClassroom = t.type === 'classroom';
                  const percent = Math.max(0, Math.min(100, Math.round((t.remainingSeconds / t.totalSeconds) * 100)));

                  return (
                    <div
                      key={t.id}
                      className={`p-4 rounded-2xl border transition-all shadow-md relative overflow-hidden flex flex-col justify-between ${
                        t.isExpired
                          ? 'bg-rose-950/30 border-rose-500/60 ring-1 ring-rose-500/50'
                          : t.remainingSeconds < 300
                          ? 'bg-amber-950/30 border-amber-500/60 ring-1 ring-amber-500/40'
                          : 'bg-slate-800/80 border-slate-700/80'
                      }`}
                    >
                      {/* 頂部進度細條 */}
                      <div className="absolute top-0 left-0 right-0 h-1 bg-slate-700">
                        <div
                          className={`h-full transition-all duration-1000 ${
                            t.isExpired
                              ? 'bg-rose-500'
                              : t.remainingSeconds < 300
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>

                      {/* 卡片標題與對象 */}
                      <div className="flex items-start justify-between gap-2 pt-1">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {isClassroom ? (
                              <span className="text-[11px] px-2 py-0.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {t.grade ? `${t.grade} 全體` : '全班統一'}
                              </span>
                            ) : (
                              <span className="text-[11px] px-2 py-0.5 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {t.grade || '個人'}
                              </span>
                            )}
                            <span className="font-bold text-sm text-white">{t.studentName}</span>
                          </div>
                          {t.paperTitle && (
                            <p className="text-xs text-slate-400 mt-1 truncate max-w-[200px]">
                              {t.paperTitle}
                            </p>
                          )}
                        </div>

                        {/* 狀態標籤 */}
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 ${
                          t.isExpired
                            ? 'bg-rose-500 text-white animate-pulse'
                            : t.isRunning
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-slate-700 text-slate-300'
                        }`}>
                          {t.isExpired ? '時間到！請收卷' : t.isRunning ? '進行中' : '已暫停'}
                        </span>
                      </div>

                      {/* 巨大字體倒數數字 */}
                      <div className="my-3 text-center">
                        <div
                          className={`font-mono text-4xl sm:text-5xl font-black tracking-tight ${
                            t.isExpired
                              ? 'text-rose-400 animate-bounce'
                              : t.remainingSeconds < 300
                              ? 'text-amber-400 animate-pulse'
                              : 'text-white'
                          }`}
                        >
                          {formatTime(t.remainingSeconds)}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1">
                          總時間：{Math.round(t.totalSeconds / 60)} 分鐘
                        </div>
                      </div>

                      {/* 快捷操作控制列 */}
                      <div className="flex items-center justify-between gap-1.5 pt-2 border-t border-slate-700/50">
                        <div className="flex items-center gap-1">
                          {t.isRunning ? (
                            <button
                              onClick={() => onPauseTimer(t.id)}
                              className="px-2.5 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-amber-300 text-xs font-bold flex items-center gap-1 transition-colors"
                            >
                              <Pause className="w-3.5 h-3.5" />
                              <span>暫停</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => onResumeTimer(t.id)}
                              className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 transition-colors"
                            >
                              <Play className="w-3.5 h-3.5" />
                              <span>繼續</span>
                            </button>
                          )}

                          <button
                            onClick={() => onAddMinutes(t.id, 5)}
                            className="px-2 py-1.5 rounded-xl bg-slate-700/80 hover:bg-slate-600 text-slate-200 text-xs font-semibold"
                            title="加 5 分鐘"
                          >
                            +5分
                          </button>
                          <button
                            onClick={() => onAddMinutes(t.id, 10)}
                            className="px-2 py-1.5 rounded-xl bg-slate-700/80 hover:bg-slate-600 text-slate-200 text-xs font-semibold"
                            title="加 10 分鐘"
                          >
                            +10分
                          </button>
                        </div>

                        <button
                          onClick={() => onRemoveTimer(t.id)}
                          className="px-2.5 py-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 text-xs font-semibold flex items-center gap-1 transition-colors"
                          title="結束計時並清除"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>收卷</span>
                        </button>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>


          {/* ============================================================== */}
          {/* 區塊 2: 🚀【按年級/學生快速發起】(解決全班統一計時不知是哪班問題) */}
          {/* ============================================================== */}
          <div className="pt-2 border-t border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-cyan-400" />
                <span>快速發起新計時</span>
              </h3>

              {/* 切換按年級 vs 個別學生 */}
              <div className="flex bg-slate-800 p-0.5 rounded-xl border border-slate-700 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setTargetType('grade')}
                  className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1 ${
                    targetType === 'grade'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>按年級統一計時</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTargetType('student')}
                  className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1 ${
                    targetType === 'student'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>個別學生臨時計時</span>
                </button>
              </div>
            </div>

            {/* 發起模式 1: 按年級統一計時 */}
            {targetType === 'grade' && (
              <form onSubmit={handleStartGradeTimer} className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/80 space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1.5">
                    1. 選擇要統一計時的年級／班別：
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {gradeList.map(({ grade, count }) => (
                      <button
                        key={grade}
                        type="button"
                        onClick={() => setSelectedGrade(grade)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
                          selectedGrade === grade
                            ? 'bg-amber-600 text-white border-amber-400 shadow-md'
                            : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500'
                        }`}
                      >
                        <span>{grade}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/30">
                          {count}人
                        </span>
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setSelectedGrade('all')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
                        selectedGrade === 'all'
                          ? 'bg-amber-600 text-white border-amber-400 shadow-md'
                          : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500'
                      }`}
                    >
                      <span>全場所有學生</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/30">
                        {students.length}人
                      </span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1.5">
                    2. 測驗時間 (分鐘)：
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {[15, 20, 25, 30, 45, 60].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setGradeMinutes(m)}
                        className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                          gradeMinutes === m
                            ? 'bg-amber-500 text-slate-950 border-amber-400 font-black shadow-md'
                            : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500'
                        }`}
                      >
                        {m} 分鐘
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                  <input
                    type="text"
                    placeholder={`主題名稱 (選填，預設：${selectedGrade === 'all' ? '全場統一考試' : `${selectedGrade} 全體統一測驗`})`}
                    value={gradeCustomTitle}
                    onChange={(e) => setGradeCustomTitle(e.target.value)}
                    className="flex-1 w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-900/30 flex items-center justify-center gap-1.5 transition-all shrink-0 active:scale-[0.98]"
                  >
                    <Play className="w-4 h-4 fill-slate-950" />
                    <span>🚀 啟動【{selectedGrade === 'all' ? '全場' : selectedGrade}】統一計時 ({gradeMinutes}分)</span>
                  </button>
                </div>
              </form>
            )}

            {/* 發起模式 2: 個別學生臨時計時 */}
            {targetType === 'student' && (
              <form onSubmit={handleStartIndividualTimer} className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/80 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      選擇學生：
                    </label>
                    <select
                      value={selectedStudentId}
                      onChange={(e) => setSelectedStudentId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="">-- 請選擇學生 --</option>
                      {students.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.grade || '未分級'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      測驗考卷／科目 (選填)：
                    </label>
                    <input
                      type="text"
                      placeholder="如：段考衝刺數學卷"
                      value={studentPaperTitle}
                      onChange={(e) => setStudentPaperTitle(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                    >
                    </input>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      測驗時間：
                    </label>
                    <div className="flex gap-1.5">
                      <input
                        type="number"
                        min={5}
                        max={120}
                        value={studentMinutes}
                        onChange={(e) => setStudentMinutes(Number(e.target.value))}
                        className="w-20 px-2 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white text-center font-bold focus:outline-none focus:border-amber-500"
                      />
                      <button
                        type="submit"
                        className="flex-1 py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition-all shadow-md"
                      >
                        開始個人計時
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            )}

          </div>

        </div>

      </div>
    </div>
  );
};
