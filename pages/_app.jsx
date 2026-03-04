import "@/styles/globals.css";
import { useEffect, useState } from "react";

export default function App({ Component, pageProps }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    async function fetchUser() {
      const res = await fetch("/.auth/me");
      const data = await res.json();
      if (data.clientPrincipal) {
        setUser(data.clientPrincipal);

        // The token is inside the claims or via the X-MS-TOKEN headers
        // For AAD, you can get it this way:
        const idToken = data.clientPrincipal?.claims?.find(
          (c) => c.typ === "idp_access_token"
        )?.val;
        setToken(idToken);
      }
    }
    fetchUser();
  }, []);

  return <Component {...pageProps} user={user} token={token} />;
}