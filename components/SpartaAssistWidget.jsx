"use client";

import { useEffect, useState } from "react";

const WIDGET_SRC =
  "https://sparta-voice-frontend-dev-002.azurewebsites.net/widget?v=21";
const PHOTO_SRC =
  "https://sparta-voice-frontend-dev-002.azurewebsites.net/sparta-photo.jpg";
const FALLBACK_ICON_SRC =
  "https://sparta-voice-frontend-dev-002.azurewebsites.net/sparta-icon.svg";

export default function SpartaAssistWidget({ hasMobileBottomNav = false }) {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [iconSrc, setIconSrc] = useState(PHOTO_SRC);
  const [viewport, setViewport] = useState({ w: 0, h: 0 });

  useEffect(() => {
    setMounted(true);

    const updateViewport = () => {
      setViewport({
        w: window.innerWidth,
        h: window.innerHeight,
      });
    };

    updateViewport();
    window.addEventListener("resize", updateViewport);
    window.addEventListener("orientationchange", updateViewport);

    return () => {
      window.removeEventListener("resize", updateViewport);
      window.removeEventListener("orientationchange", updateViewport);
    };
  }, []);

  useEffect(() => {
    function onMessage(event) {
      if (event?.data?.type === "sparta-assist-close") {
        setOpen(false);
      }
    }

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  if (!mounted) return null;

  const isThinPhone = viewport.w > 0 && viewport.w <= 360;
  const isMobile = viewport.w > 0 && viewport.w <= 768;
  const isLarge = viewport.w >= 1440;

  const launcherSize = isThinPhone ? 54 : isMobile ? 58 : 64;
  const edgeGap = isMobile ? 12 : 16;
  const mobileBottomNavHeight = hasMobileBottomNav && isMobile ? 64 : 0;
  const launcherBottom = edgeGap + mobileBottomNavHeight;

  const frameWidth = isThinPhone
    ? Math.max(280, viewport.w - edgeGap * 2)
    : isMobile
      ? Math.min(420, viewport.w - edgeGap * 2)
      : isLarge
        ? 420
        : 390;

  const frameHeightBase = isThinPhone
    ? 390
    : isMobile
      ? 460
      : isLarge
        ? 500
        : 415;
  const frameHeight =
    viewport.h > 0
      ? Math.min(frameHeightBase, viewport.h - (launcherSize + 56))
      : frameHeightBase;

  return (
    <>
      <button
        id="sparta-launcher"
        aria-label="Open Sparta Assist"
        aria-expanded={open ? "true" : "false"}
        onClick={() => setOpen((v) => !v)}
        style={{
          position: "fixed",
          right: edgeGap,
          bottom: launcherBottom,
          width: launcherSize,
          height: launcherSize,
          borderRadius: "50%",
          border: "2px solid #f8cb6d",
          background: "#0b1f74",
          padding: 0,
          display: open ? "none" : "grid",
          placeItems: "center",
          cursor: "pointer",
          zIndex: 100001,
          boxShadow: "0 12px 30px rgba(8,13,40,.45)",
        }}
      >
        <img
          src={iconSrc}
          alt="Sparta Assist"
          onError={() => setIconSrc(FALLBACK_ICON_SRC)}
          style={{
            width: isThinPhone ? 30 : 34,
            height: isThinPhone ? 30 : 34,
            borderRadius: "50%",
            objectFit: "cover",
          }}
        />
      </button>

      <div
        id="sparta-frame-wrap"
        style={{
          position: "fixed",
          right: edgeGap,
          bottom: launcherBottom + launcherSize + 10,
          width: frameWidth,
          height: frameHeight,
          maxWidth: `calc(100vw - ${edgeGap * 2}px)`,
          maxHeight: `calc(100vh - ${launcherSize + launcherBottom + 24}px)`,
          display: open ? "block" : "none",
          zIndex: 100000,
          background: "transparent",
          border: 0,
          padding: 0,
          overflow: "hidden",
          borderRadius: isMobile ? 14 : 18,
        }}
      >
        <iframe
          id="sparta-frame"
          src={open ? WIDGET_SRC : "about:blank"}
          title="Sparta Assist"
          allow="microphone; autoplay"
          style={{
            width: "100%",
            height: "100%",
            border: 0,
            background: "transparent",
            display: "block",
          }}
        />
      </div>
    </>
  );
}
