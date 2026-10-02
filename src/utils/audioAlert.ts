// Web Audio API 音效提醒工具 (無須載入外部音頻檔案，100% 跨平台穩定發聲)

export const playTimerBeep = () => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    
    // 播放三次清脆和弦提示鈴 (叮 - 咚 - 叮)
    const playChime = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
      
      gain.gain.setValueAtTime(0.3, ctx.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + duration);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + duration);
    };

    // 和弦頻率: D5, A5, D6
    playChime(587.33, 0, 0.3);
    playChime(880.00, 0.22, 0.35);
    playChime(1174.66, 0.45, 0.65);
    // 第二聲加強提示
    playChime(880.00, 0.9, 0.25);
    playChime(1174.66, 1.1, 0.7);

  } catch (err) {
    console.warn('無法播放計時提醒音效:', err);
  }
};

// 請求瀏覽器桌面通知權限
export const requestNotificationPermission = async () => {
  if ('Notification' in window && Notification.permission === 'default') {
    try {
      await Notification.requestPermission();
    } catch {
      // 忽略權限拒絕
    }
  }
};

// 發送系統桌面推播通知
export const showDesktopNotification = (title: string, body: string) => {
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        icon: 'https://api.iconify.design/lucide:clock.svg',
      });
    } catch {
      // 忽略推播失敗
    }
  }
};
