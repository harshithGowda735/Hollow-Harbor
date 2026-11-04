/**
 * Web Audio Interstellar & Coastal Harbor Ambient Synthesizer
 * 
 * Features:
 * 1. Hans Zimmer "Interstellar" Theme Synthesizer:
 *    - Authentic Church Pipe Organ sound (multi-rank additive harmonic synthesis with mechanical tremolo)
 *    - Deep Sub-Bass Pedal Foundation (36Hz - 55Hz) for physical chest-resonance
 *    - High Celestial Space Arpeggio (Day One / Cornfield Chase motif)
 *    - Multi-Tap Cathedral Reverb Network for awe-inspiring acoustic space
 * 2. Subtle Ocean Surf & Coastal Winds
 * 3. Responsive Web Audio sound effects (coins, anvil strike, prologue bells)
 * 
 * 100% synthesized in Web Audio API. Zero external audio file lag or CORS issues.
 */

class HarborAudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = true;
  
  // Ambient nodes
  private masterGain: GainNode | null = null;
  private surfGain: GainNode | null = null;
  private organGain: GainNode | null = null;
  private reverbNode: AudioNode | null = null;
  
  // Sequencer state
  private sequenceTimer: any = null;
  private currentStep: number = 0;
  private activeNotes: OscillatorNode[] = [];
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

  /**
   * Builds an expansive stereo cathedral acoustic space using multi-tap delays and lowpass damping
   */
  private createCathedralSpace(ctx: AudioContext, input: AudioNode, output: AudioNode) {
    const delayL = ctx.createDelay();
    const delayR = ctx.createDelay();
    delayL.delayTime.value = 0.38; // 380ms left reflections
    delayR.delayTime.value = 0.52; // 520ms right reflections

    const feedbackL = ctx.createGain();
    const feedbackR = ctx.createGain();
    feedbackL.gain.value = 0.45;
    feedbackR.gain.value = 0.42;

    const dampFilter = ctx.createBiquadFilter();
    dampFilter.type = 'lowpass';
    dampFilter.frequency.value = 1200; // Warm church stone absorption

    const wetGain = ctx.createGain();
    wetGain.gain.value = 0.40;

    // Cross-feedback stereo matrix
    input.connect(delayL);
    input.connect(delayR);

    delayL.connect(dampFilter);
    delayR.connect(dampFilter);

    dampFilter.connect(feedbackL);
    dampFilter.connect(feedbackR);

    feedbackL.connect(delayR);
    feedbackR.connect(delayL);

    dampFilter.connect(wetGain);
    wetGain.connect(output);
  }

  /**
   * Synthesize a Hans Zimmer Pipe Organ note with authentic flute/reed harmonic ranks
   */
  private playOrganPipe(
    freq: number, 
    duration: number, 
    startTime: number, 
    velocity: number = 0.3,
    isPedal: boolean = false
  ) {
    if (!this.ctx || !this.organGain) return;

    // Pipe Organ Ranks: Fundamental (8'), Octave (4'), Quint (2 2/3'), Superoctave (2')
    const ranks = isPedal 
      ? [
          { mult: 0.5, gain: 0.8, type: 'sine' as OscillatorType }, // 16' Sub-bass
          { mult: 1.0, gain: 0.4, type: 'triangle' as OscillatorType }, // 8' Bourdon
          { mult: 2.0, gain: 0.1, type: 'sine' as OscillatorType }
        ]
      : [
          { mult: 1.0, gain: 0.50, type: 'sine' as OscillatorType }, // 8' Principal
          { mult: 2.0, gain: 0.28, type: 'triangle' as OscillatorType }, // 4' Octave
          { mult: 3.0, gain: 0.12, type: 'sine' as OscillatorType }, // 2 2/3' Nazard
          { mult: 4.0, gain: 0.08, type: 'triangle' as OscillatorType } // 2' Superoctave
        ];

    const noteGain = this.ctx.createGain();
    
    // Slow cathedral organ pipe attack and warm natural release
    noteGain.gain.setValueAtTime(0.0001, startTime);
    noteGain.gain.exponentialRampToValueAtTime(velocity, startTime + (isPedal ? 0.6 : 0.35));
    noteGain.gain.setValueAtTime(velocity, startTime + duration - 0.2);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration + 1.2);

    // Warm Lowpass Filter for pipe tone
    const pipeFilter = this.ctx.createBiquadFilter();
    pipeFilter.type = 'lowpass';
    pipeFilter.frequency.setValueAtTime(isPedal ? 350 : 2200, startTime);
    pipeFilter.Q.setValueAtTime(1.2, startTime);

    // Gentle organ tremolo (wind chest pulsation)
    const tremolo = this.ctx.createOscillator();
    tremolo.frequency.setValueAtTime(5.2, startTime);
    const tremoloGain = this.ctx.createGain();
    tremoloGain.gain.setValueAtTime(isPedal ? 0.0 : velocity * 0.15, startTime);
    tremolo.connect(tremoloGain);
    tremoloGain.connect(noteGain.gain);

    ranks.forEach(rank => {
      const osc = this.ctx!.createOscillator();
      osc.type = rank.type;
      osc.frequency.setValueAtTime(freq * rank.mult, startTime);

      const rankGain = this.ctx!.createGain();
      rankGain.gain.setValueAtTime(rank.gain, startTime);

      osc.connect(rankGain);
      rankGain.connect(pipeFilter);

      osc.start(startTime);
      osc.stop(startTime + duration + 1.3);
      this.activeNotes.push(osc);
    });

    tremolo.start(startTime);
    tremolo.stop(startTime + duration + 1.3);

    pipeFilter.connect(noteGain);
    noteGain.connect(this.organGain);
  }

  /**
   * Starts the slow, awe-inspiring Interstellar chord and melody progression
   */
  private startInterstellarProgression() {
    if (!this.ctx) return;

    // Frequencies (Hz)
    const NOTES = {
      // Sub-bass pedals
      A1: 55.00,
      F1: 43.65,
      D1: 36.71,
      E1: 41.20,
      G1: 49.00,
      C2: 65.41,

      // Church Organ Chords
      D3: 146.83, E3: 164.81, F3: 174.61, A3: 220.00, C4: 261.63, E4: 329.63, F4: 349.23, G4: 392.00,

      // Zimmer Slow Interstellar Melody (Stay / First Step / Day One)
      A4: 440.00,
      B4: 493.88,
      C5: 523.25,
      D5: 587.33,
      E5: 659.25,
      F5: 698.46,
      G5: 783.99,
      A5: 880.00,
      B5: 987.77,
      C6: 1046.50
    };

    /**
     * The Iconic Interstellar 4-Measure Progression
     * Each measure is 6.4 seconds (slow, majestic 60 BPM pace)
     * Total cycle = 25.6s
     */
    const MEASURE_DUR = 6.4;
    const NOTE_DUR = 1.5;

    const playCycle = () => {
      if (!this.ctx || this.isMuted) return;
      const now = this.ctx.currentTime + 0.1;

      // ==========================================
      // MEASURE 1: A MINOR (Solitude / Deep Space)
      // ==========================================
      const m1 = now;
      // Sub pedal
      this.playOrganPipe(NOTES.A1, MEASURE_DUR, m1, 0.35, true);
      // Soft organ harmony pad
      this.playOrganPipe(NOTES.A3, MEASURE_DUR, m1, 0.10);
      this.playOrganPipe(NOTES.C4, MEASURE_DUR, m1, 0.08);
      this.playOrganPipe(NOTES.E4, MEASURE_DUR, m1, 0.08);
      // Hans Zimmer signature melody: E5 -> F5 -> E5 -> D5
      this.playOrganPipe(NOTES.E5, NOTE_DUR, m1 + 0.0, 0.28);
      this.playOrganPipe(NOTES.F5, NOTE_DUR, m1 + 1.6, 0.32);
      this.playOrganPipe(NOTES.E5, NOTE_DUR, m1 + 3.2, 0.28);
      this.playOrganPipe(NOTES.D5, NOTE_DUR, m1 + 4.8, 0.24);

      // Delicate celestial arpeggio (high organ chime)
      this.playOrganPipe(NOTES.A4, 0.7, m1 + 0.4, 0.07);
      this.playOrganPipe(NOTES.C5, 0.7, m1 + 2.0, 0.07);
      this.playOrganPipe(NOTES.E5, 0.7, m1 + 3.6, 0.07);
      this.playOrganPipe(NOTES.A5, 0.7, m1 + 5.2, 0.08);

      // ==========================================
      // MEASURE 2: F MAJOR (Longing / Horizon)
      // ==========================================
      const m2 = now + MEASURE_DUR;
      // Sub pedal
      this.playOrganPipe(NOTES.F1, MEASURE_DUR, m2, 0.38, true);
      // Organ harmony pad
      this.playOrganPipe(NOTES.F3, MEASURE_DUR, m2, 0.11);
      this.playOrganPipe(NOTES.A3, MEASURE_DUR, m2, 0.09);
      this.playOrganPipe(NOTES.C4, MEASURE_DUR, m2, 0.09);
      // Melody: C5 -> D5 -> E5 -> F5
      this.playOrganPipe(NOTES.C5, NOTE_DUR, m2 + 0.0, 0.25);
      this.playOrganPipe(NOTES.D5, NOTE_DUR, m2 + 1.6, 0.28);
      this.playOrganPipe(NOTES.E5, NOTE_DUR, m2 + 3.2, 0.32);
      this.playOrganPipe(NOTES.F5, NOTE_DUR, m2 + 4.8, 0.36);

      // Arpeggio
      this.playOrganPipe(NOTES.F4, 0.7, m2 + 0.4, 0.07);
      this.playOrganPipe(NOTES.A4, 0.7, m2 + 2.0, 0.07);
      this.playOrganPipe(NOTES.C5, 0.7, m2 + 3.6, 0.07);
      this.playOrganPipe(NOTES.F5, 0.7, m2 + 5.2, 0.09);

      // ==========================================
      // MEASURE 3: D MINOR (Gravity / Voyage)
      // ==========================================
      const m3 = now + MEASURE_DUR * 2;
      // Sub pedal
      this.playOrganPipe(NOTES.D1, MEASURE_DUR, m3, 0.36, true);
      // Organ harmony pad
      this.playOrganPipe(NOTES.D3, MEASURE_DUR, m3, 0.10);
      this.playOrganPipe(NOTES.F3, MEASURE_DUR, m3, 0.09);
      this.playOrganPipe(NOTES.A3, MEASURE_DUR, m3, 0.09);
      // Melody: D5 -> E5 -> F5 -> A5 (Soaring climax!)
      this.playOrganPipe(NOTES.D5, NOTE_DUR, m3 + 0.0, 0.26);
      this.playOrganPipe(NOTES.E5, NOTE_DUR, m3 + 1.6, 0.30);
      this.playOrganPipe(NOTES.F5, NOTE_DUR, m3 + 3.2, 0.35);
      this.playOrganPipe(NOTES.A5, NOTE_DUR, m3 + 4.8, 0.38);

      // ==========================================
      // MEASURE 4: E MAJOR / EM (Resolution & Eternity)
      // ==========================================
      const m4 = now + MEASURE_DUR * 3;
      // Sub pedal
      this.playOrganPipe(NOTES.E1, MEASURE_DUR, m4, 0.37, true);
      // Organ harmony pad
      this.playOrganPipe(NOTES.E3, MEASURE_DUR, m4, 0.10);
      this.playOrganPipe(NOTES.G4, MEASURE_DUR, m4, 0.09);
      this.playOrganPipe(NOTES.B4, MEASURE_DUR, m4, 0.08);
      // Melody: G5 -> F5 -> E5 -> D5
      this.playOrganPipe(NOTES.G5, NOTE_DUR, m4 + 0.0, 0.34);
      this.playOrganPipe(NOTES.F5, NOTE_DUR, m4 + 1.6, 0.30);
      this.playOrganPipe(NOTES.E5, NOTE_DUR, m4 + 3.2, 0.27);
      this.playOrganPipe(NOTES.D5, NOTE_DUR, m4 + 4.8, 0.22);
    };

    // Play first cycle immediately
    playCycle();

    // Loop cycle every 25.6 seconds seamlessly
    this.sequenceTimer = setInterval(() => {
      if (!this.isMuted) {
        playCycle();
      }
    }, MEASURE_DUR * 4 * 1000);
  }

  private start() {
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;

      // Master output gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.001, now);
      this.masterGain.gain.exponentialRampToValueAtTime(0.9, now + 2.0); // Gentle 2s cinematic swell
      this.masterGain.connect(this.ctx.destination);

      // =========================================================================
      // 1. CATHEDRAL ACOUSTIC REVERB BUS
      // =========================================================================
      const reverbInput = this.ctx.createGain();
      reverbInput.gain.value = 1.0;
      this.createCathedralSpace(this.ctx, reverbInput, this.masterGain);

      // Organ Gain Channel
      this.organGain = this.ctx.createGain();
      this.organGain.gain.value = 0.85;
      this.organGain.connect(this.masterGain);
      this.organGain.connect(reverbInput);

      // =========================================================================
      // 2. DYNAMIC OCEAN SURF (Subtle coastal backdrop behind Interstellar theme)
      // =========================================================================
      const bufferSize = this.ctx.sampleRate * 3;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        data[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = data[i];
        data[i] *= 2.2;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      const lowFilter = this.ctx.createBiquadFilter();
      lowFilter.type = 'lowpass';
      lowFilter.frequency.setValueAtTime(200, now);
      lowFilter.Q.setValueAtTime(2.0, now);

      const swellLfo = this.ctx.createOscillator();
      swellLfo.frequency.setValueAtTime(0.09, now);
      const swellGain = this.ctx.createGain();
      swellGain.gain.setValueAtTime(140, now);
      swellLfo.connect(swellGain);
      swellGain.connect(lowFilter.frequency);

      this.surfGain = this.ctx.createGain();
      this.surfGain.gain.setValueAtTime(0.045, now); // Gentle background surf

      noise.connect(lowFilter);
      lowFilter.connect(this.surfGain);
      this.surfGain.connect(this.masterGain);

      noise.start();
      swellLfo.start();

      // =========================================================================
      // 3. START HANS ZIMMER INTERSTELLAR PIPE ORGAN PROGRESSION
      // =========================================================================
      this.startInterstellarProgression();

      // =========================================================================
      // 4. PERIODIC DISTANT HARBOR BUOY BELL (Every 24 seconds)
      // =========================================================================
      this.bellTimer = setInterval(() => {
        if (!this.isMuted) {
          this.playHarborBell();
        }
      }, 24000);

    } catch (e) {
      console.warn('Audio start error:', e);
    }
  }

  private stop() {
    try {
      if (this.sequenceTimer) {
        clearInterval(this.sequenceTimer);
        this.sequenceTimer = null;
      }
      if (this.bellTimer) {
        clearInterval(this.bellTimer);
        this.bellTimer = null;
      }
      if (this.masterGain && this.ctx) {
        const now = this.ctx.currentTime;
        this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
        this.masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
        setTimeout(() => {
          if (this.ctx) {
            this.ctx.close();
            this.ctx = null;
          }
        }, 700);
      } else if (this.ctx) {
        this.ctx.close();
        this.ctx = null;
      }
      this.organGain = null;
      this.surfGain = null;
    } catch {}
  }

  /**
   * Resonant Harbor Fog Bell with metallic overtones
   */
  public playHarborBell() {
    if (this.isMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const freqs = [440.0, 523.25, 880.0];
      const gains = [0.04, 0.02, 0.01];

      freqs.forEach((freq, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(gains[i], now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.2);

        osc.connect(gain);
        gain.connect(this.masterGain || this.ctx!.destination);

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
        gain.connect(this.masterGain || this.ctx!.destination);

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
        gain.connect(this.masterGain || this.ctx!.destination);

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
      gain.connect(this.masterGain || this.ctx.destination);

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
