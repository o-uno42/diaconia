import confetti from 'canvas-confetti';

/**
 * Fire a "yay, you did it!" feedback: confetti burst, a short synthesized
 * chime, and a light haptic buzz on mobile devices. Origin is optional and
 * lets the burst originate from a specific screen point (e.g. the button
 * the user just clicked) — pass `{ x, y }` in viewport ratio (0..1).
 */
export function celebrate(origin?: { x: number; y: number }): void {
  // Visual — two-stage confetti for a fuller effect
  const colors = ['#10b981', '#34d399', '#fbbf24', '#f59e0b', '#6366f1'];
  const baseOpts: confetti.Options = {
    particleCount: 80,
    spread: 70,
    startVelocity: 45,
    ticks: 200,
    colors,
    origin: origin ?? { x: 0.5, y: 0.7 },
    disableForReducedMotion: true,
  };
  confetti(baseOpts);
  // Second smaller burst, slightly delayed, for a "double pop" feel
  setTimeout(() => {
    confetti({
      ...baseOpts,
      particleCount: 40,
      spread: 110,
      startVelocity: 30,
      scalar: 0.8,
    });
  }, 120);

  // Sound — synthesized 2-note chime, no audio file needed
  playChime();

  // Haptic feedback on supported devices (mobile)
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    navigator.vibrate([35, 40, 35]);
  }
}

let audioCtx: AudioContext | null = null;

function playChime(): void {
  try {
    // Lazily create AudioContext on first user interaction (browser policies)
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    audioCtx ??= new Ctx();

    // Two ascending notes: C6 → E6 — a quick "ta-da"
    playNote(audioCtx, 1046.5, 0, 0.18);
    playNote(audioCtx, 1318.5, 0.1, 0.25);
  } catch {
    // Audio is optional — never throw on celebration
  }
}

function playNote(ctx: AudioContext, freq: number, startOffset: number, duration: number): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.value = freq;

  const start = ctx.currentTime + startOffset;
  // Quick attack, smooth decay — sounds like a soft chime
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(0.25, start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  osc.connect(gain).connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration);
}
