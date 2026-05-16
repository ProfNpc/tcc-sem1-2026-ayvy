import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react";
import "./style.css";

const AUTH_KEY = "ayvy.auth";

function readLogged() {
  try {
    return localStorage.getItem(AUTH_KEY) === "1";
  } catch {
    return false;
  }
}

let loggedSnapshot = readLogged();
const listeners = new Set();

function subscribe(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getSnapshot() {
  return loggedSnapshot;
}

function setLogged(next) {
  loggedSnapshot = next;
  listeners.forEach((l) => l());
}

export default function AuthProvider({ children }) {
  const loggedIn = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const loginMock = useCallback((email, password) => {
    if (!email || !password) return false;
    try {
      localStorage.setItem(AUTH_KEY, "1");
      setLogged(true);
      return true;
    } catch {
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(AUTH_KEY);
    } catch {
      /* ignore */
    }
    setLogged(false);
  }, []);

  const value = useMemo(
    () => ({
      loggedIn,
      loginMock,
      logout,
    }),
    [loggedIn, loginMock, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

const AuthContext = createContext(null);

// eslint-disable-next-line react-refresh/only-export-components -- hook colocado junto ao provider (padrão da comunidade)
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
