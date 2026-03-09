// Frontend: src/lib/msalConfig.js
const redirectUri =
  typeof window !== "undefined"
    ? window.location.origin + "/"
    : "http://localhost:3000/";

export const msalConfig = {
  auth: {
    clientId: "6ccf8b01-7af5-497b-9e23-45a92d68a226",
    authority: "https://login.microsoftonline.com/organizations",
    redirectUri,
    navigateToLoginRequestUrl: true,
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,
  },
};

export const loginRequest = {
  scopes: ["openid", "profile", "User.Read"],
};

// Use this when calling YOUR API
export const apiRequest = {
  scopes: ["api://6ccf8b01-7af5-497b-9e23-45a92d68a226/user_impersonation"],
};

// Use this when calling Dynamics
export const dynamicsRequest = {
  scopes: ["https://org962c7b75.crm.dynamics.com/user_impersonation"],
};