"use client";

import { RefreshCw } from "lucide-react";

const STATUS_COLORS = {
  Active:
    "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800/40",
  Inactive:
    "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800/40",
};

const CONSENT_COLORS = {
  Consented:
    "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/40",
  "Not Consented":
    "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/40",
};

const getPillClass = (map, key) =>
  map[key] ||
  "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700";

const readField = (tenant, keys, fallback = "-") => {
  for (const key of keys) {
    const value = tenant?.[key];
    if (value !== null && value !== undefined && String(value).trim() !== "") {
      return value;
    }
  }
  return fallback;
};

const normalizeBoolean = (value) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const lowered = value.trim().toLowerCase();
    if (["true", "1", "yes", "y", "active", "consented"].includes(lowered))
      return true;
    if (
      ["false", "0", "no", "n", "inactive", "not consented"].includes(lowered)
    )
      return false;
  }
  return null;
};

const formatDate = (value) => {
  if (!value || value === "-") return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatTime = (value) => {
  if (!value || value === "-") return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

export default function ComCard({ tenant = {}, onClick, isSyncing = false }) {
  const tenantName = readField(tenant, ["v_tenantname", "tenantname"], "-");
  const entraTenantId = readField(
    tenant,
    ["v_entratenantid", "entratenantid"],
    "-",
  );
  const userGroupId = readField(tenant, ["v_usergroupid", "usergroupid"], "-");
  const tenantEmail = readField(tenant, ["v_tenantemail", "tenantemail"], "-");
  const createdAt = readField(tenant, ["v_createdat", "createdat"], null);

  const isActive = normalizeBoolean(
    readField(tenant, ["v_isactive", "isactive"], null),
  );
  const isConsented = normalizeBoolean(
    readField(tenant, ["v_isconsented", "isconsented"], null),
  );

  const statusLabel =
    isActive === null ? "Unknown" : isActive ? "Active" : "Inactive";
  const consentLabel =
    isConsented === null
      ? "Unknown"
      : isConsented
        ? "Consented"
        : "Not Consented";

  const handleKeyDown = (event) => {
    if (!onClick || isSyncing) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onClick();
    }
  };

  const tenantInitial =
    tenantName !== "-" ? String(tenantName).charAt(0).toUpperCase() : "?";

  return (
    <div
      onClick={isSyncing ? undefined : onClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={isSyncing ? -1 : 0}
      className={`rounded-xl border overflow-hidden w-full transition-all duration-200 ${
        isSyncing
          ? "border-violet-300 dark:border-violet-800 cursor-wait opacity-80 bg-white dark:bg-gray-800"
          : "border-gray-200 dark:border-gray-700 hover:border-violet-300 dark:hover:border-violet-700 hover:shadow-md cursor-pointer bg-white dark:bg-gray-800"
      }`}
    >
      <div className="flex items-center gap-2 px-3 py-2.5 bg-violet-50 dark:bg-violet-900/20 border-b border-violet-100 dark:border-violet-800/40">
        {isSyncing ? (
          <div className="w-6 h-6 rounded-md bg-violet-200 dark:bg-violet-800/50 animate-pulse shrink-0" />
        ) : (
          <div className="w-6 h-6 rounded-md bg-violet-600 dark:bg-violet-500 flex items-center justify-center text-white text-xs font-bold shrink-0 select-none">
            {tenantInitial}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <span className="text-sm font-semibold text-violet-600 dark:text-violet-300 leading-snug wrap-break-word">
            {tenantName}
          </span>
          <p className="text-[11px] text-violet-500/80 dark:text-violet-300/70 truncate">
            {tenantEmail}
          </p>
        </div>
        {isSyncing && (
          <span className="inline-flex items-center gap-1 text-violet-500 dark:text-violet-400 text-[10px] font-medium shrink-0">
            <RefreshCw className="w-3 h-3 animate-spin" />
            Saving...
          </span>
        )}
      </div>

      <div className="px-3 pt-2.5 pb-0">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span
            className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${getPillClass(
              STATUS_COLORS,
              statusLabel,
            )}`}
          >
            {statusLabel}
          </span>
          <span
            className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${getPillClass(
              CONSENT_COLORS,
              consentLabel,
            )}`}
          >
            {consentLabel}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-1.5 mb-2.5">
          <div className="bg-gray-50 dark:bg-gray-900/60 rounded-md px-2.5 py-1.5 min-w-0 border border-gray-100 dark:border-gray-700/50">
            <p className="text-[9px] text-gray-400 dark:text-gray-500 mb-0.5 uppercase tracking-wider">
              Entra Tenant ID
            </p>
            <p className="text-[11px] font-medium truncate text-gray-800 dark:text-gray-200">
              {entraTenantId}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between px-3 py-2 bg-gray-50/70 dark:bg-gray-800/40 border-t border-gray-100/80 dark:border-gray-700/40 gap-2">
        <span className="text-[9px] text-gray-400 dark:text-gray-500 truncate">
          {formatDate(createdAt)}{" "}
          {createdAt ? `· ${formatTime(createdAt)}` : ""}
        </span>
        <span
          className={`text-[9px] font-semibold whitespace-nowrap shrink-0 ${
            isSyncing
              ? "text-violet-300 dark:text-violet-500"
              : "text-violet-500 dark:text-violet-400"
          }`}
        >
          {isSyncing ? "Please wait..." : "View details ->"}
        </span>
      </div>
    </div>
  );
}
