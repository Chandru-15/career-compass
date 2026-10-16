import {
  readDemoSession,
  startDemoSession,
  endDemoSession,
} from "./demoSession";
export const isDemoMode = import.meta.env.VITE_AUTH_MODE === "demo";
function assertDemoHost() {
  if (!["localhost", "127.0.0.1", "[::1]"].includes(window.location.hostname))
    throw new Error("Demo authentication is restricted to localhost.");
}
export class AuthService {
  static async login() {
    if (isDemoMode) {
      assertDemoHost();
      return startDemoSession(localStorage);
    }
    const { msalInstance, loginRequest, initMsal } =
      await import("./msalConfig");
    await initMsal();
    const response = await msalInstance.loginPopup(loginRequest);
    msalInstance.setActiveAccount(response.account);
    return this.getCurrentUser();
  }
  static async loginRedirect() {
    if (isDemoMode) return this.login();
    const { msalInstance, loginRequest, initMsal } =
      await import("./msalConfig");
    await initMsal();
    await msalInstance.loginRedirect(loginRequest);
  }
  static async getCurrentUser() {
    if (isDemoMode) {
      assertDemoHost();
      return readDemoSession(localStorage);
    }
    const { msalInstance, initMsal } = await import("./msalConfig");
    await initMsal();
    const account =
      msalInstance.getActiveAccount() || msalInstance.getAllAccounts()[0];
    return account
      ? {
          id: account.localAccountId,
          email: account.username,
          full_name: account.name,
        }
      : null;
  }
  // Reserved for future Microsoft Graph integrations; never used to call this demo API.
  static async getAccessToken() {
    if (isDemoMode)
      throw new Error("Microsoft tokens are not used in demo mode.");
    const { msalInstance, loginRequest, initMsal } =
      await import("./msalConfig");
    await initMsal();
    return (
      await msalInstance.acquireTokenSilent({
        ...loginRequest,
        account: msalInstance.getActiveAccount(),
      })
    ).accessToken;
  }
  static async logout() {
    if (isDemoMode) {
      endDemoSession(localStorage);
      return;
    }
    const { msalInstance, initMsal } = await import("./msalConfig");
    await initMsal();
    await msalInstance.logoutPopup();
  }
}
