import { voiceSettingsStore } from '@extension/storage';

/**
 * Text-to-Speech service for providing voice feedback
 * Uses the Web Speech API for speech synthesis
 */
export class TextToSpeechService {
  private static instance: TextToSpeechService | null = null;
  private synth: SpeechSynthesis | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  private isInitialized = false;

  private constructor() {
    // Initialize speech synthesis if available
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.loadVoices();
    }
  }

  static getInstance(): TextToSpeechService {
    if (!TextToSpeechService.instance) {
      TextToSpeechService.instance = new TextToSpeechService();
    }
    return TextToSpeechService.instance;
  }

  private loadVoices() {
    if (!this.synth) return;

    // Load voices - they may not be immediately available
    this.voices = this.synth.getVoices();

    if (this.voices.length === 0) {
      // Wait for voices to load
      this.synth.addEventListener('voiceschanged', () => {
        this.voices = this.synth?.getVoices() || [];
        this.isInitialized = true;
      });
    } else {
      this.isInitialized = true;
    }
  }

  /**
   * Get all available voices
   */
  getVoices(): SpeechSynthesisVoice[] {
    return this.voices;
  }

  /**
   * Get voice names for settings UI
   */
  getVoiceNames(): string[] {
    return this.voices.map(v => v.name);
  }

  /**
   * Find a voice by name
   */
  findVoice(name: string): SpeechSynthesisVoice | undefined {
    return this.voices.find(v => v.name === name);
  }

  /**
   * Get the default voice (prefer English voices)
   */
  getDefaultVoice(): SpeechSynthesisVoice | undefined {
    // Prefer English voices
    const englishVoice = this.voices.find(v => v.lang.startsWith('en-') && v.default);
    if (englishVoice) return englishVoice;

    // Fall back to any English voice
    const anyEnglish = this.voices.find(v => v.lang.startsWith('en-'));
    if (anyEnglish) return anyEnglish;

    // Fall back to the default voice
    return this.voices.find(v => v.default) || this.voices[0];
  }

  /**
   * Speak text with the configured voice settings
   */
  async speak(text: string, options?: { voiceName?: string; rate?: number; pitch?: number }): Promise<void> {
    if (!this.synth) {
      console.warn('Speech synthesis not available');
      return;
    }

    // Check if TTS is enabled
    const settings = await voiceSettingsStore.getSettings();
    if (!settings.ttsEnabled) {
      return;
    }

    // Cancel any ongoing speech
    this.synth.cancel();

    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text);

      // Set voice
      const voiceName = options?.voiceName || settings.ttsVoice;
      if (voiceName) {
        const voice = this.findVoice(voiceName);
        if (voice) {
          utterance.voice = voice;
        }
      }

      // If no voice set, use default
      if (!utterance.voice) {
        const defaultVoice = this.getDefaultVoice();
        if (defaultVoice) {
          utterance.voice = defaultVoice;
        }
      }

      // Set rate and pitch
      utterance.rate = options?.rate ?? settings.ttsRate ?? 1.0;
      utterance.pitch = options?.pitch ?? settings.ttsPitch ?? 1.0;

      utterance.onend = () => resolve();
      utterance.onerror = event => {
        console.error('Speech synthesis error:', event.error);
        reject(new Error(event.error));
      };

      this.synth?.speak(utterance);
    });
  }

  /**
   * Stop any ongoing speech
   */
  stop(): void {
    this.synth?.cancel();
  }

  /**
   * Check if speech is currently active
   */
  isSpeaking(): boolean {
    return this.synth?.speaking || false;
  }

  /**
   * Speak a summarized version of task completion
   */
  async speakTaskComplete(summary: string): Promise<void> {
    await this.speak(`Task completed. ${summary}`);
  }

  /**
   * Speak task failure message
   */
  async speakTaskFailed(error: string): Promise<void> {
    await this.speak(`Task failed. ${error}`);
  }

  /**
   * Speak a navigation update
   */
  async speakNavigation(url: string): Promise<void> {
    // Extract domain from URL for brevity
    try {
      const domain = new URL(url).hostname;
      await this.speak(`Navigating to ${domain}`);
    } catch {
      await this.speak(`Navigating to ${url}`);
    }
  }

  /**
   * Speak a click action
   */
  async speakClick(elementDescription: string): Promise<void> {
    await this.speak(`Clicking ${elementDescription}`);
  }

  /**
   * Check if TTS is available and enabled
   */
  async isAvailable(): Promise<boolean> {
    if (!this.synth) return false;
    const settings = await voiceSettingsStore.getSettings();
    return settings.ttsEnabled;
  }
}

// Export singleton instance
export const textToSpeechService = TextToSpeechService.getInstance();
