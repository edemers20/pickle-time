"use client";

import { createContext, useContext } from "react";

export const OpenPlayerContext = createContext<(id: number) => void>(() => {});

export function useOpenPlayer() {
  return useContext(OpenPlayerContext);
}
