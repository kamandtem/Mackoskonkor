/**
 * Web Audio Ambient Sound Generator
 * 100% Offline, Procedural Synthesizer for Focus Sessions
 */
import { AmbientSoundId } from '../types/konkur';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private currentSound: AmbientSoundId = 'none';
  private masterGain: GainNode | null = null;
  private activeNodes: (AudioNode | number)[] = [];
  private isRunning = false;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.6, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setVolume(volume: number) {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(Math.max(0, Math.min(1, volume)), this.ctx.currentTime, 0.1);
    }
  }

  public playSound(sound: AmbientSoundId) {
    this.stop();
    if (sound === 'none') return;

    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    this.currentSound = sound;
    this.isRunning = true;

    try {
      switch (sound) {
        case 'whitenoise':
          this.startWhiteNoise();
          break;
        case 'rain':
          this.startRainSound();
          break;
        case 'waves':
          this.startWavesSound();
          break;
        case 'fireplace':
          this.startFireplaceSound();
          break;
        case 'forest':
          this.startForestSound();
          break;
        case 'lofi':
          this.startLofiAmbience();
          break;
      }
    } catch (e) {
      console.error('Failed to start ambient sound:', e);
    }
  }

  public stop() {
    this.currentSound = 'none';
    this.isRunning = false;

    for (const node of this.activeNodes) {
      if (typeof node === 'number') {
        window.clearInterval(node);
      } else {
        try {
          if ('stop' in node && typeof (node as AudioScheduledSourceNode).stop === 'function') {
            (node as AudioScheduledSourceNode).stop();
          }
          node.disconnect();
        } catch {
          // ignore disconnect errors
        }
      }
    }
    this.activeNodes = [];
  }

  public getCurrentSound(): AmbientSoundId {
    return this.currentSound;
  }

  private createNoiseBuffer(): AudioBuffer | null {
    if (!this.ctx) return null;
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  private startWhiteNoise() {
    if (!this.ctx || !this.masterGain) return;
    const noiseBuffer = this.createNoiseBuffer();
    if (!noiseBuffer) return;

    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1000, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.18, this.ctx.currentTime);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start();
    this.activeNodes.push(noise, filter, gain);
  }

  private startRainSound() {
    if (!this.ctx || !this.masterGain) return;
    const noiseBuffer = this.createNoiseBuffer();
    if (!noiseBuffer) return;

    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, this.ctx.currentTime);
    filter.Q.setValueAtTime(0.8, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.28, this.ctx.currentTime);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start();
    this.activeNodes.push(noise, filter, gain);
  }

  private startWavesSound() {
    if (!this.ctx || !this.masterGain) return;
    const noiseBuffer = this.createNoiseBuffer();
    if (!noiseBuffer) return;

    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, this.ctx.currentTime);

    // LFO for wave modulation
    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.12, this.ctx.currentTime); // slow wave cycle ~8s

    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(300, this.ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.35, this.ctx.currentTime);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start();
    lfo.start();
    this.activeNodes.push(noise, filter, lfo, lfoGain, gain);
  }

  private startFireplaceSound() {
    if (!this.ctx || !this.masterGain) return;
    const noiseBuffer = this.createNoiseBuffer();
    if (!noiseBuffer) return;

    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;

    const lowFilter = this.ctx.createBiquadFilter();
    lowFilter.type = 'lowpass';
    lowFilter.frequency.setValueAtTime(300, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);

    noise.connect(lowFilter);
    lowFilter.connect(gain);
    gain.connect(this.masterGain);
    noise.start();
    this.activeNodes.push(noise, lowFilter, gain);

    // Crackle pops
    const interval = window.setInterval(() => {
      if (!this.ctx || !this.masterGain || !this.isRunning) return;
      if (Math.random() > 0.4) {
        const pop = this.ctx.createOscillator();
        const popGain = this.ctx.createGain();
        pop.type = 'triangle';
        pop.frequency.setValueAtTime(150 + Math.random() * 800, this.ctx.currentTime);
        popGain.gain.setValueAtTime(0.12 + Math.random() * 0.15, this.ctx.currentTime);
        popGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);
        pop.connect(popGain);
        popGain.connect(this.masterGain);
        pop.start();
        pop.stop(this.ctx.currentTime + 0.05);
      }
    }, 180);

    this.activeNodes.push(interval);
  }

  private startForestSound() {
    if (!this.ctx || !this.masterGain) return;
    // Gentle rustle breeze
    const noiseBuffer = this.createNoiseBuffer();
    if (!noiseBuffer) return;

    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(500, this.ctx.currentTime);
    filter.Q.setValueAtTime(0.5, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    noise.start();
    this.activeNodes.push(noise, filter, gain);
  }

  private startLofiAmbience() {
    if (!this.ctx || !this.masterGain) return;
    // Mellow chord progression (warm synth pads)
    const notes = [261.63, 329.63, 392.00, 523.25]; // C major 7th
    notes.forEach((freq) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600, this.ctx.currentTime);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.04, this.ctx.currentTime);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      osc.start();
      this.activeNodes.push(osc, filter, gain);
    });
  }
}

export const soundEngine = new SoundEngine();
