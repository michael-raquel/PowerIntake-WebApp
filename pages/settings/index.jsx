'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useMsal } from '@azure/msal-react';
import { useAuth } from '@/context/AuthContext';
import { useAppTheme } from '@/context/ThemeContext';
import { useSpartaAssist } from '@/context/SpartaAssistContext';
import { useFetchUserSettings } from '@/hooks/UseFetchUserSettings';
import { useUpdateUserSettings } from '@/hooks/UseUpdateUserSettings';
import useManagerCheck from '@/hooks/UseManagerCheck';
import { Button } from '@/components/ui/button';
import { ChevronDown, ExternalLink, Settings } from 'lucide-react';
import { AssistSection, DarkModeSection } from '@/components/settings/ComCards';
import { TUTORIAL_IDS, getScheduledTutorialIds, setTutorialScheduled } from '@/lib/tutorialSteps/userTutorial';
import { Switch } from '@/components/ui/switch';

export default function SettingsPage() {
  const { accounts } = useMsal();
  const { account, tokenInfo } = useAuth();
  const { isManager } = useManagerCheck();
  const { isDarkMode, toggleTheme } = useAppTheme();
  const { updateSpartaAssist } = useSpartaAssist();
  const [localSettings, setLocalSettings] = useState({});
  const [initialSettings, setInitialSettings] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [loadingToggles, setLoadingToggles] = useState({});
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [tutorialsOpen, setTutorialsOpen] = useState(false);
  const [scheduledTutorialIds, setScheduledTutorialIds] = useState([]);

  const roles = tokenInfo?.account?.roles ?? [];
  const isSuperAdmin = roles.includes('SuperAdmin');
  const isAdmin = isSuperAdmin || roles.includes('Admin');
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

  const tutorialOptions = useMemo(() => {
    const base = [
      {
        id: TUTORIAL_IDS.HOME,
        label: 'Home Page',
        description: 'Get familiar with the dashboard, view your ticket statistics at a glance and quickly jump to your most recent active tickets.',
        href: '/',
      },
      {
        id: TUTORIAL_IDS.CREATE,
        label: 'Create Ticket',
        description: 'Learn how to submit a support request, enter your incident details, schedule a support call, and attach any relevant files before submitting.',
        href: '/ticket?create=true',
      },
      {
        id: TUTORIAL_IDS.TICKET_LIST,
        label: 'Ticket List ',
        description: 'Learn the ticket tab bar, the ticket list, and the sample row used to open the ticket details flow.',
        href: '/ticket',
      },
      {
        id: TUTORIAL_IDS.TICKET_OPENING,
        label: 'Ticket Opening ',
        description: 'Learn the full ticket details view, the panel rail, and the reactivate action.',
        href: '/ticket',
      },
    ];

    if (isManager || isAdmin) {
      base.push({
        id: TUTORIAL_IDS.MANAGE,
        label: 'Manage Page',
        description: 'Learn how to oversee your team\'s tickets, review company users, and monitor activity across your organization.',
        href: '/manage',
      });
    }

    return base;
  }, [isManager, isAdmin]);

  useEffect(() => {
    setScheduledTutorialIds(getScheduledTutorialIds(entrauserid));
  }, [entrauserid]);

  const handleToggleTutorial = useCallback((tutorialId, value) => {
    if (!tutorialId) return;
    setTutorialScheduled(entrauserid, tutorialId, value);
    setScheduledTutorialIds(getScheduledTutorialIds(entrauserid));
  }, [entrauserid]);

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
                <p className="text-xs text-white/60 mt-0.5">Manage assist tools and theme preferences</p>
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
            {/*
            <NotificationsSection
              localSettings={localSettings}
              onToggle={handleToggle}
              loadingToggles={loadingToggles}
              isLoading={loading}
            />
            */}
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

            <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-4 sm:p-5">
              <button
                type="button"
                onClick={() => setTutorialsOpen((prev) => !prev)}
                className="w-full flex items-center justify-between text-left"
              >
                <div>
                  <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
                    📖 Tutorials
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    These tutorials will help you get familiar with the key features of the application. You can revisit them at any time.
                  </p>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-gray-500 transition-transform ${tutorialsOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {tutorialsOpen && (
                <div className="mt-4 grid gap-2">
                  {tutorialOptions.map((option) => (
                    <div
                      key={option.id}
                      className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40 px-3 py-3 text-left transition-colors"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">{option.label}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{option.description}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-gray-600 dark:text-gray-300">{scheduledTutorialIds.includes(option.id) ? 'On' : 'Off'}</span>
                          <Switch
                            checked={scheduledTutorialIds.includes(option.id)}
                            onCheckedChange={(v) => handleToggleTutorial(option.id, !!v)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleReset}
                className="gap-1 sm:gap-2 shrink-0 bg-purple-600 hover:bg-purple-700 text-white px-2 sm:px-3 h-8 sm:h-10 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap"
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