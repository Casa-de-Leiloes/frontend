import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { users } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function formatCents(cents: string | null | undefined): string {
  if (!cents) return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    Number(cents) / 100,
  );
}

export function MyActivityPage() {
  const { data: bidsData, isLoading: loadingBids } = useQuery({
    queryKey: ["my-bids"],
    queryFn: () => users.myBids(),
  });

  const { data: wins, isLoading: loadingWins } = useQuery({
    queryKey: ["my-wins"],
    queryFn: () => users.myWins(),
  });

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-bold">Minha Atividade</h1>

      <Card>
        <CardHeader>
          <CardTitle>Vitórias</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingWins && <p className="text-sm text-muted-foreground">Carregando…</p>}
          {wins?.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhuma vitória ainda.</p>
          )}
          <div className="space-y-3">
            {wins?.map((win) => (
              <div
                key={win.lotId}
                className="flex items-center justify-between border rounded px-4 py-3 gap-4"
              >
                <div>
                  <Link
                    to={`/lots/${win.lotId}`}
                    className="font-medium hover:underline text-sm"
                  >
                    Lote #{win.lotId.slice(-6).toUpperCase()}
                  </Link>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Valor: {formatCents(win.amountCents)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="default">Vencedor</Badge>
                  {win.receiptToken && (
                    <Link
                      to={`/receipt/${win.receiptToken}`}
                      className="text-xs underline text-primary"
                    >
                      Comprovante
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de lances</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingBids && <p className="text-sm text-muted-foreground">Carregando…</p>}
          {bidsData?.items.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhum lance dado ainda.</p>
          )}
          <div className="space-y-2">
            {bidsData?.items.map((bid) => (
              <div
                key={bid.id}
                className="flex justify-between text-sm border-b border-border pb-2"
              >
                <Link
                  to={bid.lotId ? `/lots/${bid.lotId}` : "#"}
                  className="text-muted-foreground hover:underline"
                >
                  {bid.lotId ? `Lote #${bid.lotId.slice(-6).toUpperCase()}` : "—"}
                </Link>
                <span className="font-semibold">{formatCents(bid.amountCents)}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(bid.placedAt).toLocaleString("pt-BR")}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
