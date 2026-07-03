import { createContext, useContext, ReactNode } from "react";
import { useCrmStore } from "@/hooks/useCrmStore";

type CrmContextType = ReturnType<typeof useCrmStore>;
const CrmContext = createContext<CrmContextType | null>(null);

export function CrmProvider({ children }: { children: ReactNode }) {
  const store = useCrmStore();
  return <CrmContext.Provider value={store}>{children}</CrmContext.Provider>;
}

export function useCrm() {
  const ctx = useContext(CrmContext);
  if (!ctx) throw new Error("useCrm must be used within CrmProvider");
  return ctx;
}
