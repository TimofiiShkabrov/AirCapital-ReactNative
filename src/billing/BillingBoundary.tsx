import React, { useEffect } from "react";
import { AppState } from "react-native";
import { useBillingStore } from "./store";

export function BillingBoundary({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const refresh = () => { useBillingStore.getState().tick(); void useBillingStore.getState().refresh(); };
    refresh();
    const listener = AppState.addEventListener("change", (state) => { if (state === "active") refresh(); });
    const timer = setInterval(() => { if (AppState.currentState === "active") refresh(); }, 60000);
    return () => { listener.remove(); clearInterval(timer); };
  }, []);
  return children;
}
