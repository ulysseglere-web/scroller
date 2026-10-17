// Ambient Audio Engine & Soundscape Synthesizer
// Provides offline procedural soundscapes (Lofi, Rain, Vinyl, Celestial) and custom MP3/Audio file playback.

export interface AudioPreset {
  id: string;
  name: string;
  category: 'lofi' | 'ambient' | 'nature' | 'vintage';
  description: string;
}

export const AMBIENT_PRESETS: AudioPreset[] = [
  { id: 'preset:lofi', name: 'Lofi Sunset', category: 'lofi', description: 'Accords feutrés et crépitement apaisant' },
  { id: 'preset:rain', name: 'Pluie & Piano nocturne', category: 'nature', description: 'Averse douce et résonance mélancolique' },
  { id: 'preset:vinyl', name: 'Vinyle Vintage', category: 'vintage', description: 'Grain chaud de platine analogique' },
  { id: 'preset:celestial', name: 'Ondes Célestes', category: 'ambient', description: 'Nappes lentes méditatives et spatiales' },
  { id: 'preset:synth', name: 'Nostalgie Synthwave', category: 'lofi', description: 'Synthétiseur rétro 80s réverbéré' },
];

class AmbientAudioEngine {
  private ctx: AudioContext | null = null;
  private currentSource: AudioNode | null = null;
  private activeIntervals: number[] = [];
  private audioElement: HTMLAudioElement | null = null;
  private gainNode: GainNode | null = null;
  private isMuted: boolean = false;
  private currentPlayingId: string | null = null;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public getCurrentTrackId(): string | null {
    return this.currentPlayingId;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.gainNode && this.ctx) {
      this.gainNode.gain.setValueAtTime(muted ? 0 : 0.4, this.ctx.currentTime);
    }
    if (this.audioElement) {
      this.audioElement.muted = muted;
    }
  }

  public stop() {
    // Clear procedural loops
    this.activeIntervals.forEach(clearInterval);
    this.activeIntervals = [];

    // Stop custom HTML audio
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.src = '';
      this.audioElement = null;
    }

    // Stop web audio nodes
    if (this.currentSource) {
      try {
        (this.currentSource as AudioScheduledSourceNode).stop?.();
      } catch {}
      this.currentSource = null;
    }

    this.currentPlayingId = null;
  }

  public pause() {
    if (this.audioElement) {
      this.audioElement.pause();
    }
    if (this.ctx && this.ctx.state === 'running') {
      this.ctx.suspend().catch(() => {});
    }
  }

  public resume() {
    if (this.audioElement && !this.isMuted) {
      this.audioElement.play().catch(() => {});
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public play(identifier: string, isMutedState: boolean = false) {
    this.stop();
    this.isMuted = isMutedState;
    this.currentPlayingId = identifier;

    // 1. If it's a custom uploaded audio file (URL or base64)
    if (identifier.startsWith('data:audio') || identifier.startsWith('http') || identifier.startsWith('blob:')) {
      this.audioElement = new Audio(identifier);
      this.audioElement.loop = true;
      this.audioElement.muted = isMutedState;
      this.audioElement.volume = 0.6;
      this.audioElement.play().catch(() => {
        // Autoplay policy fallback
      });
      return;
    }

    // 2. Procedural Web Audio preset
    this.initContext();
    if (!this.ctx) return;

    this.gainNode = this.ctx.createGain();
    this.gainNode.gain.setValueAtTime(isMutedState ? 0 : 0.35, this.ctx.currentTime);
    this.gainNode.connect(this.ctx.destination);

    switch (identifier) {
      case 'preset:rain':
        this.startRainSoundscape();
        break;
      case 'preset:vinyl':
        this.startVinylSoundscape();
        break;
      case 'preset:celestial':
        this.startCelestialSoundscape();
        break;
      case 'preset:synth':
        this.startSynthSoundscape();
        break;
      case 'preset:lofi':
      default:
        this.startLofiSoundscape();
        break;
    }
  }

  // --- PROCEDURAL SOUNDSCAPES ---

  private startVinylSoundscape() {
    if (!this.ctx || !this.gainNode) return;
    // Vinyl crackle: white noise with random crackle impulses
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      // Crackle pops + warm background hiss
      const isCrackle = Math.random() < 0.0006;
      data[i] = isCrackle ? (Math.random() * 2 - 1) * 0.7 : (Math.random() * 2 - 1) * 0.03;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, this.ctx.currentTime);

    noise.connect(filter);
    filter.connect(this.gainNode);
    noise.start();
    this.currentSource = noise;
  }

  private startRainSoundscape() {
    if (!this.ctx || !this.gainNode) return;
    // Filtered pink noise + occasional soft drops
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      data[i] = (b0 + b1 + b2) * 0.08;
    }

    const rain = this.ctx.createBufferSource();
    rain.buffer = buffer;
    rain.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, this.ctx.currentTime);

    rain.connect(filter);
    filter.connect(this.gainNode);
    rain.start();
    this.currentSource = rain;

    // Periodic soft piano note (ambient rain notes)
    const notes = [220, 261.63, 329.63, 392, 440, 523.25]; // Am7 pentatonic
    const interval = window.setInterval(() => {
      if (!this.ctx || !this.gainNode || this.isMuted) return;
      const freq = notes[Math.floor(Math.random() * notes.length)];
      const osc = this.ctx.createOscillator();
      const dropGain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      dropGain.gain.setValueAtTime(0, this.ctx.currentTime);
      dropGain.gain.linearRampToValueAtTime(0.08, this.ctx.currentTime + 0.05);
      dropGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 2.2);

      osc.connect(dropGain);
      dropGain.connect(this.gainNode);
      osc.start();
      osc.stop(this.ctx.currentTime + 2.3);
    }, 2800);

    this.activeIntervals.push(interval);
  }

  private startCelestialSoundscape() {
    if (!this.ctx || !this.gainNode) return;
    // Harmonic drone chords (D minor 9th meditative drone)
    const freqs = [146.83, 220.00, 261.63, 329.63, 440.00];

    freqs.forEach((freq, idx) => {
      if (!this.ctx || !this.gainNode) return;
      const osc = this.ctx.createOscillator();
      const droneGain = this.ctx.createGain();

      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      droneGain.gain.setValueAtTime(0.035, this.ctx.currentTime);

      // Subtle LFO detune
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.frequency.setValueAtTime(0.1 + idx * 0.05, this.ctx.currentTime);
      lfoGain.gain.setValueAtTime(2.5, this.ctx.currentTime);

      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      lfo.start();

      osc.connect(droneGain);
      droneGain.connect(this.gainNode);
      osc.start();
    });
  }

  private startLofiSoundscape() {
    if (!this.ctx || !this.gainNode) return;
    // Warm Rhodes style chords looping softly
    this.startVinylSoundscape(); // subtle vinyl bed

    const chords = [
      [261.63, 329.63, 392.00, 493.88], // Cmaj7
      [220.00, 261.63, 329.63, 392.00], // Am7
      [174.61, 220.00, 261.63, 329.63], // Fmaj7
      [196.00, 246.94, 293.66, 349.23], // G7
    ];
    let chordIdx = 0;

    const playChord = () => {
      if (!this.ctx || !this.gainNode || this.isMuted) return;
      const chord = chords[chordIdx];
      chordIdx = (chordIdx + 1) % chords.length;

      chord.forEach((freq) => {
        if (!this.ctx || !this.gainNode) return;
        const osc = this.ctx.createOscillator();
        const chordGain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        chordGain.gain.setValueAtTime(0, this.ctx.currentTime);
        chordGain.gain.linearRampToValueAtTime(0.06, this.ctx.currentTime + 0.15);
        chordGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 3.2);

        osc.connect(chordGain);
        chordGain.connect(this.gainNode);
        osc.start();
        osc.stop(this.ctx.currentTime + 3.3);
      });
    };

    playChord();
    const interval = window.setInterval(playChord, 3500);
    this.activeIntervals.push(interval);
  }

  private startSynthSoundscape() {
    if (!this.ctx || !this.gainNode) return;
    // 80s nostalgic arpeggio
    const arpNotes = [130.81, 164.81, 196.00, 246.94, 261.63, 329.63];
    let noteIdx = 0;

    const interval = window.setInterval(() => {
      if (!this.ctx || !this.gainNode || this.isMuted) return;
      const freq = arpNotes[noteIdx];
      noteIdx = (noteIdx + 1) % arpNotes.length;

      const osc = this.ctx.createOscillator();
      const noteGain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(900, this.ctx.currentTime);
      filter.Q.setValueAtTime(4, this.ctx.currentTime);

      noteGain.gain.setValueAtTime(0.04, this.ctx.currentTime);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.5);

      osc.connect(filter);
      filter.connect(noteGain);
      noteGain.connect(this.gainNode);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.55);
    }, 450);

    this.activeIntervals.push(interval);
  }
}

export const ambientAudio = new AmbientAudioEngine();
