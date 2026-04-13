import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Bell, MoreVertical, RefreshCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useFetchNotification } from "@/hooks/UseFetchNotification";
import { useUpdateNotificationIsRead } from "@/hooks/UseUpdateNotificationIsRead";
import { useDeleteNotification } from "@/hooks/UseDeleteNotification";
import socket from "@/lib/socket";

const formatTime = (ts) => {
    if (!ts) return "Just now";
    const d = new Date(ts);
    if (Number.isNaN(d.getTime())) return "Just now";
    try { return formatDistanceToNow(d, { addSuffix: true }); } catch { return d.toLocaleString(); }
};

const MenuButton = ({ onClick, disabled, className, children }) => (
    <button
        type="button"
        onClick={(e) => {
            e.stopPropagation();
            onClick?.(e);
        }}
        disabled={disabled}
        className={`w-full px-3 py-2 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${className}`}>
        {children}
    </button>
);

const getNotificationId = (notification) =>
    String(notification?.v_notificationuuid ?? notification?.notificationuuid ?? notification?.id ?? "");

const getTicketUuid = (notification) => {
    const value = notification?.v_ticketuuid ?? notification?.ticketuuid;
    return value ? String(value) : "";
};

const getTicketNumber = (notification) => {
    const value = notification?.v_ticketnumber ?? notification?.ticketnumber;
    return value ? String(value) : "";
};

const toBoolean = (value) => {
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value === 1;
    if (value == null) return false;
    const normalized = String(value).trim().toLowerCase();
    return normalized === "true" || normalized === "1";
};

const normalizeIncomingNotification = (payload) => {
    const notification = payload?.notification ?? payload?.data ?? payload;
    if (!notification || typeof notification !== "object") return null;

    const notificationId = getNotificationId(notification);
    if (!notificationId) return null;

    return {
        ...notification,
        v_notificationuuid: notificationId,
        v_ticketuuid: getTicketUuid(notification) || null,
        v_ticketnumber: getTicketNumber(notification) || null,
        v_message: notification?.v_message ?? notification?.message ?? "Notification",
        v_createdat: notification?.v_createdat ?? notification?.createdat ?? notification?.createdAt ?? new Date().toISOString(),
        v_isread: toBoolean(notification?.v_isread ?? notification?.isread ?? notification?.isRead),
    };
};

export default function Notification({ isMobile = false, isCollapsed = false }) {
    const router = useRouter();
    const { tokenInfo, userInfo } = useAuth();

    const useruuid = useMemo(
        () => userInfo?.useruuid || userInfo?.v_useruuid || tokenInfo?.account?.localAccountId || "",
        [tokenInfo?.account?.localAccountId, userInfo],
    );

    // The current user's entra ID — sent to API as modifiedby / deletedby
    const modifiedby = useMemo(
        () => tokenInfo?.account?.localAccountId || useruuid || "",
        [tokenInfo?.account?.localAccountId, useruuid],
    );

    const { notifications, setNotifications, loading, error, refetch } = useFetchNotification({ useruuid, enabled: Boolean(useruuid) });
    const { updateNotificationIsRead } = useUpdateNotificationIsRead();
    const { deleteNotification }       = useDeleteNotification();

    const [isOpen,         setIsOpen]         = useState(false);
    const [openBulkMenu,   setOpenBulkMenu]   = useState(false);
    const [openCardMenuId, setOpenCardMenuId] = useState(null);
    const [isBulkLoading,  setIsBulkLoading]  = useState(false); // bulk action (mark all / delete all) in-flight
    const [loadingItemId,  setLoadingItemId]  = useState(null);  // UUID of the single item currently being acted on
    const containerRef = useRef(null);

    const closeMenus = useCallback(() => {
        setIsOpen(false);
        setOpenBulkMenu(false);
        setOpenCardMenuId(null);
    }, []);

    useEffect(() => {
        const onClickOutside = (e) => { if (!containerRef.current?.contains(e.target)) closeMenus(); };
        const onEscape       = (e) => { if (e.key === "Escape") closeMenus(); };
        document.addEventListener("mousedown", onClickOutside);
        document.addEventListener("keydown",   onEscape);
        return () => {
            document.removeEventListener("mousedown", onClickOutside);
            document.removeEventListener("keydown",   onEscape);
        };
    }, [closeMenus]);

    useEffect(() => {
        if (!useruuid) return;

        const onNotificationCreated = (payload) => {
            const targetUser = payload?.useruuid ?? payload?.v_useruuid ?? payload?.entrauserid;
            if (targetUser) {
                const target = String(targetUser);
                const isDbUserMatch = target === String(useruuid);
                const isEntraUserMatch = target === String(modifiedby);
                if (!isDbUserMatch && !isEntraUserMatch) return;
            }

            const incoming = normalizeIncomingNotification(payload);
            if (!incoming) return;

            setNotifications((prev) => {
                const incomingId = getNotificationId(incoming);
                const exists = prev.some((n) => getNotificationId(n) === incomingId);
                if (exists) return prev;
                return [incoming, ...prev];
            });
        };

        socket.on("notification:created", onNotificationCreated);
        return () => socket.off("notification:created", onNotificationCreated);
    }, [modifiedby, setNotifications, useruuid]);

    const items = useMemo(() =>
        [...(notifications ?? [])]
            .map((n) => ({
                id:        getNotificationId(n),
                ticketUuid: getTicketUuid(n),
                ticketNumber: getTicketNumber(n),
                message:   n.v_message   ?? "Notification",
                createdAt: n.v_createdat ?? null,
                isRead:    toBoolean(n.v_isread ?? n.isread ?? n.isRead),
            }))
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
        [notifications],
    );

    const unreadCount      = useMemo(() => items.filter((n) => !n.isRead).length, [items]);
    const hasNotifications = items.length > 0;
    const hasUnread        = unreadCount > 0;

    const patchLocal    = useCallback((id, isRead) =>
        setNotifications((prev) => prev.map((n) =>
            String(n.v_notificationuuid) === id ? { ...n, v_isread: isRead } : n
        )), [setNotifications]);

    const patchAllLocal = useCallback((isRead) =>
        setNotifications((prev) => prev.map((n) => ({ ...n, v_isread: isRead }))),
        [setNotifications]);

    const removeLocal   = useCallback((id) =>
        setNotifications((prev) => prev.filter((n) => String(n.v_notificationuuid) !== id)),
        [setNotifications]);

    const handleMarkOne = useCallback(async (id, isRead) => {
        if (!id || !useruuid || !modifiedby) return;
        setLoadingItemId(id);
        try {
            await updateNotificationIsRead({ useruuid, isread: isRead, modifiedby, notificationuuid: id });
            patchLocal(id, isRead);
            setOpenCardMenuId(null);
        } catch (err) {
            toast.error(err.message || "Failed to update notification");
        } finally {
            setLoadingItemId(null);
        }
    }, [modifiedby, patchLocal, updateNotificationIsRead, useruuid]);

    const handleDeleteOne = useCallback(async (id) => {
        if (!id || !useruuid || !modifiedby) return;
        setLoadingItemId(id);
        try {
            await deleteNotification({ useruuid, deletedby: modifiedby, notificationuuid: id });
            removeLocal(id);
            setOpenCardMenuId(null);
        } catch (err) {
            toast.error(err.message || "Failed to delete notification");
        } finally {
            setLoadingItemId(null);
        }
    }, [modifiedby, deleteNotification, removeLocal, useruuid]);

    const handleMarkAll = useCallback(async (isRead) => {
        if (!hasNotifications || !useruuid || !modifiedby) return;
        setIsBulkLoading(true);
        try {
            await updateNotificationIsRead({ useruuid, isread: isRead, modifiedby, notificationuuid: null });
            patchAllLocal(isRead);
            setOpenBulkMenu(false);
        } catch (err) {
            toast.error(err.message || "Failed to update notifications");
        } finally {
            setIsBulkLoading(false);
        }
    }, [modifiedby, hasNotifications, patchAllLocal, updateNotificationIsRead, useruuid]);

    const handleDeleteAll = useCallback(async () => {
        if (!hasNotifications || !useruuid || !modifiedby) return;
        setIsBulkLoading(true);
        try {
            await deleteNotification({ useruuid, deletedby: modifiedby, notificationuuid: null });
            setNotifications([]);
            setOpenBulkMenu(false);
        } catch (err) {
            toast.error(err.message || "Failed to delete notifications");
        } finally {
            setIsBulkLoading(false);
        }
    }, [modifiedby, deleteNotification, hasNotifications, setNotifications, useruuid]);

    const handleNotificationClick = useCallback((notification) => {
        if (!notification) return;

        const ticketUuid = notification.ticketUuid;
        const ticketNumber = notification.ticketNumber;
        if (!ticketUuid && !ticketNumber) return;

        if (!notification.isRead && notification.id && useruuid && modifiedby) {
            patchLocal(notification.id, true);
            updateNotificationIsRead({
                useruuid,
                isread: true,
                modifiedby,
                notificationuuid: notification.id,
            }).catch((err) => {
                toast.error(err.message || "Failed to update notification");
                patchLocal(notification.id, false);
            });
        }

        const params = new URLSearchParams();
        if (ticketUuid) params.set("uuid", ticketUuid);
        if (ticketNumber) params.set("search", ticketNumber);

        closeMenus();
        router.push(`/ticket?${params.toString()}`);
    }, [closeMenus, modifiedby, patchLocal, router, updateNotificationIsRead, useruuid]);

    // Mobile: fixed to viewport — no absolute positioning that clips outside the screen
    // Desktop collapsed: anchors right of sidebar icon
    // Desktop expanded: anchors above trigger
    const panelClass = isMobile
        ? "fixed inset-x-3 top-16 bottom-20 z-50 rounded-2xl"
        : isCollapsed
            ? "absolute left-full bottom-0 ml-3 w-80 h-[28rem] z-50 rounded-2xl"
            : "absolute bottom-full left-0 mb-2 w-[22rem] h-[28rem] z-50 rounded-2xl";

    const triggerClass = isMobile
        ? "relative flex items-center justify-center rounded-lg p-1.5 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.06] dark:hover:text-white"
        : `w-full flex items-center rounded-lg px-3 py-2.5 transition-colors text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-white/[0.04] ${isCollapsed ? "justify-center" : "gap-3"}`;

    return (
        <div ref={containerRef} className="relative">
            {/* Trigger */}
            <button type="button"
                onClick={() => { setIsOpen((p) => !p); setOpenBulkMenu(false); setOpenCardMenuId(null); }}
                className={triggerClass}
                title={isCollapsed && !isMobile ? "Notifications" : undefined}
                aria-label="Notifications">
                <div className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute -right-1.5 -top-1.5 inline-flex min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold leading-4 text-white">
                            {unreadCount > 99 ? "99+" : unreadCount}
                        </span>
                    )}
                </div>
                {!isMobile && !isCollapsed && (
                    <div className="min-w-0 flex-1 text-left">
                        <p className="truncate text-sm font-medium text-gray-900 dark:text-white">Notifications</p>
                        <p className="truncate text-xs text-gray-400 dark:text-gray-500">{unreadCount} unread</p>
                    </div>
                )}
            </button>

            {/* Panel */}
            {isOpen && (
                <div className={`flex flex-col overflow-hidden border border-gray-100 bg-white shadow-2xl dark:border-white/[0.08] dark:bg-[#242526] ${panelClass}`}
                    style={{ boxShadow: "0 14px 40px rgba(0,0,0,0.18)" }}>

                    {/* Header */}
                    <div className="flex items-start justify-between border-b border-gray-100 px-4 py-3 dark:border-white/[0.08]">
                        <div>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">Notifications</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500">{unreadCount} unread</p>
                        </div>
                        <div className="flex items-center gap-1">
                            <button type="button" onClick={() => refetch()} disabled={loading} aria-label="Refresh notifications"
                                className="rounded-md p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/[0.08] dark:hover:text-gray-200">
                                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                            </button>

                            {/* Bulk menu */}
                            <div className="relative">
                                <button type="button" aria-label="Bulk actions"
                                    onClick={() => { setOpenBulkMenu((p) => !p); setOpenCardMenuId(null); }}
                                    className="rounded-md p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/[0.08] dark:hover:text-gray-200">
                                    <MoreVertical className="h-4 w-4" />
                                </button>
                                {openBulkMenu && (
                                    <div className="absolute right-0 top-9 z-20 w-44 overflow-hidden rounded-lg border border-gray-100 bg-white py-1 shadow-lg dark:border-white/[0.08] dark:bg-[#2d2f31]">
                                        <MenuButton onClick={() => handleMarkAll(true)}  disabled={isBulkLoading || !hasNotifications || !hasUnread}                    className="text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/[0.08]">Mark all as read</MenuButton>
                                        <MenuButton onClick={() => handleMarkAll(false)} disabled={isBulkLoading || !hasNotifications || unreadCount === items.length} className="text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/[0.08]">Mark all as unread</MenuButton>
                                        <MenuButton onClick={handleDeleteAll}            disabled={isBulkLoading || !hasNotifications}                                  className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10">Delete all</MenuButton>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* List */}
                    <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-2">
                        {loading && !hasNotifications && (
                            <p className="px-2 py-6 text-center text-sm text-gray-500 dark:text-gray-400">Loading notifications...</p>
                        )}
                        {!loading && error && (
                            <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-3 dark:border-red-900/40 dark:bg-red-900/20">
                                <p className="text-xs text-red-600 dark:text-red-300">{error}</p>
                                <button type="button" onClick={() => refetch()} className="mt-2 text-xs font-medium text-red-600 underline underline-offset-2 dark:text-red-300">Try again</button>
                            </div>
                        )}
                        {!loading && !error && !hasNotifications && (
                            <p className="px-2 py-6 text-center text-sm text-gray-500 dark:text-gray-400">No notifications yet.</p>
                        )}

                        {!error && items.map((n) => {
                            const isItemLoading = loadingItemId === n.id;
                            const canOpenTicket = Boolean(n.ticketUuid || n.ticketNumber);

                            const handleKeyDown = (e) => {
                                if (!canOpenTicket) return;
                                if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    handleNotificationClick(n);
                                }
                            };

                            return (
                                <div key={n.id}
                                    role={canOpenTicket ? "button" : undefined}
                                    tabIndex={canOpenTicket ? 0 : undefined}
                                    onClick={canOpenTicket ? () => handleNotificationClick(n) : undefined}
                                    onKeyDown={handleKeyDown}
                                    className={`rounded-xl border ${n.isRead
                                        ? "border-gray-200 bg-gray-50/70 dark:border-gray-800 dark:bg-white/[0.02]"
                                        : "border-violet-200 bg-violet-50/80 dark:border-violet-500/20 dark:bg-violet-500/10"} ${canOpenTicket
                                        ? "cursor-pointer transition-colors hover:border-violet-300 dark:hover:border-violet-400/40"
                                        : ""}`}>
                                    <div className="flex items-start gap-3 p-3">
                                        <span className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${n.isRead ? "bg-gray-300 dark:bg-gray-600" : "bg-violet-500"}`} />
                                        <div className="min-w-0 flex-1">
                                            <p className={`break-words text-sm leading-snug ${n.isRead ? "text-gray-700 dark:text-gray-200" : "font-medium text-gray-900 dark:text-white"}`}>
                                                {n.message}
                                            </p>
                                            <p className="mt-1 text-[11px] text-gray-400 dark:text-gray-500">{formatTime(n.createdAt)}</p>
                                        </div>

                                        {/* Per-card menu */}
                                        <div className="relative">
                                            <button type="button" disabled={!n.id || isItemLoading} aria-label="Notification actions"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setOpenCardMenuId((p) => p === n.id ? null : n.id);
                                                    setOpenBulkMenu(false);
                                                }}
                                                className="rounded-md p-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50 dark:text-gray-400 dark:hover:bg-white/[0.08] dark:hover:text-gray-200">
                                                <MoreVertical className="h-4 w-4" />
                                            </button>
                                            {openCardMenuId === n.id && (
                                                // Mobile: fixed right-3 so it anchors to viewport edge, never clips
                                                    <div onClick={(e) => e.stopPropagation()} className={`z-30 w-44 overflow-hidden rounded-lg border border-gray-100 bg-white py-1 shadow-lg dark:border-white/[0.08] dark:bg-[#2d2f31] ${isMobile ? "fixed right-3" : "absolute right-0 top-8"}`}>
                                                    <MenuButton onClick={() => handleMarkOne(n.id, true)}  disabled={isItemLoading || n.isRead}  className="text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/[0.08]">Mark as read</MenuButton>
                                                    <MenuButton onClick={() => handleMarkOne(n.id, false)} disabled={isItemLoading || !n.isRead} className="text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/[0.08]">Mark as unread</MenuButton>
                                                    <MenuButton onClick={() => handleDeleteOne(n.id)}      disabled={isItemLoading}              className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10">Delete</MenuButton>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}