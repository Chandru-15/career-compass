import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";
import { AuthService, isDemoMode } from "../services/authService";
import { useQueryClient } from "@tanstack/react-query";
const AuthContext = createContext(null);
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("AuthProvider is required");
  return context;
}
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  const queryClient = useQueryClient();
  useEffect(() => {
    let active = true;
    AuthService.getCurrentUser()
      .then((u) => {
        if (active) setUser(u);
      })
      .catch(() => {
        if (active)
          setError(
            "Authentication configuration is unavailable. Check your frontend environment.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);
  const login = useCallback(async () => {
    try {
      const u = await AuthService.login();
      setUser(u);
      setError("");
      return u;
    } catch (e) {
      setError(e.message);
      throw e;
    }
  }, []);
  const logout = useCallback(async () => {
    await AuthService.logout();
    queryClient.clear();
    setUser(null);
  }, [queryClient]);
  const value = useMemo(
    () => ({
      user,
      loading,
      error,
      login,
      loginRedirect: login,
      logout,
      isAuthenticated: !!user,
      isDemoMode,
    }),
    [user, loading, error, login, logout],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function AuthGate({ children }) {
  const { user, loading, error, login, isDemoMode } = useAuth();
  if (loading)
    return <div className="p-12 text-center">Loading your session…</div>;
  if (!user)
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-white rounded-2xl shadow p-10 text-center max-w-md">
          <h1 className="text-2xl font-bold mb-4">Welcome to Career Compass</h1>
          <p className="text-slate-500 mb-6">
            {isDemoMode
              ? "Start your local demo session. Your saved profile is preserved."
              : "Sign in with your configured Microsoft account."}
          </p>
          {error && (
            <p role="alert" className="text-red-600 mb-4">
              {error}
            </p>
          )}
          <button
            className="bg-teal-500 text-white rounded-lg px-6 py-3"
            onClick={() => login().catch(() => {})}
          >
            {isDemoMode ? "Start Demo Session" : "Sign in with Microsoft"}
          </button>
        </div>
      </div>
    );
  return children;
}
