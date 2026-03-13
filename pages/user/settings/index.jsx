'use client';
 
import { useState, useEffect } from 'react';
import { useMsal } from '@azure/msal-react';
import { useTheme } from 'next-themes';
import { useAuth } from '@/context/AuthContext';
import { useFetchUserSettings } from '@/hooks/UseFetchUserSettings';
import { useUpdateUserSettings } from '@/hooks/UseUpdateUserSettings';
import { Button } from '@/components/ui/button';
import { NotificationsSection, AssistSection, DarkModeSection } from './components/ComCards';
 
export default function SettingsPage() {
  const { accounts } = useMsal();
  const { account } = useAuth();
  const { setTheme } = useTheme();
  const [localSettings, setLocalSettings] = useState({});
  const [initialSettings, setInitialSettings] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [loadingToggles, setLoadingToggles] = useState({});
  const [settingsLoaded, setSettingsLoaded] = useState(false);  // ← new flag
 
  const entrauserid = account?.localAccountId || '';
 
  const { userSettings, loading, error, refetch } = useFetchUserSettings({ entrauserid });
  const { updateUserSettings, submitting } = useUpdateUserSettings();
 
  useEffect(() => {
    setMounted(true);
  }, []);
 
  useEffect(() => {
    if (userSettings && userSettings.length > 0) {
      const settings = userSettings[0];
      const parseBool = (v) => v === true || v === 'true';
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
  }, [userSettings]);
 
  const handleToggle = (setting) => {
    setLoadingToggles((prev) => ({ ...prev, [setting]: true }));
    setLocalSettings((prev) => ({
      ...prev,
      [setting]: !prev[setting],
    }));
    setTimeout(() => {
      setLoadingToggles((prev) => ({ ...prev, [setting]: false }));
    }, 500);
  };
 
  const handleDarkModeToggle = () => {
    const newDarkModeValue = !localSettings.darkmode;
    setLoadingToggles((prev) => ({ ...prev, darkmode: true }));
    setLocalSettings((prev) => ({
      ...prev,
      darkmode: newDarkModeValue,
    }));
    setTheme(newDarkModeValue ? 'dark' : 'light');
    setTimeout(() => {
      setLoadingToggles((prev) => ({ ...prev, darkmode: false }));
    }, 500);
  };
 
  const hasChanges = JSON.stringify(localSettings) !== JSON.stringify(initialSettings);
 
  const handleSave = async () => {
    try {
      setIsSaving(true);
      await updateUserSettings({
        ...localSettings,
        modifiedby: accounts?.[0]?.username || null,
      });
      await refetch();
      setInitialSettings(localSettings);
    } catch (err) {
    } finally {
      setIsSaving(false);
    }
  };
 
  const handleReset = async () => {
    try {
      setIsSaving(true);
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
      await refetch();
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
          <div className="flex gap-4">
            <Button
              onClick={handleSave}
              disabled={isSaving || submitting || !hasChanges}
              className="bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50"
            >
              {isSaving || submitting ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button
              onClick={handleReset}
              variant="outline"
              disabled={isSaving || submitting}
            >
              Reset
            </Button>
          </div>
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