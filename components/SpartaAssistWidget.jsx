"use client";

import { useEffect } from "react";

const OMNICHANNEL_WIDGET_ID = "Microsoft_Omnichannel_LCWidget";
const OMNICHANNEL_WIDGET_SRC =
  "https://oc-cdn-ocprod.azureedge.net/livechatwidget/scripts/LiveChatBootstrapper.js";
const OMNICHANNEL_WIDGET_FALLBACK_SRC =
  "https://ocprodocprodnamgs.blob.core.windows.net/livechatwidget/scripts/LiveChatBootstrapper.js";
const OMNICHANNEL_WIDGET_APP_ID = "c82548f3-ee31-4f2a-b1ed-615e9aa7aaae";
const OMNICHANNEL_WIDGET_LCW_VERSION = "prod";
const OMNICHANNEL_WIDGET_ORG_ID = "0789a0af-1312-ee11-a66d-0022482ab00a";
const OMNICHANNEL_WIDGET_ORG_URL =
  "https://m-0789a0af-1312-ee11-a66d-0022482ab00a.us.omnichannelengagementhub.com";
const OMNICHANNEL_WIDGET_STYLE_ID = "sparta-omnichannel-widget-offset-style";
const OMNICHANNEL_DARK_STYLE_ID = "sparta-omnichannel-widget-dark-style";
const OMNICHANNEL_WIDGET_BOTTOM_VAR = "--sparta-omnichannel-widget-bottom";
const OMNICHANNEL_WIDGET_MANAGED_ATTR = "data-sparta-omnichannel-managed";
const MOBILE_BREAKPOINT = 768;
const MOBILE_NAV_HEIGHT = 64;
const MOBILE_EDGE_GAP = 16;
const DEFAULT_EDGE_GAP = 45;
const WIDGET_IFRAME_SELECTOR =
  'iframe[src*="omnichannelengagementhub"], iframe[src*="livechatwidget"]';

const WIDGET_SELECTOR = [
  WIDGET_IFRAME_SELECTOR,
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
  if (document.getElementById(OMNICHANNEL_WIDGET_STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = OMNICHANNEL_WIDGET_STYLE_ID;
  style.textContent = `${WIDGET_SELECTOR} { bottom: var(${OMNICHANNEL_WIDGET_BOTTOM_VAR}, ${DEFAULT_EDGE_GAP}px) !important; }`;
  document.head.appendChild(style);
}

function ensureWidgetDarkModeStyle() {
  if (document.getElementById(OMNICHANNEL_DARK_STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = OMNICHANNEL_DARK_STYLE_ID;
  style.textContent = `
    ${WIDGET_SELECTOR} {
      color-scheme: light;
    }
    ${WIDGET_IFRAME_SELECTOR} {
      background-color: transparent !important;
      border: 0 !important;
      box-shadow: none !important;
    }
  `;
  document.head.appendChild(style);
}

function applyWidgetIsolationStyles(node) {
  node.style.setProperty("background", "transparent", "important");
  node.style.setProperty("background-color", "transparent", "important");
  node.style.setProperty("box-shadow", "none", "important");
  node.style.setProperty("border", "0", "important");
  node.style.setProperty("color-scheme", "light");
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
    if (node.tagName === "IFRAME") {
      applyWidgetIsolationStyles(node);
    }
    let current = node;
    let depth = 0;

    while (current && current !== document.body && depth < 5) {
      if (visited.has(current)) break;
      const computed = window.getComputedStyle(current);
      if (computed.position === "fixed") {
        current.style.bottom = `${offset}px`;
        applyWidgetIsolationStyles(current);
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

  document.getElementById(OMNICHANNEL_DARK_STYLE_ID)?.remove();
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

function applyOmnichannelScriptAttributes(script) {
  script.setAttribute("data-app-id", OMNICHANNEL_WIDGET_APP_ID);
  script.setAttribute("data-lcw-version", OMNICHANNEL_WIDGET_LCW_VERSION);
  script.setAttribute("data-org-id", OMNICHANNEL_WIDGET_ORG_ID);
  script.setAttribute("data-org-url", OMNICHANNEL_WIDGET_ORG_URL);
  script.setAttribute("data-customization-callback", "lcw");
}

function createOmnichannelScript(src) {
  const script = document.createElement("script");
  script.id = OMNICHANNEL_WIDGET_ID;
  script.src = src;
  script.async = true;
  applyOmnichannelScriptAttributes(script);
  return script;
}

export default function SpartaAssistWidget({ hasMobileBottomNav = false, userEmail = "" }) {
  useEffect(() => {
    if (userEmail) window.__lcwContextEmail = userEmail;
  }, [userEmail]);

  useEffect(() => {
    ensureWidgetOffsetStyle();
    ensureWidgetDarkModeStyle();

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

      const script = createOmnichannelScript(OMNICHANNEL_WIDGET_SRC);
      script.onerror = () => {
        script.parentNode?.removeChild(script);
        const fallbackScript = createOmnichannelScript(
          OMNICHANNEL_WIDGET_FALLBACK_SRC,
        );
        document.body.appendChild(fallbackScript);
      };

      document.body.appendChild(script);
    }

    return () => {
      window.removeEventListener("lcw:ready", onLcwReady);
      teardownWidget();
    };
  }, []);

  return null;
}