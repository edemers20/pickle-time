"use client";

import { useRouter } from "next/navigation";
import { use } from "react";
import { PlayerSheet } from "@/components/player-sheet";

export function PlayerView({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const playerId = Number(id);
  return <PlayerSheet id={Number.isNaN(playerId) ? null : playerId} onOpenPlayer={(next) => router.push(`/players/${next}`)} />;
}
