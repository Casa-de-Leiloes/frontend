import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { wallet } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function formatCents(cents: string): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(cents) / 100);
}

export function WalletPage() {
  const qc = useQueryClient();
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { data: balance, isLoading } = useQuery({
    queryKey: ["wallet-balance"],
    queryFn: () => wallet.balance(),
  });

  async function handleDeposit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const cents = Math.round(parseFloat(amount) * 100);
      await wallet.deposit(cents);
      setAmount("");
      void qc.invalidateQueries({ queryKey: ["wallet-balance"] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Deposit failed");
    } finally {
      setLoading(false);
    }
  }

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading wallet…</div>;

  return (
    <div className="max-w-lg mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">My Wallet</h1>

      {balance && (
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-xl font-bold">{formatCents(balance.totalCents)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground">Available</p>
              <p className="text-xl font-bold text-green-600">{formatCents(balance.availableCents)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground">Committed</p>
              <p className="text-xl font-bold text-orange-500">{formatCents(balance.committedCents)}</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">Add Funds</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleDeposit} className="flex gap-2">
            <Input
              type="number"
              step="0.01"
              min="1"
              placeholder="Amount in USD"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
            <Button type="submit" disabled={loading}>{loading ? "…" : "Deposit"}</Button>
          </form>
          {error && <p className="text-sm text-destructive mt-2">{error}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
