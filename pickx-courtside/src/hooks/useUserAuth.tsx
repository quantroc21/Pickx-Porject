import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

const STORAGE_KEY = "pickx.identity.userId";

interface UserAuthValue {
  userId: string | null;
  login: (id: string) => void;
  logout: () => void;
}

const Ctx = createContext<UserAuthValue | null>(null);

export function UserAuthProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    setUserId(localStorage.getItem(STORAGE_KEY));
  }, []);

  const login = useCallback((id: string) => {
    localStorage.setItem(STORAGE_KEY, id);
    setUserId(id);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setUserId(null);
  }, []);

  const value = useMemo(() => ({ userId, login, logout }), [userId, login, logout]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useUserAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useUserAuth must be used inside UserAuthProvider");
  return ctx;
}
