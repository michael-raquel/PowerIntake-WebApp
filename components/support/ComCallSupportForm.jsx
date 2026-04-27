"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Phone, PhoneOff, Mic, MicOff, Loader2 } from "lucide-react";
import { useACSCalling } from "@/hooks/UseACSCalling";

const CONTACTS = [
  { label: "Toll-Free", number: "+18776553469", display: "+1 877-655-3469" },
  { label: "Local",     number: "+14256553468", display: "+1 425-655-3468" },
];

const STATE_CONFIG = {
  idle:         { label: "Ready to call",  color: "text-gray-500 dark:text-gray-400",      dot: "bg-gray-400"                },
  connecting:   { label: "Connecting…",    color: "text-amber-500 dark:text-amber-400",     dot: "bg-amber-400 animate-pulse" },
  connected:    { label: "Call connected", color: "text-emerald-600 dark:text-emerald-400", dot: "bg-emerald-500"             },
  disconnected: { label: "Call ended",     color: "text-red-500 dark:text-red-400",         dot: "bg-red-400"                 },
};

export default function ComCallSupportForm({ open, onClose }) {
  const {
    callState, isMuted, duration,
    loading, error,
    fetchACSConfig, startCall, endCall, toggleMute,
  } = useACSCalling();

  const [selected,  setSelected]  = useState(CONTACTS[0]);
  const [acsNumber, setAcsNumber] = useState(null);
  const [cfgError,  setCfgError]  = useState(null);

  const stateInfo = STATE_CONFIG[callState] ?? STATE_CONFIG.idle;
  const isOnCall  = ["connecting", "connected"].includes(callState);

  // Load config when dialog opens
  useEffect(() => {
    if (!open) return;
    fetchACSConfig()
      .then((data) => { if (data?.acsPhoneNumber) setAcsNumber(data.acsPhoneNumber); })
      .catch(() => setCfgError("Failed to load call configuration."));
  }, [open, fetchACSConfig]);

  // Block closing while on a call
  const handleClose = useCallback(() => {
    if (isOnCall) return;
    onClose();
  }, [isOnCall, onClose]);

  // Don't render anything if closed
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-800 dark:bg-gray-900"
        onClick={(e) => e.stopPropagation()}
      >

        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-300">
              <Phone className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Call Support Team</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Speak with our MSP experts</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isOnCall}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed dark:hover:bg-gray-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Status */}
        <div className="flex items-center gap-2 mb-5">
          <span className={`h-2 w-2 rounded-full ${stateInfo.dot}`} />
          <span className={`text-sm font-medium ${stateInfo.color}`}>{stateInfo.label}</span>
          {callState === "connected" && (
            <span className="ml-auto font-mono text-sm text-emerald-600 dark:text-emerald-400">{duration}</span>
          )}
        </div>

        {/* Number selector */}
        <div className="mb-4">
          <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Select Number
          </label>
          <div className="flex gap-2">
            {CONTACTS.map((contact) => (
              <button
                key={contact.number}
                type="button"
                disabled={isOnCall}
                onClick={() => setSelected(contact)}
                className={`flex-1 rounded-xl border px-3 py-2.5 text-left transition-all disabled:cursor-not-allowed disabled:opacity-50
                  ${selected.number === contact.number
                    ? "border-orange-400 bg-orange-50 dark:border-orange-500 dark:bg-orange-900/20"
                    : "border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800"
                  }`}
              >
                <p className={`text-xs font-semibold ${selected.number === contact.number ? "text-orange-600 dark:text-orange-400" : "text-gray-500 dark:text-gray-400"}`}>
                  {contact.label}
                </p>
                <p className={`mt-0.5 text-sm font-medium ${selected.number === contact.number ? "text-orange-700 dark:text-orange-300" : "text-gray-800 dark:text-gray-200"}`}>
                  {contact.display}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Caller ID */}
        <div className="mb-4 flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3 dark:bg-gray-800/60">
          <span className="text-xs text-gray-500 dark:text-gray-400">Calling from</span>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {acsNumber ?? "Loading…"}
          </span>
        </div>

        {/* Error */}
        {(error || cfgError) && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 dark:border-red-800 dark:bg-red-900/20">
            <p className="text-sm text-red-600 dark:text-red-400">{error || cfgError}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {!isOnCall ? (
            <button
              type="button"
              onClick={() => startCall(selected.number)}
              disabled={loading || !acsNumber || !!cfgError}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-purple-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-purple-700 dark:hover:bg-purple-600 cursor-pointer"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Phone className="h-4 w-4" />}
              {loading ? "Loading…" : `Call ${selected.label}`}
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={endCall}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-500 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-red-600 active:scale-95"
              >
                <PhoneOff className="h-4 w-4" />
                Hang Up
              </button>
              <button
                type="button"
                onClick={toggleMute}
                disabled={callState !== "connected"}
                className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-50
                  ${isMuted
                    ? "bg-amber-500 hover:bg-amber-600"
                    : "bg-gray-500 hover:bg-gray-600"
                  }`}
              >
                {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                {isMuted ? "Unmute" : "Mute"}
              </button>
            </>
          )}
        </div>

        {/* Footer notice */}
        <div className="mt-4 space-y-1 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">Mon–Fri, 5AM–5PM PST · Available 24/7 after hours</p>
          {/* <p className="text-[11px] text-amber-500 dark:text-amber-400">Trial number active — upgrade to call any number</p> */}
        </div>

      </div>
    </div>
  );
}
