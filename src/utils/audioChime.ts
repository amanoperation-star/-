// Web Audio API synthesized alert chimes
export const playNotificationChime = (volume = 0.8, customUrl?: string) => {
  try {
    // 1. Web Audio API synthesis - guaranteed to work offline and without external assets
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtx) {
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      const now = ctx.currentTime;

      // Note 1: E5 (659.25 Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, now);
      osc1.frequency.exponentialRampToValueAtTime(880, now + 0.12); // Ramp to A5
      gain1.gain.setValueAtTime(0, now);
      gain1.gain.linearRampToValueAtTime(Math.min(volume * 0.4, 0.4), now + 0.04);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.6);

      // Note 2: C#6 (1108.73 Hz) - Crisp Bell Overtones
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(880, now + 0.1);
      osc2.frequency.exponentialRampToValueAtTime(1108.73, now + 0.25);
      gain2.gain.setValueAtTime(0, now + 0.1);
      gain2.gain.linearRampToValueAtTime(Math.min(volume * 0.3, 0.3), now + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.1);
      osc2.stop(now + 0.8);
    }

    // 2. Also attempt custom URL if configured
    if (customUrl) {
      const audio = new Audio(customUrl);
      audio.volume = Math.min(Math.max(volume, 0), 1);
      audio.play().catch(() => {});
    }
  } catch (err) {
    console.warn('[AudioChime] Play error:', err);
  }
};
