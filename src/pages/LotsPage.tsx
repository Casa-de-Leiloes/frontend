import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { lots } from "@/lib/api";

function formatCents(cents: string | null): string {
	if (!cents) return "—";
	return new Intl.NumberFormat("pt-BR", {
		style: "currency",
		currency: "BRL",
	}).format(Number(cents) / 100);
}

function formatEndsAt(endsAt: string): string {
	return new Date(endsAt).toLocaleString("pt-BR", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

interface StatusBadgeProps {
	status: string;
}

function StatusBadge({ status }: StatusBadgeProps) {
	const base =
		"inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold";
	if (status === "LIVE")
		return (
			<span className={`${base} bg-[#1d5fbf] text-white`}>
				<span className="mr-1 inline-block w-1.5 h-1.5 rounded-full bg-white opacity-90" />
				AO VIVO
			</span>
		);
	if (status === "SCHEDULED")
		return (
			<span className={`${base} bg-muted text-muted-foreground`}>AGENDADO</span>
		);
	if (status === "CLOSED")
		return (
			<span className={`${base} bg-muted text-muted-foreground`}>
				ENCERRADO
			</span>
		);
	if (status === "CANCELLED")
		return (
			<span className={`${base} bg-destructive/10 text-destructive`}>
				CANCELADO
			</span>
		);
	return (
		<span className={`${base} bg-muted text-muted-foreground`}>{status}</span>
	);
}

export function LotsPage() {
	const { data, isLoading, error } = useQuery({
		queryKey: ["lots"],
		queryFn: () => lots.list(),
		refetchInterval: 30_000,
	});

	const activeLots =
		data?.items.filter((lot) => lot.status !== "CANCELLED") ?? [];

	if (isLoading)
		return (
			<div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
				Carregando lotes…
			</div>
		);

	if (error)
		return (
			<div className="flex items-center justify-center h-64 text-destructive text-sm">
				Falha ao carregar lotes.
			</div>
		);

	return (
		<div className="p-6 lg:p-8">
			<div className="mb-6 flex items-baseline justify-between gap-4">
				<div>
					<h1 className="text-xl font-bold text-foreground">
						Lotes Disponíveis
					</h1>
					<p className="text-sm text-muted-foreground mt-0.5">
						{activeLots.length} {activeLots.length === 1 ? "lote" : "lotes"}
					</p>
				</div>
			</div>

			{activeLots.length === 0 && (
				<div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
					<p className="text-sm">Nenhum lote disponível no momento.</p>
				</div>
			)}

			<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
				{activeLots.map((lot) => (
					<Link key={lot.id} to={`/lots/${lot.id}`} className="group">
						<div className="bg-surface border border-border rounded-lg p-5 hover:border-foreground/20 hover:shadow-md transition-all cursor-pointer h-full flex flex-col">
							<div className="flex items-start justify-between gap-2 mb-3">
								<StatusBadge status={lot.status} />
								<span className="text-xs text-muted-foreground">
									{lot.category.replace(/_/g, " ")}
								</span>
							</div>

							<h2 className="text-sm font-semibold text-foreground line-clamp-2 mb-4 flex-1">
								{lot.title}
							</h2>

							<div className="border-t border-border pt-3 space-y-1.5">
								<div className="flex justify-between items-baseline">
									<span className="text-xs text-muted-foreground">
										Lance atual
									</span>
									<span className="text-base font-bold text-[#1d5fbf] font-mono tabular-nums">
										{formatCents(lot.currentBidCents ?? lot.startingBidCents)}
									</span>
								</div>
								<div className="flex justify-between text-xs text-muted-foreground">
									<span>
										{lot.bidCount} {lot.bidCount === 1 ? "lance" : "lances"}
									</span>
									<span>Encerra {formatEndsAt(lot.endsAt)}</span>
								</div>
							</div>
						</div>
					</Link>
				))}
			</div>
		</div>
	);
}
