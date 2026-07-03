import React, { createContext, useContext } from "react";
import { useHRStore } from "@/hooks/useHRStore";

type HRContextType = ReturnType<typeof useHRStore>;

const HRContext = createContext<HRContextType | null>(null);

export function HRProvider({ children }: { children: React.ReactNode }) {
  const store = useHRStore();
  return <HRContext.Provider value={store}>{children}</HRContext.Provider>;
}

export function useHR() {
  const ctx = useContext(HRContext);
  if (!ctx) throw new Error("useHR must be used within HRProvider");
  return ctx;
}
