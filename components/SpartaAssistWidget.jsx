"use client";

import { useEffect } from "react";

const OMNICHANNEL_WIDGET_ID = "Microsoft_Omnichannel_LCWidget";
const OMNICHANNEL_WIDGET_SRC =
  "https://oc-cdn-ocprod.azureedge.net/livechatwidget/scripts/LiveChatBootstrapper.js";
const OMNICHANNEL_WIDGET_STYLE_ID = "sparta-omnichannel-widget-offset-style";
const OMNICHANNEL_WIDGET_BOTTOM_VAR = "--sparta-omnichannel-widget-bottom";
const OMNICHANNEL_WIDGET_MANAGED_ATTR = "data-sparta-omnichannel-managed";
const OMNICHANNEL_WIDGET_MOBILE_SIZED_ATTR =
  "data-sparta-omnichannel-mobile-sized";
const MOBILE_BREAKPOINT = 768;
const MOBILE_NAV_HEIGHT = 64;
const MOBILE_EDGE_GAP = 12;
const DEFAULT_EDGE_GAP = 16;
const MOBILE_LAUNCHER_SIZE = 42;

const WIDGET_SELECTOR = [
  'iframe[src*="omnichannelengagementhub"]',
  'iframe[src*="livechatwidget"]',
  '[id*="omnichannel"]',
  '[class*="omnichannel"]',
  '[id*="lcw"]',
  '[class*="lcw"]',
  '[data-id*="lcw"]',
  '[data-testid*="lcw"]',
].join(",");

function getWidgetBottomOffset(hasMobileBottomNav) {
  const shouldLiftForMobileNav =
    hasMobileBottomNav && window.innerWidth <= MOBILE_BREAKPOINT;
  return shouldLiftForMobileNav
    ? MOBILE_NAV_HEIGHT + MOBILE_EDGE_GAP
    : DEFAULT_EDGE_GAP;
}

function ensureWidgetOffsetStyle() {
  if (document.getElementById(OMNICHANNEL_WIDGET_STYLE_ID)) {
    return;
  }

  const style = document.createElement("style");
  style.id = OMNICHANNEL_WIDGET_STYLE_ID;
  style.textContent = `${WIDGET_SELECTOR} { bottom: var(${OMNICHANNEL_WIDGET_BOTTOM_VAR}, ${DEFAULT_EDGE_GAP}px) !important; }`;
  document.head.appendChild(style);
}

function setWidgetBottomVariable(hasMobileBottomNav) {
  const offset = getWidgetBottomOffset(hasMobileBottomNav);
  document.documentElement.style.setProperty(
    OMNICHANNEL_WIDGET_BOTTOM_VAR,
    `${offset}px`,
  );
}

function applyMobileLauncherSizing(node) {
  if (!(node instanceof HTMLElement)) return;

  const isMobile = window.innerWidth <= MOBILE_BREAKPOINT;
  const rect = node.getBoundingClientRect();
  const isLauncherCandidate =
    rect.width >= 34 &&
    rect.width <= 100 &&
    rect.height >= 34 &&
    rect.height <= 100 &&
    Math.abs(rect.width - rect.height) <= 18;

  if (isMobile && isLauncherCandidate) {
    const size = `${MOBILE_LAUNCHER_SIZE}px`;
    node.style.setProperty("width", size, "important");
    node.style.setProperty("height", size, "important");
    node.style.setProperty("min-width", size, "important");
    node.style.setProperty("min-height", size, "important");
    node.style.setProperty("max-width", size, "important");
    node.style.setProperty("max-height", size, "important");
    node.style.setProperty("border-radius", "9999px", "important");
    node.setAttribute(OMNICHANNEL_WIDGET_MOBILE_SIZED_ATTR, "1");
    return;
  }

  if (node.getAttribute(OMNICHANNEL_WIDGET_MOBILE_SIZED_ATTR) === "1") {
    node.style.removeProperty("width");
    node.style.removeProperty("height");
    node.style.removeProperty("min-width");
    node.style.removeProperty("min-height");
    node.style.removeProperty("max-width");
    node.style.removeProperty("max-height");
    node.style.removeProperty("border-radius");
    node.removeAttribute(OMNICHANNEL_WIDGET_MOBILE_SIZED_ATTR);
  }
}

function applyWidgetBottomOffset(hasMobileBottomNav) {
  const offset = getWidgetBottomOffset(hasMobileBottomNav);

  const nodes = document.querySelectorAll(WIDGET_SELECTOR);
  const visited = new Set();

  nodes.forEach((node) => {
    if (!(node instanceof HTMLElement)) return;

    let current = node;
    let depth = 0;

    while (current && current !== document.body && depth < 5) {
      if (visited.has(current)) break;

      const computed = window.getComputedStyle(current);
      if (computed.position === "fixed") {
        current.style.bottom = `${offset}px`;
        current.setAttribute(OMNICHANNEL_WIDGET_MANAGED_ATTR, "1");
        applyMobileLauncherSizing(current);
        visited.add(current);
      }

      current = current.parentElement;
      depth += 1;
    }
  });
}

function teardownWidget() {
  const script = document.getElementById(OMNICHANNEL_WIDGET_ID);
  script?.remove();

  const managedNodes = document.querySelectorAll(
    `[${OMNICHANNEL_WIDGET_MANAGED_ATTR}="1"]`,
  );
  managedNodes.forEach((node) => {
    if (node instanceof HTMLElement) {
      node.remove();
    }
  });

  const widgetIframes = document.querySelectorAll(
    'iframe[src*="omnichannelengagementhub"], iframe[src*="livechatwidget"]',
  );
  widgetIframes.forEach((node) => {
    if (node instanceof HTMLElement) {
      node.remove();
    }
  });

  document.documentElement.style.removeProperty(OMNICHANNEL_WIDGET_BOTTOM_VAR);
}

export default function SpartaAssistWidget({ hasMobileBottomNav = false }) {
  useEffect(() => {
    ensureWidgetOffsetStyle();

    const syncPosition = () => {
      setWidgetBottomVariable(hasMobileBottomNav);
      applyWidgetBottomOffset(hasMobileBottomNav);
    };

    syncPosition();

    const observer = new MutationObserver(syncPosition);
    observer.observe(document.body, { childList: true, subtree: true });

    window.addEventListener("resize", syncPosition);
    window.addEventListener("orientationchange", syncPosition);

    const script = document.getElementById(OMNICHANNEL_WIDGET_ID);
    script?.addEventListener("load", syncPosition);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", syncPosition);
      window.removeEventListener("orientationchange", syncPosition);
      script?.removeEventListener("load", syncPosition);
    };
  }, [hasMobileBottomNav]);

  useEffect(() => {
    if (!document.getElementById(OMNICHANNEL_WIDGET_ID)) {
      const script = document.createElement("script");
      script.id = OMNICHANNEL_WIDGET_ID;
      script.src = OMNICHANNEL_WIDGET_SRC;
      script.async = true;
      script.setAttribute(
        "data-app-id",
        "866addcc-5961-436b-8970-4e9e7720027c",
      );
      script.setAttribute("data-lcw-version", "prod");
      script.setAttribute(
        "data-org-id",
        "45e594ab-bb72-ee11-8bc5-6045bd003e36",
      );
      script.setAttribute(
        "data-org-url",
        "https://m-45e594ab-bb72-ee11-8bc5-6045bd003e36.us.omnichannelengagementhub.com",
      );

      document.body.appendChild(script);
    }

    return () => {
      teardownWidget();
    };
  }, []);

  return null;
}
