import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { lots } from "@/lib/api";

function formatCents(cents: string | null | undefined): string {
	if (!cents) return "-";
	return new Intl.NumberFormat("pt-BR", {
		style: "currency",
		currency: "BRL",
	}).format(Number(cents) / 100);
}

export function ReceiptPage() {
	const { token } = useParams<{ token: string }>();

	const {
		data: receipt,
		isLoading,
		isError,
	} = useQuery({
		queryKey: ["receipt", token],
		queryFn: () => lots.getReceipt(token!),
		enabled: !!token,
		retry: false,
	});

	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
				Carregando comprovante…
			</div>
		);
	}

	if (isError || !receipt) {
		return (
			<div className="flex flex-col items-center justify-center h-64 gap-3">
				<p className="text-destructive font-medium text-sm">
					Comprovante não encontrado.
				</p>
				<Link
					to="/"
					className="text-xs text-muted-foreground underline hover:text-foreground"
				>
					Voltar ao início
				</Link>
			</div>
		);
	}

	return (
		<div className="p-6 lg:p-8 max-w-lg space-y-6">
			<div className="text-center">
				<span className="inline-flex items-center px-3 py-1 rounded text-xs font-semibold tracking-wide uppercase bg-[#1d5fbf] text-white">
					Comprovante de Arrematação
				</span>
			</div>

			<div className="bg-surface border border-border rounded-lg overflow-hidden">
				<div className="px-6 py-5 border-b border-border">
					<h1 className="text-base font-semibold text-foreground text-center">
						{receipt.lotTitle}
					</h1>
				</div>

				<div className="px-6 py-5 space-y-0">
					<div className="flex justify-between items-center py-3 border-b border-border text-sm">
						<span className="text-muted-foreground">Lote</span>
						<Link
							to={`/lots/${receipt.lotId}`}
							className="font-mono text-xs underline text-foreground hover:text-muted-foreground"
						>
							#{receipt.lotId.slice(-8).toUpperCase()}
						</Link>
					</div>

					<div className="flex justify-between items-center py-3 border-b border-border text-sm">
						<span className="text-muted-foreground">Valor arrematado</span>
						<span className="font-bold font-mono tabular-nums text-[#1d5fbf]">
							{formatCents(receipt.amountCents)}
						</span>
					</div>

					<div className="flex justify-between items-center py-3 border-b border-border text-sm">
						<span className="text-muted-foreground">Data de emissão</span>
						<span className="text-foreground">
							{new Date(receipt.issuedAt).toLocaleString("pt-BR")}
						</span>
					</div>

					<div className="flex justify-between items-center py-3 border-b border-border text-sm">
						<span className="text-muted-foreground">Token público</span>
						<code className="font-mono text-xs break-all text-right max-w-[200px] text-muted-foreground">
							{receipt.publicToken}
						</code>
					</div>

					<div className="py-3">
						<p className="text-xs text-muted-foreground mb-2">
							Hash final da cadeia
						</p>
						<code className="font-mono text-xs break-all block bg-ground px-3 py-2 rounded text-muted-foreground">
							{receipt.finalChainHash}
						</code>
					</div>
				</div>
			</div>

			<div className="flex flex-col items-center gap-2 text-center">
				<Link
					to={`/audit/${receipt.lotId}`}
					className="text-sm underline text-foreground hover:text-muted-foreground"
				>
					Verificar cadeia de lances →
				</Link>
				<Link
					to="/"
					className="text-xs text-muted-foreground underline hover:text-foreground"
				>
					Voltar ao início
				</Link>
			</div>
		</div>
	);
}
