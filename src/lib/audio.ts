/**
 * Web Audio Coastal Harbor Ambient & Cinematic Synthesizer
 * Generates an immersive, multi-layered coastal soundscape:
 * - Dynamic breathing ocean surf (dual-LFO wave swells)
 * - Ethereal maritime harmonic pads (mystical D-minor / F-major coastal chords)
 * - Resonant harbor fog bells with metallic overtones
 * - Crisp interactive sound effects (coins, anvil strike, timber milling, story chimes)
 * 100% synthesized in Web Audio API with ZERO external asset dependencies.
 */

class HarborAudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = true;
  
  // Ambient nodes
  private surfGain: GainNode | null = null;
  private padGain: GainNode | null = null;
  private padOscs: OscillatorNode[] = [];
  private bellTimer: any = null;

  public toggle(): boolean {
    if (this.isMuted) {
      this.start();
      this.isMuted = false;
      return true;
    } else {
      this.stop();
      this.isMuted = true;
      return false;
    }
  }

  public enable(): void {
    if (this.isMuted) {
      this.start();
      this.isMuted = false;
    }
  }

  public getStatus(): boolean {
    return !this.isMuted;
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  private start() {
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;

      // =========================================================================
      // 1. DYNAMIC OCEAN SURF (Multi-stage filtered noise with dual-LFO breathing)
      // =========================================================================
      const bufferSize = this.ctx.sampleRate * 3;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        // Pink noise approximation for a warmer, deeper sea sound
        const white = Math.random() * 2 - 1;
        data[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = data[i];
        data[i] *= 3.5;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      // Dual filters for deep wave roll + spray
      const lowFilter = this.ctx.createBiquadFilter();
      lowFilter.type = 'lowpass';
      lowFilter.frequency.setValueAtTime(260, now);
      lowFilter.Q.setValueAtTime(2.5, now);

      // Slow deep swell LFO (~8 seconds per wave cycle)
      const swellLfo = this.ctx.createOscillator();
      swellLfo.frequency.setValueAtTime(0.12, now);
      const swellGain = this.ctx.createGain();
      swellGain.gain.setValueAtTime(180, now);
      swellLfo.connect(swellGain);
      swellGain.connect(lowFilter.frequency);

      // Surf gain control
      this.surfGain = this.ctx.createGain();
      this.surfGain.gain.setValueAtTime(0.09, now);

      noise.connect(lowFilter);
      lowFilter.connect(this.surfGain);
      this.surfGain.connect(this.ctx.destination);

      noise.start();
      swellLfo.start();

      // =========================================================================
      // 2. ETHEREAL MARITIME HARMONIC PADS (Warm cinematic coastal mystery)
      // D minor / F major ethereal open fifths: D3 (146.83Hz), A3 (220Hz), F4 (349.23Hz)
      // =========================================================================
      this.padGain = this.ctx.createGain();
      this.padGain.gain.setValueAtTime(0.04, now);

      const chordFreqs = [146.83, 220.00, 349.23, 440.00];
      this.padOscs = chordFreqs.map((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        // Gentle chorus detune
        const detuneLfo = this.ctx!.createOscillator();
        detuneLfo.frequency.setValueAtTime(0.08 + idx * 0.03, now);
        const detuneGain = this.ctx!.createGain();
        detuneGain.gain.setValueAtTime(6, now);
        detuneLfo.connect(detuneGain);
        detuneGain.connect(osc.detune);

        const filter = this.ctx!.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(600, now);

        osc.connect(filter);
        filter.connect(this.padGain!);

        osc.start();
        detuneLfo.start();
        return osc;
      });

      this.padGain.connect(this.ctx.destination);

      // =========================================================================
      // 3. PERIODIC DISTANT HARBOR BUOY BELL (Every 18 seconds)
      // =========================================================================
      this.bellTimer = setInterval(() => {
        if (!this.isMuted) {
          this.playHarborBell();
        }
      }, 18000);

      // Play an initial welcoming chime after 1.5s
      setTimeout(() => {
        if (!this.isMuted) this.playHarborBell();
      }, 1500);

    } catch (e) {
      console.warn('Audio start error:', e);
    }
  }

  private stop() {
    try {
      if (this.bellTimer) {
        clearInterval(this.bellTimer);
        this.bellTimer = null;
      }
      if (this.ctx) {
        this.ctx.close();
        this.ctx = null;
      }
      this.padOscs = [];
      this.surfGain = null;
      this.padGain = null;
    } catch {}
  }

  /**
   * Resonant Harbor Fog Bell with metallic overtones
   */
  public playHarborBell() {
    if (this.isMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      // Fundamental + Minor 3rd overtone + Octave for classic bell resonance
      const freqs = [440.0, 523.25, 880.0];
      const gains = [0.06, 0.03, 0.015];

      freqs.forEach((freq, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(gains[i], now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.2);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(now);
        osc.stop(now + 3.2);
      });
    } catch {}
  }

  /**
   * Story prologue advance chime (warm harp-like arpeggio)
   */
  public playStoryAdvance() {
    this.initContext();
    if (this.isMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const notes = [293.66, 369.99, 440.0, 587.33]; // D, F#, A, D
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        const startTime = now + idx * 0.07;
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.05, startTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 1.2);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(startTime);
        osc.stop(startTime + 1.2);
      });
    } catch {}
  }

  /**
   * Crisp double-coin clink for trade settlements and purse grants
   */
  public playCoinSound() {
    this.initContext();
    if (this.isMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      [1800, 2400].forEach((freq, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        const startTime = now + i * 0.08;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.07, startTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.35);
      });
    } catch {}
  }

  /**
   * Resonant anvil strike for smelting and forging
   */
  public playAnvilSound() {
    this.initContext();
    if (this.isMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1174.66, now); // D6
      osc.frequency.exponentialRampToValueAtTime(587.33, now + 0.15);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.7);
    } catch {}
  }

  /**
   * General pleasant notification chime
   */
  public playChime() {
    this.playStoryAdvance();
  }
}

export const harborAudio = new HarborAudioEngine();
