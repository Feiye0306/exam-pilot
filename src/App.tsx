import React, { useState, useEffect } from 'react';
import { ActiveTab, ExamPaper, Student, TrackItem, UserRole } from './types';
import { Navbar } from './components/Navbar';
import { TutorView } from './components/TutorView';
import { PlannerView } from './components/PlannerView';
import { LibraryView } from './components/LibraryView';
import { OverviewView } from './components/OverviewView';
import { PaperPreviewModal } from './components/PaperPreviewModal';
import { SubmissionDetailModal } from './components/SubmissionDetailModal';
import { ClassroomTimerModal } from './components/ClassroomTimerModal';
import { TimerFloatingBar } from './components/TimerFloatingBar';
import { TimerAlertModal } from './components/TimerAlertModal';
import { useExamTimers } from './hooks/useExamTimers';
import { 
  subscribeToPapers, 
  subscribeToStudents, 
  getLocalPapers, 
  getLocalStudents 
} from './services/storageService';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('tutor');
  
  // 角色權限狀態 (預設為 'tutor' 輔導老師模式，完全隱藏主教排程台)
  const [userRole, setUserRole] = useState<UserRole>(() => {
    return (localStorage.getItem('exam_pilot_user_role') as UserRole) || 'tutor';
  });

  const [papers, setPapers] = useState<ExamPaper[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ⏱️ 全域考試計時器系統 (支援全班與個別學生)
  const {
    timers,
    expiredAlert,
    setExpiredAlert,
    startClassroomTimer,
    startStudentTimer,
    pauseTimer,
    resumeTimer,
    addMinutes,
    removeTimer,
  } = useExamTimers();

  const [isTimerModalOpen, setIsTimerModalOpen] = useState(false);

  // 彈窗狀態
  const [previewingPaper, setPreviewingPaper] = useState<ExamPaper | null>(null);
  const [viewingSubmission, setViewingSubmission] = useState<{
    student: Student;
    subject: string;
    item: TrackItem;
  } | null>(null);

  // 檢查 URL 參數解鎖管理權限 (例如 ?admin=8888 或 ?admin=true)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const adminParam = params.get('admin');
      const secretParam = params.get('secret');
      if (adminParam === '8888' || adminParam === 'true' || secretParam === '8888') {
        setUserRole('admin');
        localStorage.setItem('exam_pilot_user_role', 'admin');
        if (params.get('tab') === 'planner') {
          setActiveTab('planner');
        }
      }
    } catch {
      // 忽略 URL 解析錯誤
    }
  }, []);

  // 鍵盤快捷鍵 (Ctrl + Shift + A) 快速喚出管理員解鎖
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        const pwd = window.prompt('請輸入排程管理通行碼：');
        if (pwd === '8888') {
          setUserRole('admin');
          localStorage.setItem('exam_pilot_user_role', 'admin');
          setActiveTab('planner');
          alert('已解鎖排程中控台！');
        } else if (pwd !== null) {
          alert('通行碼錯誤');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 初始化與即時資料訂閱
  useEffect(() => {
    // 立即先以本地快取渲染，達成 0 延遲秒開
    setPapers(getLocalPapers());
    setStudents(getLocalStudents());
    setIsLoading(false);

    // 啟動 Firestore 雲端即時同步
    const unsubscribePapers = subscribeToPapers((updatedPapers) => {
      setPapers(updatedPapers);
    });

    const unsubscribeStudents = subscribeToStudents((updatedStudents) => {
      setStudents(updatedStudents);
    });

    return () => {
      unsubscribePapers();
      unsubscribeStudents();
    };
  }, []);

  // 若為輔導老師模式，但當前 Tab 為 planner，自動轉移至 tutor 視角
  useEffect(() => {
    if (userRole === 'tutor' && activeTab === 'planner') {
      setActiveTab('tutor');
    }
  }, [userRole, activeTab]);

  // 手動觸發重整
  const handleDataChanged = () => {
    setPapers(getLocalPapers());
    setStudents(getLocalStudents());
  };

  // 從戰情室點擊學生直接切換至輔導老師前台
  const handleSelectStudentForTutor = (studentId: string) => {
    setActiveTab('tutor');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* 頂部導覽列 (支援角色切換與主教排程台隱藏) */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userRole={userRole}
        setUserRole={setUserRole}
        studentCount={students.length}
        paperCount={papers.length}
      />

      {/* 主工作區 (依 Tab 切換視角) */}
      <main className="flex-1 pb-16">
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[50vh] text-slate-400 text-sm">
            載入系統中...
          </div>
        ) : (
          <>
            {/* 1. 輔導老師前台 (年級名單分頁過濾、查卷、發卷、拍照登分、名單抽屜與個別計時) */}
            {activeTab === 'tutor' && (
              <TutorView
                students={students}
                papers={papers}
                onDataChanged={handleDataChanged}
                onPreviewPaper={(p) => setPreviewingPaper(p)}
                onViewSubmission={(stu, sub, it) => setViewingSubmission({ student: stu, subject: sub, item: it })}
                activeTimers={timers}
                onStartStudentTimer={startStudentTimer}
                onPauseTimer={pauseTimer}
                onResumeTimer={resumeTimer}
                onAddMinutes={addMinutes}
                onRemoveTimer={removeTimer}
                onOpenTimerModal={() => setIsTimerModalOpen(true)}
              />
            )}

            {/* 2. 主教老師排程台 (僅管理員解鎖後可見) */}
            {activeTab === 'planner' && userRole === 'admin' && (
              <PlannerView
                students={students}
                papers={papers}
                onDataChanged={handleDataChanged}
                onPreviewPaper={(p) => setPreviewingPaper(p)}
              />
            )}

            {/* 3. 考卷資料庫 (虛擬標籤篩選、資料夾/批次匯入、縮圖、圖卡/列表切換) */}
            {activeTab === 'library' && (
              <LibraryView
                papers={papers}
                onDataChanged={handleDataChanged}
                onPreviewPaper={(p) => setPreviewingPaper(p)}
              />
            )}

            {/* 4. 全班戰情室 (各科完成度、考卷卡關與平均成績) */}
            {activeTab === 'overview' && (
              <OverviewView
                students={students}
                papers={papers}
                onSelectStudentForTutor={handleSelectStudentForTutor}
              />
            )}
          </>
        )}
      </main>

      {/* 考卷大圖與考點預覽 Modal */}
      <PaperPreviewModal
        paper={previewingPaper}
        onClose={() => setPreviewingPaper(null)}
      />

      {/* 學生歷史作答與照片檢視 Modal (含未來 AI 接口) */}
      <SubmissionDetailModal
        data={viewingSubmission}
        onClose={() => setViewingSubmission(null)}
      />

      {/* ⏱️ 補習班全班統一與個別學生考試計時中控 Modal */}
      <ClassroomTimerModal
        isOpen={isTimerModalOpen}
        onClose={() => setIsTimerModalOpen(false)}
        timers={timers}
        onStartClassroomTimer={startClassroomTimer}
        onStartStudentTimer={startStudentTimer}
        onPauseTimer={pauseTimer}
        onResumeTimer={resumeTimer}
        onAddMinutes={addMinutes}
        onRemoveTimer={removeTimer}
        students={students}
      />

      {/* 🔔 考試時間屆滿警報提示彈窗 (附帶和弦音效提醒) */}
      <TimerAlertModal
        alertItem={expiredAlert}
        onClose={() => setExpiredAlert(null)}
        onGoToGrade={(studentId) => {
          setActiveTab('tutor');
        }}
        onAddMinutes={(id, mins) => addMinutes(id, mins)}
      />

      {/* ⏱️ 全域右下角浮動計時指示器 (點擊直接喚起計時中控) */}
      <TimerFloatingBar
        timers={timers}
        onOpenModal={() => setIsTimerModalOpen(true)}
      />

      {/* 底部行動端快捷提示列與極低調管理入口 */}
      <footer className="py-4 border-t border-slate-900 bg-slate-950/80 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>考卷導航中控台 • 補習班考前加強個別化進度系統 (MVP) • 支援手機拍照與多端即時同步</span>
          <div className="flex items-center gap-2">
            {userRole === 'admin' ? (
              <button
                onClick={() => {
                  setUserRole('tutor');
                  localStorage.removeItem('exam_pilot_user_role');
                  setActiveTab('tutor');
                }}
                className="text-indigo-400 hover:text-indigo-300 transition-colors"
                title="點擊切回一般老師視角"
              >
                已啟用排程管理 (點擊關閉)
              </button>
            ) : (
              <button
                onClick={() => {
                  const pwd = window.prompt('請輸入管理通行碼：');
                  if (pwd === '8888') {
                    setUserRole('admin');
                    localStorage.setItem('exam_pilot_user_role', 'admin');
                    setActiveTab('planner');
                  } else if (pwd !== null) {
                    alert('通行碼錯誤');
                  }
                }}
                className="text-slate-800 hover:text-slate-500 transition-colors select-none"
                title="系統管理"
              >
                管理
              </button>
            )}
          </div>
        </div>
      </footer>

    </div>
  );
};

export default App;
