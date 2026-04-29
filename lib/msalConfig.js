import { TeamsNativeAuthBrokerPlugin } from "@azure/msal-browser";

const redirectUri =
  typeof window !== "undefined"
    ? window.location.origin + "/checking"
    : "http://localhost:3000/checking";

export const msalConfig = {
  auth: {
    clientId: "6ccf8b01-7af5-497b-9e23-45a92d68a226",
    authority: "https://login.microsoftonline.com/common",
    redirectUri,
    navigateToLoginRequestUrl: false,
  },
  cache: {
    cacheLocation: "localStorage",
    storeAuthStateInCookie: false,
  },
  system: {
    allowNativeBroker: true,
    nativeBrokerPlugin: new TeamsNativeAuthBrokerPlugin(), // ← this is the key
    iframeHashTimeout: 10000,
  },
};