import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { NoticeTone, ToastNotice } from "./ui";

export type TabKey = "home" | "seasons" | "tasks" | "notifications" | "account"
  | "farm" | "owner-tasks" | "owner-protocols" | "inventory";

export interface Route {
  name: string;
  params?: Record<string, string>;
}

interface NavState {
  tab: TabKey;
  stack: Route[];
  setTab: (t: TabKey) => void;
  go: (name: string, params?: Record<string, string>) => void;
  back: () => void;
  toast: (msg: string, tone?: NoticeTone, title?: string) => void;
  toastNotice: ToastNotice | null;
  loggedIn: boolean;
  login: () => void;
  logout: () => void;
}

const NavCtx = createContext<NavState | null>(null);
export const useNav = () => {
  const ctx = useContext(NavCtx);
  if (!ctx) throw new Error("useNav must be used inside NavProvider");
  return ctx;
};

export function NavProvider({ children }: { children: React.ReactNode }) {
  const [tab, setTabState] = useState<TabKey>("home");
  const [stack, setStack] = useState<Route[]>([]);
  const [toastNotice, setToastNotice] = useState<ToastNotice | null>(null);
  const toastTimerRef = useRef<number | undefined>(undefined);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => () => {
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
  }, []);

  const setTab = useCallback((t: TabKey) => {
    setTabState(t);
    setStack([]);
  }, []);
  const go = useCallback((name: string, params?: Record<string, string>) => {
    setStack((s) => [...s, { name, params }]);
  }, []);
  const back = useCallback(() => setStack((s) => s.slice(0, -1)), []);

  const toast = useCallback((msg: string, tone?: NoticeTone, title?: string) => {
    const inferredTone: NoticeTone = tone ?? (
      /Không thể|không hợp lệ|không đúng|không khớp|vượt quá|bị vô hiệu hóa/i.test(msg)
        ? "danger"
        : /Vui lòng|Hãy |cần |chưa /i.test(msg)
          ? "warning"
          : /^(Đã|Cảm ơn)|thành công|đã được/i.test(msg)
            ? "success"
            : "info"
    );
    setToastNotice({ message: msg, tone: inferredTone, title });
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToastNotice(null), 3200);
  }, []);

  const value = useMemo<NavState>(
    () => ({
      tab,
      stack,
      setTab,
      go,
      back,
      toast,
      toastNotice,
      loggedIn,
      login: () => setLoggedIn(true),
      logout: () => {
        setLoggedIn(false);
        setTabState("home");
        setStack([]);
      },
    }),
    [tab, stack, setTab, go, back, toast, toastNotice, loggedIn],
  );

  return <NavCtx.Provider value={value}>{children}</NavCtx.Provider>;
}
