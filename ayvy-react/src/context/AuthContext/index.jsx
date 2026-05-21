import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react";
import { resolveMockSession, ROLES } from "../../utils/mockAuthUsers";
import "./style.css";

const AUTH_KEY = "ayvy.auth";

function readSession() {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    if (raw === "1") {
      return { role: ROLES.CLIENTE, login: "", displayName: "Cliente" };
    }
    const parsed = JSON.parse(raw);
    if (!parsed?.role) return null;
    const role = String(parsed.role).toLowerCase();
    if (role === ROLES.ADMIN || role === ROLES.LOJISTA || role === ROLES.CLIENTE) {
      return { ...parsed, role };
    }
    return parsed;
  } catch {
    return null;
  }
}

let sessionSnapshot = readSession();
const listeners = new Set();

function subscribe(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getSnapshot() {
  return sessionSnapshot;
}

function persistSession(session) {
  sessionSnapshot = session;
  try {
    if (session) {
      localStorage.setItem(AUTH_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(AUTH_KEY);
    }
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

export default function AuthProvider({ children }) {
  const user = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const loggedIn = Boolean(user);

  const loginMock = useCallback((loginInput, password) => {
    const session = resolveMockSession(loginInput, password);
    if (!session) return null;
    persistSession(session);
    return session;
  }, []);

  const logout = useCallback(() => {
    persistSession(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loggedIn,
      role: user?.role ?? null,
      isAdmin: user?.role === ROLES.ADMIN,
      isLojista: user?.role === ROLES.LOJISTA,
      isCliente: user?.role === ROLES.CLIENTE,
      shopSlug: user?.shopSlug ?? null,
      loginMock,
      logout,
    }),
    [user, loggedIn, loginMock, logout],
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
