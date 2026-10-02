import { useState, useEffect, useCallback } from 'react';
import { ExamTimerItem } from '../types';
import { playTimerBeep, showDesktopNotification, requestNotificationPermission } from '../utils/audioAlert';

const STORAGE_KEY = 'exam_pilot_active_timers';

export const useExamTimers = () => {
  const [timers, setTimers] = useState<ExamTimerItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return [];
      const parsed: ExamTimerItem[] = JSON.parse(saved);
      // 重建恢復剩餘秒數
      const now = Date.now();
      return parsed.map((t) => {
        if (t.isRunning) {
          const rem = Math.max(0, Math.round((t.endAt - now) / 1000));
          return {
            ...t,
            remainingSeconds: rem,
            isExpired: rem <= 0,
          };
        }
        return t;
      });
    } catch {
      return [];
    }
  });

  // 最新時間到提醒彈窗對象
  const [expiredAlert, setExpiredAlert] = useState<ExamTimerItem | null>(null);

  // 持久化儲存
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(timers));
  }, [timers]);

  // 心跳倒數計時器 (每秒執行)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      let hasChange = false;

      setTimers((prev) => {
        return prev.map((t) => {
          if (!t.isRunning) return t;

          const rem = Math.max(0, Math.round((t.endAt - now) / 1000));
          const isNowExpired = rem <= 0;

          // 時間剛到且尚未通知過
          if (isNowExpired && !t.notified) {
            hasChange = true;
            // 播放清脆和弦音
            playTimerBeep();

            const alertTitle = t.type === 'classroom'
              ? '⏰ 全班考試時間到！'
              : `⏰ 【${t.studentName}】考卷時間到！`;
            const alertBody = t.type === 'classroom'
              ? `全班統一計時已結束，請輔導老師提醒收卷！`
              : `${t.paperTitle ? `《${t.paperTitle}》` : ''} 建議作答時間已屆滿，請拍照登分！`;

            showDesktopNotification(alertTitle, alertBody);
            setExpiredAlert({ ...t, remainingSeconds: 0, isExpired: true, notified: true });

            return {
              ...t,
              remainingSeconds: 0,
              isRunning: false,
              isExpired: true,
              notified: true,
            };
          }

          if (rem !== t.remainingSeconds) {
            hasChange = true;
            return {
              ...t,
              remainingSeconds: rem,
              isExpired: isNowExpired,
            };
          }

          return t;
        });
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // 1. 啟動或重設全班統一計時器
  const startClassroomTimer = useCallback((minutes: number, customTitle?: string) => {
    requestNotificationPermission();
    const totalSec = minutes * 60;
    const now = Date.now();
    const newTimer: ExamTimerItem = {
      id: 'classroom-global',
      type: 'classroom',
      studentName: customTitle || '全班統一考試',
      paperTitle: '全場同步計時',
      totalSeconds: totalSec,
      remainingSeconds: totalSec,
      isRunning: true,
      startedAt: now,
      endAt: now + totalSec * 1000,
      isExpired: false,
      notified: false,
    };

    setTimers((prev) => {
      const filtered = prev.filter((t) => t.id !== 'classroom-global');
      return [newTimer, ...filtered];
    });
  }, []);

  // 2. 啟動或重設個別學生計時器 (例如王小華寫數學卷 30 分鐘)
  const startStudentTimer = useCallback((
    studentId: string,
    studentName: string,
    grade: string,
    paperTitle: string,
    subject: string,
    minutes: number
  ) => {
    requestNotificationPermission();
    const totalSec = minutes * 60;
    const now = Date.now();
    const timerId = `student-${studentId}`;

    const newTimer: ExamTimerItem = {
      id: timerId,
      type: 'student',
      studentId,
      studentName,
      grade,
      paperTitle,
      subject,
      totalSeconds: totalSec,
      remainingSeconds: totalSec,
      isRunning: true,
      startedAt: now,
      endAt: now + totalSec * 1000,
      isExpired: false,
      notified: false,
    };

    setTimers((prev) => {
      const filtered = prev.filter((t) => t.id !== timerId);
      return [newTimer, ...filtered];
    });
  }, []);

  // 3. 暫停計時
  const pauseTimer = useCallback((id: string) => {
    setTimers((prev) =>
      prev.map((t) => {
        if (t.id === id && t.isRunning) {
          return {
            ...t,
            isRunning: false,
          };
        }
        return t;
      })
    );
  }, []);

  // 4. 恢復計時
  const resumeTimer = useCallback((id: string) => {
    setTimers((prev) =>
      prev.map((t) => {
        if (t.id === id && !t.isRunning && t.remainingSeconds > 0) {
          const now = Date.now();
          return {
            ...t,
            isRunning: true,
            endAt: now + t.remainingSeconds * 1000,
          };
        }
        return t;
      })
    );
  }, []);

  // 5. 延長分鐘數 (如加 5 分鐘、加 10 分鐘)
  const addMinutes = useCallback((id: string, minutes: number) => {
    setTimers((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const addSec = minutes * 60;
          const newRemaining = t.remainingSeconds + addSec;
          const newTotal = t.totalSeconds + addSec;
          const now = Date.now();
          return {
            ...t,
            totalSeconds: newTotal,
            remainingSeconds: newRemaining,
            endAt: t.isRunning ? now + newRemaining * 1000 : t.endAt + addSec * 1000,
            isExpired: false,
            notified: false,
          };
        }
        return t;
      })
    );
  }, []);

  // 6. 結束/移除計時器
  const removeTimer = useCallback((id: string) => {
    setTimers((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // 7. 取得某位學生的個別計時狀態
  const getTimerByStudentId = useCallback((studentId: string) => {
    return timers.find((t) => t.studentId === studentId);
  }, [timers]);

  return {
    timers,
    expiredAlert,
    setExpiredAlert,
    startClassroomTimer,
    startStudentTimer,
    pauseTimer,
    resumeTimer,
    addMinutes,
    removeTimer,
    getTimerByStudentId,
  };
};
