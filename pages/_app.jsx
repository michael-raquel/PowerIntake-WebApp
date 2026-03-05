import "@/styles/globals.css";
import { PublicClientApplication } from "@azure/msal-browser";
import { MsalProvider } from "@azure/msal-react";
import { msalConfig } from "@/lib/msalConfig";

const msalInstance = new PublicClientApplication(msalConfig);

export default function App({ Component, pageProps }) {
  return (
    <MsalProvider instance={msalInstance}>
      <Component {...pageProps} />
    </MsalProvider>
  );
}
