// Sound Manager for Tennis Match Events
// Uses Web Audio API with fallback to HTML5 Audio for cross-browser compatibility

export type SoundEvent = 
  | 'point-won'
  | 'game-won'
  | 'set-won'
  | 'match-won'
  | 'ace'
  | 'double-fault'
  | 'break-point'
  | 'set-point'
  | 'match-point'
  | 'undo'
  | 'error'

interface SoundSettings {
  enabled: boolean
  volume: number // 0-1
  pointSounds: boolean
  criticalPointSounds: boolean
  matchEventSounds: boolean
}

class SoundManager {
  private audioContext: AudioContext | null = null
  private settings: SoundSettings
  private soundCache: Map<SoundEvent, AudioBuffer> = new Map()
  private isInitialized = false

  constructor() {
    this.settings = this.loadSettings()
  }

  private loadSettings(): SoundSettings {
    if (typeof window === 'undefined') {
      return this.getDefaultSettings()
    }

    try {
      const stored = localStorage.getItem('tennis-sound-settings')
      if (stored) {
        return { ...this.getDefaultSettings(), ...JSON.parse(stored) }
      }
    } catch (error) {
      console.warn('Failed to load sound settings:', error)
    }
    
    return this.getDefaultSettings()
  }

  private getDefaultSettings(): SoundSettings {
    return {
      enabled: false, // Start muted by default
      volume: 0.7,
      pointSounds: true,
      criticalPointSounds: true,
      matchEventSounds: true,
    }
  }

  private saveSettings() {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('tennis-sound-settings', JSON.stringify(this.settings))
      } catch (error) {
        console.warn('Failed to save sound settings:', error)
      }
    }
  }

  async initialize() {
    if (this.isInitialized || typeof window === 'undefined') return

    try {
      // Create AudioContext on user interaction to avoid autoplay restrictions
      const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (AudioContextClass) {
        this.audioContext = new AudioContextClass()
        
        if (this.audioContext && this.audioContext.state === 'suspended') {
          await this.audioContext.resume()
        }
      }

      this.isInitialized = true
    } catch (error) {
      console.warn('Failed to initialize AudioContext:', error)
      // Fallback to HTML5 Audio will be used
    }
  }

  private generateTone(frequency: number, duration: number, type: OscillatorType = 'sine'): AudioBuffer | null {
    if (!this.audioContext) return null

    const sampleRate = this.audioContext.sampleRate
    const frameCount = sampleRate * duration
    const buffer = this.audioContext.createBuffer(1, frameCount, sampleRate)
    const data = buffer.getChannelData(0)

    for (let i = 0; i < frameCount; i++) {
      const t = i / sampleRate
      let value = 0
      
      switch (type) {
        case 'sine':
          value = Math.sin(2 * Math.PI * frequency * t)
          break
        case 'square':
          value = Math.sin(2 * Math.PI * frequency * t) > 0 ? 1 : -1
          break
        case 'triangle':
          value = (2 / Math.PI) * Math.asin(Math.sin(2 * Math.PI * frequency * t))
          break
        case 'sawtooth':
          value = 2 * (t * frequency - Math.floor(t * frequency + 0.5))
          break
      }
      
      // Apply envelope to avoid clicks
      const envelope = Math.min(t * 10, (duration - t) * 10, 1)
      data[i] = value * envelope * 0.3 // Reduce volume to 30%
    }

    return buffer
  }

  private generateSoundEffect(event: SoundEvent): AudioBuffer | null {
    if (!this.audioContext) return null

    switch (event) {
      case 'point-won':
        return this.generateTone(800, 0.15, 'sine')
      
      case 'game-won':
        // Two-tone chime
        const buffer1 = this.generateTone(600, 0.2, 'sine')
        const buffer2 = this.generateTone(800, 0.2, 'sine')
        if (!buffer1 || !buffer2) return null
        
        const combinedBuffer = this.audioContext.createBuffer(1, buffer1.length + buffer2.length, this.audioContext.sampleRate)
        const data = combinedBuffer.getChannelData(0)
        
        // Add first tone
        const data1 = buffer1.getChannelData(0)
        for (let i = 0; i < data1.length; i++) {
          data[i] = data1[i]
        }
        
        // Add second tone with slight overlap
        const data2 = buffer2.getChannelData(0)
        const offset = Math.floor(buffer1.length * 0.7)
        for (let i = 0; i < data2.length; i++) {
          if (offset + i < data.length) {
            data[offset + i] += data2[i] * 0.8
          }
        }
        
        return combinedBuffer

      case 'set-won':
        return this.generateTone(1000, 0.4, 'sine')
      
      case 'match-won':
        return this.generateTone(1200, 0.6, 'sine')
      
      case 'ace':
        return this.generateTone(1500, 0.1, 'triangle')
      
      case 'double-fault':
        return this.generateTone(300, 0.3, 'square')
      
      case 'break-point':
        return this.generateTone(700, 0.2, 'triangle')
      
      case 'set-point':
        return this.generateTone(900, 0.25, 'sine')
      
      case 'match-point':
        return this.generateTone(1100, 0.3, 'sine')
      
      case 'undo':
        return this.generateTone(400, 0.1, 'sawtooth')
      
      case 'error':
        return this.generateTone(200, 0.2, 'square')
      
      default:
        return this.generateTone(600, 0.1, 'sine')
    }
  }

  private async playWithAudioContext(buffer: AudioBuffer) {
    if (!this.audioContext) return

    const source = this.audioContext.createBufferSource()
    const gainNode = this.audioContext.createGain()
    
    gainNode.gain.value = this.settings.volume
    
    source.buffer = buffer
    source.connect(gainNode)
    gainNode.connect(this.audioContext.destination)
    
    source.start()
  }

  private playWithHTML5Audio(event: SoundEvent) {
    // Fallback to simple beep using HTML5 Audio with data URL
    const audio = new Audio()
    
    // Generate a simple beep data URL (very basic fallback)
    const frequency = this.getFrequencyForEvent(event)
    const duration = this.getDurationForEvent(event)
    
    // Create a simple oscillator tone using data URL
    const sampleRate = 8000
    const samples = Math.floor(sampleRate * duration)
    const wave = new Uint8Array(samples)
    
    for (let i = 0; i < samples; i++) {
      const t = i / sampleRate
      const value = Math.sin(2 * Math.PI * frequency * t) * 127 + 128
      wave[i] = Math.floor(value)
    }
    
    // Convert to base64 and create data URL
    const base64 = btoa(String.fromCharCode(...wave))
    audio.src = `data:audio/wav;base64,${base64}`
    audio.volume = this.settings.volume
    
    audio.play().catch(e => console.warn('Failed to play fallback audio:', e))
  }

  private getFrequencyForEvent(event: SoundEvent): number {
    const frequencies = {
      'point-won': 800,
      'game-won': 700,
      'set-won': 1000,
      'match-won': 1200,
      'ace': 1500,
      'double-fault': 300,
      'break-point': 700,
      'set-point': 900,
      'match-point': 1100,
      'undo': 400,
      'error': 200,
    }
    return frequencies[event] || 600
  }

  private getDurationForEvent(event: SoundEvent): number {
    const durations = {
      'point-won': 0.15,
      'game-won': 0.3,
      'set-won': 0.4,
      'match-won': 0.6,
      'ace': 0.1,
      'double-fault': 0.3,
      'break-point': 0.2,
      'set-point': 0.25,
      'match-point': 0.3,
      'undo': 0.1,
      'error': 0.2,
    }
    return durations[event] || 0.15
  }

  async play(event: SoundEvent) {
    if (!this.settings.enabled) return

    // Check category-specific settings
    const criticalPoints = ['break-point', 'set-point', 'match-point']
    const matchEvents = ['game-won', 'set-won', 'match-won']
    const pointEvents = ['point-won', 'ace', 'double-fault']

    if (criticalPoints.includes(event) && !this.settings.criticalPointSounds) return
    if (matchEvents.includes(event) && !this.settings.matchEventSounds) return
    if (pointEvents.includes(event) && !this.settings.pointSounds) return

    await this.initialize()

    try {
      if (this.audioContext) {
        // Use cached buffer or generate new one
        let buffer = this.soundCache.get(event)
        if (!buffer) {
          const generatedBuffer = this.generateSoundEffect(event)
          if (generatedBuffer) {
            buffer = generatedBuffer
            this.soundCache.set(event, buffer)
          }
        }
        
        if (buffer) {
          await this.playWithAudioContext(buffer)
        }
      } else {
        // Fallback to HTML5 Audio
        this.playWithHTML5Audio(event)
      }
    } catch (error) {
      console.warn(`Failed to play sound for ${event}:`, error)
    }
  }

  // Settings management
  getSettings(): SoundSettings {
    return { ...this.settings }
  }

  updateSettings(newSettings: Partial<SoundSettings>) {
    this.settings = { ...this.settings, ...newSettings }
    this.saveSettings()
  }

  setEnabled(enabled: boolean) {
    this.updateSettings({ enabled })
  }

  setVolume(volume: number) {
    this.updateSettings({ volume: Math.max(0, Math.min(1, volume)) })
  }

  // Convenience methods for quick access
  isEnabled(): boolean {
    return this.settings.enabled
  }

  getVolume(): number {
    return this.settings.volume
  }
}

// Export singleton instance
export const soundManager = new SoundManager()

// Convenience function for easy access
export const playSound = (event: SoundEvent) => soundManager.play(event) 