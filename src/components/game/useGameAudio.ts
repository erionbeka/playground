import { useCallback } from "react";
import { getSensorySnapshot } from "@/lib/sensory";

type ToneOptions = {
  duration?: number;
  volume?: number;
  type?: OscillatorType;
  frequency?: number;
};

function clampVolume(volume: number) {
  return Math.min(0.12, Math.max(0.01, volume));
}

let sharedContext: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;

  if (!sharedContext) {
    const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return null;
    try {
      sharedContext = new AudioContextClass();
    } catch {
      return null;
    }
  }

  if (sharedContext.state === "suspended") {
    void sharedContext.resume();
  }

  return sharedContext;
}

export function useGameAudio() {
  const playTone = useCallback(
    ({ duration = 0.12, volume = 0.05, type = "sine", frequency = 440 }: ToneOptions) => {
      const sensory = getSensorySnapshot();
      if (!sensory.soundOn) return;

      const context = getContext();
      if (!context || context.state === "closed") return;

      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const now = context.currentTime;
      const safeVolume = clampVolume(sensory.calmMode ? volume * 0.5 : volume);

      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, now);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(safeVolume, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      oscillator.connect(gain);
      gain.connect(context.destination);

      oscillator.start(now);
      oscillator.stop(now + duration + 0.02);
    },
    []
  );

  const playTapSound = useCallback(() => {
    playTone({ frequency: 520, duration: 0.08, volume: 0.045, type: "triangle" });
  }, [playTone]);

  const playStartSound = useCallback(() => {
    playTone({ frequency: 392, duration: 0.14, volume: 0.04, type: "sine" });
    window.setTimeout(() => playTone({ frequency: 523.25, duration: 0.18, volume: 0.05, type: "triangle" }), 90);
  }, [playTone]);

  const playCelebrationSound = useCallback(() => {
    [523.25, 659.25, 783.99].forEach((frequency, index) => {
      window.setTimeout(() => {
        playTone({ frequency, duration: 0.22, volume: 0.055, type: "triangle" });
      }, index * 100);
    });
  }, [playTone]);

  const playHitSound = useCallback(
    (combo = 0) => {
      const step = Math.min(combo, 8);
      playTone({ frequency: 520 * Math.pow(1.06, step), duration: 0.1, volume: 0.05, type: "triangle" });
    },
    [playTone]
  );

  const playMissSound = useCallback(() => {
    playTone({ frequency: 196, duration: 0.16, volume: 0.03, type: "sine" });
  }, [playTone]);

  const playPopSound = useCallback(() => {
    playTone({ frequency: 740, duration: 0.06, volume: 0.05, type: "square" });
  }, [playTone]);

  const playFanfare = useCallback(() => {
    [523.25, 659.25, 783.99, 1046.5].forEach((frequency, index) => {
      window.setTimeout(() => {
        playTone({ frequency, duration: 0.18, volume: 0.055, type: "triangle" });
      }, index * 90);
    });
  }, [playTone]);

  return {
    warmUpAudio: getContext,
    playTone,
    playTapSound,
    playStartSound,
    playCelebrationSound,
    playHitSound,
    playMissSound,
    playPopSound,
    playFanfare,
  };
}
