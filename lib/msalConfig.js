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
    cacheLocation: "sessionStorage",      // ← was localStorage; Webview2 partitions it
    storeAuthStateInCookie: true,         // ← fallback for when sessionStorage is also blocked
  },
};

export const loginRequest = {
  scopes: ["openid", "profile", "User.Read"],
};

export const apiRequest = {
  // Must match the scope name in Azure → Expose an API exactly
  scopes: ["api://powerintake.spartaserv.com/6ccf8b01-7af5-497b-9e23-45a92d68a226/access_as_user"],
};