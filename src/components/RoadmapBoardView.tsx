import React, { useState, useMemo } from 'react';
import { Student, ExamPaper, TrackItem, DifficultyLevel, ExamTimerItem } from '../types';
import { 
  GitBranch, 
  Search, 
  Users, 
  Plus, 
  Clock, 
  CheckCircle2, 
  Play, 
  Pause, 
  Image as ImageIcon,
  Flame,
  Award,
  ChevronRight,
  Send,
  AlertCircle
} from 'lucide-react';

interface RoadmapBoardViewProps {
  students: Student[];
  papers: ExamPaper[];
  onPreviewPaper: (paper: ExamPaper) => void;
  onOpenBatchAssign: (paper?: ExamPaper) => void;
  onViewSubmission: (student: Student, subject: string, item: TrackItem) => void;
  onCompleteItem: (student: Student, subject: string, item: TrackItem) => void;
  activeTimers?: ExamTimerItem[];
  onStartStudentTimer?: (studentId: string, studentName: string, grade: string, paperTitle: string, subject: string, minutes: number) => void;
  onPauseTimer?: (id: string) => void;
  onResumeTimer?: (id: string) => void;
}

export const RoadmapBoardView: React.FC<RoadmapBoardViewProps> = ({
  students,
  papers,
  onPreviewPaper,
  onOpenBatchAssign,
  onViewSubmission,
  onCompleteItem,
  activeTimers = [],
  onStartStudentTimer,
  onPauseTimer,
  onResumeTimer,
}) => {
  const [selectedSubject, setSelectedSubject] = useState<string>('數學');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // 取得所有存在的科目清單
  const allSubjects = useMemo(() => {
    const set = new Set<string>();
    students.forEach(s => {
      Object.keys(s.tracks || {}).forEach(sub => set.add(sub));
    });
    return Array.from(set).length > 0 ? Array.from(set) : ['數學', '英文', '物理'];
  }, [students]);

  // 取得所有年級
  const allGrades = useMemo(() => {
    const set = new Set<string>();
    students.forEach(s => { if (s.grade) set.add(s.grade); });
    return Array.from(set);
  }, [students]);

  // 篩選學生
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      if (selectedGrade !== 'all' && s.grade !== selectedGrade) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = s.name.toLowerCase().includes(q);
        const matchSchool = (s.school || '').toLowerCase().includes(q);
        return matchName || matchSchool;
      }
      return true;
    });
  }, [students, selectedGrade, searchQuery]);

  const getDifficultyBadge = (diff: DifficultyLevel) => {
    switch (diff) {
      case 'easy':
        return <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">入門</span>;
      case 'medium':
        return <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">實戰</span>;
      case 'hard':
        return <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800">進階</span>;
      case 'boss':
        return <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800">魔王</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
      
      {/* 頂部操作工具列 */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <GitBranch className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>全班考卷進度路線圖看板</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              一眼綜覽全班每位同學的闖關路線圖、目前正在寫哪張、已通關成績與即時作答倒數！
            </p>
          </div>

          {/* 核心操作：多人批次派卷大按鈕 */}
          <button
            onClick={() => onOpenBatchAssign()}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-600/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Send className="w-4 h-4" />
            <span>➕ 批次指派同一考卷給多人</span>
          </button>
        </div>

        {/* 篩選控制器 */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          {/* 科目切換 */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-500 mr-1">選擇科目：</span>
            {allSubjects.map((sub) => (
              <button
                key={sub}
                onClick={() => setSelectedSubject(sub)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedSubject === sub
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {sub}
              </button>
            ))}
          </div>

          {/* 年級與搜尋 */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setSelectedGrade('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                  selectedGrade === 'all'
                    ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}
              >
                全部年級
              </button>
              {allGrades.map((g) => (
                <button
                  key={g}
                  onClick={() => setSelectedGrade(g)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                    selectedGrade === g
                      ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>

            <div className="relative w-44">
              <input
                type="text"
                placeholder="搜尋學生..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 每一位學生的完整進度路線軌道 (Roadmap List) */}
      <div className="space-y-3.5">
        {filteredStudents.map((stu) => {
          const track = stu.tracks?.[selectedSubject] || { items: [] };
          const items = track.items || [];
          const completedCount = items.filter(it => it.status === 'completed').length;
          const totalCount = items.length;
          const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
          
          // 查找當前正在進行的考卷
          const currentActionItem = items.find(it => it.status === 'pending' || it.status === 'in_progress');
          const activeTimer = activeTimers.find(t => t.studentId === stu.id);

          return (
            <div
              key={stu.id}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-700 transition-all flex flex-col lg:flex-row lg:items-center gap-4"
            >
              {/* 左側：學生名片卡 (固定寬度) */}
              <div className="w-full lg:w-64 shrink-0 space-y-2 border-b lg:border-b-0 lg:border-r border-slate-100 dark:border-slate-800 pb-3 lg:pb-0 lg:pr-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-base text-slate-900 dark:text-white">
                      {stu.name}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                      {stu.grade}
                    </span>
                  </div>

                  <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                    {percent}%
                  </span>
                </div>

                {stu.school && (
                  <p className="text-xs text-slate-400 truncate">{stu.school}</p>
                )}

                {/* 進度條 */}
                <div className="space-y-1">
                  <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>{selectedSubject}：已過 {completedCount}/{totalCount} 張</span>
                  </div>
                </div>

                {/* ⏱️ 若此生正在倒數計時，直接在名片顯示動態倒數 */}
                {activeTimer && (
                  <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-bold">
                      <Clock className="w-3.5 h-3.5 animate-pulse" />
                      <span className="font-mono text-sm">
                        {Math.floor(activeTimer.remainingSeconds / 60)}:
                        {String(activeTimer.remainingSeconds % 60).padStart(2, '0')}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {activeTimer.isRunning ? (
                        <button
                          onClick={() => onPauseTimer && onPauseTimer(activeTimer.id)}
                          className="p-1 rounded bg-amber-200/60 dark:bg-amber-800 text-amber-800 dark:text-amber-200 hover:scale-105"
                          title="暫停"
                        >
                          <Pause className="w-3 h-3" />
                        </button>
                      ) : (
                        <button
                          onClick={() => onResumeTimer && onResumeTimer(activeTimer.id)}
                          className="p-1 rounded bg-emerald-500 text-white hover:scale-105"
                          title="繼續"
                        >
                          <Play className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* 右側：橫向展開的關卡路線節點鏈 (Timeline Node Track) */}
              <div className="flex-1 min-w-0 overflow-x-auto pb-2 scrollbar-thin">
                <div className="flex items-center gap-3 min-w-max py-1">
                  {items.map((item, idx) => {
                    const isCompleted = item.status === 'completed';
                    const isCurrent = item.itemId === currentActionItem?.itemId;
                    const paperInfo = papers.find(p => p.id === item.paperId);

                    return (
                      <div key={item.itemId} className="flex items-center gap-3">
                        {/* 關卡節點卡片 */}
                        <div className={`p-3 rounded-2xl border transition-all w-56 flex flex-col justify-between ${
                          isCurrent
                            ? 'bg-indigo-50/90 dark:bg-indigo-950/60 border-indigo-400 dark:border-indigo-600 shadow-lg shadow-indigo-500/10 ring-2 ring-indigo-400/40'
                            : isCompleted
                            ? 'bg-slate-50/80 dark:bg-slate-850/60 border-slate-200 dark:border-slate-800 hover:border-emerald-400'
                            : 'bg-slate-50/40 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800/60 opacity-60'
                        }`}>
                          
                          {/* 頂部標記 */}
                          <div className="flex items-center justify-between gap-1 mb-1.5">
                            <span className="text-[10px] font-bold text-slate-400">
                              第 {idx + 1} 關
                            </span>
                            {getDifficultyBadge(item.difficulty)}
                            
                            {isCompleted ? (
                              <span className="flex items-center gap-0.5 text-xs font-black text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>{item.score}分</span>
                              </span>
                            ) : isCurrent ? (
                              <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-indigo-600 text-white animate-pulse">
                                當前應考
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400">待解鎖</span>
                            )}
                          </div>

                          {/* 考卷標題 */}
                          <h4 
                            onClick={() => paperInfo && onPreviewPaper(paperInfo)}
                            className="font-bold text-xs text-slate-900 dark:text-white line-clamp-2 hover:text-indigo-600 cursor-pointer min-h-[32px]"
                            title={item.paperTitle}
                          >
                            {item.paperTitle}
                          </h4>

                          {/* 底部操作或備註 */}
                          <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-[11px]">
                            {isCompleted ? (
                              <button
                                onClick={() => onViewSubmission(stu, selectedSubject, item)}
                                className="text-emerald-600 dark:text-emerald-400 hover:underline font-semibold"
                              >
                                檢視作答照片
                              </button>
                            ) : isCurrent ? (
                              <div className="flex items-center gap-1.5 w-full justify-between">
                                {/* 開始計時 */}
                                {!activeTimer && onStartStudentTimer && (
                                  <button
                                    onClick={() => onStartStudentTimer(
                                      stu.id,
                                      stu.name,
                                      stu.grade,
                                      item.paperTitle,
                                      selectedSubject,
                                      item.targetMinutes || 30
                                    )}
                                    className="px-2 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-[10px] flex items-center gap-1 shadow-sm transition-all"
                                  >
                                    <Clock className="w-3 h-3" />
                                    <span>計時</span>
                                  </button>
                                )}

                                {/* 拍照登分 */}
                                <button
                                  onClick={() => onCompleteItem(stu, selectedSubject, item)}
                                  className="flex-1 px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] flex items-center justify-center gap-1 shadow-sm transition-all"
                                >
                                  <span>✍️ 登分</span>
                                </button>
                              </div>
                            ) : (
                              <span className="text-slate-400">{item.targetMinutes} 分鐘</span>
                            )}
                          </div>

                        </div>

                        {/* 箭頭連接符號 */}
                        {idx < items.length - 1 && (
                          <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0" />
                        )}
                      </div>
                    );
                  })}

                  {items.length === 0 && (
                    <div className="text-xs text-slate-400 py-3 px-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-800">
                      尚未排定任何考卷，點擊上方「➕ 批次指派同一考卷」即可一次加卷！
                    </div>
                  )}
                </div>
              </div>

            </div>
          );
        })}

        {filteredStudents.length === 0 && (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-400">
            查無符合條件的學生資料
          </div>
        )}
      </div>

    </div>
  );
};
