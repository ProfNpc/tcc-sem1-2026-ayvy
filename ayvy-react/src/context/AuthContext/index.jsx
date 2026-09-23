import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react";
import {
  findLojistaByUsuarioId,
  loginUsuario,
  resolveLoginEmail,
  sessionFromUsuario,
} from "../../services/authApi";
import { getPostLoginPath, ROLES } from "../../utils/mockAuthUsers";
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

  const login = useCallback(async (emailInput, password) => {
    const email = resolveLoginEmail(emailInput);
    const senha = String(password || "").trim();
    if (!email || !senha) {
      throw new Error("Preencha e-mail e senha.");
    }
    if (!email.includes("@")) {
      throw new Error("Use o e-mail completo do cadastro (ex.: seu@email.com).");
    }

    const usuario = await loginUsuario({ email, senha });
    let lojista = null;
    if (String(usuario.papel).toLowerCase() === ROLES.LOJISTA) {
      try {
        lojista = await findLojistaByUsuarioId(usuario.id);
      } catch {
        lojista = null;
      }
      if (!lojista) {
        throw new Error(
          "Conta lojista sem loja vinculada na API. Conclua o cadastro de lojista ou fale com o admin.",
        );
      }
    }

    const session = sessionFromUsuario(usuario, lojista);
    persistSession(session);
    return session;
  }, []);

  const logout = useCallback(() => {
    persistSession(null);
  }, []);

  const updateSession = useCallback((patch) => {
    const current = sessionSnapshot;
    if (!current) return null;
    const next = { ...current, ...patch };
    persistSession(next);
    return next;
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
      login,
      /** @deprecated use login — mantido para não quebrar imports antigos */
      loginMock: login,
      logout,
      updateSession,
      getPostLoginPath,
    }),
    [user, loggedIn, login, logout, updateSession],
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
