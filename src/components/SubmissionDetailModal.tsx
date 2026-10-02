import React from 'react';
import { Student, TrackItem } from '../types';
import { X, Camera, Award, Sparkles, User, Clock, FileText } from 'lucide-react';

interface SubmissionDetailModalProps {
  data: {
    student: Student;
    subject: string;
    item: TrackItem;
  } | null;
  onClose: () => void;
}

export const SubmissionDetailModal: React.FC<SubmissionDetailModalProps> = ({
  data,
  onClose,
}) => {
  if (!data) return null;
  const { student, subject, item } = data;

  const formattedDate = item.completedAt 
    ? new Date(item.completedAt).toLocaleString('zh-TW', {
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : '未知時間';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        
        {/* 標題與關閉按鈕 */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
              <span>{student.name} • {subject} 完賽明細</span>
            </div>
            <h3 className="text-base font-bold text-white mt-0.5">
              {item.paperTitle}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 成績與紀錄卡片 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-center">
            <span className="text-[11px] text-slate-400">實得分數</span>
            <div className="text-2xl font-black text-emerald-400 mt-0.5">
              {item.score} <span className="text-xs font-normal text-slate-400">/ 100</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-center">
            <span className="text-[11px] text-slate-400">輔導老師</span>
            <div className="text-sm font-bold text-white mt-1.5">
              {item.tutorName || '現場輔導老師'}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-center">
            <span className="text-[11px] text-slate-400">完成時間</span>
            <div className="text-xs font-semibold text-slate-300 mt-2">
              {formattedDate}
            </div>
          </div>
        </div>

        {/* 老師批改備註 */}
        {item.tutorNotes && (
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs">
            <span className="font-bold text-amber-300">老師批改筆記：</span>
            <p className="mt-1">{item.tutorNotes}</p>
          </div>
        )}

        {/* 學生手寫拍照考卷照片 (利於後續 AI 分析) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-emerald-400" />
              <span>現場拍照存證照片 ({item.submissionPhotoUrls?.length || 0} 張)</span>
            </span>
          </div>

          {item.submissionPhotoUrls && item.submissionPhotoUrls.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {item.submissionPhotoUrls.map((url, idx) => (
                <div
                  key={idx}
                  className="rounded-xl overflow-hidden border border-slate-800 bg-black aspect-video flex items-center justify-center group relative"
                >
                  <img src={url} alt={`作答第 ${idx + 1} 頁`} className="w-full h-full object-contain" />
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-opacity"
                  >
                    點擊開大圖檢視
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 rounded-xl bg-slate-800/40 border border-slate-800 text-center text-xs text-slate-500">
              本次登記未附帶拍照照片
            </div>
          )}
        </div>

        {/* 🤖 未來 AI 錯題分析接口預留區塊 */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-slate-900 border border-indigo-500/30 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-white">AI 錯題診斷預留接口 (Phase 2)</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Ready
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            系統已完整封裝本張原始試卷 ID 與手寫紅字照片。待接上 Gemini 2.5 Flash 後，即可一鍵提取錯題題型、知識盲點與推薦加強練習題！
          </p>
        </div>

        <div className="flex items-center justify-end pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-white text-xs font-bold transition-colors"
          >
            關閉
          </button>
        </div>

      </div>
    </div>
  );
};
