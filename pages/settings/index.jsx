'use client';

import { useState, useEffect, useMemo } from 'react';
import { useMsal } from '@azure/msal-react';
import { useAuth } from '@/context/AuthContext';
import { useAppTheme } from '@/context/ThemeContext';
import { useSpartaAssist } from '@/context/SpartaAssistContext';
import { useFetchUserSettings } from '@/hooks/UseFetchUserSettings';
import { useUpdateUserSettings } from '@/hooks/UseUpdateUserSettings';
import { Button } from '@/components/ui/button';
import { ExternalLink, Settings } from 'lucide-react';
import { NotificationsSection, AssistSection, DarkModeSection } from '@/components/settings/ComCards';

export default function SettingsPage() {
  const { accounts } = useMsal();
  const { account } = useAuth();
  const { isDarkMode, toggleTheme } = useAppTheme();
  const { updateSpartaAssist } = useSpartaAssist();
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
      updateSpartaAssist(newSettings.spartaassist);
    }
  }, [userSettings, entrauserid, settingsLoaded, updateSpartaAssist]);

  useEffect(() => {
    if (settingsLoaded && localSettings.darkmode !== isDarkMode) {
      setLocalSettings(prev => ({ ...prev, darkmode: isDarkMode }));
    }
  }, [isDarkMode, settingsLoaded, localSettings.darkmode]);

  const handleToggle = async (setting, value) => {
    setLoadingToggles((prev) => ({ ...prev, [setting]: true }));
    const updatedSettings = { ...localSettings, [setting]: value };
    setLocalSettings(updatedSettings);

    if (setting === 'spartaassist') {
      updateSpartaAssist(value);
    }

    try {
      await updateUserSettings({
        ...updatedSettings,
        modifiedby: accounts?.[0]?.username || null,
      });
      setInitialSettings(updatedSettings);
    } catch {
      setLocalSettings(localSettings);
      if (setting === 'spartaassist') {
        updateSpartaAssist(localSettings.spartaassist);
      }
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
        outlook: false,
        teams: false,
        powersuiteai: false,
        spartaassist: false,
        darkmode: false,
        modifiedby: accounts?.[0]?.username || null,
      };
      setLocalSettings(resetSettings);
      setInitialSettings(resetSettings);
      updateSpartaAssist(false);
      await updateUserSettings(resetSettings);
      if (isDarkMode) await toggleTheme();
    } catch {
    } finally {
      setIsSaving(false);
    }
  };

  const isReady = settingsLoaded && !loading && !error;
  const showLoading = loading || !settingsLoaded;

  return (
    <div className="min-h-[100dvh] flex flex-col p-4 pb-0">
      <div className="flex flex-col gap-4 flex-1">

        <div className="px-4 bg-gradient-to-l from-pink-500 to-violet-800 rounded-xl py-5 flex-shrink-0 shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-inner">
                <Settings className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-black text-xl sm:text-2xl text-white tracking-tight">Settings</h2>
                <p className="text-xs text-white/60 mt-0.5">Manage notifications, assist tools, and theme preferences</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
          <div className="space-y-8">
            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-200">
                Error: {error}
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
                className="bg-white text-gray-900 border-gray-300 hover:bg-gray-100 dark:bg-gray-900 dark:text-white dark:border-gray-600 dark:hover:bg-gray-800 appearance-none"
                disabled={!isReady || isSaving || submitting}
              >
                Reset
              </Button>
            </div>
          </div>
        </div>

      </div>

      <footer className="mt-4 border-t border-gray-200 dark:border-gray-800">
        <div className="px-6 py-2 flex flex-col sm:flex-row items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2 shrink-0 order-1 sm:order-1">
            <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0" />
            <p className="text-sm font-semibold text-gray-900 dark:text-white tracking-tight whitespace-nowrap">Sparta Services, LLC</p>
          </div>
          <div className="flex items-center gap-1 shrink-0 order-2 sm:order-3 sm:pr-14">
            <div className="hidden sm:flex items-center gap-1">
              {[
                { href: 'https://www.spartaserv.com/terms-conditions', label: 'Terms' },
                { href: 'https://Portal.SpartaServ.com', label: 'Portal' },
                { href: 'https://www.spartaserv.com/privacy-policy', label: 'Privacy Policy' },
                { href: 'https://www.spartaserv.com', label: 'SpartaServ.com' },
              ].map((link, i, arr) => (
                <span key={link.label} className="flex items-center">
                  <a href={link.href} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-purple-600 dark:text-purple-400 underline underline-offset-2 decoration-purple-300 dark:decoration-purple-700 hover:decoration-purple-600 dark:hover:decoration-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/30 transition-all whitespace-nowrap">
                    {link.label}<ExternalLink className="w-2.5 h-2.5 opacity-70 shrink-0" />
                  </a>
                  {i < arr.length - 1 && <span className="w-px h-3 bg-gray-300 dark:bg-gray-700 mx-0.5 shrink-0" />}
                </span>
              ))}
            </div>
            <div className="grid sm:hidden grid-cols-2 gap-x-0 gap-y-0">
              {[
                { href: 'https://www.spartaserv.com/terms-conditions', label: 'Terms' },
                { href: 'https://Portal.SpartaServ.com', label: 'Portal' },
                { href: 'https://www.spartaserv.com/privacy-policy', label: 'Privacy Policy' },
                { href: 'https://www.spartaserv.com', label: 'SpartaServ.com' },
              ].map((link, i) => (
                <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer"
                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs font-medium text-purple-600 dark:text-purple-400 underline underline-offset-2 decoration-purple-300 dark:decoration-purple-700 hover:decoration-purple-600 dark:hover:decoration-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/30 transition-all whitespace-nowrap ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                  {link.label}<ExternalLink className="w-2.5 h-2.5 opacity-70 shrink-0" />
                </a>
              ))}
            </div>
          </div>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 whitespace-nowrap order-3 sm:order-2">
            &copy; {new Date().getFullYear()} Sparta Services, LLC. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}