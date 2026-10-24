import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { lots, bids, wallet } from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { Bid } from "@/lib/api";

function formatCents(cents: string | null | undefined): string {
  if (!cents) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(cents) / 100);
}

export function LotDetailPage() {
  const { id } = useParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();
  const [bidAmount, setBidAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [placing, setPlacing] = useState(false);
  const [liveBids, setLiveBids] = useState<Bid[]>([]);
  const sseRef = useRef<EventSource | null>(null);

  const { data: lot } = useQuery({
    queryKey: ["lot", id],
    queryFn: () => lots.get(id!),
    refetchInterval: 10_000,
    enabled: !!id,
  });

  const { data: initialBids } = useQuery({
    queryKey: ["bids", id],
    queryFn: () => bids.list(id!),
    enabled: !!id,
  });

  useEffect(() => {
    if (initialBids) setLiveBids(initialBids);
  }, [initialBids]);

  useEffect(() => {
    if (!id || lot?.status !== "LIVE") return;
    const es = new EventSource(`/api/lots/${id}/bids/events`, { withCredentials: true });
    es.onmessage = (e) => {
      const bid = JSON.parse(e.data) as Bid;
      setLiveBids((prev) => [...prev, bid]);
      void qc.invalidateQueries({ queryKey: ["lot", id] });
    };
    sseRef.current = es;
    return () => { es.close(); sseRef.current = null; };
  }, [id, lot?.status, qc]);

  const { data: balance } = useQuery({
    queryKey: ["wallet-balance"],
    queryFn: () => wallet.balance(),
    enabled: !!user && user.role === "BIDDER",
  });

  async function handlePlaceBid(e: React.FormEvent) {
    e.preventDefault();
    if (!id) return;
    setError(null);
    setPlacing(true);
    try {
      const cents = Math.round(parseFloat(bidAmount) * 100);
      await bids.place(id, cents);
      setBidAmount("");
      void qc.invalidateQueries({ queryKey: ["lot", id] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to place bid");
    } finally {
      setPlacing(false);
    }
  }

  if (!lot) return <div className="p-8 text-center text-muted-foreground">Loading…</div>;

  const minNext = lot.currentBidCents
    ? Number(lot.currentBidCents) + Number(lot.minIncrementCents)
    : Number(lot.startingBidCents);

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{lot.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">{lot.category.replace(/_/g, " ")}</p>
        </div>
        <Badge variant={lot.status === "LIVE" ? "default" : "secondary"}>{lot.status}</Badge>
      </div>

      {lot.description && <p className="text-muted-foreground">{lot.description}</p>}

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Current Price</p>
            <p className="text-2xl font-bold">{formatCents(lot.currentBidCents ?? lot.startingBidCents)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Ends At</p>
            <p className="text-sm font-semibold">{new Date(lot.endsAt).toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {user?.role === "BIDDER" && lot.status === "LIVE" && (
        <Card>
          <CardHeader><CardTitle className="text-base">Place a Bid</CardTitle></CardHeader>
          <CardContent>
            {balance && (
              <p className="text-sm text-muted-foreground mb-3">
                Available: {formatCents(balance.availableCents)} · Min next: {formatCents(String(minNext))}
              </p>
            )}
            <form onSubmit={handlePlaceBid} className="flex gap-2">
              <Input
                type="number"
                step="0.01"
                min={(minNext / 100).toFixed(2)}
                placeholder={`Min $${(minNext / 100).toFixed(2)}`}
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                required
              />
              <Button type="submit" disabled={placing}>
                {placing ? "…" : "Bid"}
              </Button>
            </form>
            {error && <p className="text-sm text-destructive mt-2">{error}</p>}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">Bid History ({liveBids.length})</CardTitle></CardHeader>
        <CardContent>
          {liveBids.length === 0 && <p className="text-sm text-muted-foreground">No bids yet.</p>}
          <div className="space-y-2">
            {[...liveBids].reverse().map((bid) => (
              <div key={bid.id} className="flex justify-between text-sm border-b border-border pb-1">
                <span className="text-muted-foreground">{bid.pseudonym}</span>
                <span className="font-semibold">{formatCents(bid.amountCents)}</span>
                <span className="text-xs text-muted-foreground">{new Date(bid.placedAt).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
