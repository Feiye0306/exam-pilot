import React, { useState, useMemo, useEffect } from 'react';
import { Student, ExamPaper, TrackItem, DifficultyLevel, ExamTimerItem } from '../types';
import { 
  Search, 
  CheckCircle2, 
  Clock, 
  Camera, 
  FileText, 
  Sparkles, 
  ChevronRight, 
  ChevronLeft,
  ChevronDown,
  AlertCircle, 
  Upload, 
  X, 
  UserCheck, 
  Users,
  Image as ImageIcon,
  Flame,
  Award,
  Filter,
  SlidersHorizontal,
  Settings,
  Play,
  Pause,
  RotateCcw,
  Plus
} from 'lucide-react';
import { completeTrackItem, compressImage } from '../services/storageService';
import { StudentDrawer } from './StudentDrawer';

interface TutorViewProps {
  students: Student[];
  papers: ExamPaper[];
  onDataChanged: () => void;
  onPreviewPaper: (paper: ExamPaper) => void;
  onViewSubmission: (student: Student, subject: string, item: TrackItem) => void;
  // ⏱️ 計時器相關 Props
  activeTimers?: ExamTimerItem[];
  onStartStudentTimer?: (
    studentId: string, 
    studentName: string, 
    grade: string, 
    paperTitle: string, 
    subject: string, 
    minutes: number
  ) => void;
  onPauseTimer?: (id: string) => void;
  onResumeTimer?: (id: string) => void;
  onAddMinutes?: (id: string, mins: number) => void;
  onRemoveTimer?: (id: string) => void;
  onOpenTimerModal?: () => void;
}

export const TutorView: React.FC<TutorViewProps> = ({
  students,
  papers,
  onDataChanged,
  onPreviewPaper,
  onViewSubmission,
  activeTimers = [],
  onStartStudentTimer,
  onPauseTimer,
  onResumeTimer,
  onAddMinutes,
  onRemoveTimer,
  onOpenTimerModal,
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeSubject, setActiveSubject] = useState<string>('數學');

  // 年級與群組分頁狀態
  const [selectedGradeTab, setSelectedGradeTab] = useState<string>('all');
  
  // 輔導老師自訂偏好：只看特定年級 (例如 A 老師只看高一、高二)
  const [isPreferenceModalOpen, setIsPreferenceModalOpen] = useState(false);
  const [preferredGrades, setPreferredGrades] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('tutor_preferred_grades');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // 完成登記 Modal 狀態
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [currentItemToComplete, setCurrentItemToComplete] = useState<TrackItem | null>(null);
  const [scoreInput, setScoreInput] = useState<string>('');
  const [tutorNameInput, setTutorNameInput] = useState<string>(() => localStorage.getItem('last_tutor_name') || '輔導老師');
  const [notesInput, setNotesInput] = useState<string>('');
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // 取得學生名單中所有實際存在的年級清單
  const allAvailableGrades = useMemo(() => {
    const gradesSet = new Set<string>();
    students.forEach(s => {
      if (s.grade) gradesSet.add(s.grade);
    });
    return Array.from(gradesSet);
  }, [students]);

  // 決定在頂部要顯示哪些分頁 (若有偏好設定，則顯示偏好年級；若無，則顯示全體年級)
  const visibleGradeTabs = useMemo(() => {
    if (preferredGrades.length > 0) {
      return ['all', ...preferredGrades];
    }
    return ['all', ...allAvailableGrades];
  }, [preferredGrades, allAvailableGrades]);

  // 依年級分頁與自訂偏好過濾學生名單
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      // 1. 年級分頁過濾
      if (selectedGradeTab !== 'all') {
        if (s.grade !== selectedGradeTab) return false;
      } else if (preferredGrades.length > 0) {
        // 如果選全部，但老師有設定「只看特定年級」，則全部分頁也只包含這兩年級
        if (!preferredGrades.includes(s.grade)) return false;
      }
      return true;
    });
  }, [students, selectedGradeTab, preferredGrades]);

  // 處理點擊年級分頁 Tab：同步更新目前選取的學生至該分頁的第一人
  const handleSelectGradeTab = (grade: string) => {
    setSelectedGradeTab(grade);
    const matched = students.filter(s => {
      // 1. 年級過濾
      if (grade !== 'all') {
        if (s.grade !== grade) return false;
      } else if (preferredGrades.length > 0) {
        if (!preferredGrades.includes(s.grade)) return false;
      }
      return true;
    });

    if (matched.length > 0) {
      setSelectedStudentId(matched[0].id);
    }
  };

  // 當前選中的學生：優先從目前過濾出的學生名單中找，若不在名單中則自動取第一位
  const currentStudent = filteredStudents.find(s => s.id === selectedStudentId) || filteredStudents[0] || students[0];

  // 目前學生的科目清單
  const availableSubjects = currentStudent?.tracks ? Object.keys(currentStudent.tracks) : [];
  
  // 若當前選取的科目該學生沒有，預設選第一個可用科目
  const effectiveSubject = availableSubjects.includes(activeSubject) 
    ? activeSubject 
    : (availableSubjects[0] || '數學');

  const currentTrack = currentStudent?.tracks?.[effectiveSubject];
  const trackItems = currentTrack?.items || [];

  // 尋找「當前應發／進行中」的考卷：第一個未完成 (pending 或 in_progress) 的項目
  const currentActionItem = trackItems.find(it => it.status === 'in_progress' || it.status === 'pending');
  
  // 查找對應的 ExamPaper 原始資訊
  const currentPaperInfo = currentActionItem 
    ? papers.find(p => p.id === currentActionItem.paperId)
    : null;

  // 統計進度
  const completedCount = trackItems.filter(it => it.status === 'completed').length;
  const progressPercent = trackItems.length > 0 ? Math.round((completedCount / trackItems.length) * 100) : 0;

  // 難易度顏色標籤
  const getDifficultyBadge = (difficulty: DifficultyLevel) => {
    switch (difficulty) {
      case 'easy':
        return <span className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">基礎入門</span>;
      case 'medium':
        return <span className="px-2 py-0.5 rounded text-xs font-medium bg-sky-500/20 text-sky-300 border border-sky-500/30">標準實戰</span>;
      case 'hard':
        return <span className="px-2 py-0.5 rounded text-xs font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30">進階挑戰</span>;
      case 'boss':
        return <span className="px-2 py-0.5 rounded text-xs font-medium bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1"><Flame className="w-3 h-3" /> 魔王衝刺</span>;
    }
  };

  // 儲存輔導老師偏好年級
  const handleToggleGradePreference = (grade: string) => {
    const updated = preferredGrades.includes(grade)
      ? preferredGrades.filter(g => g !== grade)
      : [...preferredGrades, grade];

    setPreferredGrades(updated);
    localStorage.setItem('tutor_preferred_grades', JSON.stringify(updated));
    setSelectedGradeTab('all');
  };

  // 重置為全年級可見
  const handleResetPreferences = () => {
    setPreferredGrades([]);
    localStorage.removeItem('tutor_preferred_grades');
    setSelectedGradeTab('all');
    setIsPreferenceModalOpen(false);
  };

  // 打開完成登記視窗
  const handleOpenCompleteModal = (item: TrackItem) => {
    setCurrentItemToComplete(item);
    setScoreInput('');
    setNotesInput('');
    setCapturedPhotos([]);
    setIsSubmitModalOpen(true);
  };

  // 拍照 / 圖片選取處理
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const newUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const compressed = await compressImage(files[i], 1200, 0.75);
        newUrls.push(compressed);
      }
      setCapturedPhotos(prev => [...prev, ...newUrls]);
    } catch (err) {
      console.error('照片讀取失敗:', err);
      alert('照片處理失敗，請再試一次');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  // 移除已選照片
  const handleRemovePhoto = (index: number) => {
    setCapturedPhotos(prev => prev.filter((_, i) => i !== index));
  };

  // 提交成績並推進關卡
  const handleSubmitComplete = async () => {
    if (!currentStudent || !currentItemToComplete) return;

    const scoreNum = Number(scoreInput);
    if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 100) {
      alert('請輸入 0 ~ 100 之間的合理成績！');
      return;
    }

    setIsUploading(true);
    try {
      localStorage.setItem('last_tutor_name', tutorNameInput);

      await completeTrackItem({
        studentId: currentStudent.id,
        subject: effectiveSubject,
        itemId: currentItemToComplete.itemId,
        score: scoreNum,
        tutorName: tutorNameInput,
        tutorNotes: notesInput,
        photoUrls: capturedPhotos
      });

      // 拍照登分成功後，若該學生有進行中的計時器，自動結束
      if (currentStudentTimer && onRemoveTimer) {
        onRemoveTimer(currentStudentTimer.id);
      }

      setIsSubmitModalOpen(false);
      onDataChanged();
    } catch (err) {
      console.error('登記失敗:', err);
      alert('登記失敗，請檢查網路連線');
    } finally {
      setIsUploading(false);
    }
  };

  // 學生切換邏輯：上一位 / 下一位
  const currentStudentIndex = filteredStudents.findIndex(s => s.id === currentStudent?.id);

  const handlePrevStudent = () => {
    if (filteredStudents.length === 0) return;
    const prevIdx = (currentStudentIndex - 1 + filteredStudents.length) % filteredStudents.length;
    setSelectedStudentId(filteredStudents[prevIdx].id);
  };

  const handleNextStudent = () => {
    if (filteredStudents.length === 0) return;
    const nextIdx = (currentStudentIndex + 1) % filteredStudents.length;
    setSelectedStudentId(filteredStudents[nextIdx].id);
  };

  // 檢查當前選取的學生是否有正在倒數的計時器
  const currentStudentTimer = activeTimers.find(t => t.studentId === currentStudent?.id);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* 頂部精簡導航列：抽屜開啟鈕、學生切換與計時器中控 */}
      <div className="bg-slate-800/80 backdrop-blur-md rounded-2xl p-4 border border-slate-700/60 shadow-xl flex flex-wrap items-center justify-between gap-3">
        
        {/* 左側：開啟學生名單抽屜按鈕 & 上下一位快捷鍵 */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-950/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
            title="點擊展開學生縱向名單抽屜 (支援及時搜尋與上下捲動)"
          >
            <Users className="w-4 h-4" />
            <span>學生名單抽屜</span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-black/30 font-mono">
              {filteredStudents.length} 人
            </span>
            <ChevronDown className="w-4 h-4 ml-0.5" />
          </button>

          {/* 快速切換上一位 / 下一位學生 */}
          <div className="flex items-center bg-slate-900/90 border border-slate-700 rounded-xl p-0.5">
            <button
              onClick={handlePrevStudent}
              disabled={filteredStudents.length <= 1}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              title="上一位學生"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-[11px] font-bold text-slate-300 px-2 font-mono">
              {currentStudentIndex >= 0 ? currentStudentIndex + 1 : 1} / {filteredStudents.length}
            </span>
            <button
              onClick={handleNextStudent}
              disabled={filteredStudents.length <= 1}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              title="下一位學生"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 右側：考試計時器中控入口 & 篩選偏好設定 */}
        <div className="flex items-center gap-2">
          {onOpenTimerModal && (
            <button
              onClick={onOpenTimerModal}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
              title="開啟考試計時器中控 (支援全班統一計時與個別臨時學生計時)"
            >
              <Clock className="w-4 h-4 text-amber-400" />
              <span>考試計時器</span>
              {activeTimers.length > 0 && (
                <span className="flex items-center gap-1 text-[11px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                  {activeTimers.length}
                </span>
              )}
            </button>
          )}

          <button
            onClick={() => setIsPreferenceModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium transition-colors"
            title="設定我負責的年級名單"
          >
            <Settings className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">篩選年級</span>
            {preferredGrades.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            )}
          </button>
        </div>

      </div>

      {currentStudent ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* 左側主要工作區：當前應發考卷與核心操作 (7 Columns) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* 學生基本資訊與科目切換 */}
            <div className="bg-slate-800/80 rounded-2xl p-5 border border-slate-700/60 shadow-xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-xl font-bold text-white tracking-tight">{currentStudent.name}</h2>
                    <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {currentStudent.grade}
                    </span>
                    {currentStudent.school && (
                      <span className="text-xs text-slate-400 hidden sm:inline">
                        • {currentStudent.school}
                      </span>
                    )}
                  </div>
                  {currentStudent.tags && (
                    <div className="flex items-center gap-1.5 mt-1.5">
                      {currentStudent.tags.map((t, i) => (
                        <span key={i} className="text-[11px] px-2 py-0.5 rounded bg-slate-700/70 text-slate-300">
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* 總通關進度環/條 */}
                <div className="text-right">
                  <div className="text-xs text-slate-400">目前通關度</div>
                  <div className="text-lg font-black text-emerald-400">
                    {progressPercent}% <span className="text-xs font-normal text-slate-400">({completedCount}/{trackItems.length} 張)</span>
                  </div>
                </div>
              </div>

              {/* 科目軌道切換 Tab (例如：數學、英文、物理) */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-700/60">
                <span className="text-xs font-medium text-slate-400 mr-1">選擇科目：</span>
                {availableSubjects.map((sub) => {
                  const isActive = sub === effectiveSubject;
                  const count = currentStudent.tracks[sub]?.items?.length || 0;
                  return (
                    <button
                      key={sub}
                      onClick={() => setActiveSubject(sub)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        isActive
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-slate-700/40 text-slate-300 hover:bg-slate-700 hover:text-white'
                      }`}
                    >
                      {sub} ({count})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 🔥【最核心痛點】輔導老師目前「立刻要發放」的考卷大卡片 */}
            {currentActionItem ? (
              <div className="relative overflow-hidden bg-gradient-to-br from-indigo-950/60 via-slate-800 to-slate-900 rounded-3xl p-6 border-2 border-indigo-500/40 shadow-2xl shadow-indigo-950/50">
                {/* 霓虹亮點指示 */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>

                <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-2">
                  <Sparkles className="w-4 h-4 text-amber-400 animate-spin-slow" />
                  <span>現場輔導任務 • 當前應發考卷</span>
                </div>

                <h3 className="text-lg sm:text-xl font-bold text-white leading-snug mb-3">
                  {currentActionItem.paperTitle}
                </h3>

                {/* 考卷屬性標籤 */}
                <div className="flex flex-wrap items-center gap-3 text-xs mb-5">
                  {getDifficultyBadge(currentActionItem.difficulty)}
                  <span className="flex items-center gap-1 text-slate-300 bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-700">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    建議作答：{currentActionItem.targetMinutes} 分鐘
                  </span>
                  {currentPaperInfo?.unit && (
                    <span className="text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-700">
                      單元：{currentPaperInfo.unit}
                    </span>
                  )}
                </div>

                {/* 備註與考點提示 */}
                {currentActionItem.tutorNotes && (
                  <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                    <span>出卷備註：{currentActionItem.tutorNotes}</span>
                  </div>
                )}

                {/* ⏱️ 個別作答計時面板 (若此學生正在計時) */}
                {currentStudentTimer && (
                  <div className="mb-4 p-4 rounded-2xl bg-amber-950/40 border border-amber-500/50 shadow-inner space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                        <span className="text-xs font-bold text-amber-300">
                          ⏱️ 此考卷作答倒數計時中
                        </span>
                      </div>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                        currentStudentTimer.isExpired
                          ? 'bg-rose-500/20 text-rose-400 animate-bounce'
                          : currentStudentTimer.isRunning
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-slate-700 text-slate-300'
                      }`}>
                        {currentStudentTimer.isExpired ? '時間已屆滿！' : currentStudentTimer.isRunning ? '計時中' : '已暫停'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="font-mono text-3xl sm:text-4xl font-black text-white">
                        {Math.floor(currentStudentTimer.remainingSeconds / 60)}:
                        {String(currentStudentTimer.remainingSeconds % 60).padStart(2, '0')}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {currentStudentTimer.isRunning ? (
                          <button
                            onClick={() => onPauseTimer && onPauseTimer(currentStudentTimer.id)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-xs font-bold flex items-center gap-1"
                          >
                            <Pause className="w-3.5 h-3.5" />
                            <span>暫停</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => onResumeTimer && onResumeTimer(currentStudentTimer.id)}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1"
                          >
                            <Play className="w-3.5 h-3.5" />
                            <span>繼續</span>
                          </button>
                        )}

                        <button
                          onClick={() => onAddMinutes && onAddMinutes(currentStudentTimer.id, 5)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold"
                          title="延長 5 分鐘"
                        >
                          +5分
                        </button>

                        <button
                          onClick={() => onRemoveTimer && onRemoveTimer(currentStudentTimer.id)}
                          className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/50 text-slate-400 hover:text-rose-300 border border-slate-700 text-xs"
                          title="清除計時"
                        >
                          結束
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 輔導老師三大主要動作按鈕 */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
                  {/* 按鈕 1：查看縮圖去抽卷 */}
                  <button
                    onClick={() => {
                      if (currentPaperInfo) onPreviewPaper(currentPaperInfo);
                      else alert('目前無考卷縮圖資料');
                    }}
                    className="flex items-center justify-center gap-1.5 py-3 px-3 rounded-xl bg-slate-700/80 hover:bg-slate-700 text-white font-semibold text-xs sm:text-sm border border-slate-600 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <ImageIcon className="w-4 h-4 text-cyan-400" />
                    <span>👀 查看縮圖 (抽卷)</span>
                  </button>

                  {/* 按鈕 2：個別開始計時 (若尚未計時) */}
                  {!currentStudentTimer && onStartStudentTimer && (
                    <button
                      onClick={() => onStartStudentTimer(
                        currentStudent.id,
                        currentStudent.name,
                        currentStudent.grade,
                        currentActionItem.paperTitle,
                        effectiveSubject,
                        currentActionItem.targetMinutes || 30
                      )}
                      className="flex items-center justify-center gap-1.5 py-3 px-3 rounded-xl bg-amber-600/90 hover:bg-amber-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-amber-950/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <Clock className="w-4 h-4 text-white" />
                      <span>⏱️ 開始計時 ({currentActionItem.targetMinutes || 30}分)</span>
                    </button>
                  )}

                  {/* 若已在計時中，顯示綠色快捷交卷登分 */}
                  <button
                    onClick={() => handleOpenCompleteModal(currentActionItem)}
                    className={`flex items-center justify-center gap-1.5 py-3 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-900/30 transition-all hover:scale-[1.02] active:scale-[0.98] ${
                      currentStudentTimer ? 'sm:col-span-2' : ''
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    <span>✍️ 學生寫完 ➔ 拍照登分</span>
                  </button>
                </div>
              </div>
            ) : (
              /* 全數通過大獎牌 */
              <div className="bg-slate-800/80 rounded-3xl p-8 border border-emerald-500/30 text-center space-y-3 shadow-xl">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto ring-4 ring-emerald-500/10">
                  <Award className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-white">太棒了！此科目進度已全數通關！</h3>
                <p className="text-sm text-slate-400 max-w-md mx-auto">
                  {currentStudent.name} 已順利完成「{effectiveSubject}」所排定的所有考卷關卡。如需加練，可在排程中控台隨時追加新考卷！
                </p>
              </div>
            )}
          </div>

          {/* 右側：整條考卷通關路徑鏈 (時間軸視圖) (5 Columns) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-slate-800/80 rounded-2xl p-5 border border-slate-700/60 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-400" />
                  <h3 className="font-bold text-sm text-white">
                    {effectiveSubject} • 專屬通關進度鏈
                  </h3>
                </div>
                <span className="text-xs text-slate-400">
                  共 {trackItems.length} 關
                </span>
              </div>

              {/* 關卡清單 (時間軸) */}
              <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
                {trackItems.map((item, index) => {
                  const isCompleted = item.status === 'completed';
                  const isCurrent = item.itemId === currentActionItem?.itemId;

                  return (
                    <div
                      key={item.itemId}
                      className={`p-3.5 rounded-xl border transition-all ${
                        isCurrent
                          ? 'bg-indigo-900/30 border-indigo-500/60 shadow-md ring-1 ring-indigo-500/30'
                          : isCompleted
                          ? 'bg-slate-900/60 border-emerald-500/30 hover:border-emerald-500/50'
                          : 'bg-slate-900/30 border-slate-700/40 opacity-70'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2.5">
                          {/* 序號圈圈 */}
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                              isCompleted
                                ? 'bg-emerald-500 text-white'
                                : isCurrent
                                ? 'bg-indigo-600 text-white ring-2 ring-indigo-400/50 animate-pulse'
                                : 'bg-slate-700 text-slate-400'
                            }`}
                          >
                            {isCompleted ? '✓' : index + 1}
                          </div>

                          <div>
                            <div className="text-xs font-bold text-slate-200 leading-tight">
                              {item.paperTitle}
                            </div>
                            <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-400">
                              {getDifficultyBadge(item.difficulty)}
                              <span>{item.targetMinutes} 分鐘</span>
                            </div>
                          </div>
                        </div>

                        {/* 成績或當前標籤 */}
                        <div className="text-right shrink-0">
                          {isCompleted ? (
                            <button
                              onClick={() => onViewSubmission(currentStudent, effectiveSubject, item)}
                              className="group flex flex-col items-end"
                              title="點擊查看批改照片與老師紀錄"
                            >
                              <span className="text-base font-black text-emerald-400 leading-none">
                                {item.score} <span className="text-[10px] text-slate-400">分</span>
                              </span>
                              <span className="text-[10px] text-indigo-300 group-hover:underline flex items-center gap-0.5 mt-1">
                                <Camera className="w-2.5 h-2.5" /> 檢視照片
                              </span>
                            </button>
                          ) : isCurrent ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                              進行中
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-500 font-medium">
                              待發放
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {trackItems.length === 0 && (
                  <div className="text-center py-8 text-slate-400 text-xs">
                    目前尚未排定任何考卷，可至「排程中控台」安排考卷！
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      ) : (
        <div className="text-center py-16 text-slate-400">
          目前篩選條件下查無學生資料，請嘗試清除搜尋或更換年級分頁！
        </div>
      )}

      {/* ⚙️ 輔導老師年級偏好設定 Modal (例如：A 老師只看高一、高二) */}
      {isPreferenceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-white">
                <Settings className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-base">設定我負責的年級名單</h3>
              </div>
              <button
                onClick={() => setIsPreferenceModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              勾選您負責輔導的年級，前台將只顯示您勾選的學生分頁，過濾掉無關年級：
            </p>

            {/* 年級勾選清單 */}
            <div className="space-y-2">
              {allAvailableGrades.map((grade) => {
                const isChecked = preferredGrades.includes(grade);
                return (
                  <label
                    key={grade}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                      isChecked
                        ? 'bg-emerald-950/30 border-emerald-500/60 text-white'
                        : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span className="font-semibold text-xs">{grade}</span>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleGradePreference(grade)}
                      className="w-4 h-4 rounded text-emerald-500 focus:ring-0 bg-slate-900 border-slate-700"
                    />
                  </label>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={handleResetPreferences}
                className="text-xs text-slate-400 hover:text-white underline"
              >
                重置 (看全年級)
              </button>
              <button
                type="button"
                onClick={() => setIsPreferenceModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-900/30"
              >
                完成設定
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 📱 輔導老師快速登記與相機拍照 Modal */}
      {isSubmitModalOpen && currentItemToComplete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            
            {/* Modal 標題列 */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">考卷完賽與成績登記</h3>
                  <p className="text-xs text-slate-400">{currentStudent?.name} • {effectiveSubject}</p>
                </div>
              </div>
              <button
                onClick={() => setIsSubmitModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 考卷名稱 */}
            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs text-slate-300">
              <div className="text-slate-400 text-[11px] mb-0.5">完成考卷：</div>
              <div className="font-semibold text-white">{currentItemToComplete.paperTitle}</div>
            </div>

            {/* 表單內容 */}
            <div className="space-y-4">
              
              {/* 成績輸入 */}
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">
                  實得成績 (0 ~ 100 分) <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    autoFocus
                    placeholder="請輸入分數，如：85"
                    value={scoreInput}
                    onChange={(e) => setScoreInput(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-lg font-bold text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-bold">
                    分
                  </span>
                </div>
              </div>

              {/* 輔導老師稱呼 */}
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">
                  輔導老師稱呼 / 代號
                </label>
                <input
                  type="text"
                  placeholder="例如：林老師"
                  value={tutorNameInput}
                  onChange={(e) => setTutorNameInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* 📷 手機拍照 / 批改考卷上傳 (核心重點功能) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-emerald-400" />
                    <span>拍照上傳批改後考卷 (利於後續 AI 分析)</span>
                  </label>
                  <span className="text-[11px] text-slate-400">已選 {capturedPhotos.length} 張</span>
                </div>

                {/* 拍照/選圖按鈕 */}
                <div className="grid grid-cols-2 gap-2">
                  {/* 相機拍照直開按鈕 */}
                  <label className="flex items-center justify-center gap-2 p-3 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/40 border border-indigo-500/40 text-indigo-300 font-semibold text-xs cursor-pointer transition-all active:scale-[0.98]">
                    <Camera className="w-4 h-4 text-indigo-400" />
                    <span>即時拍照</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handlePhotoSelect}
                      className="hidden"
                    />
                  </label>

                  {/* 從相簿選擇 */}
                  <label className="flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-300 font-semibold text-xs cursor-pointer transition-all active:scale-[0.98]">
                    <Upload className="w-4 h-4 text-slate-400" />
                    <span>相簿選取</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePhotoSelect}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* 照片預覽區 */}
                {capturedPhotos.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mt-2.5">
                    {capturedPhotos.map((photoUrl, idx) => (
                      <div key={idx} className="relative group rounded-lg overflow-hidden border border-slate-700 aspect-video bg-black">
                        <img src={photoUrl} alt="作答考卷" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(idx)}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-rose-600/80 text-white flex items-center justify-center text-xs opacity-90 hover:opacity-100"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 批改筆記 */}
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">
                  批改重點備註 (選填)
                </label>
                <textarea
                  rows={2}
                  placeholder="例如：計算粗心、十字交乘法觀念不熟、需再加強..."
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>
            </div>

            {/* Modal 按鈕列 */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsSubmitModalOpen(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              >
                取消
              </button>

              <button
                type="button"
                disabled={isUploading || !scoreInput}
                onClick={handleSubmitComplete}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-bold shadow-lg shadow-emerald-900/30 disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                {isUploading ? (
                  <span>正在儲存與推進...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>確認送出並解鎖下一關！</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 📱 手機版專屬懸浮抽屜展開按鈕 (FAB) */}
      <button
        onClick={() => setIsDrawerOpen(true)}
        className="fixed bottom-5 left-5 z-40 md:hidden flex items-center gap-2 px-4 py-3 rounded-full bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-bold text-xs shadow-2xl shadow-emerald-950/80 border border-emerald-400/30 backdrop-blur-md active:scale-95 transition-all"
      >
        <Users className="w-4 h-4" />
        <span>名單抽屜 ({filteredStudents.length})</span>
      </button>

      {/* 👥 學生縱向名單抽屜 (Drawer - 支援上下滾動、分頁、及時搜尋) */}
      <StudentDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        students={students}
        selectedStudentId={currentStudent?.id || null}
        onSelectStudent={(id) => {
          setSelectedStudentId(id);
          setIsDrawerOpen(false);
        }}
        gradeTabs={allAvailableGrades}
        activeGradeTab={selectedGradeTab}
        onSelectGradeTab={(g) => handleSelectGradeTab(g)}
        activeTimers={activeTimers}
      />

    </div>
  );
};
