import confetti from 'canvas-confetti';

type CelebrationOptions = { title?: string; message?: string; notify?: boolean; intensity?: 'small' | 'normal' };

const playChime = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const context = new AudioContextClass();
    const gain = context.createGain();
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.055, context.currentTime + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.42);
    gain.connect(context.destination);
    [659.25, 783.99].forEach((frequency, index) => {
      const oscillator = context.createOscillator(); oscillator.type = 'sine'; oscillator.frequency.value = frequency;
      oscillator.connect(gain); oscillator.start(context.currentTime + index * 0.08); oscillator.stop(context.currentTime + 0.45);
    });
    window.setTimeout(() => void context.close(), 650);
  } catch {}
};

export const notifyUser = (title: string, body: string) => {
  try { if ('Notification' in window && Notification.permission === 'granted') new Notification(title, { body, icon: '/icon.svg', tag: `puzzle-${title}` }); } catch {}
};

export const celebrateAchievement = ({ title = 'آفرین!', message = 'یک قدم دیگر جلو رفتی.', notify = false, intensity = 'normal' }: CelebrationOptions = {}) => {
  playChime();
  try { confetti({ particleCount: intensity === 'small' ? 32 : 70, spread: intensity === 'small' ? 48 : 72, startVelocity: intensity === 'small' ? 20 : 28, scalar: intensity === 'small' ? 0.72 : 0.9, gravity: 0.85, ticks: 150, origin: { y: 0.72 }, colors: ['#6366f1','#10b981','#f59e0b','#ec4899'] }); } catch {}
  if (notify) notifyUser(title, message);
};
