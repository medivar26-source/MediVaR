"use client";

import { createContext, useCallback, useContext, useState } from "react";

type ToastType = "ok" | "err";
interface ToastItem { id: number; msg: string; type: ToastType }

const ToastContext = createContext<(msg: string, type?: ToastType) => void>(() => {});
export const useToast = () => useContext(ToastContext);

let toastId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback((msg: string, type: ToastType = "ok") => {
    const id = ++toastId;
    setToasts((t) => [...t, { id, msg, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3000);
  }, []);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast-stack">
        {toasts.map((t) => (
          <div key={t.id} className={"toast" + (t.type === "err" ? " err" : "")}>
            {t.msg}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
