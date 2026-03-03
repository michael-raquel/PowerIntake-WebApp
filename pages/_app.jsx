import "@/styles/globals.css";
import { useEffect, useState } from "react";

export default function App({ Component, pageProps }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    async function fetchUser() {
      const res = await fetch("/.auth/me");
      const data = await res.json();
      if (data.clientPrincipal) {
        setUser(data.clientPrincipal);
      }
    }
    fetchUser();
  }, []);

  return <Component {...pageProps} user={user} />;
}