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
			<div style={{ background: "var(--ground)", minHeight: "100vh" }}>
				<div style={{ height: "var(--header-h, 152px)" }} aria-hidden />
				<div className="flex items-center justify-center py-24">
					<div className="flex items-center gap-3" style={{ color: "var(--ink-subtle)" }}>
						<svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
							<path d="M21 12a9 9 0 11-6.219-8.56" />
						</svg>
						<span className="text-sm">Loading…</span>
					</div>
				</div>
			</div>
		);
	}

	if (isError || !receipt) {
		return (
			<div style={{ background: "var(--ground)", minHeight: "100vh" }}>
				<div style={{ height: "var(--header-h, 152px)" }} aria-hidden />
				<div className="flex flex-col items-center justify-center py-24 gap-4">
					<div
						className="w-14 h-14 rounded-full flex items-center justify-center"
						style={{ background: "rgba(220,38,38,0.1)" }}
					>
						<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2">
							<path d="M18 6L6 18M6 6l12 12" />
						</svg>
					</div>
					<p className="text-base font-semibold" style={{ color: "var(--ink)" }}>
						Comprovante não encontrado
					</p>
					<p className="text-sm" style={{ color: "var(--ink-muted)" }}>
						Token inválido ou comprovante expirado.
					</p>
					<Link
						to="/"
						className="text-sm mt-2"
						style={{ color: "var(--accent)", textDecoration: "underline" }}
					>
						Voltar ao início
					</Link>
				</div>
			</div>
		);
	}

	return (
		<div style={{ background: "var(--ground)", minHeight: "100vh" }}>
			<div style={{ height: "var(--header-h, 152px)" }} aria-hidden />

			<div className="flex flex-col items-center px-4 py-6">
				{/* Badge */}
				<div className="mb-6 flex items-center gap-2">
					<div
						className="w-8 h-8 rounded-full flex items-center justify-center"
						style={{ background: "rgba(22,163,74,0.12)" }}
					>
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5">
							<path d="M20 6L9 17l-5-5" />
						</svg>
					</div>
					<span
						className="text-xs font-bold tracking-widest uppercase"
						style={{ color: "#16A34A" }}
					>
						Comprovante de Arrematação
					</span>
				</div>

				{/* Card */}
				<div
					className="w-full max-w-md rounded-2xl overflow-hidden"
					style={{
						background: "var(--surface)",
						border: "1px solid var(--border)",
						boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
					}}
				>
					{/* Header */}
					<div
						className="px-6 py-5 text-center"
						style={{ borderBottom: "1px solid var(--border)" }}
					>
						<p className="text-[11px] font-medium uppercase tracking-widest mb-1" style={{ color: "var(--ink-subtle)" }}>
							Lote arrematado
						</p>
						<h1
							className="text-lg font-bold leading-snug"
							style={{ fontFamily: "var(--font-display)", color: "var(--ink)" }}
						>
							{receipt.lotTitle}
						</h1>
						<Link
							to={`/lots/${receipt.lotId}`}
							className="text-xs font-mono mt-1 inline-block"
							style={{ color: "var(--ink-subtle)", textDecoration: "underline" }}
						>
							#{receipt.lotId.slice(-8).toUpperCase()}
						</Link>
					</div>

					{/* Amount hero */}
					<div
						className="py-6 text-center"
						style={{ background: "rgba(29,78,216,0.04)", borderBottom: "1px solid var(--border)" }}
					>
						<p className="text-[11px] font-medium uppercase tracking-widest mb-2" style={{ color: "var(--ink-subtle)" }}>
							Valor arrematado
						</p>
						<p
							className="text-4xl font-bold tabular-nums"
							style={{ fontFamily: "var(--font-mono)", color: "var(--accent)" }}
						>
							{formatCents(receipt.amountCents)}
						</p>
					</div>

					{/* Details */}
					<div className="px-6 py-4 space-y-0">
						<div className="flex justify-between items-center py-3" style={{ borderBottom: "1px solid var(--border)" }}>
							<span className="text-xs font-medium" style={{ color: "var(--ink-subtle)" }}>Data de emissão</span>
							<span className="text-sm tabular-nums" style={{ color: "var(--ink)" }}>
								{new Date(receipt.issuedAt).toLocaleString("pt-BR", {
									day: "2-digit", month: "2-digit", year: "numeric",
									hour: "2-digit", minute: "2-digit",
								})}
							</span>
						</div>

						<div className="flex justify-between items-start py-3" style={{ borderBottom: "1px solid var(--border)" }}>
							<span className="text-xs font-medium shrink-0 pt-0.5" style={{ color: "var(--ink-subtle)" }}>Token público</span>
							<code
								className="text-[11px] font-mono break-all text-right max-w-[220px]"
								style={{ color: "var(--ink-muted)" }}
							>
								{receipt.publicToken}
							</code>
						</div>

						<div className="py-3">
							<p className="text-xs font-medium mb-2" style={{ color: "var(--ink-subtle)" }}>
								Hash final da cadeia
							</p>
							<code
								className="text-[11px] font-mono break-all block px-3 py-2 rounded-lg"
								style={{ background: "var(--subtle-bg2)", color: "var(--ink-muted)" }}
							>
								{receipt.finalChainHash}
							</code>
						</div>
					</div>
				</div>

				{/* Actions */}
				<div className="flex flex-col items-center gap-3 mt-6">
					<Link
						to={`/audit/${receipt.lotId}`}
						className="inline-flex items-center gap-1.5 text-sm font-medium"
						style={{ color: "var(--accent)" }}
					>
						<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
							<path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
						Verificar cadeia de lances
					</Link>
					<Link
						to="/"
						className="text-xs"
						style={{ color: "var(--ink-subtle)", textDecoration: "underline" }}
					>
						Voltar ao início
					</Link>
				</div>
			</div>
		</div>
	);
}
