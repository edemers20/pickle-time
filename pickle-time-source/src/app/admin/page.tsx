"use client";

import Link from "next/link";
import { Shield } from "lucide-react";
import { LoadingState, PageHeader, WithState } from "@/components/bits";
import { usePlayerSession } from "@/components/player-session";
import { Tabs, TabsContent, TabsList, TabsPanels, TabsTrigger } from "@/components/ui/tabs";
import { PairingTab, PlayoffsTab, ScoresTab, SettingsTab, TeamsTab } from "./tabs";

export default function AdminPage() {
  const { playerId, isAdmin, ready } = usePlayerSession();
  if (!ready) return <LoadingState label="Checking login…" />;
  if (!playerId) {
    return (
      <div className="mx-auto max-w-md py-16 text-center" data-testid="admin-gate">
        <Shield className="mx-auto mb-3 size-8 text-muted-foreground" />
        <h1 className="font-display text-2xl font-bold uppercase">Admin</h1>
        <p className="mt-2 text-sm text-muted-foreground">Log in as an admin player.</p>
        <Link href="/login" className="mt-4 inline-block text-sm font-semibold text-primary underline">
          Login
        </Link>
      </div>
    );
  }
  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-md py-16 text-center" data-testid="admin-denied">
        <Shield className="mx-auto mb-3 size-8 text-muted-foreground" />
        <h1 className="font-display text-2xl font-bold uppercase">Admin</h1>
        <p className="mt-2 text-sm text-muted-foreground">This page is for the tournament admin.</p>
      </div>
    );
  }

  return (
    <div data-testid="admin-desk">
      <PageHeader title="Tournament desk" />
      <WithState>
        {(state) => (
          <Tabs defaultValue="scores">
            <div className="-mx-4 overflow-x-auto px-4">
              <TabsList>
                <TabsTrigger value="scores">Scores</TabsTrigger>
                <TabsTrigger value="pairing">Pairing</TabsTrigger>
                <TabsTrigger value="playoffs">Playoffs</TabsTrigger>
                <TabsTrigger value="teams">Teams &amp; players</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>
            </div>
            <TabsPanels>
              <TabsContent value="scores" className="pt-4">
                <ScoresTab state={state} />
              </TabsContent>
              <TabsContent value="pairing" className="pt-4">
                <PairingTab state={state} />
              </TabsContent>
              <TabsContent value="playoffs" className="pt-4">
                <PlayoffsTab state={state} />
              </TabsContent>
              <TabsContent value="teams" className="pt-4">
                <TeamsTab state={state} />
              </TabsContent>
              <TabsContent value="settings" className="pt-4">
                <SettingsTab state={state} />
              </TabsContent>
            </TabsPanels>
          </Tabs>
        )}
      </WithState>
    </div>
  );
}
