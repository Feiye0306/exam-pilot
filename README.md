# 🚀 考卷導航中控台 (ExamPilot) - 個別化考前加強路徑系統 (MVP)

> **專為補習班考前加強期設計之「因材施教・考卷關卡導航與輔導協同雲端工作台」**

---

## 🎯 核心痛點與設計哲學

在補習班考前加強期，不同程度的學生（A 救底型、B 突破型、C 頂尖型）面對同一份考卷有完全不同的攻克次序：
- **基礎學生 (A)**：先寫入門診斷卷打底，穩健累積信心。
- **中等學生 (B)**：先做標準實戰卷；若考得不理想，退回入門卷補破網，及格則直攻魔王卷。
- **頂尖學生 (C)**：完全跳過基礎題，直上難題與魔王卷。

傳統紙本或人工安排極易混亂，輔導老師現場難以即時掌握「**這個學生現在到底該寫哪張考卷？**」。

本系統提供三大核心價值：
1. **主教老師排程中控 (Planner View)**：
   - 一鍵為每位學生拉出「多科目學習軌道」（如：數學軌道、英文軌道、物理軌道）。
   - 像排歌單一樣彈性拖曳調整關卡順序，可隨時插入救底卷或跳級挑戰。
2. **現場輔導老師工作台 (Tutor View - 手機優先最佳化)**：
   - 學生到場，老師點選學生即可一眼看清：**「目前應發：[數學] 第 2 關 - 多項式進階卷」**。
   - 點擊「**查看縮圖**」直接至試卷櫃拿卷發放。
   - 學生寫完改好後：點擊「**拍照登分**」，手機鏡頭直接拍照存證、輸入成績、一鍵打勾解鎖下一關！
3. **雲端多人即時協作 & 未來 AI 接口 (Future-Ready)**：
   - 採用 **Firebase Firestore** 即時同步，多位老師手機與主教電腦秒級聯動。
   - 資料結構已完整封裝 `{ 原始試卷ID, 學生手寫拍照照片, 成績, 考點關鍵字 }`，後續可無縫接上 Gemini API 進行錯題診斷。

---

## ☁️ 100% 永久免費雲端部署指南 (Zero-Cost Deployment)

本系統完全符合 **Serverless 無伺服器架構**，您不需要在本機開伺服器，直接透過全球免費雲端託管：

### 1. 前端託管 (Vercel 或 Cloudflare Pages) - 永久免費
1. 將本專案推送到您的 GitHub 倉庫。
2. 登入 [Vercel](https://vercel.com/)，點擊「Add New Project」並匯入此倉庫。
3. 根目錄選擇：`exam-pilot`。
4. 在「Environment Variables」填入 `.env` 內的 Firebase 設定變數：
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
   - `VITE_FIREBASE_MEASUREMENT_ID`
5. 點擊「Deploy」，1 分鐘內即可獲得如 `https://your-exam-pilot.vercel.app` 的專屬網址，直接傳給所有輔導老師使用！

---

## 💻 本地開發與預覽

```bash
# 安裝依賴
npm install

# 啟動本地開發伺服器 (Port: 5175)
npm run dev

# 正式生產打包測試
npm run build
```

---

## 📁 專案架構一覽

```
exam-pilot/
├── src/
│   ├── components/
│   │   ├── Navbar.tsx                # 頂部導覽與視角切換器
│   │   ├── TutorView.tsx             # 📱 輔導老師前台 (發卷、縮圖、拍照登分)
│   │   ├── PlannerView.tsx           # 🎯 主教老師排程 (學生管理、各科排卷)
│   │   ├── LibraryView.tsx           # 📁 考卷資料庫 (單元、難度、考點標籤)
│   │   ├── OverviewView.tsx          # 📊 班級通關戰情室
│   │   ├── PaperPreviewModal.tsx     # 考卷縮圖與考點預覽彈窗
│   │   └── SubmissionDetailModal.tsx # 學生作答照片與成績明細 (含 AI 接口)
│   ├── mock/
│   │   └── initialData.ts            # 初期種子資料 (含真實程度 A/B/C 學生)
│   ├── services/
│   │   ├── firebase.ts               # Firebase 安全初始化與降級容錯
│   │   └── storageService.ts         # Firestore 雲端即時監聽與 LocalStorage 雙軌
│   ├── types/
│   │   └── index.ts                  # 資料型別定義
│   ├── App.tsx                       # 應用主程式
│   ├── index.css                     # Tailwind 現代深色美學樣式
│   └── main.tsx                      # 進入點
├── .env.example                      # 環境變數範本 (已加入 .gitignore 防護)
├── package.json                      # 依賴配置 (React 19 + Vite 7 + Lucide)
├── tailwind.config.js                # Tailwind 配置
└── vite.config.ts                    # Vite 打包配置
```
