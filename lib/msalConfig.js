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
    cacheLocation: "localStorage", // ← Teams iframe loses sessionStorage on navigation
    storeAuthStateInCookie: false,
  },
};

export const loginRequest = {
  scopes: ["openid", "profile", "User.Read"],
};

export const apiRequest = {
 // ✅ New — domain-prefixed, matches Azure + Teams manifest
  scopes: ["api://powerintake.spartaserv.com/6ccf8b01-7af5-497b-9e23-45a92d68a226/user_impersonation"],
};