'use client';
 
import { useState, useEffect, useMemo } from 'react';
import { useMsal } from '@azure/msal-react';
import { useAuth } from '@/context/AuthContext';
import { useAppTheme } from '@/context/ThemeContext';
import { useFetchUserSettings } from '@/hooks/UseFetchUserSettings';
import { useUpdateUserSettings } from '@/hooks/UseUpdateUserSettings';
import { Button } from '@/components/ui/button';
import { NotificationsSection, AssistSection, DarkModeSection } from '@/components/settings/ComCards';
 
export default function SettingsPage() {
  const { accounts } = useMsal();
  const { account } = useAuth();
  const { isDarkMode, toggleTheme } = useAppTheme();
  const [localSettings,   setLocalSettings]   = useState({});
  const [initialSettings, setInitialSettings] = useState({});
  const [isSaving,        setIsSaving]        = useState(false);
  const [loadingToggles,  setLoadingToggles]  = useState({});
  const [settingsLoaded,  setSettingsLoaded]  = useState(false);
 
  const entrauserid = useMemo(() => 
    account?.localAccountId || accounts?.[0]?.localAccountId || '', 
    [account?.localAccountId, accounts]
  );
 
  const { userSettings, loading, error } = useFetchUserSettings({ entrauserid });
  const { updateUserSettings, submitting } = useUpdateUserSettings();
 
  useEffect(() => {
    if (userSettings && userSettings.length > 0 && entrauserid && !settingsLoaded) {
      const settings = userSettings[0];
      if (settings.v_entrauserid !== entrauserid) return;

      const parseBool = (v) => {
        if (v === null || v === undefined) return false;
        if (typeof v === 'boolean') return v;
        if (typeof v === 'number') return v === 1;
        const str = String(v).toLowerCase();
        return str === 'true' || str === '1';
      };

      const newSettings = {
        usersettingsuuid: settings.v_usersettingsuuid,
        outlook:          parseBool(settings.v_outlook),
        teams:            parseBool(settings.v_teams),
        powersuiteai:     parseBool(settings.v_powersuiteai),
        spartaassist:     parseBool(settings.v_spartaassist),
        darkmode:         parseBool(settings.v_darkmode),
      };

      setLocalSettings(newSettings);
      setInitialSettings(newSettings);
      setSettingsLoaded(true);
    }
  }, [userSettings, entrauserid, settingsLoaded]);

  // Sync local darkmode state with global theme context
  useEffect(() => {
    if (settingsLoaded && localSettings.darkmode !== isDarkMode) {
      setLocalSettings(prev => ({ ...prev, darkmode: isDarkMode }));
    }
  }, [isDarkMode, settingsLoaded]);

  const handleToggle = async (setting, value) => {
    setLoadingToggles((prev) => ({ ...prev, [setting]: true }));
    const updatedSettings = { ...localSettings, [setting]: value };
    setLocalSettings(updatedSettings);
    try {
      await updateUserSettings({
        ...updatedSettings,
        modifiedby: accounts?.[0]?.username || null,
      });
      setInitialSettings(updatedSettings);
    } catch {
      setLocalSettings(localSettings);
    } finally {
      setLoadingToggles((prev) => ({ ...prev, [setting]: false }));
    }
  };
  const handleDarkModeToggle = async (value) => {
    await toggleTheme();
  };
 
  const handleReset = async () => {
    setIsSaving(true);
    try {
      const resetSettings = {
        usersettingsuuid: localSettings.usersettingsuuid,
        outlook:          true,
        teams:            true,
        powersuiteai:     true,
        spartaassist:     true,
        darkmode:         true,
        modifiedby:       accounts?.[0]?.username || null,
      };
      setLocalSettings(resetSettings);
      setInitialSettings(resetSettings);
      await updateUserSettings(resetSettings);
      if (!isDarkMode) {
        await toggleTheme();
      }
    } catch {
    } finally {
      setIsSaving(false);
    }
  };
 
  const isReady = settingsLoaded && !loading && !error;
  const showLoading = loading || !settingsLoaded;
 
  return (
    <div className="p-6 rounded-lg">
      <div className="mb-4 px-2 bg-gradient-to-l from-pink-500 to-violet-800 rounded-lg py-4">
        <h2 className="font-bold text-sm sm:text-lg text-white">Settings</h2>
        <p className="text-xs sm:text-sm text-gray-200 mt-1">
          Manage notifications, assist tools, and theme preferences
        </p>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <div className="space-y-8">
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-200">
              Error: {error}
            </div>
          )}
          {showLoading && !error && (
            <div className="text-sm text-gray-600 dark:text-gray-300">
              Loading settings...
            </div>
          )}
          <NotificationsSection
            localSettings={localSettings}
            onToggle={handleToggle}
            loadingToggles={loadingToggles}
            isLoading={loading}
          />
          <AssistSection
            localSettings={localSettings}
            onToggle={handleToggle}
            loadingToggles={loadingToggles}
            isLoading={loading}
          />
          <DarkModeSection
            localSettings={localSettings}
            onToggle={handleDarkModeToggle}
            loadingToggles={loadingToggles}
            isLoading={loading}
          />
          <div className="flex justify-end">
            <Button
              onClick={handleReset}
              variant="outline"
              disabled={!isReady || isSaving || submitting}
            >
              Reset
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}