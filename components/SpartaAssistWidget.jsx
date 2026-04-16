"use client";

import { useEffect } from "react";

const OMNICHANNEL_WIDGET_ID = "Microsoft_Omnichannel_LCWidget";
const OMNICHANNEL_WIDGET_SRC =
  "https://oc-cdn-ocprod.azureedge.net/livechatwidget/scripts/LiveChatBootstrapper.js";
const OMNICHANNEL_WIDGET_STYLE_ID = "sparta-omnichannel-widget-offset-style";
const OMNICHANNEL_WIDGET_ROOT_ID = "sparta-widget-root";
const OMNICHANNEL_ISOLATION_STYLE_ID =
  "sparta-omnichannel-widget-isolation-style";
const OMNICHANNEL_WIDGET_BOTTOM_VAR = "--sparta-omnichannel-widget-bottom";
const OMNICHANNEL_WIDGET_MANAGED_ATTR = "data-sparta-omnichannel-managed";
const MOBILE_BREAKPOINT = 768;
const MOBILE_NAV_HEIGHT = 64;
const MOBILE_EDGE_GAP = 16;
const DEFAULT_EDGE_GAP = 45;

const OMNICHANNEL_CONTAINER_SELECTOR = [
  'div[id^="Microsoft_Omnichannel"]',
  'div[id*="Microsoft_Omnichannel"]',
  'div[id*="omnichannel"]',
  'div[class*="omnichannel"]',
  'div[id*="lcw"]',
  'div[class*="lcw"]',
  '[data-id*="lcw"]',
  '[data-testid*="lcw"]',
].join(",");

const OMNICHANNEL_IFRAME_SELECTOR = [
  'iframe[src*="omnichannelengagementhub"]',
  'iframe[src*="livechatwidget"]',
].join(",");

const WIDGET_SELECTOR = [
  OMNICHANNEL_IFRAME_SELECTOR,
  OMNICHANNEL_CONTAINER_SELECTOR,
].join(",");

function getWidgetBottomOffset(hasMobileBottomNav) {
  const shouldLiftForMobileNav =
    hasMobileBottomNav && window.innerWidth <= MOBILE_BREAKPOINT;
  return shouldLiftForMobileNav
    ? MOBILE_NAV_HEIGHT + MOBILE_EDGE_GAP
    : DEFAULT_EDGE_GAP;
}

function ensureWidgetOffsetStyle() {
  if (document.getElementById(OMNICHANNEL_WIDGET_STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = OMNICHANNEL_WIDGET_STYLE_ID;
  style.textContent = `${WIDGET_SELECTOR} { bottom: var(${OMNICHANNEL_WIDGET_BOTTOM_VAR}, ${DEFAULT_EDGE_GAP}px) !important; }`;
  document.head.appendChild(style);
}

function ensureWidgetIsolationStyle() {
  if (document.getElementById(OMNICHANNEL_ISOLATION_STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = OMNICHANNEL_ISOLATION_STYLE_ID;
  style.textContent = `
    #${OMNICHANNEL_WIDGET_ROOT_ID},
    #${OMNICHANNEL_WIDGET_ROOT_ID} * {
      color-scheme: light !important;
    }
    #${OMNICHANNEL_WIDGET_ROOT_ID} :where(${OMNICHANNEL_CONTAINER_SELECTOR}),
    #${OMNICHANNEL_WIDGET_ROOT_ID} :where(${OMNICHANNEL_IFRAME_SELECTOR}) {
      background-color: transparent !important;
      background: transparent !important;
      box-shadow: none !important;
    }
    #${OMNICHANNEL_WIDGET_ROOT_ID} :where(${OMNICHANNEL_IFRAME_SELECTOR}) {
      color-scheme: light !important;
    }
  `;
  document.head.appendChild(style);
}

function ensureWidgetRoot() {
  let root = document.getElementById(OMNICHANNEL_WIDGET_ROOT_ID);
  if (!root) {
    root = document.createElement("div");
    root.id = OMNICHANNEL_WIDGET_ROOT_ID;
    document.body.appendChild(root);
  }
  return root;
}

function applyWidgetAppearanceOverrides() {
  const root = ensureWidgetRoot();
  root.style.setProperty("color-scheme", "light", "important");
  root.style.setProperty("background", "transparent", "important");
  root.style.setProperty("background-color", "transparent", "important");

  const targets = document.querySelectorAll(WIDGET_SELECTOR);
  targets.forEach((node) => {
    if (!(node instanceof HTMLElement)) return;

    if (!node.closest(`#${OMNICHANNEL_WIDGET_ROOT_ID}`)) {
      root.appendChild(node);
    }

    node.style.setProperty("color-scheme", "light", "important");
    node.style.setProperty("background", "transparent", "important");
    node.style.setProperty("background-color", "transparent", "important");
  });
}

function setWidgetBottomVariable(hasMobileBottomNav) {
  const offset = getWidgetBottomOffset(hasMobileBottomNav);
  document.documentElement.style.setProperty(
    OMNICHANNEL_WIDGET_BOTTOM_VAR,
    `${offset}px`,
  );
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

  document
    .querySelectorAll(`[${OMNICHANNEL_WIDGET_MANAGED_ATTR}="1"]`)
    .forEach((node) => {
      if (node instanceof HTMLElement) node.remove();
    });

  document
    .querySelectorAll(
      'iframe[src*="omnichannelengagementhub"], iframe[src*="livechatwidget"]',
    )
    .forEach((node) => {
      if (node instanceof HTMLElement) node.remove();
    });

  document.getElementById(OMNICHANNEL_ISOLATION_STYLE_ID)?.remove();
  document.getElementById(OMNICHANNEL_WIDGET_ROOT_ID)?.remove();
  document.documentElement.style.removeProperty(OMNICHANNEL_WIDGET_BOTTOM_VAR);
}

function ensureLcwCallback() {
  if (typeof window.lcw === "function") return;
  window.lcw = function () {
    return {
      chatButtonProps: {
        controlProps: {
          hideChatTextContainer: true,
          titleText: "",
          subtitleText: "",
        },
        styleProps: {
          generalStyleProps: {
            minWidth: "60px",
            width: "60px",
            height: "60px",
            cursor: "pointer",
            borderRadius: "50%",
            borderWidth: "0",
            backgroundImage:
              "url('https://dev-portal.spartaserv.com/img/sparta-icon.png')",
            backgroundSize: "contain",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            backgroundColor: "#ffffff",
          },
          chatButtonTextContainerStyleProps: {
            display: "none",
          },
        },
      },
    };
  };
}

export default function SpartaAssistWidget({
  hasMobileBottomNav = false,
  userEmail = "",
}) {
  useEffect(() => {
    if (userEmail) window.__lcwContextEmail = userEmail;
  }, [userEmail]);

  useEffect(() => {
    ensureWidgetOffsetStyle();
    ensureWidgetIsolationStyle();
    ensureWidgetRoot();

    const syncWidget = () => {
      setWidgetBottomVariable(hasMobileBottomNav);
      applyWidgetAppearanceOverrides();
      applyWidgetBottomOffset(hasMobileBottomNav);
    };

    syncWidget();

    const widgetObserver = new MutationObserver(syncWidget);
    widgetObserver.observe(document.body, { childList: true, subtree: true });

    const themeObserver = new MutationObserver(syncWidget);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme", "style"],
    });

    window.addEventListener("resize", syncWidget);
    window.addEventListener("orientationchange", syncWidget);

    const script = document.getElementById(OMNICHANNEL_WIDGET_ID);
    script?.addEventListener("load", syncWidget);

    return () => {
      widgetObserver.disconnect();
      themeObserver.disconnect();
      window.removeEventListener("resize", syncWidget);
      window.removeEventListener("orientationchange", syncWidget);
      script?.removeEventListener("load", syncWidget);
    };
  }, [hasMobileBottomNav]);

  useEffect(() => {
    const onLcwReady = () => {
      const email = window.__lcwContextEmail || "";
      if (email) {
        window.Microsoft?.Omnichannel?.LiveChatWidget?.SDK?.setContextProvider(
          () => ({
            loggedInEmail: email,
            authenticatedUserId: email,
          }),
        );
      }
    };

    window.addEventListener("lcw:ready", onLcwReady);

    if (!document.getElementById(OMNICHANNEL_WIDGET_ID)) {
      ensureLcwCallback();
      const root = ensureWidgetRoot();

      const script = document.createElement("script");
      script.id = OMNICHANNEL_WIDGET_ID;
      script.src = OMNICHANNEL_WIDGET_SRC;
      script.async = true;
      script.setAttribute(
        "data-app-id",
        "cc334317-af40-40dc-85e5-edb227d50bb0",
      );
      script.setAttribute("data-lcw-version", "prod");
      script.setAttribute(
        "data-org-id",
        "0789a0af-1312-ee11-a66d-0022482ab00a",
      );
      script.setAttribute(
        "data-org-url",
        "https://m-0789a0af-1312-ee11-a66d-0022482ab00a.us.omnichannelengagementhub.com",
      );
      script.setAttribute("data-customization-callback", "lcw");

      root.appendChild(script);
    }

    return () => {
      window.removeEventListener("lcw:ready", onLcwReady);
      teardownWidget();
    };
  }, []);

  return null;
}
