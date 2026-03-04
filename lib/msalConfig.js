const redirectUri =
  typeof window !== "undefined"
    ? window.location.origin + "/"
    : "http://localhost:3000/";

export const msalConfig = {
  auth: {
    clientId: "6ccf8b01-7af5-497b-9e23-45a92d68a226",
    authority: "https://login.microsoftonline.com/organizations", // ✅ Any work/school account
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