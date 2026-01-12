import { useEffect, useState, useCallback } from 'react';
import { voiceSettingsStore, type VoiceSettings } from '@extension/storage';
import { t } from '@extension/i18n';

interface VoiceSettingsProps {
  isDarkMode?: boolean;
}

export const VoiceSettingsComponent = ({ isDarkMode = false }: VoiceSettingsProps) => {
  const [settings, setSettings] = useState<VoiceSettings>({
    ttsEnabled: false,
    ttsVoice: '',
    ttsRate: 1.0,
    ttsPitch: 1.0,
    liveVoiceEnabled: false,
    wakeWord: 'Hey Browser',
  });
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isSaved, setIsSaved] = useState(false);

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const stored = await voiceSettingsStore.getSettings();
        setSettings(stored);
      } catch (error) {
        console.error('Error loading voice settings:', error);
      }
    };
    loadSettings();
  }, []);

  // Load available voices
  useEffect(() => {
    const loadVoices = () => {
      const synth = window.speechSynthesis;
      const voices = synth.getVoices();
      setAvailableVoices(voices);
    };

    loadVoices();

    // Voices may load asynchronously - use addEventListener for proper event handling
    const handleVoicesChanged = () => loadVoices();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);
    }

    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
      }
    };
  }, []);

  const handleSettingChange = useCallback(async (key: keyof VoiceSettings, value: VoiceSettings[keyof VoiceSettings]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setIsSaved(false);
  }, []);

  const handleSave = async () => {
    try {
      await voiceSettingsStore.updateSettings(settings);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    } catch (error) {
      console.error('Error saving voice settings:', error);
    }
  };

  const testVoice = () => {
    const synth = window.speechSynthesis;
    synth.cancel();

    const utterance = new SpeechSynthesisUtterance('This is a test of the voice feedback feature.');

    if (settings.ttsVoice) {
      const voice = availableVoices.find(v => v.name === settings.ttsVoice);
      if (voice) {
        utterance.voice = voice;
      }
    }

    utterance.rate = settings.ttsRate;
    utterance.pitch = settings.ttsPitch;

    synth.speak(utterance);
  };

  return (
    <section className="space-y-6">
      {/* Text-to-Speech Settings */}
      <div
        className={`rounded-lg border ${isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-blue-100 bg-gray-50'} p-6 text-left shadow-sm`}>
        <h2 className={`mb-4 text-xl font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
          {t('options_voice_tts_header')}
        </h2>

        <div className="space-y-4">
          {/* Enable TTS Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <label className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {t('options_voice_tts_enabled')}
              </label>
              <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {t('options_voice_tts_enabled_desc')}
              </p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={settings.ttsEnabled}
                onChange={e => handleSettingChange('ttsEnabled', e.target.checked)}
                className="peer sr-only"
              />
              <div className="peer h-6 w-11 rounded-full bg-gray-300 after:absolute after:left-[2px] after:top-[2px] after:size-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-500 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:ring-4 peer-focus:ring-blue-300"></div>
            </label>
          </div>

          {/* Voice Selection */}
          {settings.ttsEnabled && (
            <>
              <div className="flex items-center">
                <label className={`w-24 text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {t('options_voice_tts_voice')}
                </label>
                <select
                  value={settings.ttsVoice}
                  onChange={e => handleSettingChange('ttsVoice', e.target.value)}
                  className={`flex-1 rounded-md border text-sm ${isDarkMode ? 'border-slate-600 bg-slate-700 text-gray-200' : 'border-gray-300 bg-white text-gray-700'} px-3 py-2`}>
                  <option value="">System Default</option>
                  {availableVoices.map(voice => (
                    <option key={voice.name} value={voice.name}>
                      {voice.name} ({voice.lang})
                    </option>
                  ))}
                </select>
              </div>

              {/* Speech Rate */}
              <div className="flex items-center">
                <label className={`w-24 text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {t('options_voice_tts_rate')}
                </label>
                <div className="flex flex-1 items-center space-x-2">
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={settings.ttsRate}
                    onChange={e => {
                      const value = Number.parseFloat(e.target.value);
                      if (!Number.isNaN(value) && value >= 0.5 && value <= 2) {
                        handleSettingChange('ttsRate', value);
                      }
                    }}
                    className={`flex-1 ${isDarkMode ? 'accent-blue-500' : 'accent-blue-400'} h-1 appearance-none rounded-full`}
                    style={{
                      background: `linear-gradient(to right, ${isDarkMode ? '#3b82f6' : '#60a5fa'} 0%, ${isDarkMode ? '#3b82f6' : '#60a5fa'} ${((settings.ttsRate - 0.5) / 1.5) * 100}%, ${isDarkMode ? '#475569' : '#cbd5e1'} ${((settings.ttsRate - 0.5) / 1.5) * 100}%, ${isDarkMode ? '#475569' : '#cbd5e1'} 100%)`,
                    }}
                  />
                  <span className={`w-12 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {settings.ttsRate.toFixed(1)}x
                  </span>
                </div>
              </div>

              {/* Pitch */}
              <div className="flex items-center">
                <label className={`w-24 text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {t('options_voice_tts_pitch')}
                </label>
                <div className="flex flex-1 items-center space-x-2">
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={settings.ttsPitch}
                    onChange={e => {
                      const value = Number.parseFloat(e.target.value);
                      if (!Number.isNaN(value) && value >= 0.5 && value <= 2) {
                        handleSettingChange('ttsPitch', value);
                      }
                    }}
                    className={`flex-1 ${isDarkMode ? 'accent-blue-500' : 'accent-blue-400'} h-1 appearance-none rounded-full`}
                    style={{
                      background: `linear-gradient(to right, ${isDarkMode ? '#3b82f6' : '#60a5fa'} 0%, ${isDarkMode ? '#3b82f6' : '#60a5fa'} ${((settings.ttsPitch - 0.5) / 1.5) * 100}%, ${isDarkMode ? '#475569' : '#cbd5e1'} ${((settings.ttsPitch - 0.5) / 1.5) * 100}%, ${isDarkMode ? '#475569' : '#cbd5e1'} 100%)`,
                    }}
                  />
                  <span className={`w-12 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {settings.ttsPitch.toFixed(1)}
                  </span>
                </div>
              </div>

              {/* Test Voice Button */}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={testVoice}
                  className={`rounded-md px-4 py-2 text-sm font-medium ${isDarkMode ? 'bg-slate-600 text-gray-200 hover:bg-slate-500' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                  Test Voice
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Live Voice Control Settings */}
      <div
        className={`rounded-lg border ${isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-blue-100 bg-gray-50'} p-6 text-left shadow-sm`}>
        <h2 className={`mb-4 text-xl font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
          {t('options_voice_live_header')}
        </h2>

        <div className="space-y-4">
          {/* Enable Live Voice Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <label className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {t('options_voice_live_enabled')}
              </label>
              <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {t('options_voice_live_enabled_desc')}
              </p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={settings.liveVoiceEnabled}
                onChange={e => handleSettingChange('liveVoiceEnabled', e.target.checked)}
                className="peer sr-only"
              />
              <div className="peer h-6 w-11 rounded-full bg-gray-300 after:absolute after:left-[2px] after:top-[2px] after:size-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-500 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:ring-4 peer-focus:ring-blue-300"></div>
            </label>
          </div>

          {/* Wake Word */}
          {settings.liveVoiceEnabled && (
            <div className="flex items-center">
              <label className={`w-24 text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {t('options_voice_wake_word')}
              </label>
              <div className="flex-1">
                <input
                  type="text"
                  value={settings.wakeWord}
                  onChange={e => handleSettingChange('wakeWord', e.target.value)}
                  placeholder="Hey Browser"
                  className={`w-full rounded-md border text-sm ${isDarkMode ? 'border-slate-600 bg-slate-700 text-gray-200' : 'border-gray-300 bg-white text-gray-700'} px-3 py-2`}
                />
                <p className={`mt-1 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {t('options_voice_wake_word_desc')}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          className={`rounded-md px-6 py-2 text-sm font-medium ${isDarkMode ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-blue-500 text-white hover:bg-blue-600'} ${isSaved ? 'bg-green-500 hover:bg-green-600' : ''}`}>
          {isSaved ? '✓ Saved' : 'Save Settings'}
        </button>
      </div>
    </section>
  );
};
