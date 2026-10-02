import React, { useState } from 'react';
import { Student, ExamPaper, TrackItem, DifficultyLevel } from '../types';
import { 
  Plus, 
  ArrowUp, 
  ArrowDown, 
  Trash2, 
  BookOpen, 
  UserPlus, 
  GraduationCap, 
  Check, 
  Sparkles, 
  Sliders, 
  FileText,
  Search,
  Flame,
  Clock,
  X
} from 'lucide-react';
import { saveStudent } from '../services/storageService';

interface PlannerViewProps {
  students: Student[];
  papers: ExamPaper[];
  onDataChanged: () => void;
  onPreviewPaper: (paper: ExamPaper) => void;
}

const COMMON_SUBJECTS = ['數學', '英文', '物理', '化學', '生物', '國文', '地科'];

export const PlannerView: React.FC<PlannerViewProps> = ({
  students,
  papers,
  onDataChanged,
  onPreviewPaper,
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id || '');
  const [activeSubject, setActiveSubject] = useState<string>('數學');
  const [searchStudent, setSearchStudent] = useState('');

  // 新增學生 Modal 狀態
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentGrade, setNewStudentGrade] = useState('高一');
  const [newStudentSchool, setNewStudentSchool] = useState('');
  const [newStudentTags, setNewStudentTags] = useState('');

  // 從考卷庫挑選加入 Modal 狀態
  const [isAddPaperOpen, setIsAddPaperOpen] = useState(false);
  const [paperSearchQuery, setPaperSearchQuery] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');
  const [customNoteInput, setCustomNoteInput] = useState('');

  // 新增自訂科目彈窗
  const [isAddSubjectOpen, setIsAddSubjectOpen] = useState(false);
  const [newSubjectInput, setNewSubjectInput] = useState('');

  const currentStudent = students.find(s => s.id === selectedStudentId) || students[0];

  const availableSubjects = currentStudent?.tracks ? Object.keys(currentStudent.tracks) : [];
  const effectiveSubject = availableSubjects.includes(activeSubject)
    ? activeSubject
    : (availableSubjects[0] || '數學');

  const currentTrack = currentStudent?.tracks?.[effectiveSubject];
  const trackItems = currentTrack?.items || [];

  // 篩選考卷庫
  const filteredLibraryPapers = papers.filter(p => {
    const matchSubject = p.subject === effectiveSubject || p.subject.includes(effectiveSubject);
    const matchQuery = p.title.toLowerCase().includes(paperSearchQuery.toLowerCase()) ||
                       p.unit.toLowerCase().includes(paperSearchQuery.toLowerCase());
    const matchDiff = filterDifficulty === 'all' || p.difficulty === filterDifficulty;
    return matchSubject && matchQuery && matchDiff;
  });

  // 難易度顏色標籤
  const getDifficultyBadge = (difficulty: DifficultyLevel) => {
    switch (difficulty) {
      case 'easy':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">入門救底</span>;
      case 'medium':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-sky-500/20 text-sky-300 border border-sky-500/30">標準實戰</span>;
      case 'hard':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">進階挑戰</span>;
      case 'boss':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-0.5"><Flame className="w-3 h-3" /> 魔王卷</span>;
    }
  };

  // 新增學生提交
  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim()) return;

    const tagsArray = newStudentTags
      .split(/[,，、 ]+/)
      .map(t => t.trim())
      .filter(Boolean);

    const newStudent: Student = {
      id: `student-${Date.now()}`,
      name: newStudentName.trim(),
      grade: newStudentGrade,
      school: newStudentSchool.trim() || undefined,
      tags: tagsArray,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      tracks: {
        '數學': {
          subject: '數學',
          updatedAt: Date.now(),
          items: []
        },
        '英文': {
          subject: '英文',
          updatedAt: Date.now(),
          items: []
        }
      }
    };

    await saveStudent(newStudent);
    setSelectedStudentId(newStudent.id);
    setIsAddStudentOpen(false);
    setNewStudentName('');
    setNewStudentSchool('');
    setNewStudentTags('');
    onDataChanged();
  };

  // 新增科目軌道
  const handleAddSubjectToStudent = async (subjectName: string) => {
    if (!currentStudent || !subjectName.trim()) return;
    if (currentStudent.tracks[subjectName]) {
      setActiveSubject(subjectName);
      setIsAddSubjectOpen(false);
      return;
    }

    const updated: Student = {
      ...currentStudent,
      updatedAt: Date.now(),
      tracks: {
        ...currentStudent.tracks,
        [subjectName]: {
          subject: subjectName,
          updatedAt: Date.now(),
          items: []
        }
      }
    };

    await saveStudent(updated);
    setActiveSubject(subjectName);
    setIsAddSubjectOpen(false);
    setNewSubjectInput('');
    onDataChanged();
  };

  // 將考卷加入當前軌道
  const handleAddPaperToTrack = async (paper: ExamPaper) => {
    if (!currentStudent) return;

    const newItem: TrackItem = {
      itemId: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      paperId: paper.id,
      paperTitle: paper.title,
      subject: effectiveSubject,
      difficulty: paper.difficulty,
      targetMinutes: paper.targetMinutes,
      status: 'pending',
      score: null,
      maxScore: 100,
      assignedAt: Date.now(),
      completedAt: null,
      tutorName: null,
      tutorNotes: customNoteInput.trim() || null,
      submissionPhotoUrls: [],
    };

    const updatedItems = [...trackItems, newItem];

    const updatedStudent: Student = {
      ...currentStudent,
      updatedAt: Date.now(),
      tracks: {
        ...currentStudent.tracks,
        [effectiveSubject]: {
          ...currentTrack,
          subject: effectiveSubject,
          updatedAt: Date.now(),
          items: updatedItems
        }
      }
    };

    await saveStudent(updatedStudent);
    setIsAddPaperOpen(false);
    setCustomNoteInput('');
    onDataChanged();
  };

  // 上移關卡
  const handleMoveUp = async (index: number) => {
    if (index === 0 || !currentStudent) return;
    const items = [...trackItems];
    const temp = items[index];
    items[index] = items[index - 1];
    items[index - 1] = temp;

    const updatedStudent: Student = {
      ...currentStudent,
      updatedAt: Date.now(),
      tracks: {
        ...currentStudent.tracks,
        [effectiveSubject]: {
          ...currentTrack,
          subject: effectiveSubject,
          updatedAt: Date.now(),
          items
        }
      }
    };

    await saveStudent(updatedStudent);
    onDataChanged();
  };

  // 下移關卡
  const handleMoveDown = async (index: number) => {
    if (index === trackItems.length - 1 || !currentStudent) return;
    const items = [...trackItems];
    const temp = items[index];
    items[index] = items[index + 1];
    items[index + 1] = temp;

    const updatedStudent: Student = {
      ...currentStudent,
      updatedAt: Date.now(),
      tracks: {
        ...currentStudent.tracks,
        [effectiveSubject]: {
          ...currentTrack,
          subject: effectiveSubject,
          updatedAt: Date.now(),
          items
        }
      }
    };

    await saveStudent(updatedStudent);
    onDataChanged();
  };

  // 刪除關卡
  const handleDeleteItem = async (index: number) => {
    if (!currentStudent) return;
    if (!confirm('確定要從此學生的學習路徑中移除此考卷嗎？')) return;

    const items = trackItems.filter((_, i) => i !== index);

    const updatedStudent: Student = {
      ...currentStudent,
      updatedAt: Date.now(),
      tracks: {
        ...currentStudent.tracks,
        [effectiveSubject]: {
          ...currentTrack,
          subject: effectiveSubject,
          updatedAt: Date.now(),
          items
        }
      }
    };

    await saveStudent(updatedStudent);
    onDataChanged();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* 頂部標題與新增學生按鈕 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Sliders className="w-5 h-5 text-amber-400" />
            <span>個別化考卷路徑排程中控台</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            因材施教：為每位學生量身打造各科專屬的考卷關卡順序，支援即時調動、插入救底卷或跳級挑戰
          </p>
        </div>

        <button
          onClick={() => setIsAddStudentOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all active:scale-[0.98]"
        >
          <UserPlus className="w-4 h-4" />
          <span>＋ 新增學生</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* 左側：學生選擇名單 (4 Columns) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700/60 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300">學生清單 ({students.length})</span>
            </div>

            {/* 搜尋學生 */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="搜尋學生..."
                value={searchStudent}
                onChange={(e) => setSearchStudent(e.target.value)}
                className="w-full pl-9 pr-8 py-1.5 bg-slate-900/80 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />
              {searchStudent && (
                <button
                  type="button"
                  onClick={() => setSearchStudent('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-slate-400 hover:text-white"
                  title="清除搜尋"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* 學生卡片捲軸 */}
            <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
              {students
                .filter(s => s.name.toLowerCase().includes(searchStudent.toLowerCase()))
                .map((student) => {
                  const isSelected = student.id === currentStudent?.id;
                  const subjectsCount = Object.keys(student.tracks || {}).length;
                  
                  return (
                    <div
                      key={student.id}
                      onClick={() => setSelectedStudentId(student.id)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-gradient-to-r from-indigo-900/40 to-slate-800 border-indigo-500 shadow-md ring-1 ring-indigo-500/30'
                          : 'bg-slate-900/40 border-slate-700/50 hover:bg-slate-800/60 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-sm text-white">{student.name}</div>
                        <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          {student.grade}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-2 text-xs text-slate-400">
                        <span>{student.school || '校區學生'}</span>
                        <span className="text-indigo-300 text-[11px]">
                          {subjectsCount} 個科目軌道
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>

        {/* 右側：當前學生的科目學習軌道編輯器 (8 Columns) */}
        <div className="lg:col-span-8 space-y-4">
          {currentStudent ? (
            <div className="bg-slate-800/80 rounded-2xl p-6 border border-slate-700/60 shadow-xl space-y-5">
              
              {/* 學生資訊與科目軌道標籤 */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700/60 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-white">{currentStudent.name}</h3>
                    <span className="text-xs text-slate-400">通關路徑排程</span>
                  </div>
                  {currentStudent.tags && (
                    <div className="flex items-center gap-1.5 mt-1">
                      {currentStudent.tags.map((t, idx) => (
                        <span key={idx} className="text-[10px] px-2 py-0.5 rounded bg-slate-700/60 text-slate-300">
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* 增加考卷按鈕 */}
                <button
                  onClick={() => setIsAddPaperOpen(true)}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-bold shadow-md shadow-emerald-900/30 transition-all active:scale-[0.98]"
                >
                  <Plus className="w-4 h-4" />
                  <span>➕ 從考卷庫拉入考卷</span>
                </button>
              </div>

              {/* 科目軌道切換區 (數學/英文/物理...) */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-400 mr-1">科目軌道：</span>
                {availableSubjects.map((sub) => {
                  const isActive = sub === effectiveSubject;
                  const count = currentStudent.tracks[sub]?.items?.length || 0;
                  return (
                    <button
                      key={sub}
                      onClick={() => setActiveSubject(sub)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-slate-700/40 text-slate-300 hover:bg-slate-700 hover:text-white'
                      }`}
                    >
                      {sub} ({count})
                    </button>
                  );
                })}

                {/* ➕ 建立新科目軌道 */}
                <button
                  onClick={() => setIsAddSubjectOpen(true)}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white border border-dashed border-slate-600 hover:border-slate-500 transition-colors"
                >
                  ＋ 開立新科目軌道
                </button>
              </div>

              {/* 考卷關卡順序調整列表 */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>考卷通關順序（由上至下按部就班通關）</span>
                  <span>共 {trackItems.length} 張考卷</span>
                </div>

                {trackItems.length > 0 ? (
                  <div className="space-y-2.5">
                    {trackItems.map((item, idx) => {
                      const isCompleted = item.status === 'completed';

                      return (
                        <div
                          key={item.itemId}
                          className={`p-4 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                            isCompleted
                              ? 'bg-slate-900/60 border-emerald-500/30'
                              : 'bg-slate-900/80 border-slate-700/70 hover:border-indigo-500/50'
                          }`}
                        >
                          {/* 左側序號與資訊 */}
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                                isCompleted
                                  ? 'bg-emerald-500 text-white'
                                  : 'bg-slate-800 text-slate-300 border border-slate-700'
                              }`}
                            >
                              第 {idx + 1} 關
                            </div>

                            <div className="min-w-0">
                              <div className="font-bold text-sm text-slate-100 truncate">
                                {item.paperTitle}
                              </div>
                              <div className="flex flex-wrap items-center gap-2 mt-1 text-xs">
                                {getDifficultyBadge(item.difficulty)}
                                <span className="text-slate-400">{item.targetMinutes} 分鐘</span>
                                {item.tutorNotes && (
                                  <span className="text-amber-400 text-[11px] bg-amber-400/10 px-1.5 py-0.5 rounded">
                                    註：{item.tutorNotes}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* 右側操作群 (上移/下移/刪除) */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            {isCompleted ? (
                              <div className="text-right mr-2">
                                <span className="text-sm font-bold text-emerald-400">
                                  {item.score} 分
                                </span>
                                <span className="text-[10px] text-slate-500 block">已完賽</span>
                              </div>
                            ) : null}

                            <button
                              title="向上調整順序"
                              disabled={idx === 0}
                              onClick={() => handleMoveUp(idx)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                            >
                              <ArrowUp className="w-4 h-4" />
                            </button>

                            <button
                              title="向下調整順序"
                              disabled={idx === trackItems.length - 1}
                              onClick={() => handleMoveDown(idx)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                            >
                              <ArrowDown className="w-4 h-4" />
                            </button>

                            <button
                              title="移除此考卷"
                              onClick={() => handleDeleteItem(idx)}
                              className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors ml-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 border-2 border-dashed border-slate-700 rounded-2xl p-6 text-slate-400 space-y-3">
                    <BookOpen className="w-10 h-10 mx-auto text-slate-500" />
                    <p className="text-sm font-medium">該科目路徑目前是空的！</p>
                    <p className="text-xs text-slate-500">
                      點擊右上角的「➕ 從考卷庫拉入考卷」，即可按這名學生的程度量身建立進度！
                    </p>
                  </div>
                )}
              </div>

            </div>
          ) : null}
        </div>

      </div>

      {/* 彈窗 1：新增學生 Modal */}
      {isAddStudentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-indigo-400" />
              <span>建立新學生檔案</span>
            </h3>

            <form onSubmit={handleCreateStudent} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  學生姓名 <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="例如：張宇廷、陳小美"
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">年級</label>
                  <select
                    value={newStudentGrade}
                    onChange={(e) => setNewStudentGrade(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="國一">國一</option>
                    <option value="國二">國二</option>
                    <option value="國三 (會考衝刺)">國三 (會考衝刺)</option>
                    <option value="高一">高一</option>
                    <option value="高二">高二</option>
                    <option value="高三 (學測分科)">高三 (學測分科)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">學校</label>
                  <input
                    type="text"
                    placeholder="例如：成功高中"
                    value={newStudentSchool}
                    onChange={(e) => setNewStudentSchool(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  程度標籤 / 備註 (以逗號隔開)
                </label>
                <input
                  type="text"
                  placeholder="例如：基礎弱需多算, 段考目標70, 計算粗心"
                  value={newStudentTags}
                  onChange={(e) => setNewStudentTags(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddStudentOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30"
                >
                  確認建立
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 彈窗 2：從考卷庫挑選考卷拉入進度條 Modal */}
      {isAddPaperOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-emerald-400" />
                  <span>挑選考卷排入【{currentStudent?.name} - {effectiveSubject}】學習鏈</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">點擊「加入此卷」即可將該份考卷安排到進度最後</p>
              </div>
              <button
                onClick={() => setIsAddPaperOpen(false)}
                className="text-slate-400 hover:text-white text-lg p-1"
              >
                ✕
              </button>
            </div>

            {/* 篩選器與搜尋 */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="搜尋考卷名稱、單元..."
                  value={paperSearchQuery}
                  onChange={(e) => setPaperSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                />
                {paperSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setPaperSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-slate-400 hover:text-white"
                    title="清除搜尋"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* 難易度過濾 */}
              <select
                value={filterDifficulty}
                onChange={(e) => setFilterDifficulty(e.target.value)}
                className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
              >
                <option value="all">所有難度</option>
                <option value="easy">入門救底</option>
                <option value="medium">標準實戰</option>
                <option value="hard">進階挑戰</option>
                <option value="boss">魔王衝刺</option>
              </select>
            </div>

            {/* 主教備註 (可選填給輔導老師看的指引) */}
            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700">
              <label className="block text-[11px] font-bold text-slate-300 mb-1">
                給現場輔導老師的指示備註 (選填，如：考差才做這張、需限時 20 分鐘)
              </label>
              <input
                type="text"
                placeholder="例如：若前一張未達 70 分才需做這張救底..."
                value={customNoteInput}
                onChange={(e) => setCustomNoteInput(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none"
              />
            </div>

            {/* 考卷庫清單 */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {filteredLibraryPapers.map((paper) => (
                <div
                  key={paper.id}
                  className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 hover:border-emerald-500/50 flex items-center justify-between gap-3 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="font-bold text-xs sm:text-sm text-white truncate">
                      {paper.title}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs">
                      {getDifficultyBadge(paper.difficulty)}
                      <span className="text-slate-400">{paper.targetMinutes} 分鐘</span>
                      <span className="text-slate-400">單元：{paper.unit}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => onPreviewPaper(paper)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-650 text-slate-300 text-xs font-medium"
                    >
                      縮圖
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAddPaperToTrack(paper)}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-700/30"
                    >
                      ＋ 加入進度
                    </button>
                  </div>
                </div>
              ))}

              {filteredLibraryPapers.length === 0 && (
                <div className="text-center py-8 text-slate-400 text-xs">
                  找不到符合條件的考卷，請至「考卷庫」先上傳考卷！
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* 彈窗 3：開立新科目軌道 Modal */}
      {isAddSubjectOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-white">開立新科目學習軌道</h3>
            <p className="text-xs text-slate-400">
              選擇或輸入要為 {currentStudent?.name} 開立的科目軌道：
            </p>

            {/* 常用科目快捷 */}
            <div className="flex flex-wrap gap-1.5">
              {COMMON_SUBJECTS.map((sub) => (
                <button
                  key={sub}
                  type="button"
                  onClick={() => handleAddSubjectToStudent(sub)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white text-xs font-semibold transition-colors"
                >
                  {sub}
                </button>
              ))}
            </div>

            {/* 自訂科目輸入 */}
            <div className="pt-2 border-t border-slate-800 flex items-center gap-2">
              <input
                type="text"
                placeholder="自訂其他科目..."
                value={newSubjectInput}
                onChange={(e) => setNewSubjectInput(e.target.value)}
                className="flex-1 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none"
              />
              <button
                type="button"
                onClick={() => handleAddSubjectToStudent(newSubjectInput)}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold"
              >
                新增
              </button>
            </div>

            <div className="text-right">
              <button
                type="button"
                onClick={() => setIsAddSubjectOpen(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                關閉
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
