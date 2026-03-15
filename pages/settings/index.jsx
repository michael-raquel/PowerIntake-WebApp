'use client';
 
import { useState, useEffect, useMemo } from 'react';
import { useMsal } from '@azure/msal-react';
import { useTheme } from 'next-themes';
import { useAuth } from '@/context/AuthContext';
import { useFetchUserSettings } from '@/hooks/UseFetchUserSettings';
import { useUpdateUserSettings } from '@/hooks/UseUpdateUserSettings';
import { Button } from '@/components/ui/button';
import { NotificationsSection, AssistSection, DarkModeSection } from '@/components/settings/ComCards';
 
export default function SettingsPage() {
  const { accounts } = useMsal();
  const { account } = useAuth();
  const { setTheme } = useTheme();
  const { theme, resolvedTheme } = useTheme();
  const [localSettings, setLocalSettings] = useState({});
  const [initialSettings, setInitialSettings] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [loadingToggles, setLoadingToggles] = useState({});
  const [settingsLoaded, setSettingsLoaded] = useState(false);
 
  const entrauserid = useMemo(() => 
    account?.localAccountId || accounts?.[0]?.localAccountId || '', 
    [account?.localAccountId, accounts]
  );
 
  const { userSettings, loading, error, refetch } = useFetchUserSettings({ entrauserid });
  const { updateUserSettings, submitting } = useUpdateUserSettings();
 
  useEffect(() => {
    setMounted(true);
  }, []);
 
  useEffect(() => {
    if (userSettings && userSettings.length > 0 && entrauserid && !settingsLoaded) {
      const settings = userSettings[0];
      if (settings.v_entrauserid !== entrauserid) {
        return;
      }
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
      if (newSettings.darkmode) {
        setTheme('dark');
      } else {
        setTheme('light');
      }
    }
  }, [userSettings, setTheme, entrauserid, settingsLoaded]);
 
  useEffect(() => {
    if (settingsLoaded && mounted && localSettings.usersettingsuuid) {
      const isDark = resolvedTheme === 'dark';
      if (localSettings.darkmode !== isDark) {
        const updatedSettings = {
          ...localSettings,
          darkmode: isDark,
        };
        setLocalSettings(updatedSettings);
        updateUserSettings({
          ...updatedSettings,
          modifiedby: accounts?.[0]?.username || null,
        }).then(() => {
          setInitialSettings(updatedSettings);
        }).catch(() => {});
      }
    }
  }, [resolvedTheme, settingsLoaded, mounted, localSettings.usersettingsuuid, localSettings.darkmode, accounts, updateUserSettings]);

  const handleToggle = async (setting, value) => {
    setLoadingToggles((prev) => ({ ...prev, [setting]: true }));
    const updatedSettings = {
      ...localSettings,
      [setting]: value,
    };
    setLocalSettings(updatedSettings);
    try {
      await updateUserSettings({
        ...updatedSettings,
        modifiedby: accounts?.[0]?.username || null,
      });
      setInitialSettings(updatedSettings);
    } catch (err) {
      setLocalSettings(localSettings);
    } finally {
      setLoadingToggles((prev) => ({ ...prev, [setting]: false }));
    }
  };
 
  const handleDarkModeToggle = async (value) => {
    setLoadingToggles((prev) => ({ ...prev, darkmode: true }));
    const updatedSettings = {
      ...localSettings,
      darkmode: value,
    };
    setLocalSettings(updatedSettings);
    setTheme(value ? 'dark' : 'light');
    try {
      await updateUserSettings({
        ...updatedSettings,
        modifiedby: accounts?.[0]?.username || null,
      });
      setInitialSettings(updatedSettings);
    } catch (err) {
      setLocalSettings(localSettings);
      setTheme(localSettings.darkmode ? 'dark' : 'light');
    } finally {
      setLoadingToggles((prev) => ({ ...prev, darkmode: false }));
    }
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
      setTheme('dark');
      await updateUserSettings(resetSettings);
    } catch (err) {
    } finally {
      setIsSaving(false);
    }
  };
 
  if (!mounted) return null;
  if (loading) return <div className="p-8">Loading settings...</div>;
  if (error) return <div className="p-8 text-red-500">Error: {error}</div>;
  if (!settingsLoaded) return <div className="p-8">Loading settings...</div>;
 
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Settings</h1>
          <Button
            onClick={handleReset}
            variant="outline"
            disabled={isSaving || submitting}
          >
            Reset
          </Button>
        </div>
 
        <div className="space-y-8">
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
        </div>
      </div>
    </div>
  );
}
