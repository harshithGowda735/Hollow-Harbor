/**
 * Web Audio Coastal Harbor Ambient Synthesizer
 * Generates cozy ocean wave noise and occasional harbor bell tones with zero external assets.
 */

class HarborAudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = true;
  private noiseNode: AudioNode | null = null;

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

  public getStatus(): boolean {
    return !this.isMuted;
  }

  private start() {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();

      // White noise buffer for ocean surf
      const bufferSize = this.ctx.sampleRate * 2;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      // Lowpass filter for ocean wave rumble
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(320, this.ctx.currentTime);

      // Low frequency oscillator for wave ebb and flow
      const lfo = this.ctx.createOscillator();
      lfo.frequency.setValueAtTime(0.12, this.ctx.currentTime); // ~8s wave cycle

      const lfoGain = this.ctx.createGain();
      lfoGain.gain.setValueAtTime(200, this.ctx.currentTime);

      lfo.connect(filter.frequency);

      // Volume gain
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.06, this.ctx.currentTime);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start();
      lfo.start();
      this.noiseNode = noise;
    } catch (e) {
      console.warn('Audio init error:', e);
    }
  }

  private stop() {
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
  }

  public playChime() {
    if (this.isMuted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, this.ctx.currentTime); // D5
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 1.8);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 1.8);
    } catch {}
  }
}

export const harborAudio = new HarborAudioEngine();
