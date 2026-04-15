import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BellDot, MoreVertical } from "lucide-react";
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

const NOTE_NOTIFICATION_PATTERN = /\bnote(s)?\b|\bcomment(s)?\b/;
const ATTACHMENT_NOTIFICATION_PATTERN = /\battachment(s)?\b|\bfile\s*(upload|uploaded|delete|deleted|remove|removed)\b|\bimage(s)?\b/;

const getNotificationDetailTab = (notification) => {
    const descriptor = [
        notification?.v_message,
        notification?.v_type,
        notification?.v_notificationtype,
        notification?.v_entity,
        notification?.v_entitytype,
        notification?.v_action,
        notification?.v_event,
        notification?.v_eventtype,
        notification?.type,
        notification?.entity,
        notification?.entityType,
        notification?.action,
        notification?.event,
        notification?.eventType,
    ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

    if (!descriptor) return null;
    if (ATTACHMENT_NOTIFICATION_PATTERN.test(descriptor)) return "attachments";
    if (NOTE_NOTIFICATION_PATTERN.test(descriptor)) return "notes";
    return null;
};

const MenuButton = ({ onClick, disabled, className, children }) => (
    <button type="button"
        onClick={(e) => { e.stopPropagation(); onClick?.(e); }}
        disabled={disabled}
        className={`w-full px-3 py-2 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${className}`}>
        {children}
    </button>
);

export default function Notification({ isMobile = false, isCollapsed = false, isDesktopFloating = false }) {
    const router = useRouter();
    const { tokenInfo, userInfo } = useAuth();

    const useruuid = useMemo(
        () => userInfo?.useruuid || userInfo?.v_useruuid || tokenInfo?.account?.localAccountId || "",
        [tokenInfo?.account?.localAccountId, userInfo],
    );

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
    const [isBulkLoading,  setIsBulkLoading]  = useState(false); 
    const [loadingItemId,  setLoadingItemId]  = useState(null);  
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

    //useEffect(() => { if (isOpen && useruuid) refetch(); }, [isOpen, refetch, useruuid]);

    const items = useMemo(() =>
        [...(notifications ?? [])]
            .map((n) => ({
                id:           String(n.v_notificationuuid ?? ""),
                ticketUuid:   n.v_ticketuuid   ? String(n.v_ticketuuid)   : null,
                ticketNumber: n.v_ticketnumber ? String(n.v_ticketnumber) : null,
                message:      n.v_message   ?? "Notification",
                detailTab:    getNotificationDetailTab(n),
                createdAt:    n.v_createdat ?? null,
                isRead:       Boolean(n.v_isread),
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

    const handleNotificationClick = useCallback((n) => {
        if (!n?.ticketUuid && !n?.ticketNumber) return;

        if (!n.isRead && n.id && useruuid && modifiedby) {
            patchLocal(n.id, true);
            updateNotificationIsRead({ useruuid, isread: true, modifiedby, notificationuuid: n.id })
                .catch((err) => {
                    toast.error(err.message || "Failed to update notification");
                    patchLocal(n.id, false);
                });
        }

        const params = new URLSearchParams();
        if (n.ticketUuid)   params.set("uuid",   n.ticketUuid);
        if (n.ticketNumber) params.set("search", n.ticketNumber);
        if (n.detailTab)    params.set("detailTab", n.detailTab);

        closeMenus();
        router.push(`/ticket?${params.toString()}`);
    }, [closeMenus, modifiedby, patchLocal, router, updateNotificationIsRead, useruuid]);

    // Panel is fixed, full-height (100vh), positioned to the LEFT of the trigger button.
    // `right-[3.5rem]` offsets it just past the button width so it opens beside it.

const panelClass = isMobile
    ? "fixed inset-x-3 top-16 bottom-20 z-50 rounded-2xl"
    : isDesktopFloating
        ? "absolute right-full mr-2 top-0 w-[22rem] max-w-[calc(100vw-1rem)] h-screen z-[70]"
        : "fixed top-0 right-[3.5rem] w-[22rem] h-screen z-[70]";

    const triggerClass = isDesktopFloating
        ? `group relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:scale-[1.03] hover:border-purple-600 hover:bg-purple-600 hover:text-white hover:shadow-md active:scale-[0.98] dark:border-white/[0.12] dark:bg-[#1c1d1f] dark:text-gray-300 dark:hover:border-purple-500 dark:hover:bg-purple-500 dark:hover:text-white ${isOpen ? "!border-purple-600 !bg-purple-600 !text-white !shadow-md dark:!border-purple-500 dark:!bg-purple-500" : ""}`
        : isMobile
            ? "relative flex items-center justify-center rounded-lg p-1.5 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.06] dark:hover:text-white"
            : `w-full flex items-center rounded-lg px-3 py-2.5 transition-colors text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-white/[0.04] ${isCollapsed ? "justify-center" : "gap-3"}`;

    useEffect(() => {
        if (!tokenInfo?.account?.localAccountId) return;

        const onNotificationsUpdated = () => {
            refetch();
        };

        socket.on("notifications:updated", onNotificationsUpdated);

        return () => {
            socket.off("notifications:updated", onNotificationsUpdated);
        };
    }, [tokenInfo?.account?.localAccountId, refetch]);

    return (
        <div ref={containerRef} className="relative">
            {/* Trigger */}
            <button type="button"
                onClick={() => { setIsOpen((p) => !p); setOpenBulkMenu(false); setOpenCardMenuId(null); }}
                className={triggerClass}
                title={!isDesktopFloating && isCollapsed && !isMobile ? "Notifications" : undefined}
                aria-label="Notifications">
                {isDesktopFloating && (
                    <span
                        className={`pointer-events-none absolute right-full mr-2 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-md border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-gray-700 shadow-sm transition-all duration-200 dark:border-white/[0.12] dark:bg-[#1c1d1f] dark:text-gray-200 ${isOpen ? "opacity-0 -translate-x-1" : "opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0"}`}
                    >
                        Notifications
                    </span>
                )}
                <div className="relative">
                    <BellDot className="h-6 w-6" strokeWidth={2.4} />
                    {unreadCount > 0 && (
                        <span className="absolute -right-1.5 -top-1.5 inline-flex min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold leading-4 text-white">
                            {unreadCount > 99 ? "99+" : unreadCount}
                        </span>
                    )}
                </div>
                {!isMobile && !isCollapsed && !isDesktopFloating && (
                    <div className="min-w-0 flex-1 text-left">
                        <p className="truncate text-sm font-medium text-gray-900 dark:text-white">Notifications</p>
                        <p className="truncate text-xs text-gray-400 dark:text-gray-500">{unreadCount} unread</p>
                    </div>
                )}
            </button>

            {/* Panel — clicking anywhere inside closes any open submenu */}
            {isOpen && (
                <div className={`flex flex-col overflow-hidden border border-gray-100 bg-white shadow-2xl dark:border-white/[0.08] dark:bg-[#242526] ${panelClass}`}
                    style={{ boxShadow: "0 14px 40px rgba(0,0,0,0.18)" }}
                    onClick={() => { setOpenCardMenuId(null); setOpenBulkMenu(false); }}>

                    {/* Header */}
                    <div className="flex items-start justify-between border-b border-gray-100 px-4 py-3 dark:border-white/[0.08]">
                        <div>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">Notifications</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500">{unreadCount} unread</p>
                        </div>
                        <div className="flex items-center gap-1">
                            {/* Bulk menu */}
                            <div className="relative">
                                <button
                                    type="button"
                                    aria-label="Bulk actions"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenBulkMenu((p) => !p);
                                        setOpenCardMenuId(null);
                                    }}
                                    className="rounded-md p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/[0.08] dark:hover:text-gray-200"
                                >
                                    <MoreVertical className="h-4 w-4" />
                                </button>
                                {openBulkMenu && (
                                    <div className="absolute right-0 top-9 z-20 w-44 overflow-hidden rounded-lg border border-gray-100 bg-white py-1 shadow-lg dark:border-white/[0.08] dark:bg-[#2d2f31]"
                                        onClick={(e) => e.stopPropagation()}>
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
                            const isItemLoading  = loadingItemId === n.id;
                            const canOpenTicket  = Boolean(n.ticketUuid || n.ticketNumber);

                            return (
                                <div key={n.id}
                                    role={canOpenTicket ? "button" : undefined}
                                    tabIndex={canOpenTicket ? 0 : undefined}
                                    onClick={canOpenTicket ? () => handleNotificationClick(n) : undefined}
                                    onKeyDown={canOpenTicket ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleNotificationClick(n); } } : undefined}
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
                                                onClick={(e) => { e.stopPropagation(); setOpenCardMenuId((p) => p === n.id ? null : n.id); setOpenBulkMenu(false); }}
                                                className="rounded-md p-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50 dark:text-gray-400 dark:hover:bg-white/[0.08] dark:hover:text-gray-200">
                                                <MoreVertical className="h-4 w-4" />
                                            </button>
                                            {openCardMenuId === n.id && (
                                                <div onClick={(e) => e.stopPropagation()}
                                                    className={`z-30 w-44 overflow-hidden rounded-lg border border-gray-100 bg-white py-1 shadow-lg dark:border-white/[0.08] dark:bg-[#2d2f31] ${isMobile ? "fixed right-3" : "absolute right-0 top-8"}`}>
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