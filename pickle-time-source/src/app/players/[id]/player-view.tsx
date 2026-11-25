"use client";

import { use } from "react";
import { PlayerSheet } from "@/components/player-sheet";

export function PlayerView({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const playerId = Number(id);
  return <PlayerSheet id={Number.isNaN(playerId) ? null : playerId} />;
}
