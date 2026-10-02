import React from 'react';
import { ExamPaper } from '../types';
import { X, Clock, Layers, Sparkles, ExternalLink } from 'lucide-react';

interface PaperPreviewModalProps {
  paper: ExamPaper | null;
  onClose: () => void;
}

export const PaperPreviewModal: React.FC<PaperPreviewModalProps> = ({
  paper,
  onClose,
}) => {
  if (!paper) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        
        {/* 標題與關閉按鈕 */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
              {paper.subject} • 考卷縮圖預覽
            </span>
            <h3 className="text-base font-bold text-white leading-snug mt-0.5">
              {paper.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 縮圖大圖展示 */}
        <div className="rounded-2xl overflow-hidden border border-slate-800 bg-black aspect-video max-h-[380px] flex items-center justify-center">
          <img
            src={paper.thumbnailUrl}
            alt={paper.title}
            className="w-full h-full object-contain"
          />
        </div>

        {/* 屬性細節 */}
        <div className="grid grid-cols-2 gap-3 text-xs bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/60">
          <div>
            <span className="text-slate-400">單元範圍：</span>
            <span className="text-slate-200 font-semibold ml-1">{paper.unit}</span>
          </div>
          <div>
            <span className="text-slate-400">建議作答時間：</span>
            <span className="text-slate-200 font-semibold ml-1">{paper.targetMinutes} 分鐘</span>
          </div>
        </div>

        {/* 核心考點 (AI 診斷標籤) */}
        {paper.keyPoints && paper.keyPoints.length > 0 && (
          <div className="space-y-1.5">
            <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>本卷關鍵考點（後續 AI 錯題自動比對清單）：</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {paper.keyPoints.map((kp, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 text-xs font-medium text-cyan-300 border border-slate-700"
                >
                  ✓ {kp}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-end pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-white text-xs font-bold transition-colors"
          >
            關閉預覽
          </button>
        </div>

      </div>
    </div>
  );
};
