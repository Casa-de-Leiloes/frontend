import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { audit } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function formatCents(cents: string | null | undefined): string {
  if (!cents) return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    Number(cents) / 100,
  );
}

export function AuditPage() {
  const { lotId } = useParams<{ lotId: string }>();

  const { data: result, isLoading: loadingResult } = useQuery({
    queryKey: ["audit", lotId],
    queryFn: () => audit.getLot(lotId!),
    enabled: !!lotId,
  });

  const { data: bidList, isLoading: loadingBids } = useQuery({
    queryKey: ["audit-bids", lotId],
    queryFn: () => audit.getBids(lotId!),
    enabled: !!lotId,
  });

  const isLoading = loadingResult || loadingBids;

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link to={`/lots/${lotId}`} className="text-sm text-muted-foreground hover:underline">
          ← Voltar ao lote
        </Link>
      </div>

      <h1 className="text-2xl font-bold">Auditoria da cadeia de lances</h1>
      <p className="text-sm text-muted-foreground">
        Lote: <code className="font-mono text-xs bg-muted px-1 rounded">{lotId}</code>
      </p>

      {isLoading && <p className="text-muted-foreground">Carregando…</p>}

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              Resultado da verificação
              <Badge variant={result.chainValid ? "default" : "destructive"}>
                {result.chainValid ? "✓ Cadeia válida" : "✗ Cadeia inválida"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total de lances</span>
              <span className="font-semibold">{result.bidCount}</span>
            </div>
            {result.firstHash && (
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Hash do 1º lance</span>
                <code className="font-mono text-xs break-all text-right">{result.firstHash}</code>
              </div>
            )}
            {result.lastHash && (
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Hash do último lance</span>
                <code className="font-mono text-xs break-all text-right">{result.lastHash}</code>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {bidList && bidList.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sequência de lances</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {bidList.map((bid) => (
                <div
                  key={bid.id}
                  className="border rounded px-3 py-2 text-sm font-mono space-y-1"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">#{bid.sequence}</span>
                    <span className="font-semibold not-italic font-sans">
                      {formatCents(bid.amountCents)}
                    </span>
                    <span className="text-xs text-muted-foreground not-italic font-sans">
                      {bid.pseudonym}
                    </span>
                    <span className="text-xs text-muted-foreground not-italic font-sans">
                      {new Date(bid.placedAt).toLocaleTimeString("pt-BR")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {bidList?.length === 0 && !isLoading && (
        <p className="text-muted-foreground text-sm">Nenhum lance registrado neste lote.</p>
      )}
    </div>
  );
}
