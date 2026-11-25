import { Suspense } from "react";
import { LoadingState } from "@/components/bits";
import { PlayerView } from "./player-view";

export default function PlayerPage({ params }: PageProps<"/players/[id]">) {
  return (
    <Suspense fallback={<LoadingState label="Loading player card…" />}>
      <PlayerView params={params} />
    </Suspense>
  );
}
