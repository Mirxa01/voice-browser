import { StorageEnum } from '../base/enums';
import { createStorage } from '../base/base';
import type { BaseStorage } from '../base/types';

// Voice settings configuration
export interface VoiceSettings {
  // Text-to-Speech settings
  ttsEnabled: boolean;
  ttsVoice: string; // Voice name from Web Speech API
  ttsRate: number; // 0.1 to 10
  ttsPitch: number; // 0 to 2

  // Live voice mode settings
  liveVoiceEnabled: boolean;
  wakeWord: string;
}

export const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  ttsEnabled: false,
  ttsVoice: '', // Will be set to system default
  ttsRate: 1.0,
  ttsPitch: 1.0,
  liveVoiceEnabled: false,
  wakeWord: 'Hey Browser',
};

export type VoiceSettingsStorage = BaseStorage<VoiceSettings> & {
  getSettings: () => Promise<VoiceSettings>;
  updateSettings: (settings: Partial<VoiceSettings>) => Promise<void>;
  resetSettings: () => Promise<void>;
  isTtsEnabled: () => Promise<boolean>;
  isLiveVoiceEnabled: () => Promise<boolean>;
};

const storage = createStorage<VoiceSettings>('voice-settings', DEFAULT_VOICE_SETTINGS, {
  storageEnum: StorageEnum.Local,
  liveUpdate: true,
});

export const voiceSettingsStore: VoiceSettingsStorage = {
  ...storage,
  async getSettings() {
    const settings = await storage.get();
    return {
      ...DEFAULT_VOICE_SETTINGS,
      ...settings,
    };
  },
  async updateSettings(settings: Partial<VoiceSettings>) {
    const current = await storage.get();
    await storage.set({
      ...DEFAULT_VOICE_SETTINGS,
      ...current,
      ...settings,
    });
  },
  async resetSettings() {
    await storage.set(DEFAULT_VOICE_SETTINGS);
  },
  async isTtsEnabled() {
    const settings = await storage.get();
    return settings.ttsEnabled ?? DEFAULT_VOICE_SETTINGS.ttsEnabled;
  },
  async isLiveVoiceEnabled() {
    const settings = await storage.get();
    return settings.liveVoiceEnabled ?? DEFAULT_VOICE_SETTINGS.liveVoiceEnabled;
  },
};
