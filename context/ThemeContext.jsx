import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { useAuth } from '@/context/AuthContext';
import { useMsal } from '@azure/msal-react';
import { useFetchUserSettings } from '@/hooks/UseFetchUserSettings';
import { useUpdateUserSettings } from '@/hooks/UseUpdateUserSettings';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const { setTheme, resolvedTheme } = useTheme();
  const { account } = useAuth();
  const { accounts } = useMsal();
  const [isInitialized, setIsInitialized] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const entrauserid = account?.localAccountId || accounts?.[0]?.localAccountId || '';
  const { userSettings, loading } = useFetchUserSettings({ entrauserid });
  const { updateUserSettings } = useUpdateUserSettings();

  useEffect(() => {
    if (!entrauserid || loading || isInitialized) return;
    
    if (userSettings && userSettings.length > 0) {
      const settings = userSettings[0];
      if (settings.v_entrauserid === entrauserid) {
        const parseBool = (v) => {
          if (v === null || v === undefined) return false;
          if (typeof v === 'boolean') return v;
          if (typeof v === 'number') return v === 1;
          const str = String(v).toLowerCase();
          return str === 'true' || str === '1';
        };
        
        const isDarkMode = parseBool(settings.v_darkmode);
        setTheme(isDarkMode ? 'dark' : 'light');
        setIsInitialized(true);
      }
    }
  }, [entrauserid, userSettings, loading, isInitialized, setTheme]);

  const toggleTheme = useCallback(async () => {
    if (isUpdating || !userSettings || userSettings.length === 0) return;
    
    setIsUpdating(true);
    const newTheme = resolvedTheme === 'dark' ? 'light' : 'dark';
    
    setTheme(newTheme);
    
    try {
      const settings = userSettings[0];
      const parseBool = (v) => {
        if (v === null || v === undefined) return false;
        if (typeof v === 'boolean') return v;
        if (typeof v === 'number') return v === 1;
        const str = String(v).toLowerCase();
        return str === 'true' || str === '1';
      };
      
      const updatedSettings = {
        usersettingsuuid: settings.v_usersettingsuuid,
        outlook: parseBool(settings.v_outlook),
        teams: parseBool(settings.v_teams),
        powersuiteai: parseBool(settings.v_powersuiteai),
        spartaassist: parseBool(settings.v_spartaassist),
        darkmode: newTheme === 'dark',
        modifiedby: accounts?.[0]?.username || null,
      };
      
      await updateUserSettings(updatedSettings);
    } catch (error) {
      //console.error('ThemeContext - database update failed:', error);
      setTheme(resolvedTheme);
    } finally {
      setIsUpdating(false);
    }
  }, [resolvedTheme, setTheme, userSettings, accounts, updateUserSettings, isUpdating]);

  const value = {
    isDarkMode: resolvedTheme === 'dark',
    toggleTheme,
    isUpdating,
    isInitialized,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useAppTheme must be used within ThemeProvider');
  }
  return context;
}
