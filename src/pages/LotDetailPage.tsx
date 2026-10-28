import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { lots, bids, wallet, imgProxy } from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import { Button } from "@/components/ui/Button";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { translateError } from "@/lib/errors";
import type { Bid } from "@/lib/api";

function formatCents(cents: string | null | undefined): string {
	if (!cents) return "-";
	return new Intl.NumberFormat("pt-BR", {
		style: "currency",
		currency: "BRL",
	}).format(Number(cents) / 100);
}

function useCountdownMs(endsAt: string | undefined): number {
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

function pad(n: number): string {
	return String(n).padStart(2, "0");
}

function splitMs(ms: number) {
	const total = Math.floor(ms / 1000);
	return {
		dias: String(Math.floor(total / 86400)).padStart(2, "0"),
		hr: pad(Math.floor((total % 86400) / 3600)),
		min: pad(Math.floor((total % 3600) / 60)),
		seg: pad(total % 60),
	};
}

function CountdownBlock({ ms, urgent }: { ms: number; urgent: boolean }) {
	const { dias, hr, min, seg } = splitMs(ms);
	const color = urgent ? "var(--live)" : "var(--ink)";
	return (
		<div className="flex items-center justify-center gap-3">
			{[
				{ v: dias, l: "DIAS" },
				{ v: hr, l: "HORAS" },
				{ v: min, l: "MINUTOS" },
				{ v: seg, l: "SEGUNDOS" },
			].map(({ v, l }, i) => (
				<div key={l} className="flex items-start gap-3">
					{i > 0 && (
						<span className="text-2xl font-bold mt-0.5" style={{ color }}>
							:
						</span>
					)}
					<div className="flex flex-col items-center min-w-[40px]">
						<span
							className="text-3xl font-bold tabular-nums leading-none"
							style={{ color, fontFamily: "var(--font-mono)" }}
						>
							{v}
						</span>
						<span className="text-[9px] uppercase tracking-widest text-[var(--ink-subtle)] mt-1">
							{l}
						</span>
					</div>
				</div>
			))}
		</div>
	);
}

function LotGallery({
	mainImage,
	additionalImages,
	title,
}: {
	mainImage: string | null;
	additionalImages: string[];
	title: string;
}) {
	const allImages = [mainImage, ...additionalImages].filter(
		(u): u is string => Boolean(u),
	);
	const [activeIdx, setActiveIdx] = useState(0);
	const active = allImages[activeIdx] ?? null;
	const proxied = imgProxy(active);

	return (
		<div className="space-y-3">
			<div
				className="rounded-xl overflow-hidden bg-[var(--ground)] border border-[var(--border)]"
				style={{ aspectRatio: "4/3" }}
			>
				{proxied ? (
					<img
						src={proxied}
						alt={title}
						className="w-full h-full object-contain"
					/>
				) : (
					<div className="w-full h-full flex items-center justify-center">
						<svg
							width="64"
							height="64"
							viewBox="0 0 24 24"
							fill="none"
							stroke="#D1D5DB"
							strokeWidth="1"
						>
							<rect x="3" y="3" width="18" height="18" rx="2" />
							<circle cx="8.5" cy="8.5" r="1.5" />
							<path d="m21 15-5-5L5 21" />
						</svg>
					</div>
				)}
			</div>
			{allImages.length > 1 && (
				<div
					className="flex gap-2 overflow-x-auto pb-1"
					style={{ scrollbarWidth: "none" }}
				>
					{allImages.map((url, i) => (
						<button
							key={i}
							type="button"
							onClick={() => setActiveIdx(i)}
							className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors"
							style={{
								borderColor: i === activeIdx ? "var(--accent)" : "var(--border)",
							}}
						>
							<img
								src={imgProxy(url) ?? url}
								alt={`${title} ${i + 1}`}
								className="w-full h-full object-cover"
							/>
						</button>
					))}
				</div>
			)}
		</div>
	);
}

const ATTR_LABELS: Record<string, string> = {
	artistDisplayName: "Artista",
	artistBeginDate: "Nascimento",
	artistEndDate: "Falecimento",
	objectDate: "Data da obra",
	medium: "Técnica",
	dimensions: "Dimensões",
	country: "País de origem",
	culture: "Cultura",
	period: "Período",
	dynasty: "Dinastia",
	classification: "Classificação",
	department: "Departamento",
	creditLine: "Acervo",
	objectName: "Tipo de objeto",
	artistNationality: "Nacionalidade",
	reign: "Reinado",
	repository: "Repositório",
	rightsAndReproduction: "Direitos",
	GalleryNumber: "Galeria",
};

const ATTR_ORDER = [
	"artistDisplayName",
	"artistNationality",
	"artistBeginDate",
	"artistEndDate",
	"objectDate",
	"period",
	"dynasty",
	"culture",
	"country",
	"medium",
	"dimensions",
	"classification",
	"department",
	"creditLine",
	"objectName",
	"GalleryNumber",
	"reign",
	"repository",
];

function DataSection({
	attributes,
}: {
	attributes: Record<string, string | number | boolean | null>;
}) {
	const entries = ATTR_ORDER.flatMap((key) => {
		const val = attributes[key];
		if (!val && val !== 0) return [];
		return [[key, String(val)] as [string, string]];
	});

	const extra = Object.entries(attributes).filter(
		([k, v]) =>
			!ATTR_ORDER.includes(k) &&
			Boolean(v) &&
			!k.startsWith("_") &&
			k !== "isPublicDomain" &&
			k !== "isHighlight" &&
			k !== "isTimelineWork" &&
			k !== "accessionYear" &&
			k !== "primaryImageSmall" &&
			k !== "primaryImage" &&
			k !== "objectURL" &&
			k !== "objectID",
	) as [string, string][];

	const all = [...entries, ...extra.map(([k, v]) => [k, String(v)] as [string, string])];

	if (all.length === 0) return null;

	return (
		<div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5">
			<h2
				className="text-lg font-bold text-[var(--ink)] mb-4"
				style={{ fontFamily: "var(--font-display)" }}
			>
				Dados
			</h2>
			<div className="grid grid-cols-2 gap-x-8 gap-y-4">
				{all.map(([key, value]) => (
					<div key={key}>
						<p className="text-[10px] font-semibold text-[var(--ink-subtle)] uppercase tracking-widest mb-0.5">
							{ATTR_LABELS[key] ?? key.replace(/([A-Z])/g, " $1").trim()}
						</p>
						<p className="text-sm text-[var(--ink)] leading-snug">{value}</p>
					</div>
				))}
			</div>
		</div>
	);
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

	const remaining = useCountdownMs(lot?.endsAt);
	const isUrgent = remaining > 0 && remaining < 2 * 60 * 1000;
	const nowMs = Date.now();
	const startsAtMs = lot?.startsAt ? new Date(lot.startsAt).getTime() : 0;
	const endsAtMs = lot?.endsAt ? new Date(lot.endsAt).getTime() : 0;
	const isLive =
		lot?.status === "LIVE" &&
		startsAtMs <= nowMs &&
		endsAtMs > nowMs &&
		remaining > 0;

	const { data: initialBids } = useQuery({
		queryKey: ["bids", id],
		queryFn: () => bids.list(id!),
		enabled: !!id,
	});

	useEffect(() => {
		if (initialBids) setLiveBids(initialBids);
	}, [initialBids]);

	useEffect(() => {
		if (!id) return;
		const nowMs = Date.now();
		const s = lot?.startsAt ? new Date(lot.startsAt).getTime() : 0;
		const e = lot?.endsAt ? new Date(lot.endsAt).getTime() : 0;
		if (lot?.status !== "LIVE" || s > nowMs || e <= nowMs) return;
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
		enabled: (() => {
			if (!id || !user || user.role !== "BIDDER" || !lot) return false;
			const nowMs = Date.now();
			const s = lot.startsAt ? new Date(lot.startsAt).getTime() : 0;
			const e = lot.endsAt ? new Date(lot.endsAt).getTime() : 0;
			return lot.status === "LIVE" && s <= nowMs && e > nowMs;
		})(),
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
			setBidError(translateError(err));
		} finally {
			setPlacing(false);
		}
	}

	if (!lot)
		return (
			<div className="flex items-center justify-center h-64 text-[var(--ink-muted)] text-sm">
				Carregando...
			</div>
		);

	const minNext = lot.currentBidCents
		? Number(lot.currentBidCents) + Number(lot.minIncrementCents)
		: Number(lot.startingBidCents);

	const attrs = lot.attributes ?? {};

	return (
		<div className="bg-[var(--ground)] min-h-screen">
			{/* Top breadcrumb bar */}
			<div className="border-b border-[var(--border)] bg-[var(--surface)] sticky top-[108px] sm:top-[130px] z-10">
				<div className="max-w-7xl mx-auto px-6 h-11 flex items-center justify-between">
					<nav className="flex items-center gap-1.5 text-xs text-[var(--ink-subtle)]">
						<Link to="/" className="hover:text-[var(--ink)] transition-colors">
							Leilões
						</Link>
						<span>/</span>
						<span className="text-[var(--ink-muted)] truncate max-w-xs">{lot.title}</span>
					</nav>
					<div className="flex items-center gap-3">
						{isLive && remaining > 0 && (
							<span className="inline-flex items-center gap-1 text-[10px] font-bold text-[var(--live)] uppercase tracking-wider">
								<span className="w-1.5 h-1.5 rounded-full bg-[var(--live)] animate-pulse" />
								Ao vivo
							</span>
						)}
						{!isLive && (
							<span className="text-xs text-[var(--ink-subtle)]">
								{lot.status === "CLOSED"
									? "Encerrado"
									: lot.status === "CANCELLED"
										? "Cancelado"
										: "Agendado"}
							</span>
						)}
						{lot.catalogExternalId && lot.catalogProvider === "MET_MUSEUM" && (
							<a
								href={`https://www.metmuseum.org/art/collection/search/${lot.catalogExternalId}`}
								target="_blank"
								rel="noopener noreferrer"
								className="text-xs text-[var(--accent)] hover:underline"
							>
								Ver no museu
							</a>
						)}
					</div>
				</div>
			</div>

			<div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
				{/* Title */}
				<div className="mb-6">
					<p className="text-xs text-[var(--ink-subtle)] uppercase tracking-wider mb-1">
						{lot.category.replace(/_/g, " ")} ·{" "}
						{lot.lotCategory.replace(/_/g, " ")}
					</p>
					<h1
						className="text-2xl md:text-3xl font-bold text-[var(--ink)] leading-tight max-w-3xl"
						style={{ fontFamily: "var(--font-display)" }}
					>
						{lot.title}
					</h1>
					{attrs.artistDisplayName && (
						<p className="text-sm text-[var(--ink-muted)] mt-1">
							{String(attrs.artistDisplayName)}
							{attrs.objectDate ? ` · ${String(attrs.objectDate)}` : ""}
						</p>
					)}
				</div>

				{/* Two columns */}
				<div className="grid lg:grid-cols-[3fr_2fr] gap-8 items-start">
					{/* LEFT */}
					<div className="space-y-5">
						{/* Gallery */}
						<LotGallery
							mainImage={lot.imageUrl}
							additionalImages={lot.additionalImages ?? []}
							title={lot.title}
						/>

						{/* Description */}
						{lot.description && (
							<div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5">
								<h2
									className="text-base font-bold text-[var(--ink)] mb-3"
									style={{ fontFamily: "var(--font-display)" }}
								>
									Descrição fornecida pelo leiloeiro
								</h2>
								<p className="text-sm text-[var(--ink-muted)] leading-relaxed whitespace-pre-line">
									{lot.description}
								</p>
							</div>
						)}

						{/* Dados (catalog attributes) */}
						<DataSection attributes={attrs} />

						{/* Bid history */}
						<div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5">
							<div className="flex items-center justify-between mb-4">
								<h2
									className="text-base font-bold text-[var(--ink)]"
									style={{ fontFamily: "var(--font-display)" }}
								>
									Lances{" "}
									<span className="text-[var(--ink-subtle)] font-normal text-sm">
										({liveBids.length})
									</span>
								</h2>
								<Link
									to={`/audit/${lot.id}`}
									className="text-xs text-[var(--accent)] hover:underline"
								>
									Verificar cadeia
								</Link>
							</div>

							{liveBids.length === 0 ? (
								<p className="text-sm text-[var(--ink-subtle)]">Nenhum lance ainda.</p>
							) : (
								<table className="w-full text-sm">
									<thead>
										<tr className="border-b border-[var(--border)]">
											<th className="text-left text-[10px] font-semibold text-[var(--ink-subtle)] uppercase tracking-wider pb-2">
												Licitante
											</th>
											<th className="text-right text-[10px] font-semibold text-[var(--ink-subtle)] uppercase tracking-wider pb-2">
												Valor
											</th>
											<th className="text-right text-[10px] font-semibold text-[var(--ink-subtle)] uppercase tracking-wider pb-2">
												Horário
											</th>
										</tr>
									</thead>
									<tbody>
										{[...liveBids].reverse().map((bid, i) => (
											<tr
												key={bid.id}
												className="border-b border-[#F9F9F9] last:border-0"
											>
												<td className="py-2.5 text-[var(--ink-muted)]">
													{i === 0 && (
														<span className="inline-block w-2 h-2 rounded-full bg-[#16A34A] mr-1.5 align-middle" />
													)}
													{bid.pseudonym}
												</td>
												<td
													className="py-2.5 text-right font-semibold tabular-nums text-[var(--ink)]"
													style={{ fontFamily: "var(--font-mono)" }}
												>
													{formatCents(bid.amountCents)}
												</td>
												<td className="py-2.5 text-right text-xs text-[var(--ink-subtle)]">
													{new Date(bid.placedAt).toLocaleTimeString("pt-BR")}
												</td>
											</tr>
										))}
									</tbody>
								</table>
							)}
						</div>
					</div>

					{/* RIGHT sticky panel */}
					<div className="lg:sticky lg:top-[160px] space-y-4">
						{/* Countdown (LIVE only) */}
						{isLive && remaining > 0 && (
							<div
								className="rounded-xl border px-5 py-4 text-center"
								style={{
									borderColor: isUrgent ? "var(--live)" : "var(--border)",
									background: isUrgent ? "rgba(239,68,68,0.08)" : "var(--surface)",
								}}
							>
								<p className="text-[10px] uppercase tracking-widest text-[var(--ink-subtle)] mb-3">
									Encerra em
								</p>
								<CountdownBlock ms={remaining} urgent={isUrgent} />
							</div>
						)}

						{/* Current bid card */}
						<div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5">
							<p className="text-[10px] uppercase tracking-widest text-[var(--ink-subtle)] mb-1">
								{lot.status === "CLOSED"
									? "Lance vencedor"
									: "Licitação atual"}
							</p>
							<p
								className="text-4xl font-bold tabular-nums leading-none mb-2"
								style={{ color: "#1D4ED8", fontFamily: "var(--font-mono)" }}
							>
								{formatCents(lot.currentBidCents ?? lot.startingBidCents)}
							</p>
							<div className="flex items-center gap-3 text-xs text-[var(--ink-subtle)]">
								<span>
									{lot.bidCount}{" "}
									{lot.bidCount === 1 ? "lance" : "lances"}
								</span>
								<span>·</span>
								<span>
									Lance inicial: {formatCents(lot.startingBidCents)}
								</span>
							</div>
							{lot.bidCount > 0 && (
								<p className="text-xs text-[var(--ink-subtle)] mt-1">
									Incremento mínimo: {formatCents(lot.minIncrementCents)}
								</p>
							)}
						</div>

						{/* Position pill (BIDDER + LIVE) */}
						{user?.role === "BIDDER" && isLive && position && (
							<div
								className={`rounded-xl border px-4 py-3 text-sm font-medium ${
									position.isLeading
										? "border-green-600/30 bg-green-50 text-green-800"
										: "border-orange-500/30 bg-orange-50 text-orange-800"
								}`}
							>
								{position.isLeading ? (
									<span>Você está liderando</span>
								) : (
									<span>
										Você foi superado.{" "}
										{position.gapToLeadCents
											? `Faltam ${formatCents(position.gapToLeadCents)}`
											: "Dê um lance para participar"}
									</span>
								)}
							</div>
						)}

						{/* Bid form (BIDDER + LIVE) */}
						{user?.role === "BIDDER" && isLive && (
							<div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 space-y-3">
								<p
									className="text-sm font-bold text-[var(--ink)]"
									style={{ fontFamily: "var(--font-display)" }}
								>
									Dar lance
								</p>
								{balance && (
									<div className="flex justify-between text-xs text-[var(--ink-subtle)]">
										<span>
											Disponível:{" "}
											<span className="font-semibold text-[var(--ink)]">
												{formatCents(balance.availableCents)}
											</span>
										</span>
										<span>
											Mínimo:{" "}
											<span className="font-semibold text-[var(--ink)]">
												{formatCents(String(minNext))}
											</span>
										</span>
									</div>
								)}
								<form onSubmit={handlePlaceBid} className="flex gap-2">
									<CurrencyInput
										value={bidAmount}
										onChange={setBidAmount}
										placeholder={`Mín. ${(minNext / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
										required
										className="flex-1"
									/>
									<Button type="submit" disabled={placing}>
										{placing ? "..." : "Lançar"}
									</Button>
								</form>
								{bidError && (
									<p className="text-sm text-[var(--live)] bg-red-50 border border-red-200 rounded px-3 py-2">
										{bidError}
									</p>
								)}
							</div>
						)}

						{/* Status panel for non-LIVE */}
						{!isLive && (
							<div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5">
								<p className="text-[10px] uppercase tracking-widest text-[var(--ink-subtle)] mb-1">
									{lot.status === "CLOSED" ? "Encerrado em" : "Previsto para"}
								</p>
								<p className="text-sm font-semibold text-[var(--ink)]">
									{new Date(lot.endsAt).toLocaleString("pt-BR", {
										day: "2-digit",
										month: "2-digit",
										year: "numeric",
										hour: "2-digit",
										minute: "2-digit",
									})}
								</p>
								{lot.status === "SCHEDULED" && (
									<p className="text-xs text-[var(--ink-subtle)] mt-2">
										Início:{" "}
										{new Date(lot.startsAt).toLocaleString("pt-BR", {
											day: "2-digit",
											month: "2-digit",
											year: "numeric",
											hour: "2-digit",
											minute: "2-digit",
										})}
									</p>
								)}
							</div>
						)}

						{/* Not logged in prompt */}
						{!user && isLive && (
							<Link
								to="/login"
								className="block text-center w-full text-white rounded-xl py-3.5 text-sm font-semibold transition-colors duration-200"
								style={{ background: "var(--accent)" }}
							>
								Entrar para dar lance
							</Link>
						)}

						{/* Auctioneer cannot bid */}
						{user?.role === "AUCTIONEER" && isLive && (
							<div className="bg-[var(--subtle-bg)] border border-[var(--border)] rounded-xl p-4 text-xs text-[var(--ink-subtle)] text-center">
								Leiloeiros não participam como licitantes.
							</div>
						)}

						{/* Trust + integrity */}
						<div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 space-y-3">
							<div className="flex items-start gap-3 text-xs text-[var(--ink-muted)]">
								<svg
									width="16"
									height="16"
									viewBox="0 0 24 24"
									fill="none"
									stroke="#16A34A"
									strokeWidth="2"
									className="mt-0.5 flex-none"
								>
									<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
								</svg>
								<div>
									<p className="font-semibold text-[var(--ink)] mb-0.5">
										Proteção do comprador
									</p>
									<p>
										Todos os lances registrados em hash chain criptográfico.
										Integridade auditável e imutável.
									</p>
								</div>
							</div>
							<div className="flex items-start gap-3 text-xs text-[var(--ink-muted)]">
								<svg
									width="16"
									height="16"
									viewBox="0 0 24 24"
									fill="none"
									stroke="var(--accent)"
									strokeWidth="2"
									className="mt-0.5 flex-none"
								>
									<path d="M9 12l2 2 4-4" />
									<path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9c1.86 0 3.59.57 5.03 1.54" />
								</svg>
								<div>
									<p className="font-semibold text-[var(--ink)] mb-0.5">
										Dados protegidos (LGPD)
									</p>
									<p>
										Identidade dos licitantes pseudonimizada. Dados pessoais
										encriptados em repouso.
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
