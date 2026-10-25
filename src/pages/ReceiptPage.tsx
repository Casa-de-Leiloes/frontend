import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { lots } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function formatCents(cents: string | null | undefined): string {
  if (!cents) return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    Number(cents) / 100,
  );
}

export function ReceiptPage() {
  const { token } = useParams<{ token: string }>();

  const { data: receipt, isLoading, isError } = useQuery({
    queryKey: ["receipt", token],
    queryFn: () => lots.getReceipt(token!),
    enabled: !!token,
    retry: false,
  });

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Carregando comprovante…</div>;
  }

  if (isError || !receipt) {
    return (
      <div className="p-8 text-center">
        <p className="text-destructive font-medium">Comprovante não encontrado.</p>
        <Link to="/" className="text-sm text-muted-foreground underline mt-2 block">
          Voltar ao início
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto p-6 space-y-6">
      <div className="text-center">
        <Badge variant="default" className="text-base px-4 py-1">
          Comprovante de Arrematação
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-center">{receipt.lotTitle}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between border-b pb-2">
            <span className="text-muted-foreground">Lote</span>
            <Link to={`/lots/${receipt.lotId}`} className="font-mono text-xs underline text-primary">
              #{receipt.lotId.slice(-8).toUpperCase()}
            </Link>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span className="text-muted-foreground">Valor arrematado</span>
            <span className="font-bold text-base">{formatCents(receipt.amountCents)}</span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span className="text-muted-foreground">Data de emissão</span>
            <span>{new Date(receipt.issuedAt).toLocaleString("pt-BR")}</span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span className="text-muted-foreground">Token público</span>
            <code className="font-mono text-xs break-all text-right max-w-[200px]">
              {receipt.publicToken}
            </code>
          </div>
          <div className="pt-1">
            <p className="text-xs text-muted-foreground mb-1">Hash final da cadeia</p>
            <code className="font-mono text-xs break-all block bg-muted px-2 py-1 rounded">
              {receipt.finalChainHash}
            </code>
          </div>
        </CardContent>
      </Card>

      <div className="text-center space-y-2">
        <Link to={`/audit/${receipt.lotId}`} className="text-sm underline text-primary block">
          Verificar cadeia de lances
        </Link>
        <Link to="/" className="text-sm text-muted-foreground underline block">
          Voltar ao início
        </Link>
      </div>
    </div>
  );
}
