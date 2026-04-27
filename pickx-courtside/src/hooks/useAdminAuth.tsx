import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

const STORAGE_KEY = "pickx.adminUnlocked";
const ADMIN_PIN = "1234"; // mock only — backend handles real auth

interface AdminAuthValue {
  unlocked: boolean;
  unlock: (pin: string) => boolean;
  logout: () => void;
}

const Ctx = createContext<AdminAuthValue | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    setUnlocked(sessionStorage.getItem(STORAGE_KEY) === "1");
  }, []);

  const unlock = useCallback((pin: string) => {
    if (pin === ADMIN_PIN) {
      sessionStorage.setItem(STORAGE_KEY, "1");
      setUnlocked(true);
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY);
    setUnlocked(false);
  }, []);

  const value = useMemo(() => ({ unlocked, unlock, logout }), [unlocked, unlock, logout]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAdminAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAdminAuth must be used inside AdminAuthProvider");
  return ctx;
}