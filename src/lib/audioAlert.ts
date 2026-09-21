// Web Audio API chime synthesizer for incoming order alerts
// Uses native browser audio synthesis to guarantee zero network latency and 100% offline PWA support

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

// User interaction listener to unlock audio autoplay restrictions in modern browsers
if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    window.removeEventListener('click', unlockAudio);
    window.removeEventListener('touchstart', unlockAudio);
  };
  window.addEventListener('click', unlockAudio, { once: true });
  window.addEventListener('touchstart', unlockAudio, { once: true });
}

export function isAudioAlertEnabled(): boolean {
  try {
    const pref = localStorage.getItem('worker_sound_alert_enabled');
    return pref === null ? true : pref === 'true';
  } catch {
    return true;
  }
}

export function setAudioAlertEnabled(enabled: boolean) {
  try {
    localStorage.setItem('worker_sound_alert_enabled', String(enabled));
  } catch {}
}

/**
 * Plays an audible high-priority restaurant kitchen chime:
 * Distinct dual-chime pattern (D5 -> A5 -> pause -> D5 -> A5)
 */
export function playOrderAlertChime() {
  if (!isAudioAlertEnabled()) return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    const playTone = (freq: number, startTime: number, duration: number, gainValue = 0.35) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.exponentialRampToValueAtTime(gainValue, startTime + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    // First Ding-Dong (D5 -> A5)
    playTone(587.33, now, 0.45);
    playTone(880.0, now + 0.22, 0.6);

    // Second Ding-Dong for kitchen urgency
    playTone(587.33, now + 0.85, 0.45);
    playTone(880.0, now + 1.07, 0.75);

    // Haptic pulse on supported mobile devices
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([200, 100, 200, 100, 300]);
    }
  } catch (err) {
    console.warn('[Audio Alert] Could not play alert chime:', err);
  }
}
