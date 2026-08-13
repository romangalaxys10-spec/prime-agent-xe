import React, { useEffect } from "react";
import { Zap, Plus, RefreshCw, Cpu, Wifi, WifiOff, Boxes } from "lucide-react";
import { Button } from "./components/ui/button";
import { Card, CardContent } from "./components/ui/card";
import { Avatar, AvatarFallback } from "./components/ui/avatar";
import { Badge } from "./components/ui/badge";
import { Separator } from "./components/ui/separator";

export function Sidebar({
  connected, sessions, onRequestSessions, onNewSession, onOpenModels,
}: {
  connected: boolean; sessions: string;
  onRequestSessions: () => void; onNewSession: () => void; onOpenModels: () => void;
}) {
  useEffect(() => { onRequestSessions(); }, [onRequestSessions]);

  const agents = sessions.split("\n").map((s) => s.trim()).filter(Boolean);

  return (
    <div className="flex w-64 shrink-0 flex-col gap-3 border-r bg-card p-3">
      <div className="flex items-center gap-2 px-1">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow">
          <Zap className="h-4 w-4" />
        </div>
        <div>
          <div className="text-sm font-semibold leading-tight">Prime Agent XE</div>
          <div className="text-[11px] text-muted-foreground">Extreme Edition</div>
        </div>
      </div>

      <div className={connected ? "flex items-center gap-2 rounded-md bg-secondary/60 px-2.5 py-1.5 text-xs" : "flex items-center gap-2 rounded-md bg-destructive/10 px-2.5 py-1.5 text-xs text-destructive"}>
        {connected ? <Wifi className="h-3.5 w-3.5 text-primary" /> : <WifiOff className="h-3.5 w-3.5" />}
        <span>{connected ? "Agent linked" : "Disconnected"}</span>
      </div>

      <div className="grid grid-cols-1 gap-2">
        <Button className="justify-start gap-2" onClick={onOpenModels}>
          <Zap className="h-4 w-4" /> Switch model
        </Button>
        <Button variant="secondary" className="justify-start gap-2" onClick={onNewSession}>
          <Plus className="h-4 w-4" /> New session
        </Button>
        <Button variant="ghost" className="justify-start gap-2 text-muted-foreground" onClick={onRequestSessions}>
          <RefreshCw className="h-4 w-4" /> Refresh agents
        </Button>
      </div>

      <Separator />

      <div className="flex items-center gap-2 px-1 text-xs font-medium text-muted-foreground">
        <Cpu className="h-3.5 w-3.5" /> Running agents
        <Badge variant="secondary" className="ml-auto">{agents.length}</Badge>
      </div>

      <div className="-mr-1 flex-1 space-y-1.5 overflow-y-auto pr-1">
        {agents.length === 0 && (
          <div className="rounded-md border border-dashed p-3 text-center text-[11px] text-muted-foreground">
            None active — use <code className="text-foreground">prime-agent agents</code>
          </div>
        )}
        {agents.map((a, i) => (
          <Card key={i} className="bg-secondary/40 py-0">
            <CardContent className="flex items-center gap-2 px-2.5 py-2">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="bg-primary/20 text-primary"><Boxes className="h-3 w-3" /></AvatarFallback>
              </Avatar>
              <code className="truncate text-[11px] text-foreground">{a}</code>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="rounded-md bg-muted/40 p-2 text-[11px] leading-relaxed text-muted-foreground">
        One backend, three surfaces: desktop GUI, built-in CLI, or your native terminal.
      </div>
    </div>
  );
}
