import { Suspense } from "react";
import { LoadingState } from "@/components/bits";
import { EditorPage } from "./editor";

export default function EditPlayerPage({ params }: PageProps<"/players/[id]/edit">) {
  return (
    <Suspense fallback={<LoadingState label="Opening editor…" />}>
      <EditorPage params={params} />
    </Suspense>
  );
}
