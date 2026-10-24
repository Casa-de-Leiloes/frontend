import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { lots } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function formatCents(cents: string | null): string {
  if (!cents) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(cents) / 100);
}

function statusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  if (status === "LIVE") return "default";
  if (status === "SCHEDULED") return "secondary";
  if (status === "CLOSED" || status === "CANCELLED") return "outline";
  return "outline";
}

export function LotsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["lots"],
    queryFn: () => lots.list(),
    refetchInterval: 30_000,
  });

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading lots…</div>;
  if (error) return <div className="p-8 text-center text-destructive">Failed to load lots.</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Active Lots</h1>
      {data?.items.length === 0 && (
        <p className="text-muted-foreground text-center py-12">No lots available right now.</p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        {data?.items.map((lot) => (
          <Link key={lot.id} to={`/lots/${lot.id}`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base line-clamp-2">{lot.title}</CardTitle>
                  <Badge variant={statusVariant(lot.status)}>{lot.status}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{lot.category.replace(/_/g, " ")}</p>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Current bid</span>
                  <span className="font-semibold">{formatCents(lot.currentBidCents ?? lot.startingBidCents)}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-muted-foreground">Bids</span>
                  <span>{lot.bidCount}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  Ends {new Date(lot.endsAt).toLocaleString()}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
