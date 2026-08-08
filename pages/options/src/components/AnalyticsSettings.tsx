import React, { useState, useEffect } from 'react';
import { analyticsSettingsStore } from '@extension/storage';
import { t } from '@extension/i18n';

import type { AnalyticsSettingsConfig } from '@extension/storage';

interface AnalyticsSettingsProps {
  isDarkMode: boolean;
}

export const AnalyticsSettings: React.FC<AnalyticsSettingsProps> = ({ isDarkMode }) => {
  const [settings, setSettings] = useState<AnalyticsSettingsConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const currentSettings = await analyticsSettingsStore.getSettings();
        setSettings(currentSettings);
      } catch (error) {
        console.error('Failed to load analytics settings:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();

    // Listen for storage changes
    const unsubscribe = analyticsSettingsStore.subscribe(loadSettings);
    return () => {
      unsubscribe();
    };
  }, []);

  const handleToggleAnalytics = async (enabled: boolean) => {
    if (!settings) return;

    try {
      await analyticsSettingsStore.updateSettings({ enabled });
      setSettings({ ...settings, enabled });
    } catch (error) {
      console.error('Failed to update analytics settings:', error);
    }
  };

  if (loading) {
    return (
      <section className="space-y-6">
        <div
          className={`rounded-lg border ${isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-blue-100 bg-gray-50'} p-6 text-left shadow-sm`}>
          <h2 className={`mb-4 text-xl font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
            {t('options_analytics_header')}
          </h2>
          <div className="animate-pulse">
            <div className={`mb-2 h-4 w-3/4 rounded ${isDarkMode ? 'bg-slate-600' : 'bg-gray-200'}`}></div>
            <div className={`h-4 w-1/2 rounded ${isDarkMode ? 'bg-slate-600' : 'bg-gray-200'}`}></div>
          </div>
        </div>
      </section>
    );
  }

  if (!settings) {
    return (
      <section className="space-y-6">
        <div
          className={`rounded-lg border ${isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-blue-100 bg-gray-50'} p-6 text-left shadow-sm`}>
          <h2 className={`mb-4 text-xl font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
            {t('options_analytics_header')}
          </h2>
          <p className={`${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>{t('options_analytics_loadFailed')}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div
        className={`rounded-lg border ${isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-blue-100 bg-gray-50'} p-6 text-left shadow-sm`}>
        <h2 className={`mb-4 text-xl font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
          {t('options_analytics_header')}
        </h2>

        <div className="space-y-6">
          {/* Main toggle */}
          <div
            className={`my-6 rounded-lg border p-4 ${isDarkMode ? 'border-slate-700 bg-slate-700' : 'border-gray-200 bg-gray-100'}`}>
            <div className="flex items-center justify-between">
              <label
                htmlFor="analytics-enabled"
                className={`text-base font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                {t('options_analytics_enableToggle')}
              </label>
              <div className="relative inline-block w-12 select-none">
                <input
                  type="checkbox"
                  checked={settings.enabled}
                  onChange={e => handleToggleAnalytics(e.target.checked)}
                  className="sr-only"
                  id="analytics-enabled"
                />
                <label
                  htmlFor="analytics-enabled"
                  className={`block h-6 cursor-pointer overflow-hidden rounded-full ${
                    settings.enabled ? 'bg-blue-500' : isDarkMode ? 'bg-gray-600' : 'bg-gray-300'
                  }`}>
                  <span className="sr-only">{t('options_analytics_toggleAnalytics_a11y')}</span>
                  <span
                    className={`block size-6 rounded-full bg-white shadow transition-transform ${
                      settings.enabled ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </label>
              </div>
            </div>
            <p className={`mt-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {t('options_analytics_enableToggle_desc')}
            </p>
          </div>

          {/* Information about what we collect */}
          <div
            className={`rounded-md border p-4 ${isDarkMode ? 'border-slate-600 bg-slate-700' : 'border-gray-200 bg-gray-100'}`}>
            <h3 className={`text-base font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'} mb-4`}>
              {t('options_analytics_collect_header')}
            </h3>
            <ul
              className={`list-disc space-y-2 pl-5 text-left text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              <li>{t('options_analytics_collect_metrics')}</li>
              <li>{t('options_analytics_collect_domains')}</li>
              <li>{t('options_analytics_collect_errors')}</li>
              <li>{t('options_analytics_collect_usage')}</li>
            </ul>

            <h3 className={`mb-4 mt-6 text-base font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
              {t('options_analytics_notCollect_header')}
            </h3>
            <ul
              className={`list-disc space-y-2 pl-5 text-left text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              <li>{t('options_analytics_notCollect_personal')}</li>
              <li>{t('options_analytics_notCollect_urls')}</li>
              <li>{t('options_analytics_notCollect_prompts')}</li>
              <li>{t('options_analytics_notCollect_screenshots')}</li>
              <li>{t('options_analytics_notCollect_sensitive')}</li>
            </ul>
          </div>

          {/* Opt-out message */}
          {!settings.enabled && (
            <div
              className={`rounded-md border p-4 ${isDarkMode ? 'border-yellow-700 bg-yellow-900/20' : 'border-yellow-200 bg-yellow-50'}`}>
              <p className={`text-sm ${isDarkMode ? 'text-yellow-300' : 'text-yellow-700'}`}>
                {t('options_analytics_disabledNotice')}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
