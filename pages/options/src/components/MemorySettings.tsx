import { useEffect, useState, useCallback } from 'react';
import { memoryStore, type MemorySettings } from '@extension/storage';
import { t } from '@extension/i18n';

interface MemorySettingsProps {
  isDarkMode?: boolean;
}

export const MemorySettingsComponent = ({ isDarkMode = false }: MemorySettingsProps) => {
  const [settings, setSettings] = useState<MemorySettings>({
    enabled: true,
    maxPatterns: 100,
    maxPreferences: 50,
  });
  const [stats, setStats] = useState({ patternCount: 0, preferenceCount: 0 });
  const [isSaved, setIsSaved] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isCleared, setIsCleared] = useState(false);

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const stored = await memoryStore.getSettings();
        setSettings(stored);
        const memoryStats = await memoryStore.getMemoryStats();
        setStats(memoryStats);
      } catch (error) {
        console.error('Error loading memory settings:', error);
      }
    };
    loadSettings();
  }, []);

  const handleSettingChange = useCallback((key: keyof MemorySettings, value: MemorySettings[keyof MemorySettings]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setIsSaved(false);
  }, []);

  const handleSave = async () => {
    try {
      await memoryStore.updateSettings(settings);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    } catch (error) {
      console.error('Error saving memory settings:', error);
    }
  };

  const handleClearMemory = async () => {
    try {
      await memoryStore.clearMemory();
      setStats({ patternCount: 0, preferenceCount: 0 });
      setShowClearConfirm(false);
      setIsCleared(true);
    } catch (error) {
      console.error('Error clearing memory:', error);
    }
  };

  // Hide the "memory cleared" confirmation after a short delay
  useEffect(() => {
    if (!isCleared) return undefined;
    const timeoutId = window.setTimeout(() => setIsCleared(false), 3000);
    return () => window.clearTimeout(timeoutId);
  }, [isCleared]);

  return (
    <section className="space-y-6">
      {/* Memory & Learning Settings */}
      <div
        className={`rounded-lg border ${isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-blue-100 bg-gray-50'} p-6 text-left shadow-sm`}>
        <h2 className={`mb-4 text-xl font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
          {t('options_memory_header')}
        </h2>

        <div className="space-y-4">
          {/* Enable Learning Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {t('options_memory_enabled')}
              </h3>
              <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {t('options_memory_enabled_desc')}
              </p>
            </div>
            <div className="relative inline-flex cursor-pointer items-center">
              <input
                id="memory-enabled"
                type="checkbox"
                checked={settings.enabled}
                onChange={e => handleSettingChange('enabled', e.target.checked)}
                className="peer sr-only"
              />
              <label
                htmlFor="memory-enabled"
                className="peer h-6 w-11 cursor-pointer rounded-full bg-gray-300 after:absolute after:left-[2px] after:top-[2px] after:size-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-500 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:ring-4 peer-focus:ring-blue-300">
                <span className="sr-only">{t('options_memory_enabled')}</span>
              </label>
            </div>
          </div>

          {/* Memory Stats */}
          {settings.enabled && (
            <div className={`rounded-md p-4 ${isDarkMode ? 'bg-slate-700' : 'bg-white'}`}>
              <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {t('options_memory_count', [String(stats.patternCount)])}
              </p>
              <p className={`mt-1 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {t('options_memory_preferences_count', [String(stats.preferenceCount)])}
              </p>
            </div>
          )}

          {/* Clear Memory Button */}
          {settings.enabled && isCleared && (
            <p className={`text-sm ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
              {t('options_memory_cleared')}
            </p>
          )}
          {settings.enabled && stats.patternCount > 0 && (
            <div>
              {showClearConfirm ? (
                <div
                  className={`rounded-md border p-4 ${isDarkMode ? 'border-red-700 bg-red-900/30' : 'border-red-200 bg-red-50'}`}>
                  <p className={`mb-3 text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    {t('options_memory_clear_confirm')}
                  </p>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => setShowClearConfirm(false)}
                      className={`rounded-md px-4 py-2 text-sm font-medium ${isDarkMode ? 'bg-slate-600 text-gray-200 hover:bg-slate-500' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                      {t('common_cancel')}
                    </button>
                    <button
                      type="button"
                      onClick={handleClearMemory}
                      className="rounded-md bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600">
                      {t('options_memory_clear')}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(true)}
                  className={`rounded-md px-4 py-2 text-sm font-medium ${isDarkMode ? 'bg-red-700 text-white hover:bg-red-600' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}>
                  {t('options_memory_clear')}
                </button>
              )}
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
          {isSaved ? '✓ ' + t('common_saved') : t('common_save_settings')}
        </button>
      </div>
    </section>
  );
};
