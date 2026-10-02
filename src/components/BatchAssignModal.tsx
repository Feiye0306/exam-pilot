import React, { useState, useMemo } from 'react';
import { ExamPaper, Student } from '../types';
import { 
  Users, 
  Check, 
  X, 
  Send, 
  FileText, 
  Filter, 
  Search,
  Sparkles,
  Clock,
  Layers
} from 'lucide-react';
import { batchAssignPaperToStudents } from '../services/storageService';

interface BatchAssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  papers: ExamPaper[];
  initialPaper?: ExamPaper | null;
  students: Student[];
  onDataChanged: () => void;
}

export const BatchAssignModal: React.FC<BatchAssignModalProps> = ({
  isOpen,
  onClose,
  papers,
  initialPaper,
  students,
  onDataChanged,
}) => {
  const [selectedPaperId, setSelectedPaperId] = useState<string>(initialPaper?.id || papers[0]?.id || '');
  const [selectedSubject, setSelectedSubject] = useState<string>(initialPaper?.subject || '數學');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [tutorNotes, setTutorNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 當 initialPaper 改變時同步更新
  React.useEffect(() => {
    if (initialPaper) {
      setSelectedPaperId(initialPaper.id);
      setSelectedSubject(initialPaper.subject || '數學');
    }
  }, [initialPaper]);

  const currentPaper = useMemo(() => {
    return papers.find(p => p.id === selectedPaperId) || initialPaper || papers[0];
  }, [papers, selectedPaperId, initialPaper]);

  // 所有不重複的年級
  const allGrades = useMemo(() => {
    const set = new Set<string>();
    students.forEach(s => { if (s.grade) set.add(s.grade); });
    return Array.from(set);
  }, [students]);

  // 篩選學生清單
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      if (gradeFilter !== 'all' && s.grade !== gradeFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = s.name.toLowerCase().includes(q);
        const matchSchool = (s.school || '').toLowerCase().includes(q);
        return matchName || matchSchool;
      }
      return true;
    });
  }, [students, gradeFilter, searchQuery]);

  // 全選／取消全選當前篩選下的學生
  const handleSelectAllFiltered = () => {
    const filteredIds = filteredStudents.map(s => s.id);
    const allSelected = filteredIds.every(id => selectedStudentIds.includes(id));
    if (allSelected) {
      // 取消這批
      setSelectedStudentIds(prev => prev.filter(id => !filteredIds.includes(id)));
    } else {
      // 加入這批
      setSelectedStudentIds(prev => Array.from(new Set([...prev, ...filteredIds])));
    }
  };

  // 一鍵選取特定年級
  const handleSelectGrade = (grade: string) => {
    const gradeIds = students.filter(s => s.grade === grade).map(s => s.id);
    setSelectedStudentIds(prev => Array.from(new Set([...prev, ...gradeIds])));
  };

  // 單獨切換勾選某學生
  const handleToggleStudent = (id: string) => {
    setSelectedStudentIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // 確認批次派發
  const handleConfirmAssign = async () => {
    if (!currentPaper) {
      alert('請先選擇要派發的考卷！');
      return;
    }
    if (selectedStudentIds.length === 0) {
      alert('請至少勾選一位學生！');
      return;
    }

    setIsSubmitting(true);
    try {
      await batchAssignPaperToStudents({
        paper: currentPaper,
        studentIds: selectedStudentIds,
        subject: selectedSubject,
        tutorNotes: tutorNotes.trim() || undefined,
      });

      onDataChanged();
      alert(`🎉 成功派發！已將《${currentPaper.title}》加入 ${selectedStudentIds.length} 位學生的「${selectedSubject}」進度鏈中！`);
      onClose();
    } catch (err) {
      console.error('派發失敗:', err);
      alert('派發失敗，請稍後再試');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] flex flex-col text-slate-800 dark:text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-800">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white flex items-center gap-2">
                <span>多人批次派卷</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 font-semibold">
                  同一考卷多人進度同步
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                一鍵指派考卷給同班級或多位學生，不必再一位一位重複排定！
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. 選擇要派發的考卷摘要區 */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-indigo-500" />
              <span>目標派發考卷：</span>
            </label>
            
            {/* 更換考卷下拉 */}
            <select
              value={selectedPaperId}
              onChange={(e) => setSelectedPaperId(e.target.value)}
              className="text-xs px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              {papers.map((p) => (
                <option key={p.id} value={p.id}>
                  [{p.subject}] {p.title}
                </option>
              ))}
            </select>
          </div>

          {currentPaper && (
            <div className="flex items-center gap-3">
              <img
                src={currentPaper.thumbnailUrl}
                alt={currentPaper.title}
                className="w-16 h-12 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                  {currentPaper.title}
                </h4>
                <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                    科目：{currentPaper.subject}
                  </span>
                  <span>• 單元：{currentPaper.unit}</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {currentPaper.targetMinutes} 分鐘
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 出卷備註 (選填) */}
          <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
            <input
              type="text"
              placeholder="出卷指示或備註 (選填，例如：考前衝刺必寫、未達 70 分才做...)"
              value={tutorNotes}
              onChange={(e) => setTutorNotes(e.target.value)}
              className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* 2. 選擇學生名單區域 */}
        <div className="flex-1 flex flex-col min-h-0 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">快速勾選：</span>
              {allGrades.map(g => (
                <button
                  key={g}
                  type="button"
                  onClick={() => handleSelectGrade(g)}
                  className="px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-[11px] font-semibold border border-indigo-200/60 dark:border-indigo-800/60 transition-all"
                >
                  +{g} 全體
                </button>
              ))}
              <button
                type="button"
                onClick={handleSelectAllFiltered}
                className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 text-[11px] font-semibold transition-all"
              >
                {filteredStudents.every(s => selectedStudentIds.includes(s.id)) ? '取消當前篩選全選' : '全選當前篩選'}
              </button>
              {selectedStudentIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedStudentIds([])}
                  className="px-2 py-0.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-[11px] font-semibold"
                >
                  清空已選
                </button>
              )}
            </div>

            <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
              已勾選 {selectedStudentIds.length} / {students.length} 位
            </div>
          </div>

          {/* 搜尋與年級 Tab */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
              <button
                type="button"
                onClick={() => setGradeFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  gradeFilter === 'all'
                    ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}
              >
                全部
              </button>
              {allGrades.map(g => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGradeFilter(g)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    gradeFilter === g
                      ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>

            <div className="relative flex-1">
              <input
                type="text"
                placeholder="搜尋學生姓名或學校..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-3 pr-7 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* 學生勾選捲動清單 */}
          <div className="flex-1 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-2xl p-2 space-y-1.5 bg-slate-50/50 dark:bg-slate-950/40">
            {filteredStudents.map((stu) => {
              const isChecked = selectedStudentIds.includes(stu.id);
              const track = stu.tracks?.[selectedSubject];
              const paperCount = track?.items?.length || 0;

              return (
                <label
                  key={stu.id}
                  onClick={() => handleToggleStudent(stu.id)}
                  className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer select-none transition-all ${
                    isChecked
                      ? 'bg-indigo-50/80 dark:bg-indigo-950/50 border-indigo-300 dark:border-indigo-700 shadow-sm'
                      : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors ${
                      isChecked
                        ? 'bg-indigo-600 border-indigo-600 text-white'
                        : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                    }`}>
                      {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>

                    <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                      {stu.name}
                    </span>

                    <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                      {stu.grade}
                    </span>

                    {stu.school && (
                      <span className="text-xs text-slate-400 truncate hidden sm:inline">
                        • {stu.school}
                      </span>
                    )}
                  </div>

                  <span className="text-[11px] text-slate-400 shrink-0">
                    目前該科已排 {paperCount} 份
                  </span>
                </label>
              );
            })}

            {filteredStudents.length === 0 && (
              <div className="text-center py-8 text-xs text-slate-400">
                查無符合條件的學生
              </div>
            )}
          </div>
        </div>

        {/* 底部確認動作按鈕 */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            派發後考卷將自動加進學生的關卡最後端
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-white"
            >
              取消
            </button>

            <button
              type="button"
              disabled={isSubmitting || selectedStudentIds.length === 0}
              onClick={handleConfirmAssign}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold text-xs shadow-md shadow-indigo-600/30 disabled:opacity-40 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Send className="w-3.5 h-3.5" />
              <span>確認派發給 {selectedStudentIds.length} 位學生</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
