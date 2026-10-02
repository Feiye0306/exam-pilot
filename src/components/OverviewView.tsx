import React, { useState } from 'react';
import { Student, ExamPaper } from '../types';
import { 
  BarChart3, 
  TrendingUp, 
  Award, 
  Users, 
  CheckCircle2, 
  Clock, 
  BookOpen,
  Search
} from 'lucide-react';

interface OverviewViewProps {
  students: Student[];
  papers: ExamPaper[];
  onSelectStudentForTutor: (studentId: string) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  students,
  papers,
  onSelectStudentForTutor,
}) => {
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [searchStudent, setSearchStudent] = useState('');

  // 取得所有曾開立過的科目
  const allSubjectsSet = new Set<string>();
  students.forEach(s => {
    Object.keys(s.tracks || {}).forEach(sub => allSubjectsSet.add(sub));
  });
  const subjectsList = ['all', ...Array.from(allSubjectsSet)];

  // 總通關指標計算
  let totalAssigned = 0;
  let totalCompleted = 0;
  let totalScoreSum = 0;
  let scoreCount = 0;

  students.forEach(s => {
    Object.values(s.tracks || {}).forEach(track => {
      if (selectedSubject === 'all' || track.subject === selectedSubject) {
        track.items.forEach(it => {
          totalAssigned++;
          if (it.status === 'completed') {
            totalCompleted++;
            if (typeof it.score === 'number') {
              totalScoreSum += it.score;
              scoreCount++;
            }
          }
        });
      }
    });
  });

  const overallProgress = totalAssigned > 0 ? Math.round((totalCompleted / totalAssigned) * 100) : 0;
  const overallAvgScore = scoreCount > 0 ? Math.round(totalScoreSum / scoreCount) : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* 頂部戰情指標卡片 (KPI Pods) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: 輔導學生數 */}
        <div className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700/60 shadow-lg flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-semibold">考前衝刺學生</div>
            <div className="text-2xl font-black text-white mt-1">{students.length} <span className="text-xs font-normal text-slate-400">人</span></div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 2: 考卷題庫存量 */}
        <div className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700/60 shadow-lg flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-semibold">試卷夾庫存</div>
            <div className="text-2xl font-black text-white mt-1">{papers.length} <span className="text-xs font-normal text-slate-400">份</span></div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
            <BookOpen className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 3: 全班總通關率 */}
        <div className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700/60 shadow-lg flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-semibold">全體考卷通關率</div>
            <div className="text-2xl font-black text-emerald-400 mt-1">{overallProgress}%</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 4: 平均測驗成績 */}
        <div className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700/60 shadow-lg flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-semibold">已測驗平均分</div>
            <div className="text-2xl font-black text-amber-400 mt-1">{overallAvgScore} <span className="text-xs font-normal text-slate-400">分</span></div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* 學生通關進度總表 */}
      <div className="bg-slate-800/80 rounded-2xl p-5 border border-slate-700/60 shadow-xl space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-700/60 pb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-400" />
              <span>各學生個別化考卷通關進度戰情表</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              點擊任意學生可立即跳轉至「輔導老師前台」為其發卷或登分
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* 科目過濾 */}
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
            >
              {subjectsList.map((sub) => (
                <option key={sub} value={sub}>
                  {sub === 'all' ? '全部科目' : sub}
                </option>
              ))}
            </select>

            {/* 搜尋學生 */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="搜尋學生..."
                value={searchStudent}
                onChange={(e) => setSearchStudent(e.target.value)}
                className="pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* 學生清單 */}
        <div className="space-y-3">
          {students
            .filter(s => s.name.toLowerCase().includes(searchStudent.toLowerCase()))
            .map((student) => {
              const tracks = student.tracks || {};
              const activeTracks = Object.values(tracks).filter(
                t => selectedSubject === 'all' || t.subject === selectedSubject
              );

              return (
                <div
                  key={student.id}
                  onClick={() => onSelectStudentForTutor(student.id)}
                  className="group p-4 rounded-xl bg-slate-900/60 border border-slate-700/70 hover:border-indigo-500/60 hover:bg-slate-900/90 transition-all cursor-pointer space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="font-bold text-sm text-white group-hover:text-indigo-300 transition-colors">
                        {student.name}
                      </div>
                      <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {student.grade}
                      </span>
                      {student.school && (
                        <span className="text-xs text-slate-400 hidden sm:inline">
                          {student.school}
                        </span>
                      )}
                    </div>

                    <span className="text-xs text-indigo-400 group-hover:underline">
                      進入輔導發卷 ➔
                    </span>
                  </div>

                  {/* 各科軌道進度條 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                    {activeTracks.map((track) => {
                      const items = track.items || [];
                      const completed = items.filter(it => it.status === 'completed').length;
                      const percent = items.length > 0 ? Math.round((completed / items.length) * 100) : 0;
                      
                      // 當前未完成的第一張考卷
                      const currentItem = items.find(it => it.status !== 'completed');

                      return (
                        <div
                          key={track.subject}
                          className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700/60 space-y-1.5"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-200">{track.subject}</span>
                            <span className="font-bold text-indigo-400">{percent}% ({completed}/{items.length})</span>
                          </div>

                          {/* 進度條 */}
                          <div className="w-full h-1.5 rounded-full bg-slate-700 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full transition-all duration-500"
                              style={{ width: `${percent}%` }}
                            ></div>
                          </div>

                          {/* 目前卡在哪一張 */}
                          <div className="text-[11px] text-slate-400 truncate">
                            {currentItem ? (
                              <span>應做：{currentItem.paperTitle}</span>
                            ) : items.length > 0 ? (
                              <span className="text-emerald-400 font-semibold">✓ 已全數通關！</span>
                            ) : (
                              <span className="text-slate-500">尚未排定</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
        </div>

      </div>

    </div>
  );
};
