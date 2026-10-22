// Web Audio 音效。瀏覽器要求使用者互動後才能建立 AudioContext，所以由 init() 延遲建立。

export interface GameAudio {
  init(): void;
  laser(): void;
  explosion(): void;
  proton(): void;
  powerup(): void;
  close(): void;
}

type WindowWithWebkitAudio = Window & { webkitAudioContext?: typeof AudioContext };

export function createAudio(): GameAudio {
  let ctx: AudioContext | null = null;

  function tone(
    wave: OscillatorType,
    duration: number,
    volume: number,
    setFrequency: (frequency: AudioParam, start: number) => void,
  ) {
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = wave;
    setFrequency(osc.frequency, ctx.currentTime);
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  }

  return {
    init() {
      if (ctx) return;
      const AudioCtor = window.AudioContext || (window as WindowWithWebkitAudio).webkitAudioContext;
      if (AudioCtor) ctx = new AudioCtor();
    },

    laser() {
      tone('square', 0.1, 0.1, (f, t) => {
        f.setValueAtTime(880, t);
        f.exponentialRampToValueAtTime(440, t + 0.1);
      });
    },

    explosion() {
      if (!ctx) return;
      const bufferSize = ctx.sampleRate * 0.3;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
      }
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      const gain = ctx.createGain();
      source.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      source.start();
    },

    proton() {
      tone('sawtooth', 0.5, 0.15, (f, t) => {
        f.setValueAtTime(200, t);
        f.exponentialRampToValueAtTime(50, t + 0.5);
      });
    },

    powerup() {
      tone('sine', 0.3, 0.15, (f, t) => {
        f.setValueAtTime(523, t);
        f.setValueAtTime(659, t + 0.1);
        f.setValueAtTime(784, t + 0.2);
      });
    },

    close() {
      if (ctx) void ctx.close();
      ctx = null;
    },
  };
}
