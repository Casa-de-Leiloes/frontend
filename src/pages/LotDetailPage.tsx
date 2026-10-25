import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { lots, bids, wallet } from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Bid } from "@/lib/api";

function formatCents(cents: string | null | undefined): string {
	if (!cents) return "—";
	return new Intl.NumberFormat("pt-BR", {
		style: "currency",
		currency: "BRL",
	}).format(Number(cents) / 100);
}

function useCountdown(endsAt: string | undefined) {
	const [remaining, setRemaining] = useState(0);
	useEffect(() => {
		if (!endsAt) return;
		const update = () =>
			setRemaining(Math.max(0, new Date(endsAt).getTime() - Date.now()));
		update();
		const id = setInterval(update, 1000);
		return () => clearInterval(id);
	}, [endsAt]);
	return remaining;
}

function formatMs(ms: number): string {
	const totalSecs = Math.floor(ms / 1000);
	const h = Math.floor(totalSecs / 3600);
	const m = Math.floor((totalSecs % 3600) / 60);
	const s = totalSecs % 60;
	return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
}

const BID_ERROR_MESSAGES: Record<string, string> = {
	ALREADY_LEADING: "Você já está liderando este lote",
	BID_TOO_LOW: "Lance abaixo do mínimo permitido",
	INSUFFICIENT_BALANCE: "Saldo insuficiente — deposite mais na carteira",
	LOT_NOT_LIVE: "Lote não está ao vivo",
};

function friendlyBidError(raw: string): string {
	for (const [code, msg] of Object.entries(BID_ERROR_MESSAGES)) {
		if (raw.includes(code)) return msg;
	}
	return raw;
}

export function LotDetailPage() {
	const { id } = useParams<{ id: string }>();
	const user = useAuthStore((s) => s.user);
	const qc = useQueryClient();
	const [bidAmount, setBidAmount] = useState("");
	const [bidError, setBidError] = useState<string | null>(null);
	const [placing, setPlacing] = useState(false);
	const [liveBids, setLiveBids] = useState<Bid[]>([]);
	const sseRef = useRef<EventSource | null>(null);

	const { data: lot } = useQuery({
		queryKey: ["lot", id],
		queryFn: () => lots.get(id!),
		refetchInterval: 10_000,
		enabled: !!id,
	});

	const remaining = useCountdown(lot?.endsAt);
	const isUrgent = remaining > 0 && remaining < 2 * 60 * 1000;

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
		const es = new EventSource(`/api/lots/${id}/bids/events`, {
			withCredentials: true,
		});
		es.onmessage = (e: MessageEvent<string>) => {
			const bid = JSON.parse(e.data) as Bid;
			setLiveBids((prev) => [...prev, bid]);
			void qc.invalidateQueries({ queryKey: ["lot", id] });
			void qc.invalidateQueries({ queryKey: ["position", id] });
		};
		sseRef.current = es;
		return () => {
			es.close();
			sseRef.current = null;
		};
	}, [id, lot?.status, qc]);

	const { data: balance } = useQuery({
		queryKey: ["wallet-balance"],
		queryFn: () => wallet.balance(),
		enabled: !!user && user.role === "BIDDER",
	});

	const { data: position } = useQuery({
		queryKey: ["position", id],
		queryFn: () => lots.getPosition(id!),
		enabled: !!id && !!user && user.role === "BIDDER" && lot?.status === "LIVE",
		refetchInterval: 10_000,
	});

	async function handlePlaceBid(e: React.FormEvent) {
		e.preventDefault();
		if (!id) return;
		setBidError(null);
		setPlacing(true);
		try {
			const cents = Math.round(parseFloat(bidAmount) * 100);
			await bids.place(id, cents);
			setBidAmount("");
			void qc.invalidateQueries({ queryKey: ["lot", id] });
			void qc.invalidateQueries({ queryKey: ["position", id] });
			void qc.invalidateQueries({ queryKey: ["wallet-balance"] });
		} catch (err) {
			setBidError(
				friendlyBidError(
					err instanceof Error ? err.message : "Erro ao dar lance",
				),
			);
		} finally {
			setPlacing(false);
		}
	}

	if (!lot)
		return (
			<div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
				Carregando…
			</div>
		);

	const minNext = lot.currentBidCents
		? Number(lot.currentBidCents) + Number(lot.minIncrementCents)
		: Number(lot.startingBidCents);

	return (
		<div className="p-6 lg:p-8 max-w-3xl space-y-6">
			<div>
				<div className="flex items-start gap-3 mb-1">
					{lot.status === "LIVE" ? (
						<span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-[#1d5fbf] text-white">
							<span className="mr-1 inline-block w-1.5 h-1.5 rounded-full bg-white opacity-90" />
							AO VIVO
						</span>
					) : (
						<span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-muted text-muted-foreground">
							{lot.status}
						</span>
					)}
					<span className="text-xs text-muted-foreground self-center">
						{lot.category.replace(/_/g, " ")}
					</span>
				</div>
				<h1 className="text-xl font-bold text-foreground mt-2">{lot.title}</h1>
				{lot.description && (
					<p className="text-sm text-muted-foreground mt-1">
						{lot.description}
					</p>
				)}
			</div>

			<div className="grid grid-cols-2 gap-4">
				<div className="bg-surface border border-border rounded-lg p-4">
					<p className="text-xs text-muted-foreground mb-1">Lance atual</p>
					<p className="text-2xl font-bold font-mono tabular-nums text-[#1d5fbf]">
						{formatCents(lot.currentBidCents ?? lot.startingBidCents)}
					</p>
					<p className="text-xs text-muted-foreground mt-1">
						{lot.bidCount} {lot.bidCount === 1 ? "lance" : "lances"}
					</p>
				</div>
				<div className="bg-surface border border-border rounded-lg p-4">
					<p className="text-xs text-muted-foreground mb-1">Encerra em</p>
					{lot.status === "LIVE" && remaining > 0 ? (
						<p
							className={`text-2xl font-bold font-mono tabular-nums ${
								isUrgent ? "text-destructive" : "text-foreground"
							}`}
						>
							{formatMs(remaining)}
						</p>
					) : (
						<p className="text-sm font-semibold text-foreground">
							{new Date(lot.endsAt).toLocaleString("pt-BR")}
						</p>
					)}
				</div>
			</div>

			{user?.role === "BIDDER" && lot.status === "LIVE" && position && (
				<div
					className={`rounded-lg border px-4 py-3 text-sm font-medium ${
						position.isLeading
							? "border-green-600/30 bg-green-50 text-green-800"
							: "border-orange-500/30 bg-orange-50 text-orange-800"
					}`}
				>
					{position.isLeading ? (
						<span>✓ Você está liderando este lote</span>
					) : (
						<span>
							Você foi superado —{" "}
							{position.gapToLeadCents
								? `faltam ${formatCents(position.gapToLeadCents)} para liderar`
								: "dê um lance para participar"}
						</span>
					)}
				</div>
			)}

			{user?.role === "BIDDER" && lot.status === "LIVE" && (
				<div className="bg-surface border border-border rounded-lg p-5">
					<h2 className="text-sm font-semibold text-foreground mb-3">
						Dar lance
					</h2>
					{balance && (
						<p className="text-xs text-muted-foreground mb-3">
							Disponível:{" "}
							<span className="font-semibold text-foreground">
								{formatCents(balance.availableCents)}
							</span>{" "}
							· Mínimo:{" "}
							<span className="font-semibold text-foreground">
								{formatCents(String(minNext))}
							</span>
						</p>
					)}
					<form onSubmit={handlePlaceBid} className="flex gap-2">
						<Input
							type="number"
							step="0.01"
							min={(minNext / 100).toFixed(2)}
							placeholder={`Mín. R$ ${(minNext / 100).toFixed(2)}`}
							value={bidAmount}
							onChange={(e) => setBidAmount(e.target.value)}
							required
							className="flex-1"
						/>
						<Button type="submit" disabled={placing}>
							{placing ? "…" : "Lançar"}
						</Button>
					</form>
					{bidError && (
						<p className="text-sm text-destructive bg-destructive/5 border border-destructive/20 rounded px-3 py-2 mt-3">
							{bidError}
						</p>
					)}
				</div>
			)}

			<div className="bg-surface border border-border rounded-lg p-5">
				<div className="flex items-center justify-between mb-4">
					<h2 className="text-sm font-semibold text-foreground">
						Histórico de lances{" "}
						<span className="text-muted-foreground font-normal">
							({liveBids.length})
						</span>
					</h2>
					<Link
						to={`/audit/${lot.id}`}
						className="text-xs text-muted-foreground hover:text-foreground underline"
					>
						Verificar cadeia →
					</Link>
				</div>

				{liveBids.length === 0 && (
					<p className="text-sm text-muted-foreground">Nenhum lance ainda.</p>
				)}

				<div className="space-y-0">
					{[...liveBids].reverse().map((bid) => (
						<div
							key={bid.id}
							className="flex justify-between items-center py-2.5 border-b border-border last:border-0 text-sm"
						>
							<span className="text-muted-foreground">{bid.pseudonym}</span>
							<span className="font-semibold font-mono tabular-nums">
								{formatCents(bid.amountCents)}
							</span>
							<span className="text-xs text-muted-foreground">
								{new Date(bid.placedAt).toLocaleTimeString("pt-BR")}
							</span>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
