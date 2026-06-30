"use client";

import { createContext, useContext, useState, useCallback } from "react";

interface BgRemovalState {
  label: string;
  redirectUrl: string;
}

interface ClientJobsContextValue {
  bgState: BgRemovalState | null;
  startBgRemoval: (label: string, redirectUrl: string) => void;
  stopBgRemoval: () => void;
  seeding: boolean;
  startSeeding: () => void;
  stopSeeding: () => void;
}

const ClientJobsContext = createContext<ClientJobsContextValue>({
  bgState: null,
  startBgRemoval: () => {},
  stopBgRemoval: () => {},
  seeding: false,
  startSeeding: () => {},
  stopSeeding: () => {},
});

export function BgRemovalProvider({ children }: { children: React.ReactNode }) {
  const [bgState, setBgState] = useState<BgRemovalState | null>(null);
  const [seeding, setSeeding] = useState(false);

  const startBgRemoval = useCallback((label: string, redirectUrl: string) => {
    setBgState({ label, redirectUrl });
  }, []);

  const stopBgRemoval = useCallback(() => setBgState(null), []);
  const startSeeding  = useCallback(() => setSeeding(true),  []);
  const stopSeeding   = useCallback(() => setSeeding(false), []);

  return (
    <ClientJobsContext.Provider value={{ bgState, startBgRemoval, stopBgRemoval, seeding, startSeeding, stopSeeding }}>
      {children}
    </ClientJobsContext.Provider>
  );
}

export const useBgRemoval = () => useContext(ClientJobsContext);
