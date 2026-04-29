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
    allowNativeBroker: true,       // ← Tells MSAL to use Teams' native auth broker
                                   //   instead of hidden iframe (redirect_bridge)
    iframeHashTimeout: 10000,      // fallback timeout if broker isn't available
  },
};

export const loginRequest  = { scopes: ["openid", "profile", "User.Read"] };
export const apiRequest    = {
  scopes: [
    "api://powerintake.spartaserv.com/6ccf8b01-7af5-497b-9e23-45a92d68a226/user_impersonation"
  ],
};