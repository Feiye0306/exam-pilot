import React from 'react';
import { ActiveTab, UserRole } from '../types';
import { 
  GraduationCap, 
  Smartphone, 
  GitBranch,
  Kanban, 
  FolderKanban, 
  BarChart3, 
  HardDrive,
  LogOut,
  Sun,
  Moon,
  Send
} from 'lucide-react';
import { isFirebaseConfigured } from '../services/firebase';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  studentCount: number;
  paperCount: number;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onOpenBatchAssign: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  userRole,
  setUserRole,
  studentCount,
  paperCount,
  theme,
  onToggleTheme,
  onOpenBatchAssign,
}) => {
  // 退出管理員模式
  const handleExitAdmin = () => {
    setUserRole('tutor');
    localStorage.removeItem('exam_pilot_user_role');
    if (activeTab === 'planner') {
      setActiveTab('tutor');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & 系統名稱 */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center shadow-md shadow-indigo-600/20 shrink-0">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="font-black text-lg tracking-tight text-slate-900 dark:text-white">
                ExamPilot 考卷導航
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
                補習班個別化考前加強・學習路徑導航中控
              </p>
            </div>
          </div>

          {/* 視角切換器 (Tab 切換) */}
          <nav className="flex items-center bg-slate-100 dark:bg-slate-800/90 p-1 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 shadow-inner">
            {/* 1. 輔導老師前台 (全員可見) */}
            <button
              onClick={() => setActiveTab('tutor')}
              className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 ${
                activeTab === 'tutor'
                  ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Smartphone className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>現場前台</span>
            </button>

            {/* 2. 🗺️ 全班路線看板 (核心！一眼看清所有人各自路線，再也不用一個個點) */}
            <button
              onClick={() => setActiveTab('roadmap')}
              className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 ${
                activeTab === 'roadmap'
                  ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <GitBranch className="w-4 h-4 text-indigo-500 shrink-0" />
              <span>路線看板</span>
              <span className="hidden md:inline text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-50 text-indigo-600 dark:bg-black/30 dark:text-indigo-300">
                {studentCount}人
              </span>
            </button>

            {/* 3. 考卷庫 (全員可見) */}
            <button
              onClick={() => setActiveTab('library')}
              className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 ${
                activeTab === 'library'
                  ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FolderKanban className="w-4 h-4 text-cyan-500 shrink-0" />
              <span>考卷庫</span>
              <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-slate-200/80 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                {paperCount}
              </span>
            </button>

            {/* 4. 排程中控台 (管理員解鎖後顯示) */}
            {userRole === 'admin' && (
              <button
                onClick={() => setActiveTab('planner')}
                className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 ${
                  activeTab === 'planner'
                    ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Kanban className="w-4 h-4 text-amber-500 shrink-0" />
                <span>排程中控</span>
              </button>
            )}

            {/* 5. 戰情總覽 */}
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 hidden lg:flex ${
                activeTab === 'overview'
                  ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-purple-500 shrink-0" />
              <span>戰情室</span>
            </button>
          </nav>

          {/* 右側：批次派卷快捷鍵、主題切換與狀態 */}
          <div className="flex items-center gap-2">
            {/* 快速批次派卷按鈕 */}
            <button
              onClick={onOpenBatchAssign}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 text-xs font-bold border border-indigo-200 dark:border-indigo-800 transition-all hover:scale-105 active:scale-95"
              title="多人批次派卷"
            >
              <Send className="w-3.5 h-3.5" />
              <span>批次派卷</span>
            </button>

            {/* ☀️ 清爽明亮 / 🌙 沉穩暗色 切換開關 */}
            <button
              onClick={onToggleTheme}
              className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={theme === 'light' ? '切換為深色模式' : '切換為清爽明亮模式'}
            >
              {theme === 'light' ? (
                <Moon className="w-4 h-4 text-indigo-600" />
              ) : (
                <Sun className="w-4 h-4 text-amber-400" />
              )}
            </button>

            {/* 若已登入管理員，放極簡退出按鈕 */}
            {userRole === 'admin' && (
              <button
                onClick={handleExitAdmin}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="退出排程權限"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}

            {/* 雲端連線指標 */}
            <div className="hidden xl:flex items-center gap-2 text-xs">
              {isFirebaseConfigured ? (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>雲端即時同步</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                  <HardDrive className="w-3.5 h-3.5" />
                  <span>本地暫存</span>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </header>
  );
};

