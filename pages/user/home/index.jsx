import { useMsal } from "@azure/msal-react";
import { loginRequest, graphConfig } from "@/lib/msalConfig";
import { useState } from "react";

export default function UserHome() {
  const { instance, accounts } = useMsal();
  const account = accounts[0];
  const [tokenInfo, setTokenInfo] = useState(null);
  const [groups, setGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(false);

  async function fetchTokenInfo() {
    try {
      const response = await instance.acquireTokenSilent({
        ...loginRequest,
        account,
      });

      const info = {
        accessToken: response.accessToken,
        idToken: response.idToken,
        tokenType: response.tokenType,
        scopes: response.scopes,
        expiresOn: response.expiresOn?.toString(),
        account: {
          name: response.account.name,
          username: response.account.username,
          localAccountId: response.account.localAccountId,
          tenantId: response.account.tenantId,
          environment: response.account.environment,
        },
      };

      console.log("==== MSAL Token Info ====");
      console.log("Access Token:", info.accessToken);
      console.log("ID Token:", info.idToken);
      console.log("Token Type:", info.tokenType);
      console.log("Scopes:", info.scopes);
      console.log("Expires On:", info.expiresOn);
      console.log("Account:", info.account);
      console.table(info.account);

      setTokenInfo(info);
    } catch (error) {
      console.error("Token acquisition failed:", error);
    }
  }

  async function fetchUserGroups() {
    setLoadingGroups(true);
    try {
      const response = await instance.acquireTokenSilent({
        ...loginRequest,
        account,
      });

      const groupsResponse = await fetch(graphConfig.graphGroupsEndpoint, {
        headers: {
          Authorization: `Bearer ${response.accessToken}`,
        },
      });

      const data = await groupsResponse.json();

      const filteredGroups = data.value
        .filter((item) => item["@odata.type"] === "#microsoft.graph.group")
        .map((group) => ({
          id: group.id,
          displayName: group.displayName,
          securityEnabled: group.securityEnabled,
          mailEnabled: group.mailEnabled,
        }));

      console.log("==== User Groups ====");
      console.table(filteredGroups);

      setGroups(filteredGroups);
    } catch (error) {
      console.error("Failed to fetch groups:", error);
    } finally {
      setLoadingGroups(false);
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Welcome, {account?.name}</h1>
      <p className="text-zinc-500 text-sm">Username: {account?.username}</p>

      <div className="flex gap-3">
        <button
          onClick={fetchTokenInfo}
          className="rounded-full bg-black text-white px-6 py-2 hover:bg-zinc-800"
        >
          Fetch Token Info
        </button>
        <button
          onClick={fetchUserGroups}
          className="rounded-full bg-blue-600 text-white px-6 py-2 hover:bg-blue-700"
        >
          {loadingGroups ? "Loading..." : "Fetch My Groups"}
        </button>
      </div>

      {/* User Groups */}
      {groups.length > 0 && (
        <div className="border rounded-xl p-4 bg-zinc-50 dark:bg-zinc-900 space-y-3">
          <h2 className="font-semibold text-lg">My Groups ({groups.length})</h2>
          <div className="grid grid-cols-1 gap-2">
            {groups.map((group) => (
              <div
                key={group.id}
                className="flex items-center justify-between border rounded-lg p-3 bg-white dark:bg-black"
              >
                <div>
                  <p className="font-medium text-sm">{group.displayName}</p>
                  <p className="text-xs text-zinc-400">{group.id}</p>
                </div>
                <div className="flex gap-2">
                  {group.securityEnabled && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                      Security
                    </span>
                  )}
                  {group.mailEnabled && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                      Mail
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tokenInfo && (
        <div className="space-y-4">

          {/* Account Info */}
          <div className="border rounded-xl p-4 bg-zinc-50 dark:bg-zinc-900 space-y-1">
            <h2 className="font-semibold text-lg">Account Info</h2>
            <p><span className="font-medium">Name:</span> {tokenInfo.account.name}</p>
            <p><span className="font-medium">Username:</span> {tokenInfo.account.username}</p>
            <p><span className="font-medium">Local Account ID:</span> {tokenInfo.account.localAccountId}</p>
            <p><span className="font-medium">Tenant ID:</span> {tokenInfo.account.tenantId}</p>
            <p><span className="font-medium">Environment:</span> {tokenInfo.account.environment}</p>
          </div>

          {/* Token Details */}
          <div className="border rounded-xl p-4 bg-zinc-50 dark:bg-zinc-900 space-y-1">
            <h2 className="font-semibold text-lg">Token Details</h2>
            <p><span className="font-medium">Token Type:</span> {tokenInfo.tokenType}</p>
            <p><span className="font-medium">Expires On:</span> {tokenInfo.expiresOn}</p>
            <p><span className="font-medium">Scopes:</span> {tokenInfo.scopes.join(", ")}</p>
          </div>

          {/* Access Token */}
          <div className="border rounded-xl p-4 bg-zinc-50 dark:bg-zinc-900 space-y-2">
            <h2 className="font-semibold text-lg">Access Token</h2>
            <textarea
              readOnly
              value={tokenInfo.accessToken}
              rows={4}
              className="w-full text-xs font-mono bg-white dark:bg-black border rounded-lg p-2 resize-none"
            />
          </div>

          {/* ID Token */}
          <div className="border rounded-xl p-4 bg-zinc-50 dark:bg-zinc-900 space-y-2">
            <h2 className="font-semibold text-lg">ID Token</h2>
            <textarea
              readOnly
              value={tokenInfo.idToken}
              rows={4}
              className="w-full text-xs font-mono bg-white dark:bg-black border rounded-lg p-2 resize-none"
            />
          </div>

        </div>
      )}
    </div>
  );
}