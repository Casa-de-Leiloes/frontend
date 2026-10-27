import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { audit } from "@/lib/api";

function formatCents(cents: string | null | undefined): string {
	if (!cents) return "-";
	return new Intl.NumberFormat("pt-BR", {
		style: "currency",
		currency: "BRL",
	}).format(Number(cents) / 100);
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
		<div className="p-6 lg:p-8 max-w-3xl space-y-6">
			<div>
				<Link
					to={`/lots/${lotId}`}
					className="text-xs text-muted-foreground hover:text-foreground hover:underline"
				>
					← Voltar ao lote
				</Link>
			</div>

			<div>
				<h1 className="text-xl font-bold text-foreground">
					Auditoria da cadeia de lances
				</h1>
				<p className="text-xs text-muted-foreground mt-1">
					Lote:{" "}
					<code className="font-mono bg-muted px-1.5 py-0.5 rounded text-xs">
						{lotId}
					</code>
				</p>
			</div>

			{isLoading && (
				<p className="text-sm text-muted-foreground">Carregando…</p>
			)}

			{result && (
				<div className="bg-surface border border-border rounded-lg p-5">
					<div className="flex items-center gap-3 mb-4">
						<h2 className="text-sm font-semibold text-foreground">
							Resultado da verificação
						</h2>
						{result.chainValid ? (
							<span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-800 border border-green-200">
								✓ Cadeia válida
							</span>
						) : (
							<span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-destructive/10 text-destructive border border-destructive/20">
								✗ Cadeia inválida
							</span>
						)}
					</div>
					<div className="space-y-2 text-sm">
						<div className="flex justify-between">
							<span className="text-muted-foreground">Total de lances</span>
							<span className="font-semibold">{result.bidCount}</span>
						</div>
						{result.firstHash && (
							<div className="flex justify-between gap-4">
								<span className="text-muted-foreground shrink-0">
									Hash do 1º lance
								</span>
								<code className="font-mono text-xs break-all text-right text-muted-foreground">
									{result.firstHash}
								</code>
							</div>
						)}
						{result.lastHash && (
							<div className="flex justify-between gap-4">
								<span className="text-muted-foreground shrink-0">
									Hash do último lance
								</span>
								<code className="font-mono text-xs break-all text-right text-muted-foreground">
									{result.lastHash}
								</code>
							</div>
						)}
					</div>
				</div>
			)}

			{bidList && bidList.length > 0 && (
				<div className="bg-surface border border-border rounded-lg p-5">
					<h2 className="text-sm font-semibold text-foreground mb-4">
						Sequência de lances
					</h2>
					<div className="space-y-0">
						{bidList.map((bid) => (
							<div
								key={bid.id}
								className="py-3 border-b border-border last:border-0"
							>
								<div className="flex justify-between items-center text-sm">
									<span className="text-xs text-muted-foreground font-mono">
										#{bid.sequence}
									</span>
									<span className="font-semibold font-mono tabular-nums">
										{formatCents(bid.amountCents)}
									</span>
									<span className="text-muted-foreground">{bid.pseudonym}</span>
									<span className="text-xs text-muted-foreground">
										{new Date(bid.placedAt).toLocaleTimeString("pt-BR")}
									</span>
								</div>
							</div>
						))}
					</div>
				</div>
			)}

			{bidList?.length === 0 && !isLoading && (
				<p className="text-sm text-muted-foreground">
					Nenhum lance registrado neste lote.
				</p>
			)}
		</div>
	);
}
