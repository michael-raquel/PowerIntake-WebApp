"use client";

import { useEffect } from "react";

const OMNICHANNEL_WIDGET_ID = "Microsoft_Omnichannel_LCWidget";
const OMNICHANNEL_WIDGET_SRC =
  "https://oc-cdn-ocprod.azureedge.net/livechatwidget/scripts/LiveChatBootstrapper.js";
const OMNICHANNEL_WIDGET_STYLE_ID = "sparta-omnichannel-widget-offset-style";
const OMNICHANNEL_WIDGET_BOTTOM_VAR = "--sparta-omnichannel-widget-bottom";
const OMNICHANNEL_WIDGET_MANAGED_ATTR = "data-sparta-omnichannel-managed";
const MOBILE_BREAKPOINT = 768;
const MOBILE_NAV_HEIGHT = 64;
const MOBILE_EDGE_GAP = 16;
const DEFAULT_EDGE_GAP = 45;

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

const WHITE_RE =
  /^(white|#fff(fff)?|rgb\(255,\s*255,\s*255\)|rgba\(255,\s*255,\s*255,\s*(?:1|0?\.\d+)\))$/i;

function isWhite(value) {
  return WHITE_RE.test(value?.trim());
}

function stripWhiteFromNode(node) {
  if (!(node instanceof HTMLElement)) return;
  const s = node.style;
  const c = window.getComputedStyle(node);

  // Keep host-shell visuals stable across app theme toggles.
  s.borderColor = "transparent";
  s.borderWidth = "0";
  s.border = "0";
  s.outlineColor = "transparent";
  s.outline = "none";
  s.boxShadow = "none";
  s.colorScheme = "light";

  if (isWhite(c.backgroundColor)) s.backgroundColor = "transparent";
}

function stripWhiteFromWidgetTree() {
  document.querySelectorAll(WIDGET_SELECTOR).forEach((root) => {
    // Walk up to fixed ancestor
    let current = root;
    let depth = 0;
    while (current && current !== document.body && depth < 8) {
      stripWhiteFromNode(current);
      current = current.parentElement;
      depth++;
    }
    // Walk all descendants
    root.querySelectorAll("*").forEach(stripWhiteFromNode);
  });
}

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
  style.textContent = `
    ${WIDGET_SELECTOR} {
      bottom: var(${OMNICHANNEL_WIDGET_BOTTOM_VAR}, ${DEFAULT_EDGE_GAP}px) !important;
      border: 0 !important;
      outline: none !important;
      box-shadow: none !important;
      color-scheme: light !important;
    }
  `;
  document.head.appendChild(style);
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
    node.setAttribute(OMNICHANNEL_WIDGET_MANAGED_ATTR, "1");

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
            border: "0",
            borderWidth: "0",
            borderColor: "transparent",
            outline: "none",
            boxShadow: "none",
            backgroundImage:
              "url('https://dev-portal.spartaserv.com/img/sparta-icon.png')",
            backgroundSize: "contain",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            backgroundColor: "transparent",
          },
          chatButtonTextContainerStyleProps: {
            display: "none",
          },
        },
      },
    };
  };
}

export default function SpartaAssistWidget({ hasMobileBottomNav = false, userEmail = "" }) {
  useEffect(() => {
    if (userEmail) window.__lcwContextEmail = userEmail;
  }, [userEmail]);

  useEffect(() => {
    ensureWidgetOffsetStyle();

    const sync = () => {
      setWidgetBottomVariable(hasMobileBottomNav);
      applyWidgetBottomOffset(hasMobileBottomNav);
      stripWhiteFromWidgetTree();
    };

    sync();

    const observer = new MutationObserver(sync);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["style", "class"],
    });

    const themeObserver = new MutationObserver(sync);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "style", "data-theme"],
    });

    window.addEventListener("resize", sync);
    window.addEventListener("orientationchange", sync);

    const script = document.getElementById(OMNICHANNEL_WIDGET_ID);
    script?.addEventListener("load", sync);

    return () => {
      observer.disconnect();
      themeObserver.disconnect();
      window.removeEventListener("resize", sync);
      window.removeEventListener("orientationchange", sync);
      script?.removeEventListener("load", sync);
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

      const script = document.createElement("script");
      script.id = OMNICHANNEL_WIDGET_ID;
      script.src = OMNICHANNEL_WIDGET_SRC;
      script.async = true;
      script.setAttribute("data-app-id", "cc334317-af40-40dc-85e5-edb227d50bb0");
      script.setAttribute("data-lcw-version", "prod");
      script.setAttribute("data-org-id", "0789a0af-1312-ee11-a66d-0022482ab00a");
      script.setAttribute("data-org-url", "https://m-0789a0af-1312-ee11-a66d-0022482ab00a.us.omnichannelengagementhub.com");
      script.setAttribute("data-customization-callback", "lcw");

      document.body.appendChild(script);
    }

    return () => {
      window.removeEventListener("lcw:ready", onLcwReady);
      teardownWidget();
    };
  }, []);

  return null;
}
