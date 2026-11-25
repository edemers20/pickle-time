"use client";

import { createContext, useContext } from "react";

export const OpenTeamContext = createContext<(id: number) => void>(() => {});

export function useOpenTeam() {
  return useContext(OpenTeamContext);
}
