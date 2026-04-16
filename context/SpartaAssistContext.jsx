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
  const [spartaAssistEnabled, setSpartaAssistEnabled] = useState(null);

  const entrauserid = useMemo(
    () => account?.localAccountId || accounts?.[0]?.localAccountId || "",
    [account?.localAccountId, accounts],
  );

  const userEmail = account?.username || accounts?.[0]?.username || "";

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

    setTimeout(
      () => setSpartaAssistEnabled(parseBool(settings.v_spartaassist)),
      0,
    );
  }, [entrauserid, userSettings, loading]);

  // Set email globally before widget mounts so lcw:ready always has it
  useEffect(() => {
    if (!userEmail) return;
    window.__lcwContextEmail = userEmail;
  }, [userEmail]);

  const updateSpartaAssist = useCallback((value) => {
    setSpartaAssistEnabled(!!value);
  }, []);

  return (
    <SpartaAssistContext.Provider
      value={{ spartaAssistEnabled, updateSpartaAssist, userEmail }}
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
