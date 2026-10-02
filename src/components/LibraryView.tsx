import React, { useState, useMemo, useRef } from 'react';
import { ExamPaper, DifficultyLevel } from '../types';
import { 
  FolderKanban, 
  Plus, 
  Search, 
  Clock, 
  FileText, 
  Flame, 
  Tag, 
  Sparkles, 
  Upload, 
  ExternalLink,
  Layers,
  X,
  FolderUp,
  Files,
  Edit3,
  Check,
  LayoutGrid,
  List,
  Users
} from 'lucide-react';
import { savePaper, compressImage } from '../services/storageService';

interface LibraryViewProps {
  papers: ExamPaper[];
  onDataChanged: () => void;
  onPreviewPaper: (paper: ExamPaper) => void;
  onOpenBatchAssign?: (paper: ExamPaper) => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  papers,
  onDataChanged,
  onPreviewPaper,
  onOpenBatchAssign,
}) => {
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // 考卷庫檢視模式 (圖卡 grid 或 列表 list)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    return (localStorage.getItem('exam_pilot_paper_view_mode') as 'grid' | 'list') || 'grid';
  });

  const handleToggleViewMode = (mode: 'grid' | 'list') => {
    setViewMode(mode);
    localStorage.setItem('exam_pilot_paper_view_mode', mode);
  };

  // 單張新增考卷 Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [titleInput, setTitleInput] = useState('');
  const [subjectInput, setSubjectInput] = useState('數學');
  const [unitInput, setUnitInput] = useState('');
  const [difficultyInput, setDifficultyInput] = useState<DifficultyLevel>('medium');
  const [targetMinutesInput, setTargetMinutesInput] = useState(25);
  const [keyPointsInput, setKeyPointsInput] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [thumbnailUrlInput, setThumbnailUrlInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // 📂 批次讀取狀態 (指定資料夾 / 批量拖拉檔案)
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);

  // 預設後台標籤庫 (方便直接點擊貼上，免反覆手打)
  const DEFAULT_TAG_POOL = [
    '高一段考', '高二進階', '學測衝刺', '分科突破', '國一段考', '國二進階', '會考複習',
    '入門救底', '標準實戰', '進階挑戰', '魔王衝刺', '考前必備', '搶分題組', '段考必考',
    '多項式運算', '餘式定理', '直線運動', '牛頓力學', '核心7000單', '克漏字專攻', '文意選填', '易粗心題', '公式速查'
  ];

  const [tagPool, setTagPool] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('exam_pilot_tag_pool');
      return saved ? JSON.parse(saved) : DEFAULT_TAG_POOL;
    } catch {
      return DEFAULT_TAG_POOL;
    }
  });
  const [newTagInput, setNewTagInput] = useState('');

  // 點擊卡片上「+」號開啟的考卷貼籤 Modal
  const [tagPickerPaper, setTagPickerPaper] = useState<ExamPaper | null>(null);

  // 一鍵貼上／撕下標籤 (Toggle)
  const handleToggleTagOnPaper = async (tag: string) => {
    if (!tagPickerPaper) return;
    const currentTags = tagPickerPaper.tags || [];
    const hasTag = currentTags.includes(tag);
    const updatedTags = hasTag
      ? currentTags.filter(t => t !== tag)
      : [...currentTags, tag];

    const updatedPaper: ExamPaper = {
      ...tagPickerPaper,
      tags: updatedTags
    };

    setTagPickerPaper(updatedPaper);
    await savePaper(updatedPaper);
    onDataChanged();
  };

  // 新增自訂標籤至後台標籤庫
  const handleAddNewTagToPool = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newTagInput.trim();
    if (!trimmed) return;
    if (!tagPool.includes(trimmed)) {
      const updated = [...tagPool, trimmed];
      setTagPool(updated);
      localStorage.setItem('exam_pilot_tag_pool', JSON.stringify(updated));
    }
    // 同時貼到當前考卷
    if (tagPickerPaper) {
      handleToggleTagOnPaper(trimmed);
    }
    setNewTagInput('');
  };

  const folderInputRef = useRef<HTMLInputElement>(null);
  const multiFileInputRef = useRef<HTMLInputElement>(null);

  // 取得現有所有科目清單
  const subjectsList = ['all', ...Array.from(new Set(papers.map(p => p.subject)))];

  // 彙整考卷庫中所有出現過的標籤清單
  const allTags = useMemo(() => {
    const tagCountMap: Record<string, number> = {};
    papers.forEach(p => {
      (p.tags || []).forEach(t => {
        const trimmed = t.trim();
        if (trimmed) {
          tagCountMap[trimmed] = (tagCountMap[trimmed] || 0) + 1;
        }
      });
    });
    return Object.entries(tagCountMap)
      .sort((a, b) => b[1] - a[1]) // 按出現頻率降冪
      .map(([tag, count]) => ({ tag, count }));
  }, [papers]);

  // 篩選考卷 (支援 科目 + 難易度 + 關鍵字 + 點擊標籤)
  const filteredPapers = papers.filter(p => {
    const matchSub = selectedSubject === 'all' || p.subject === selectedSubject;
    const matchDiff = selectedDifficulty === 'all' || p.difficulty === selectedDifficulty;
    
    // 標籤篩選
    const matchTag = !selectedTag || (p.tags && p.tags.includes(selectedTag));

    // 關鍵字搜尋 (考卷名稱、單元、考點、標籤)
    const q = searchQuery.toLowerCase().trim();
    const matchQuery = !q || 
      p.title.toLowerCase().includes(q) ||
      p.unit.toLowerCase().includes(q) ||
      (p.keyPoints || []).some(k => k.toLowerCase().includes(q)) ||
      (p.tags || []).some(t => t.toLowerCase().includes(q));

    return matchSub && matchDiff && matchTag && matchQuery;
  });

  const getDifficultyBadge = (difficulty: DifficultyLevel) => {
    switch (difficulty) {
      case 'easy':
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">入門救底</span>;
      case 'medium':
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-sky-500/20 text-sky-300 border border-sky-500/30">標準實戰</span>;
      case 'hard':
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">進階挑戰</span>;
      case 'boss':
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1"><Flame className="w-3 h-3" /> 魔王衝刺</span>;
    }
  };

  // 智慧檔名解析輔助函式
  const parseFilename = (fileName: string) => {
    const clean = fileName.replace(/\.[^/.]+$/, ''); // 去除副檔名
    
    // 預設科目
    let detectedSubject = '數學';
    if (/英文|English/i.test(clean)) detectedSubject = '英文';
    else if (/物理|Physics/i.test(clean)) detectedSubject = '物理';
    else if (/化學|Chemistry/i.test(clean)) detectedSubject = '化學';
    else if (/生物/i.test(clean)) detectedSubject = '生物';
    else if (/國文/i.test(clean)) detectedSubject = '國文';

    // 預設難度
    let detectedDiff: DifficultyLevel = 'medium';
    if (/基礎|入門|救底|easy/i.test(clean)) detectedDiff = 'easy';
    else if (/難|進階|挑戰|hard/i.test(clean)) detectedDiff = 'hard';
    else if (/魔王|衝刺|頂標|boss/i.test(clean)) detectedDiff = 'boss';

    // 自動抓取初始標籤
    const autoTags: string[] = [];
    if (/高一/.test(clean)) autoTags.push('高一段考');
    if (/高二/.test(clean)) autoTags.push('高二進階');
    if (/高三|學測/.test(clean)) autoTags.push('學測衝刺');
    if (/國一/.test(clean)) autoTags.push('國一段考');
    if (/國三|會考/.test(clean)) autoTags.push('會考複習');
    if (/救底/.test(clean)) autoTags.push('救底卷');

    return {
      title: clean,
      subject: detectedSubject,
      unit: '批次匯入單元',
      difficulty: detectedDiff,
      tags: autoTags
    };
  };

  // 處理批次選擇檔案或直接讀取整個資料夾 (即讀即用，免多餘確認流程)
  const handleBatchFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsBatchProcessing(true);
    // 依序處理選中的檔案 (支援圖片格式)
    const validFiles = Array.from(files).filter(f => /\.(jpe?g|png|webp|gif|bmp)$/i.test(f.name));

    if (validFiles.length === 0) {
      alert('所選資料夾中未發現圖片格式考卷 (支援 JPG, PNG, WEBP)！');
      setIsBatchProcessing(false);
      return;
    }

    try {
      let loadedCount = 0;
      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i];
        try {
          const thumb = await compressImage(file, 800, 0.75);
          const parsed = parseFilename(file.name);
          const newPaper: ExamPaper = {
            id: `paper-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
            title: parsed.title,
            subject: parsed.subject,
            unit: parsed.unit,
            difficulty: parsed.difficulty,
            targetMinutes: 25,
            keyPoints: [],
            tags: parsed.tags,
            thumbnailUrl: thumb,
            createdAt: Date.now() + i
          };
          await savePaper(newPaper);
          loadedCount++;
        } catch (e) {
          console.warn('圖片讀取跳過:', file.name);
        }
      }

      onDataChanged();
      alert(`🎉 已成功直接讀取資料夾中的 ${loadedCount} 份考卷，已全數載入完成，立即可派發使用！`);
    } catch (err) {
      console.error('讀取資料夾失敗:', err);
      alert('讀取失敗，請再試一次');
    } finally {
      setIsBatchProcessing(false);
    }
  };

  // 單張封面縮圖處理
  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const compressed = await compressImage(file, 800, 0.75);
      setThumbnailUrlInput(compressed);
    } catch (err) {
      alert('封面圖片處理失敗');
    } finally {
      setIsUploading(false);
    }
  };

  // 提交單張新增考卷
  const handleSavePaper = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleInput.trim()) return;

    const points = keyPointsInput
      .split(/[,，、\n]+/)
      .map(k => k.trim())
      .filter(Boolean);

    const tags = tagsInput
      .split(/[,，、\n #]+/)
      .map(t => t.trim())
      .filter(Boolean);

    const newPaper: ExamPaper = {
      id: `paper-${Date.now()}`,
      title: titleInput.trim(),
      subject: subjectInput.trim(),
      unit: unitInput.trim() || '通用單元衝刺',
      difficulty: difficultyInput,
      targetMinutes: Number(targetMinutesInput) || 25,
      keyPoints: points,
      tags: tags,
      thumbnailUrl: thumbnailUrlInput || 'https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=600&auto=format&fit=crop&q=80',
      createdAt: Date.now(),
    };

    setIsUploading(true);
    try {
      await savePaper(newPaper);
      setIsAddModalOpen(false);
      // 清空表單
      setTitleInput('');
      setUnitInput('');
      setKeyPointsInput('');
      setTagsInput('');
      setThumbnailUrlInput('');
      onDataChanged();
    } catch (e) {
      alert('儲存考卷失敗');
    } finally {
      setIsUploading(false);
    }
  };



  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* 頂部標題與按鈕群組 (單張上傳 + 📁 指定資料夾批次匯入) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-cyan-400" />
            <span>補習班考卷庫 (試卷夾與虛擬標籤管理)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            支援指定整包資料夾批次匯入、檔名自動解析、自訂虛擬標籤與點擊標籤即時篩選。
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* 按鈕 1: 隱藏的資料夾上傳 input */}
          <input
            type="file"
            ref={folderInputRef}
            // @ts-ignore
            webkitdirectory="true"
            directory="true"
            multiple
            onChange={(e) => handleBatchFiles(e.target.files)}
            className="hidden"
          />

          {/* 按鈕 2: 隱藏的多檔案上傳 input */}
          <input
            type="file"
            ref={multiFileInputRef}
            multiple
            accept="image/*"
            onChange={(e) => handleBatchFiles(e.target.files)}
            className="hidden"
          />

          {/* 📂 直接讀取本機資料夾按鈕 (點擊直選，即讀即用) */}
          <button
            onClick={() => folderInputRef.current?.click()}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white border border-cyan-400/40 text-xs font-bold shadow-md shadow-cyan-900/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            title="直接點選電腦或隨身碟裡的考卷資料夾，系統立刻全部讀入列出"
          >
            <FolderUp className="w-4 h-4 text-cyan-200" />
            <span>📁 讀取本機考卷資料夾</span>
          </button>

          {/* 📂 多選圖片按鈕 */}
          <button
            onClick={() => multiFileInputRef.current?.click()}
            className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-white border border-slate-700 text-xs font-bold transition-all active:scale-[0.98]"
            title="多選圖片檔案直接讀取"
          >
            <Files className="w-4 h-4 text-cyan-400" />
            <span>多選圖片直接讀入</span>
          </button>

          {/* ＋ 單張上傳考卷按鈕 */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>＋ 單張新增</span>
          </button>
        </div>
      </div>

      {/* 🏷️ 虛擬標籤雲 (點擊標籤即時篩選考卷) */}
      <div className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700/60 shadow-xl space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
            <Tag className="w-3.5 h-3.5 text-cyan-400" />
            <span>虛擬標籤快速篩選（點擊直接過濾）：</span>
          </div>

          {selectedTag && (
            <button
              onClick={() => setSelectedTag(null)}
              className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 font-semibold"
            >
              <X className="w-3.5 h-3.5" />
              <span>清除標籤過濾 [{selectedTag}]</span>
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {allTags.map(({ tag, count }) => {
            const isSelected = selectedTag === tag;
            return (
              <button
                key={tag}
                onClick={() => setSelectedTag(isSelected ? null : tag)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/30 ring-2 ring-cyan-300'
                    : 'bg-slate-900/80 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/70'
                }`}
              >
                <span>#{tag}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-cyan-700 text-white' : 'bg-slate-800 text-slate-400'}`}>
                  {count}
                </span>
              </button>
            );
          })}

          {allTags.length === 0 && (
            <span className="text-xs text-slate-500">目前尚無標籤，上傳考卷時可隨意虛擬打上標籤！</span>
          )}
        </div>
      </div>

      {/* 篩選與搜尋列 (含帶有 X 刪除按鈕的搜尋框) */}
      <div className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700/60 shadow-xl flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        
        {/* 科目切換 Tab */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {subjectsList.map((sub) => {
            const isActive = sub === selectedSubject;
            return (
              <button
                key={sub}
                onClick={() => setSelectedSubject(sub)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-cyan-600 text-white shadow-md'
                    : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                {sub === 'all' ? '全部科目' : sub}
              </button>
            );
          })}
        </div>

        {/* 搜尋與難度篩選 */}
        <div className="flex items-center gap-2">
          {/* 🔥 帶有 X 刪除鍵的搜尋框 */}
          <div className="relative flex-1 md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="搜尋考卷、標籤、單元、考點..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500 transition-colors"
            />
            {/* ✕ 一鍵清空按鈕 */}
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                title="清空搜尋"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
          >
            <option value="all">所有難度</option>
            <option value="easy">入門救底</option>
            <option value="medium">標準實戰</option>
            <option value="hard">進階挑戰</option>
            <option value="boss">魔王衝刺</option>
          </select>

          {/* 模式切換：圖卡 ⊞ / 列表 ☰ */}
          <div className="flex items-center bg-slate-900 border border-slate-700 rounded-xl p-1 shrink-0">
            <button
              onClick={() => handleToggleViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'grid'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="圖卡排列"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleToggleViewMode('list')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'list'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="列表排列"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      {/* 考卷卡片清單 (支援圖卡 grid 與 列表 list 兩種模式) */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPapers.map((paper) => (
            <div
              key={paper.id}
              className="group bg-slate-800/80 rounded-2xl border border-slate-700/70 overflow-hidden shadow-lg hover:shadow-cyan-900/20 hover:border-cyan-500/50 transition-all flex flex-col justify-between"
            >
              <div>
                {/* 封面縮圖 */}
                <div 
                  onClick={() => onPreviewPaper(paper)}
                  className="relative aspect-video w-full bg-slate-900 overflow-hidden cursor-pointer"
                >
                  <img
                    src={paper.thumbnailUrl}
                    alt={paper.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80"></div>
                  
                  <div className="absolute top-2.5 left-2.5">
                    {getDifficultyBadge(paper.difficulty)}
                  </div>

                  <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-xs text-slate-200">
                    <span className="font-bold px-2 py-0.5 rounded bg-slate-900/80 backdrop-blur-sm border border-slate-700">
                      {paper.subject}
                    </span>
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900/80 backdrop-blur-sm border border-slate-700 text-slate-300">
                      <Clock className="w-3 h-3 text-cyan-400" />
                      {paper.targetMinutes} 分鐘
                    </span>
                  </div>
                </div>

                {/* 考卷資訊 */}
                <div className="p-4 space-y-3">
                  <div>
                    <h3 
                      onClick={() => onPreviewPaper(paper)}
                      className="font-bold text-sm text-white hover:text-cyan-300 cursor-pointer line-clamp-2 leading-snug"
                    >
                      {paper.title}
                    </h3>
                    <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                      <Layers className="w-3 h-3 text-slate-500 shrink-0" />
                      <span className="truncate">單元：{paper.unit}</span>
                    </div>
                  </div>

                  {/* 🏷️ 虛擬標籤展示與點擊篩選 */}
                  <div className="space-y-1.5">
                    <div className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
                      <Tag className="w-3 h-3 text-cyan-400" />
                      <span>虛擬標籤：</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1">
                      {(paper.tags || []).map((t, idx) => (
                        <button
                          key={idx}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTag(selectedTag === t ? null : t);
                          }}
                          className={`text-[10px] px-2 py-0.5 rounded transition-all ${
                            selectedTag === t
                              ? 'bg-cyan-500 text-slate-950 font-bold'
                              : 'bg-slate-900/90 text-cyan-300 border border-cyan-500/30 hover:border-cyan-400'
                          }`}
                        >
                          #{t}
                        </button>
                      ))}
                      
                      {/* 直接在虛擬標籤後面放置一個 + 按鈕 */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setTagPickerPaper(paper);
                        }}
                        className="px-2 py-0.5 rounded bg-slate-900/90 hover:bg-cyan-600 text-cyan-400 hover:text-white border border-cyan-500/40 text-xs font-bold transition-all flex items-center gap-0.5"
                        title="點擊挑選或貼上標籤"
                      >
                        <Plus className="w-3 h-3" />
                        <span>貼籤</span>
                      </button>
                    </div>
                  </div>

                  {/* 關鍵考點 tags (供未來 AI 分析預留) */}
                  {paper.keyPoints && paper.keyPoints.length > 0 && (
                    <div className="space-y-1 pt-1 border-t border-slate-700/50">
                      <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        <span>核心考點（AI 預留）:</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {paper.keyPoints.map((kp, idx) => (
                          <span key={idx} className="text-[10px] px-1.5 py-0.2 rounded bg-slate-900/60 text-slate-300 border border-slate-700/40">
                            {kp}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 底部查看與批次派發按鈕 */}
              <div className="p-3.5 pt-2 border-t border-slate-700/60 flex items-center justify-between gap-2">
                {onOpenBatchAssign ? (
                  <button
                    type="button"
                    onClick={() => onOpenBatchAssign(paper)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/90 hover:bg-indigo-500 text-white text-xs font-bold shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
                    title="一鍵將此考卷指派加入多位學生的進度軌道"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>👥 派給多位學生</span>
                  </button>
                ) : (
                  <span className="text-[11px] text-slate-500">ID: {paper.id.substring(0, 10)}</span>
                )}

                <button
                  type="button"
                  onClick={() => onPreviewPaper(paper)}
                  className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 font-bold transition-colors"
                >
                  <span>查看大圖</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* ☰ 列表模式 (緊湊橫條排列) */
        <div className="space-y-3">
          {filteredPapers.map((paper) => (
            <div
              key={paper.id}
              className="group bg-slate-800/80 rounded-2xl border border-slate-700/70 p-3 sm:p-4 shadow-md hover:border-cyan-500/50 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3.5"
            >
              <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
                {/* 左側縮圖 */}
                <div
                  onClick={() => onPreviewPaper(paper)}
                  className="w-20 h-16 sm:w-24 sm:h-18 rounded-xl bg-slate-900 overflow-hidden cursor-pointer shrink-0 border border-slate-700 relative group-hover:border-cyan-400 transition-colors"
                >
                  <img
                    src={paper.thumbnailUrl}
                    alt={paper.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-black/20" />
                </div>

                {/* 考卷核心資訊 */}
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-xs px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {paper.subject}
                    </span>
                    {getDifficultyBadge(paper.difficulty)}
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-cyan-400" />
                      {paper.targetMinutes} 分鐘
                    </span>
                    <span className="text-xs text-slate-500 hidden lg:inline">
                      單元：{paper.unit}
                    </span>
                  </div>

                  <h3
                    onClick={() => onPreviewPaper(paper)}
                    className="font-bold text-sm sm:text-base text-white hover:text-cyan-300 cursor-pointer truncate"
                  >
                    {paper.title}
                  </h3>

                  {/* 標籤列 */}
                  <div className="flex flex-wrap items-center gap-1">
                    {(paper.tags || []).map((t, idx) => (
                      <button
                        key={idx}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTag(selectedTag === t ? null : t);
                        }}
                        className={`text-[10px] px-2 py-0.5 rounded transition-all ${
                          selectedTag === t
                            ? 'bg-cyan-500 text-slate-950 font-bold'
                            : 'bg-slate-900 text-cyan-300 border border-cyan-500/30 hover:border-cyan-400'
                        }`}
                      >
                        #{t}
                      </button>
                    ))}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setTagPickerPaper(paper);
                      }}
                      className="px-2 py-0.5 rounded bg-slate-900 hover:bg-cyan-600 text-cyan-400 hover:text-white border border-cyan-500/40 text-[10px] font-bold transition-all flex items-center gap-0.5"
                      title="貼上或修改標籤"
                    >
                      <Plus className="w-3 h-3" />
                      <span>貼籤</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 右側操作按鈕 */}
              <div className="flex items-center justify-end gap-2 shrink-0 border-t md:border-t-0 pt-2 md:pt-0 border-slate-700/60">
                {onOpenBatchAssign && (
                  <button
                    type="button"
                    onClick={() => onOpenBatchAssign(paper)}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600/90 hover:bg-indigo-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>👥 派給多位學生</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => onPreviewPaper(paper)}
                  className="px-3 py-1.5 rounded-xl bg-slate-700/60 hover:bg-cyan-600 text-cyan-300 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>查看大圖</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredPapers.length === 0 && (
        <div className="text-center py-16 text-slate-400 space-y-2">
          <p>找不到符合條件的考卷！</p>
          <p className="text-xs text-slate-500">
            可嘗試點擊「清空搜尋」或點選上方「📁 指定資料夾／批次匯入」直接載入大量考卷！
          </p>
        </div>
      )}



      {/* 🏷️ 標籤貼紙庫 Modal (點擊直接貼上／撕下，免反覆打字) */}
      {tagPickerPaper && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">
                  標籤貼紙庫（點擊直接貼上／移除）
                </h3>
              </div>
              <button
                onClick={() => setTagPickerPaper(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs">
              <span className="text-slate-400">目前考卷：</span>
              <span className="text-white font-semibold ml-1">{tagPickerPaper.title}</span>
            </div>

            {/* 目前已貼上的標籤 */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-slate-300">
                目前已貼標籤 (點擊可移除)：
              </span>
              <div className="flex flex-wrap gap-1.5 min-h-[32px] p-2 rounded-xl bg-slate-950/60 border border-slate-800">
                {(tagPickerPaper.tags || []).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => handleToggleTagOnPaper(t)}
                    className="px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-rose-600 text-white text-xs font-bold transition-colors flex items-center gap-1 group"
                    title="點擊移除此標籤"
                  >
                    <span>#{t}</span>
                    <span className="group-hover:inline hidden text-[10px]">✕</span>
                    <span className="group-hover:hidden inline text-[10px]">✓</span>
                  </button>
                ))}
                {(!tagPickerPaper.tags || tagPickerPaper.tags.length === 0) && (
                  <span className="text-xs text-slate-500 py-0.5">尚未貼上任何標籤，請在下方點擊挑選！</span>
                )}
              </div>
            </div>

            {/* 🎯 後台預設標籤庫 (點擊直接貼上) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-300">後台標籤庫（點一下直接貼上）：</span>
                <span className="text-slate-400 text-[11px]">共 {tagPool.length} 個標籤</span>
              </div>

              <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto p-1 pr-2">
                {tagPool.map((tag) => {
                  const isAttached = (tagPickerPaper.tags || []).includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleToggleTagOnPaper(tag)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
                        isAttached
                          ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/30 ring-1 ring-cyan-300'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                      }`}
                    >
                      <span>{isAttached ? '✓' : '+'}</span>
                      <span>#{tag}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ➕ 擴充自訂新標籤至後台庫 */}
            <form onSubmit={handleAddNewTagToPool} className="pt-2 border-t border-slate-800 space-y-1.5">
              <span className="text-[11px] font-bold text-slate-400">建立新標籤至後台庫：</span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="輸入新標籤名稱，例如：第二次段考衝刺..."
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                />
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold shrink-0"
                >
                  ＋ 加入並貼上
                </button>
              </div>
            </form>

            <div className="flex items-center justify-end pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setTagPickerPaper(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-white text-xs font-bold transition-colors"
              >
                完成
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 單張新增考卷 Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Upload className="w-5 h-5 text-cyan-400" />
              <span>單張上傳／新增考卷至試卷庫</span>
            </h3>

            <form onSubmit={handleSavePaper} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  考卷名稱 <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="例如：【基礎救底】高一數學-多項式除法原理診斷卷"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">科目</label>
                  <input
                    type="text"
                    required
                    placeholder="如：數學、英文、物理"
                    value={subjectInput}
                    onChange={(e) => setSubjectInput(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">單元範圍</label>
                  <input
                    type="text"
                    placeholder="例如：第一冊 1-2 多項式"
                    value={unitInput}
                    onChange={(e) => setUnitInput(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">預設難易度</label>
                  <select
                    value={difficultyInput}
                    onChange={(e) => setDifficultyInput(e.target.value as DifficultyLevel)}
                    className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none"
                  >
                    <option value="easy">入門救底 (超簡單)</option>
                    <option value="medium">標準實戰 (中等)</option>
                    <option value="hard">進階挑戰 (高難度)</option>
                    <option value="boss">魔王衝刺 (頂尖)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">建議作答時間 (分鐘)</label>
                  <input
                    type="number"
                    min="5"
                    max="120"
                    value={targetMinutesInput}
                    onChange={(e) => setTargetMinutesInput(Number(e.target.value))}
                    className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* 虛擬標籤輸入 */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  虛擬標籤 (以逗號或空格隔開，方便日後點擊篩選)
                </label>
                <input
                  type="text"
                  placeholder="例如：高一段考, 救底卷, 多項式, 必考"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
                />
              </div>

              {/* 關鍵考點 tags */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  關鍵考點標籤 (以逗號隔開，提供後續 AI 精準對比)
                </label>
                <textarea
                  rows={2}
                  placeholder="例如：長除法原理, 餘式定理, 一次因式檢驗法"
                  value={keyPointsInput}
                  onChange={(e) => setKeyPointsInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none resize-none"
                />
              </div>

              {/* 封面縮圖上傳 */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  考卷封面縮圖
                </label>
                <div className="flex items-center gap-3">
                  <label className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-xs font-bold text-cyan-400 cursor-pointer flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" />
                    <span>上傳圖片檔案</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleThumbnailUpload}
                      className="hidden"
                    />
                  </label>
                  {thumbnailUrlInput && (
                    <span className="text-xs text-emerald-400">✓ 已準備好圖片</span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-md shadow-cyan-900/30"
                >
                  確認儲存考卷
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
