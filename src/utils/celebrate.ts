import confetti from 'canvas-confetti';

export const celebrateAchievement = () => {
  try {
    confetti({ particleCount: 38, spread: 58, startVelocity: 24, origin: { y: 0.72 }, colors: ['#4f46e5','#f59e0b','#10b981','#ec4899'] });
    window.setTimeout(() => confetti({ particleCount: 26, spread: 74, startVelocity: 20, origin: { x: 0.72, y: 0.68 } }), 140);
  } catch {
    // Success state remains usable if canvas is unavailable.
  }
};
