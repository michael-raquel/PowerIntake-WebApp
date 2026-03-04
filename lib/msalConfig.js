export const msalConfig = {
  auth: {
    clientId: "031fdb42-1404-44a9-9096-9dd0ab38255b",
    authority:
      "https://login.microsoftonline.com/1159156a-3971-429d-bb02-bd37b1223d24",
    redirectUri: "/",
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,
  },
};

export const loginRequest = {
  scopes: ["openid", "profile", "User.Read"],
};
