import { PublicClientApplication } from "@azure/msal-browser";

if (
  import.meta.env.VITE_AUTH_MODE !== "msal" ||
  !import.meta.env.VITE_AZURE_CLIENT_ID ||
  !import.meta.env.VITE_AZURE_TENANT_ID
)
  throw new Error(
    "MSAL requires explicit mode, client and tenant configuration.",
  );

const tenantId = import.meta.env.VITE_AZURE_TENANT_ID;
const clientId = import.meta.env.VITE_AZURE_CLIENT_ID;
const redirectUri = import.meta.env.VITE_REDIRECT_URI || window.location.origin;

export const msalConfig = {
  auth: {
    clientId,
    authority: `https://login.microsoftonline.com/${tenantId}`,
    redirectUri,
  },
  cache: {
    cacheLocation: "localStorage",
    storeAuthStateInCookie: false,
  },
};

export const loginRequest = {
  scopes: ["User.Read", "openid", "profile", "email"],
};

export const graphConfig = {
  graphMeEndpoint: "https://graph.microsoft.com/v1.0/me",
};

export const msalInstance = new PublicClientApplication(msalConfig);

// Important: initialize + handleRedirectPromise so redirect login works too
export async function initMsal() {
  await msalInstance.initialize();
  await msalInstance.handleRedirectPromise().catch(() => null);

  const accounts = msalInstance.getAllAccounts();
  if (accounts.length > 0) {
    msalInstance.setActiveAccount(accounts[0]);
  }
}
