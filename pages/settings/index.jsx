'use client';

import { useState, useEffect, useMemo } from 'react';
import { useMsal } from '@azure/msal-react';
import { useAuth } from '@/context/AuthContext';
import { useAppTheme } from '@/context/ThemeContext';
import { useFetchUserSettings } from '@/hooks/UseFetchUserSettings';
import { useUpdateUserSettings } from '@/hooks/UseUpdateUserSettings';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import { NotificationsSection, AssistSection, DarkModeSection } from '@/components/settings/ComCards';

export default function SettingsPage() {
  const { accounts } = useMsal();
  const { account } = useAuth();
  const { isDarkMode, toggleTheme } = useAppTheme();
  const [localSettings, setLocalSettings] = useState({});
  const [initialSettings, setInitialSettings] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [loadingToggles, setLoadingToggles] = useState({});
  const [settingsLoaded, setSettingsLoaded] = useState(false);

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
        outlook: parseBool(settings.v_outlook),
        teams: parseBool(settings.v_teams),
        powersuiteai: parseBool(settings.v_powersuiteai),
        spartaassist: parseBool(settings.v_spartaassist),
        darkmode: parseBool(settings.v_darkmode),
      };

      setLocalSettings(newSettings);
      setInitialSettings(newSettings);
      setSettingsLoaded(true);
    }
  }, [userSettings, entrauserid, settingsLoaded]);

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

  const handleDarkModeToggle = async () => {
    await toggleTheme();
  };

  const handleReset = async () => {
    setIsSaving(true);
    try {
      const resetSettings = {
        usersettingsuuid: localSettings.usersettingsuuid,
        outlook: true,
        teams: true,
        powersuiteai: true,
        spartaassist: true,
        darkmode: true,
        modifiedby: accounts?.[0]?.username || null,
      };
      setLocalSettings(resetSettings);
      setInitialSettings(resetSettings);
      await updateUserSettings(resetSettings);
      if (!isDarkMode) await toggleTheme();
    } catch {
    } finally {
      setIsSaving(false);
    }
  };

  const isReady = settingsLoaded && !loading && !error;
  const showLoading = loading || !settingsLoaded;

  return (
    <div className="min-h-screen flex flex-col p-4 md:p-6 pb-0 md:pb-0">
      <div className="flex-1 flex flex-col gap-4">

        <div className="px-2 bg-gradient-to-l from-pink-500 to-violet-800 rounded-lg py-4">
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

      <footer className="mt-4 border-t border-gray-200 dark:border-gray-800">
        <div className="px-6 py-3 flex flex-col sm:flex-row items-center sm:justify-between gap-4 relative">
          <p className="text-sm font-semibold text-gray-900 dark:text-white tracking-tight">
            Sparta Services, LLC
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap hidden sm:block absolute left-1/2 -translate-x-1/2">
            &copy; {new Date().getFullYear()} Sparta Services, LLC. All rights reserved.
          </p>
          <div className="flex flex-nowrap justify-center sm:justify-end sm:flex-wrap gap-x-3 sm:gap-x-6 gap-y-1 sm:gap-y-2 w-full sm:w-auto">
            <a href="https://www.spartaserv.com/terms-conditions" target="_blank" rel="noopener noreferrer"
              className="text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors flex items-center gap-1 shrink-0"
              style={{ fontSize: 'clamp(11px, 3vw, 14px)' }}>
              Terms
              <ExternalLink style={{ width: 'clamp(10px, 2.5vw, 12px)', height: 'clamp(10px, 2.5vw, 12px)' }} className="opacity-60 flex-shrink-0" />
            </a>
            <a href="https://www.spartaserv.com/privacy-policy" target="_blank" rel="noopener noreferrer"
              className="text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors flex items-center gap-1 shrink-0"
              style={{ fontSize: 'clamp(11px, 3vw, 14px)' }}>
              Privacy Policy
              <ExternalLink style={{ width: 'clamp(10px, 2.5vw, 12px)', height: 'clamp(10px, 2.5vw, 12px)' }} className="opacity-60 flex-shrink-0" />
            </a>
            <a href="https://www.spartaserv.com" target="_blank" rel="noopener noreferrer"
              className="text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors flex items-center gap-1 shrink-0"
              style={{ fontSize: 'clamp(11px, 3vw, 14px)' }}>
              spartaserv.com
              <ExternalLink style={{ width: 'clamp(10px, 2.5vw, 12px)', height: 'clamp(10px, 2.5vw, 12px)' }} className="opacity-60 flex-shrink-0" />
            </a>
            <a href="https://Portal.SpartaServ.com" target="_blank" rel="noopener noreferrer"
              className="text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors flex items-center gap-1 shrink-0"
              style={{ fontSize: 'clamp(11px, 3vw, 14px)' }}>
              Portal
              <ExternalLink style={{ width: 'clamp(10px, 2.5vw, 12px)', height: 'clamp(10px, 2.5vw, 12px)' }} className="opacity-60 flex-shrink-0" />
            </a>
          </div>
          <p className="text-[10px] text-gray-400 dark:text-gray-500 sm:hidden text-center">
            &copy; {new Date().getFullYear()} Sparta Services, LLC. All rights reserved.
          </p>
        </div>
      </footer>

    </div>
  );
}