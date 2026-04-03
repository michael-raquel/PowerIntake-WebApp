// context/SpartaAssistContext.jsx
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import { useAuth } from "@/context/AuthContext";
import { useMsal } from "@azure/msal-react";
import { useFetchUserSettings } from "@/hooks/UseFetchUserSettings";

const SpartaAssistContext = createContext(null);

export function SpartaAssistProvider({ children }) {
  const { account } = useAuth();
  const { accounts } = useMsal();
  const [spartaAssistEnabled, setSpartaAssistEnabled] = useState(null); // null = loading

  const entrauserid = useMemo(
    () => account?.localAccountId || accounts?.[0]?.localAccountId || "",
    [account?.localAccountId, accounts],
  );

  const { userSettings, loading } = useFetchUserSettings({ entrauserid });

  useEffect(() => {
    if (!entrauserid || loading || !userSettings || userSettings.length === 0)
      return;

    const settings = userSettings[0];
    if (settings.v_entrauserid !== entrauserid) return;

    const parseBool = (v) => {
      if (v === null || v === undefined) return false;
      if (typeof v === "boolean") return v;
      if (typeof v === "number") return v === 1;
      const str = String(v).toLowerCase();
      return str === "true" || str === "1";
    };

    setSpartaAssistEnabled(parseBool(settings.v_spartaassist));
  }, [entrauserid, userSettings, loading]);

  // Called by SettingsPage on toggle — instant UI update, no refetch needed
  const updateSpartaAssist = useCallback((value) => {
    setSpartaAssistEnabled(!!value);
  }, []);

  return (
    <SpartaAssistContext.Provider
      value={{ spartaAssistEnabled, updateSpartaAssist }}
    >
      {children}
    </SpartaAssistContext.Provider>
  );
}

export function useSpartaAssist() {
  const context = useContext(SpartaAssistContext);
  if (!context)
    throw new Error("useSpartaAssist must be used within SpartaAssistProvider");
  return context;
}
