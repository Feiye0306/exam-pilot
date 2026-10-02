export type DifficultyLevel = 'easy' | 'medium' | 'hard' | 'boss';

export interface ExamPaper {
  id: string;
  title: string;
  subject: string;
  unit: string;
  difficulty: DifficultyLevel;
  targetMinutes: number;
  thumbnailUrl: string;
  pdfUrl?: string | null;
  keyPoints: string[];
  tags: string[]; // 虛擬標籤，便於多維度搜尋與點擊過濾
  createdAt: number;
  totalQuestions?: number;
}

export type ItemStatus = 'pending' | 'in_progress' | 'completed' | 'skipped';

export interface TrackItem {
  itemId: string;
  paperId: string;
  paperTitle: string;
  subject: string;
  difficulty: DifficultyLevel;
  targetMinutes: number;
  status: ItemStatus;
  score: number | null;
  maxScore: number;
  assignedAt: number;
  completedAt: number | null;
  tutorName: string | null;
  tutorNotes: string | null;
  submissionPhotoUrls: string[];
  aiAnalysis?: {
    analyzedAt: number;
    weakPoints: string[];
    summary: string;
  } | null;
}

export interface StudentSubjectTrack {
  subject: string;
  updatedAt: number;
  items: TrackItem[];
}

export interface Student {
  id: string;
  name: string;
  grade: string;
  school?: string;
  phone?: string;
  tags?: string[];
  assignedTutors?: string[]; // 負責的輔導老師姓名或代號
  tracks: Record<string, StudentSubjectTrack>;
  createdAt: number;
  updatedAt: number;
}

export type ActiveTab = 'tutor' | 'roadmap' | 'planner' | 'library' | 'overview';

export type UserRole = 'tutor' | 'admin';

// ⏱️ 補習班考試計時器項目 (支援全班統一計時與個別學生計時)
export interface ExamTimerItem {
  id: string; // 唯一 ID (例如 studentId 或 'classroom-global')
  type: 'classroom' | 'student'; // 全班統一 或 個別學生
  studentId?: string;
  studentName: string;
  grade?: string;
  paperTitle?: string;
  subject?: string;
  totalSeconds: number; // 總設定秒數 (例如 30 * 60)
  remainingSeconds: number; // 剩餘秒數
  isRunning: boolean; // 是否計時中
  startedAt: number; // 開始時間戳記
  endAt: number; // 預計結束時間戳記
  isExpired: boolean; // 是否已倒數完畢
  notified: boolean; // 是否已發出聲響與通知
}
