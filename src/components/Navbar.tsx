import React, { useState } from 'react';
import { ActiveTab, UserRole } from '../types';
import { 
  GraduationCap, 
  Smartphone, 
  Kanban, 
  FolderKanban, 
  BarChart3, 
  HardDrive,
  LogOut
} from 'lucide-react';
import { isFirebaseConfigured } from '../services/firebase';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  studentCount: number;
  paperCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  userRole,
  setUserRole,
  studentCount,
  paperCount,
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
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & 系統名稱 (乾淨純粹，絕無白痴模式標籤) */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/25 shrink-0">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
                考卷導航中控
              </span>
              <p className="text-xs text-slate-400 hidden sm:block">個別化考前加強・學習路徑導航系統</p>
            </div>
          </div>

          {/* 視角切換器 (Tab 切換) */}
          <nav className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700/60 shadow-inner">
            {/* 1. 輔導老師前台 (全員可見) */}
            <button
              onClick={() => setActiveTab('tutor')}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 ${
                activeTab === 'tutor'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Smartphone className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>輔導老師前台</span>
            </button>

            {/* 2. 排程中控台 (僅主教透過專屬網址或管理授權解鎖後顯示，輔導老師平時完全看不到) */}
            {userRole === 'admin' && (
              <button
                onClick={() => setActiveTab('planner')}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 ${
                  activeTab === 'planner'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <Kanban className="w-4 h-4 text-amber-400 shrink-0" />
                <span>排程中控台</span>
              </button>
            )}

            {/* 3. 考卷庫 (全員可見) */}
            <button
              onClick={() => setActiveTab('library')}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 ${
                activeTab === 'library'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <FolderKanban className="w-4 h-4 text-cyan-400 shrink-0" />
              <span className="hidden sm:inline">考卷庫</span>
              <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-slate-700 text-slate-300">
                {paperCount}
              </span>
            </button>

            {/* 4. 戰情總覽 (全員可見) */}
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 ${
                activeTab === 'overview'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-purple-400 shrink-0" />
              <span className="hidden md:inline">戰情總覽</span>
            </button>
          </nav>

          {/* 右側：僅保留低調的雲端狀態或管理員退出圖示 */}
          <div className="flex items-center gap-2">
            {/* 若已登入管理員，只放一個極簡的退出按鈕 */}
            {userRole === 'admin' && (
              <button
                onClick={handleExitAdmin}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                title="退出排程權限"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}

            {/* 雲端連線指標 */}
            <div className="hidden lg:flex items-center gap-2 text-xs">
              {isFirebaseConfigured ? (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>雲端同步</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  <HardDrive className="w-3.5 h-3.5" />
                  <span>本地模式</span>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </header>
  );
};
