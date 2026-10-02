import React, { useState, useMemo } from 'react';
import { Student } from '../types';
import { 
  Users, 
  Search, 
  X, 
  Check, 
  Clock, 
  ChevronRight, 
  CheckCircle2, 
  AlertCircle,
  GraduationCap
} from 'lucide-react';
import { ExamTimerItem } from '../types';

interface StudentDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  selectedStudentId: string | null;
  onSelectStudent: (studentId: string) => void;
  gradeTabs: string[];
  activeGradeTab: string;
  onSelectGradeTab: (tab: string) => void;
  activeTimers?: ExamTimerItem[];
}

export const StudentDrawer: React.FC<StudentDrawerProps> = ({
  isOpen,
  onClose,
  students,
  selectedStudentId,
  onSelectStudent,
  gradeTabs,
  activeGradeTab,
  onSelectGradeTab,
  activeTimers = [],
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // 根據年級分頁與搜尋框過濾學生
  const filteredStudents = useMemo(() => {
    let list = students;

    if (activeGradeTab !== 'all') {
      list = list.filter((s) => s.grade === activeGradeTab);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((s) => {
        const matchName = s.name.toLowerCase().includes(q);
        const matchGrade = s.grade.toLowerCase().includes(q);
        const matchSchool = (s.school || '').toLowerCase().includes(q);
        const matchTags = (s.tags || []).some((t) => t.toLowerCase().includes(q));
        const matchTutor = (s.assignedTutors || []).some((t) => t.toLowerCase().includes(q));
        return matchName || matchGrade || matchSchool || matchTags || matchTutor;
      });
    }

    return list;
  }, [students, activeGradeTab, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* 背景遮罩 */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity duration-300"
      />

      {/* 側邊滑出抽屜本體 (左側滑出) */}
      <div className="absolute inset-y-0 left-0 max-w-full flex pr-10">
        <div className="w-screen max-w-md bg-slate-900 border-r border-slate-800 shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out">
          
          {/* 抽屜頂部 Header */}
          <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-900/95 sticky top-0 z-10 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">學生名單抽屜</h3>
                  <p className="text-[11px] text-slate-400">
                    目前篩選出 {filteredStudents.length} 位學生
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="關閉抽屜"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 年級快捷切換分頁 */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => onSelectGradeTab('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  activeGradeTab === 'all'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                全體名單 ({students.length})
              </button>
              {gradeTabs.map((g) => {
                const count = students.filter((s) => s.grade === g).length;
                return (
                  <button
                    key={g}
                    onClick={() => onSelectGradeTab(g)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                      activeGradeTab === g
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {g} ({count})
                  </button>
                );
              })}
            </div>

            {/* 帶有 X 清除鈕的即時搜尋框 */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="搜尋姓名、學校、標籤、負責老師..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="w-full pl-9 pr-9 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800"
                  title="清除搜尋"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* 垂直滾動名單區域 */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5 divide-y divide-slate-800/40">
            {filteredStudents.map((stu) => {
              const isSelected = stu.id === selectedStudentId;
              
              // 取得學生第一個科目的進度概況
              const subjectKeys = Object.keys(stu.tracks || {});
              const firstSubKey = subjectKeys[0] || '數學';
              const track = stu.tracks?.[firstSubKey];
              const items = track?.items || [];
              const completedCount = items.filter((it) => it.status === 'completed').length;
              const totalCount = items.length;
              const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
              const currentAction = items.find((it) => it.status === 'pending' || it.status === 'in_progress');

              // 檢查此學生是否有正在倒數中的計時器
              const activeTimer = activeTimers.find((t) => t.studentId === stu.id);

              return (
                <div
                  key={stu.id}
                  onClick={() => {
                    onSelectStudent(stu.id);
                    onClose();
                  }}
                  className={`pt-2.5 first:pt-0 cursor-pointer group`}
                >
                  <div className={`p-3.5 rounded-2xl border transition-all duration-200 ${
                    isSelected
                      ? 'bg-emerald-950/40 border-emerald-500/60 ring-1 ring-emerald-500/40 shadow-lg shadow-emerald-950/50'
                      : 'bg-slate-850/60 hover:bg-slate-800/80 border-slate-800 hover:border-slate-700'
                  }`}>
                    
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white group-hover:text-emerald-300 transition-colors">
                          {stu.name}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          {stu.grade}
                        </span>
                        {stu.school && (
                          <span className="text-xs text-slate-400 hidden sm:inline">
                            {stu.school}
                          </span>
                        )}
                      </div>

                      {/* 當前選中標籤 */}
                      {isSelected ? (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                          <Check className="w-3 h-3" />
                          <span>已選中</span>
                        </span>
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 group-hover:translate-x-0.5 transition-all" />
                      )}
                    </div>

                    {/* 計時狀態 (若有計時中) */}
                    {activeTimer && (
                      <div className="mt-2 flex items-center gap-2 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
                        <Clock className={`w-3.5 h-3.5 ${activeTimer.isRunning ? 'animate-pulse text-amber-400' : ''}`} />
                        <span>倒數中：</span>
                        <span className="font-mono font-bold">
                          {Math.floor(activeTimer.remainingSeconds / 60)}:
                          {String(activeTimer.remainingSeconds % 60).padStart(2, '0')}
                        </span>
                        {activeTimer.isExpired && (
                          <span className="ml-auto text-[10px] font-bold text-rose-400 bg-rose-500/20 px-1.5 py-0.2 rounded animate-bounce">
                            時間已到！
                          </span>
                        )}
                      </div>
                    )}

                    {/* 當前應考進度摘要 */}
                    <div className="mt-2.5 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>{firstSubKey}進度 ({completedCount}/{totalCount}張)</span>
                        <span className="font-semibold text-emerald-400">{percent}%</span>
                      </div>
                      
                      {/* 進度條 */}
                      <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-300"
                          style={{ width: `${percent}%` }}
                        />
                      </div>

                      {/* 當前待發考卷 */}
                      {currentAction ? (
                        <p className="text-[11px] text-slate-300 truncate pt-0.5 flex items-center gap-1">
                          <span className="text-amber-400 shrink-0">▶ 當前應發：</span>
                          <span className="truncate">{currentAction.paperTitle}</span>
                        </p>
                      ) : (
                        <p className="text-[11px] text-emerald-400/80 pt-0.5 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 shrink-0" />
                          <span>此科目所有考卷已通關</span>
                        </p>
                      )}
                    </div>

                  </div>
                </div>
              );
            })}

            {filteredStudents.length === 0 && (
              <div className="text-center py-12 text-slate-500 text-xs">
                查無符合條件的學生
              </div>
            )}
          </div>

          {/* 抽屜底部快速統計 */}
          <div className="p-3 border-t border-slate-800 bg-slate-900/90 text-center text-xs text-slate-500">
            點擊任一位學生即可直接切換至該生出卷導航
          </div>

        </div>
      </div>
    </div>
  );
};
