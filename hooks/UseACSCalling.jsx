"use client";

import { useState, useRef, useCallback } from "react";
import { useMsal } from "@azure/msal-react";
import { apiRequest } from "@/lib/msalConfig";
import { Device } from "@twilio/voice-sdk";

export function useACSCalling() {
  const { instance, accounts } = useMsal();

  const [device,      setDevice]      = useState(null);
  const [currentCall, setCurrentCall] = useState(null);
  const [callState,   setCallState]   = useState("idle");
  const [isMuted,     setIsMuted]     = useState(false);
  const [duration,    setDuration]    = useState(0);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState(null);

  const timerRef = useRef(null);

  // ── Get MSAL access token ─────────────────────────────────────────────────
  const getAccessToken = useCallback(async () => {
    if (!accounts?.[0]) return null;
    const token = await instance.acquireTokenSilent({
      ...apiRequest,
      account: accounts[0],
    });
    return token?.accessToken ?? null;
  }, [accounts, instance]);

  // ── Fetch Twilio config (replaces fetchACSConfig) ─────────────────────────
  // Keeps same name so ComCallSupportForm.jsx needs no changes
  const fetchACSConfig = useCallback(async () => {
    if (!accounts?.[0]) return;
    try {
      setLoading(true);
      setError(null);

      const accessToken = await getAccessToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/twilio/config`, {
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
      });

      if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);

      const data = await res.json();

      // Map twilioPhoneNumber → acsPhoneNumber so the UI shows it correctly
      return { ...data, acsPhoneNumber: data.twilioPhoneNumber };

    } catch (err) {
      setError(err.message || "Failed to fetch config");
    } finally {
      setLoading(false);
    }
  }, [accounts, getAccessToken]);

  // ── Fetch Twilio token ────────────────────────────────────────────────────
  const fetchTwilioToken = useCallback(async () => {
    const accessToken = await getAccessToken();
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/twilio/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
    });
    if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
    const data = await res.json();
    return data.token;
  }, [getAccessToken]);

  // ── Timer helpers ─────────────────────────────────────────────────────────
  const startTimer = useCallback(() => {
    setDuration(0);
    timerRef.current = setInterval(() => setDuration((p) => p + 1), 1000);
  }, []);

  const stopTimer = useCallback(() => {
    clearInterval(timerRef.current);
    setDuration(0);
  }, []);

  const formatDuration = () => {
    const m = String(Math.floor(duration / 60)).padStart(2, "0");
    const s = String(duration % 60).padStart(2, "0");
    return `${m}:${s}`;
  };

  // ── Start call ────────────────────────────────────────────────────────────
  const startCall = useCallback(async (toNumber) => {
    // toNumber = the Dynamics number to call
    // fromNumber param is no longer needed — Twilio handles it via TwiML
    if (!accounts?.[0]) { setError("No authenticated user found"); return; }

    try {
      setError(null);
      setCallState("connecting");
      setLoading(true);

      // 1. Get Twilio token and create Device
      const token = await fetchTwilioToken();
      const twilioDevice = new Device(token, {
        logLevel: 1,
        codecPreferences: ["opus", "pcmu"],
      });

      // 2. Wait for device to be ready
      await new Promise((resolve, reject) => {
        twilioDevice.on("registered", resolve);
        twilioDevice.on("error", reject);
        twilioDevice.register();
      });

      setDevice(twilioDevice);

      // 3. Make the call — Twilio sends To to your /twilio/voice endpoint
      const call = await twilioDevice.connect({
        params: { To: toNumber },
      });

      // 4. Attach state listeners
      call.on("accept",      () => { setCallState("connected"); startTimer(); setLoading(false); });
      call.on("disconnect",  () => { stopTimer(); setCurrentCall(null); setCallState("idle"); setIsMuted(false); setDevice(null); });
      call.on("error",       (err) => { setError(err.message || "Call error"); setCallState("idle"); setLoading(false); });
      call.on("cancel",      () => { setCallState("idle"); setLoading(false); });

      setCurrentCall(call);

    } catch (err) {
      console.error("startCall error:", err);
      setError(err.message || "Failed to start call");
      setCallState("idle");
      setLoading(false);
    }
  }, [accounts, fetchTwilioToken, startTimer, stopTimer]);

  // ── End call ──────────────────────────────────────────────────────────────
  const endCall = useCallback(() => {
    if (!currentCall) return;
    try {
      currentCall.disconnect();
      stopTimer();
      setCurrentCall(null);
      setCallState("idle");
      setIsMuted(false);
      if (device) {
        device.destroy();
        setDevice(null);
      }
    } catch (err) {
      setError(err.message || "Failed to end call");
    }
  }, [currentCall, device, stopTimer]);

  // ── Mute toggle ───────────────────────────────────────────────────────────
  const toggleMute = useCallback(() => {
    if (!currentCall) return;
    try {
      const muted = !isMuted;
      currentCall.mute(muted);
      setIsMuted(muted);
    } catch (err) {
      setError(err.message || "Failed to toggle mute");
    }
  }, [currentCall, isMuted]);

  return {
    callState,
    isMuted,
    duration: formatDuration(),
    config: null,
    loading,
    error,
    fetchACSConfig,  // ← same name, no changes needed in ComCallSupportForm
    startCall,
    endCall,
    toggleMute,
  };
}