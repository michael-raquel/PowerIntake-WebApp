import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useFetchNotification } from "@/hooks/UseFetchNotification";
import socket from "@/lib/socket";

const MAX_BADGE_COUNT = 99;
const TITLE_BADGE_PREFIX_PATTERN = /^\(\d+\+?\)\s*/;
const NOTIFICATION_UNREAD_COUNT_EVENT = "powerintake:notification-unread-count";

const stripTitleBadgePrefix = (title = "") => title.replace(TITLE_BADGE_PREFIX_PATTERN, "");

const normalizeUnreadCount = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.floor(parsed));
};

const isReadValue = (value) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "true" || normalized === "1";
  }
  return Boolean(value);
};

export default function AppNotificationBadgeSync() {
  const { tokenInfo, userInfo } = useAuth();

  const useruuid = useMemo(
    () =>
      userInfo?.useruuid ||
      userInfo?.v_useruuid ||
      tokenInfo?.account?.localAccountId ||
      "",
    [tokenInfo?.account?.localAccountId, userInfo],
  );

  const { notifications, refetch } = useFetchNotification({
    useruuid,
    enabled: Boolean(useruuid),
  });

  const unreadCount = useMemo(
    () =>
      (notifications ?? []).reduce(
        (total, notification) =>
          isReadValue(notification?.v_isread) ? total : total + 1,
        0,
      ),
    [notifications],
  );

  const [liveUnreadCount, setLiveUnreadCount] = useState(null);

  useEffect(() => {
    setLiveUnreadCount(unreadCount);
  }, [unreadCount]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const onUnreadCountUpdated = (event) => {
      const eventUnreadCount = event?.detail?.unreadCount;
      if (eventUnreadCount === undefined || eventUnreadCount === null) return;
      setLiveUnreadCount(normalizeUnreadCount(eventUnreadCount));
    };

    window.addEventListener(NOTIFICATION_UNREAD_COUNT_EVENT, onUnreadCountUpdated);

    return () => {
      window.removeEventListener(NOTIFICATION_UNREAD_COUNT_EVENT, onUnreadCountUpdated);
    };
  }, []);

  const effectiveUnreadCount = liveUnreadCount ?? unreadCount;

  useEffect(() => {
    if (!useruuid) return;

    const onNotificationsUpdated = () => {
      refetch();
    };

    socket.on("notifications:updated", onNotificationsUpdated);
    return () => {
      socket.off("notifications:updated", onNotificationsUpdated);
    };
  }, [refetch, useruuid]);

  useEffect(() => {
    if (!useruuid || typeof document === "undefined") return;

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refetch();
      }
    };

    const onFocus = () => {
      refetch();
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("focus", onFocus);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("focus", onFocus);
    };
  }, [refetch, useruuid]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const syncBadge = async () => {
      const safeUnreadCount = Math.max(0, effectiveUnreadCount);
      const badgeCount = Math.min(safeUnreadCount, MAX_BADGE_COUNT);

      try {
        if (safeUnreadCount > 0) {
          if (typeof navigator.setAppBadge === "function") {
            await navigator.setAppBadge(badgeCount);
          }
        } else if (typeof navigator.clearAppBadge === "function") {
          await navigator.clearAppBadge();
        }
      } catch {
        // Ignore app badging errors on unsupported environments.
      }

      if (typeof document === "undefined") return;

      const baseTitle = stripTitleBadgePrefix(document.title).trim() || "Power Intake";
      if (safeUnreadCount > 0) {
        const titleCount =
          safeUnreadCount > MAX_BADGE_COUNT
            ? `${MAX_BADGE_COUNT}+`
            : String(safeUnreadCount);
        document.title = `(${titleCount}) ${baseTitle}`;
      } else {
        document.title = baseTitle;
      }
    };

    syncBadge();
  }, [effectiveUnreadCount]);

  useEffect(() => {
    return () => {
      if (typeof document !== "undefined") {
        document.title = stripTitleBadgePrefix(document.title);
      }

      if (
        typeof navigator !== "undefined" &&
        typeof navigator.clearAppBadge === "function"
      ) {
        navigator.clearAppBadge().catch(() => {});
      }
    };
  }, []);

  return null;
}
