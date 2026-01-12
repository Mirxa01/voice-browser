import { useEffect, useState, useCallback } from 'react';
import { userStore, type UserProfile, type StoredCredential } from '@extension/storage';
import { t } from '@extension/i18n';

interface ProfileSettingsProps {
  isDarkMode?: boolean;
}

export const ProfileSettings = ({ isDarkMode = false }: ProfileSettingsProps) => {
  const [profile, setProfile] = useState<UserProfile>({
    userId: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    credentials: [],
  });
  const [isSaved, setIsSaved] = useState(false);
  const [showAddCredential, setShowAddCredential] = useState(false);
  const [newCredential, setNewCredential] = useState({
    site: '',
    username: '',
    password: '',
  });
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());

  // Load profile on mount
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const stored = await userStore.getProfile();
        setProfile(stored);
      } catch (error) {
        console.error('Error loading profile:', error);
      }
    };
    loadProfile();
  }, []);

  const handleProfileChange = useCallback((key: keyof UserProfile, value: string) => {
    setProfile(prev => ({ ...prev, [key]: value }));
    setIsSaved(false);
  }, []);

  const handleSave = async () => {
    try {
      await userStore.updateProfile(profile);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    } catch (error) {
      console.error('Error saving profile:', error);
    }
  };

  const handleAddCredential = async () => {
    if (!newCredential.site || !newCredential.username) return;

    try {
      await userStore.addCredential(newCredential);
      const updated = await userStore.getProfile();
      setProfile(updated);
      setNewCredential({ site: '', username: '', password: '' });
      setShowAddCredential(false);
    } catch (error) {
      console.error('Error adding credential:', error);
    }
  };

  const handleDeleteCredential = async (id: string) => {
    try {
      await userStore.removeCredential(id);
      const updated = await userStore.getProfile();
      setProfile(updated);
    } catch (error) {
      console.error('Error deleting credential:', error);
    }
  };

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const inputClassName = `w-full rounded-md border text-sm ${isDarkMode ? 'border-slate-600 bg-slate-700 text-gray-200' : 'border-gray-300 bg-white text-gray-700'} px-3 py-2`;

  return (
    <section className="space-y-6">
      {/* Personal Information */}
      <div
        className={`rounded-lg border ${isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-blue-100 bg-gray-50'} p-6 text-left shadow-sm`}>
        <h2 className={`mb-2 text-xl font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
          {t('options_profile_header')}
        </h2>
        <p className={`mb-4 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          {t('options_profile_description')}
        </p>

        <h3 className={`mb-3 text-lg font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          {t('options_profile_personal_header')}
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={`mb-1 block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              {t('options_profile_firstName')}
            </label>
            <input
              type="text"
              value={profile.firstName || ''}
              onChange={e => handleProfileChange('firstName', e.target.value)}
              className={inputClassName}
              placeholder="John"
            />
          </div>
          <div>
            <label className={`mb-1 block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              {t('options_profile_lastName')}
            </label>
            <input
              type="text"
              value={profile.lastName || ''}
              onChange={e => handleProfileChange('lastName', e.target.value)}
              className={inputClassName}
              placeholder="Doe"
            />
          </div>
          <div>
            <label className={`mb-1 block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              {t('options_profile_email')}
            </label>
            <input
              type="email"
              value={profile.email || ''}
              onChange={e => handleProfileChange('email', e.target.value)}
              className={inputClassName}
              placeholder="john@example.com"
            />
          </div>
          <div>
            <label className={`mb-1 block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              {t('options_profile_phone')}
            </label>
            <input
              type="tel"
              value={profile.phone || ''}
              onChange={e => handleProfileChange('phone', e.target.value)}
              className={inputClassName}
              placeholder="+1 (555) 123-4567"
            />
          </div>
        </div>
      </div>

      {/* Address Information */}
      <div
        className={`rounded-lg border ${isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-blue-100 bg-gray-50'} p-6 text-left shadow-sm`}>
        <h3 className={`mb-3 text-lg font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          {t('options_profile_address_header')}
        </h3>

        <div className="space-y-4">
          <div>
            <label className={`mb-1 block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              {t('options_profile_street')}
            </label>
            <input
              type="text"
              value={profile.street || ''}
              onChange={e => handleProfileChange('street', e.target.value)}
              className={inputClassName}
              placeholder="123 Main Street"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`mb-1 block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {t('options_profile_city')}
              </label>
              <input
                type="text"
                value={profile.city || ''}
                onChange={e => handleProfileChange('city', e.target.value)}
                className={inputClassName}
                placeholder="New York"
              />
            </div>
            <div>
              <label className={`mb-1 block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {t('options_profile_state')}
              </label>
              <input
                type="text"
                value={profile.state || ''}
                onChange={e => handleProfileChange('state', e.target.value)}
                className={inputClassName}
                placeholder="NY"
              />
            </div>
            <div>
              <label className={`mb-1 block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {t('options_profile_zipCode')}
              </label>
              <input
                type="text"
                value={profile.zipCode || ''}
                onChange={e => handleProfileChange('zipCode', e.target.value)}
                className={inputClassName}
                placeholder="10001"
              />
            </div>
            <div>
              <label className={`mb-1 block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {t('options_profile_country')}
              </label>
              <input
                type="text"
                value={profile.country || ''}
                onChange={e => handleProfileChange('country', e.target.value)}
                className={inputClassName}
                placeholder="United States"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Saved Credentials */}
      <div
        className={`rounded-lg border ${isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-blue-100 bg-gray-50'} p-6 text-left shadow-sm`}>
        <h3 className={`mb-2 text-lg font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          {t('options_profile_credentials_header')}
        </h3>
        <p className={`mb-4 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          {t('options_profile_credentials_description')}
        </p>

        {/* Existing Credentials */}
        {profile.credentials && profile.credentials.length > 0 && (
          <div className="mb-4 space-y-2">
            {profile.credentials.map((cred: StoredCredential) => (
              <div
                key={cred.id}
                className={`flex items-center justify-between rounded-md p-3 ${isDarkMode ? 'bg-slate-700' : 'bg-white'}`}>
                <div className="flex-1">
                  <div className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{cred.site}</div>
                  <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{cred.username}</div>
                  <div className={`text-sm font-mono ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {visiblePasswords.has(cred.id) ? cred.password : '••••••••'}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility(cred.id)}
                    className={`rounded p-1 ${isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}>
                    {visiblePasswords.has(cred.id) ? '🔒' : '👁'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteCredential(cred.id)}
                    className={`rounded p-1 ${isDarkMode ? 'text-red-400 hover:text-red-300' : 'text-red-500 hover:text-red-700'}`}>
                    🗑
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add New Credential */}
        {showAddCredential ? (
          <div
            className={`space-y-3 rounded-md border p-4 ${isDarkMode ? 'border-slate-600 bg-slate-700' : 'border-gray-200 bg-gray-50'}`}>
            <div>
              <label className={`mb-1 block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {t('options_profile_credentials_site')}
              </label>
              <input
                type="text"
                value={newCredential.site}
                onChange={e => setNewCredential(prev => ({ ...prev, site: e.target.value }))}
                className={inputClassName}
                placeholder="example.com"
              />
            </div>
            <div>
              <label className={`mb-1 block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {t('options_profile_credentials_username')}
              </label>
              <input
                type="text"
                value={newCredential.username}
                onChange={e => setNewCredential(prev => ({ ...prev, username: e.target.value }))}
                className={inputClassName}
                placeholder="username@email.com"
              />
            </div>
            <div>
              <label className={`mb-1 block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {t('options_profile_credentials_password')}
              </label>
              <input
                type="password"
                value={newCredential.password}
                onChange={e => setNewCredential(prev => ({ ...prev, password: e.target.value }))}
                className={inputClassName}
                placeholder="••••••••"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => {
                  setShowAddCredential(false);
                  setNewCredential({ site: '', username: '', password: '' });
                }}
                className={`rounded-md px-4 py-2 text-sm font-medium ${isDarkMode ? 'bg-slate-600 text-gray-200 hover:bg-slate-500' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                {t('common_cancel')}
              </button>
              <button
                type="button"
                onClick={handleAddCredential}
                disabled={!newCredential.site || !newCredential.username}
                className={`rounded-md px-4 py-2 text-sm font-medium ${isDarkMode ? 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-slate-500' : 'bg-blue-500 text-white hover:bg-blue-600 disabled:bg-gray-300'}`}>
                {t('common_add')}
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowAddCredential(true)}
            className={`w-full rounded-md border-2 border-dashed py-3 text-sm font-medium ${isDarkMode ? 'border-slate-600 text-gray-400 hover:border-slate-500 hover:text-gray-300' : 'border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-600'}`}>
            + {t('options_profile_credentials_add')}
          </button>
        )}
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          className={`rounded-md px-6 py-2 text-sm font-medium ${isDarkMode ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-blue-500 text-white hover:bg-blue-600'} ${isSaved ? 'bg-green-500 hover:bg-green-600' : ''}`}>
          {isSaved ? '✓ ' + t('options_profile_saved') : t('options_profile_btnSave')}
        </button>
      </div>
    </section>
  );
};
