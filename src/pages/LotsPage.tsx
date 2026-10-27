import { useState, useEffect, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { lots, imgProxy } from "@/lib/api";
import type { Lot } from "@/lib/api";

type StatusFilter = "ALL" | "LIVE" | "SCHEDULED" | "CLOSED";
type TimeFilter = "ENDS_TODAY" | "NONE";

const LOT_CATEGORY_LABELS: Record<string, string> = {
	FINE_ART: "Arte",
	JEWELRY: "Joalharia",
	WATCHES: "Relógios",
	ANTIQUITIES: "Antiguidades",
	NUMISMATICS: "Numismática",
	FASHION: "Moda",
	VEHICLES: "Veículos",
	BOOKS: "Livros",
	WINE: "Vinhos",
	OTHER: "Outros",
};

function IconGrid({ color }: { color: string }) {
	return (
		<svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden>
			<rect x="0" y="0" width="5.5" height="5.5" rx="1" fill={color} />
			<rect x="7.5" y="0" width="5.5" height="5.5" rx="1" fill={color} />
			<rect x="0" y="7.5" width="5.5" height="5.5" rx="1" fill={color} />
			<rect x="7.5" y="7.5" width="5.5" height="5.5" rx="1" fill={color} />
		</svg>
	);
}

function IconClock({ color }: { color: string }) {
	return (
		<svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden>
			<circle cx="6.5" cy="6.5" r="5.5" stroke={color} strokeWidth="1.5" />
			<path d="M6.5 3.5V6.5L8.5 8" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
		</svg>
	);
}

function IconCheck({ color }: { color: string }) {
	return (
		<svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden>
			<circle cx="6.5" cy="6.5" r="5.5" stroke={color} strokeWidth="1.5" />
			<path d="M4 6.5L6 8.5L9.5 5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	);
}


function formatCents(cents: string | null): string {
	if (!cents) return "—";
	return new Intl.NumberFormat("pt-BR", {
		style: "currency",
		currency: "BRL",
	}).format(Number(cents) / 100);
}

function formatTimeLeft(endsAt: string): { text: string; urgent: boolean } {
	const diff = Math.max(0, new Date(endsAt).getTime() - Date.now());
	if (diff === 0) return { text: "Encerrado", urgent: false };
	const days = Math.floor(diff / 86_400_000);
	const hours = Math.floor((diff % 86_400_000) / 3_600_000);
	const mins = Math.floor((diff % 3_600_000) / 60_000);
	const secs = Math.floor((diff % 60_000) / 1_000);
	if (days >= 2) return { text: `Faltam ${days} dias`, urgent: false };
	if (days === 1) return { text: "Falta 1 dia", urgent: false };
	if (hours >= 1) return { text: `Faltam ${hours}h ${mins}min`, urgent: false };
	if (mins >= 1) return { text: `Faltam ${mins}min`, urgent: true };
	return {
		text: `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`,
		urgent: true,
	};
}

function useTimeLeft(endsAt: string): { text: string; urgent: boolean } {
	const [val, setVal] = useState(() => formatTimeLeft(endsAt));
	useEffect(() => {
		setVal(formatTimeLeft(endsAt));
		const id = setInterval(() => setVal(formatTimeLeft(endsAt)), 1_000);
		return () => clearInterval(id);
	}, [endsAt]);
	return val;
}


function LotImage({ src, alt }: { src: string | null; alt: string }) {
	const [failed, setFailed] = useState(false);
	const proxied = imgProxy(src);
	if (!proxied || failed) {
		return (
			<div className="w-full h-full bg-[#F5F4F0] flex items-center justify-center p-4">
				<span className="text-[#9CA3AF] text-xs text-center line-clamp-3">
					{alt}
				</span>
			</div>
		);
	}
	return (
		<img
			src={proxied}
			alt={alt}
			onError={() => setFailed(true)}
			className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
			loading="lazy"
		/>
	);
}

function LiveBadge() {
	return (
		<span className="inline-flex items-center gap-1 bg-[#DC2626] text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
			<span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
			AO VIVO
		</span>
	);
}

function LotCard({ lot }: { lot: Lot }) {
	const timeLeft = useTimeLeft(lot.endsAt);
	const bidCents = lot.currentBidCents ?? lot.startingBidCents;
	const isLive = lot.status === "LIVE";

	return (
		<Link to={`/lots/${lot.id}`} className="group block">
			<div className="bg-white rounded-xl border border-[#E4E4E2] overflow-hidden hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
				{/* Image 1:1 */}
				<div className="relative w-full" style={{ aspectRatio: "1/1" }}>
					<div className="absolute inset-0">
						<LotImage src={lot.imageUrl} alt={lot.title} />
					</div>
					{isLive && (
						<div className="absolute top-2 left-2 z-10">
							<LiveBadge />
						</div>
					)}
					{lot.status === "CLOSED" && (
						<div className="absolute inset-0 bg-black/20 flex items-end justify-start p-2">
							<span className="text-[10px] font-medium text-white bg-black/60 px-2 py-0.5 rounded-full">
								Encerrado
							</span>
						</div>
					)}
					{lot.status === "SCHEDULED" && (
						<div className="absolute top-2 left-2 z-10">
							<span className="text-[10px] font-semibold text-[#0D0D0D] bg-white/90 px-2 py-0.5 rounded-full">
								Agendado
							</span>
						</div>
					)}
					{lot.bidCount > 0 && (
						<div className="absolute bottom-2 right-2 z-10">
							<span className="text-[10px] font-medium text-white bg-black/60 px-2 py-0.5 rounded-full">
								{lot.bidCount} {lot.bidCount === 1 ? "lance" : "lances"}
							</span>
						</div>
					)}
				</div>

				{/* Card body */}
				<div className="p-3">
					<p className="text-[11px] text-[#6B7280] mb-1 truncate">
						{lot.category.replace(/_/g, " ")}
					</p>
					<h2
						className="text-[15px] font-semibold leading-snug line-clamp-2 mb-3 text-[#0D0D0D]"
						style={{ fontFamily: "var(--font-display)" }}
					>
						{lot.title}
					</h2>

					<div className="border-t border-[#F0F0EE] pt-2.5 space-y-1.5">
						<div>
							<p className="text-[9px] text-[#9CA3AF] tracking-wider uppercase mb-0.5">
								Licitação atual
							</p>
							<p
								className="text-[19px] font-bold tabular-nums leading-none"
								style={{ color: "#1D4ED8" }}
							>
								{formatCents(bidCents)}
							</p>
						</div>
						<p
							className="text-xs font-medium"
							style={{ color: timeLeft.urgent ? "#DC2626" : "#6B7280" }}
						>
							{timeLeft.text}
						</p>
					</div>
				</div>
			</div>
		</Link>
	);
}

function HeroLot({ lot }: { lot: Lot }) {
	const timeLeft = useTimeLeft(lot.endsAt);
	const bidCents = lot.currentBidCents ?? lot.startingBidCents;
	return (
		<Link to={`/lots/${lot.id}`} className="group block w-full">
			<div className="relative w-full rounded-2xl overflow-hidden bg-[#0D0D0D]" style={{ minHeight: 320 }}>
				{/* Background image */}
				{lot.imageUrl && (
					<img
						src={imgProxy(lot.imageUrl) ?? lot.imageUrl}
						alt={lot.title}
						className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-50 transition-opacity duration-500"
					/>
				)}
				{!lot.imageUrl && (
					<div className="absolute inset-0 bg-gradient-to-br from-[#1D4ED8]/30 to-[#0D0D0D]" />
				)}
				{/* Content overlay */}
				<div className="relative z-10 flex flex-col justify-end p-8 h-full" style={{ minHeight: 320 }}>
					<div className="mb-3">
						<LiveBadge />
					</div>
					<p className="text-white/60 text-xs tracking-wider uppercase mb-2">
						{lot.category.replace(/_/g, " ")}
					</p>
					<h2
						className="text-white text-3xl md:text-4xl font-bold leading-tight mb-4 max-w-2xl"
						style={{ fontFamily: "var(--font-display)" }}
					>
						{lot.title}
					</h2>
					<div className="flex items-end gap-6">
						<div>
							<p className="text-white/50 text-[10px] uppercase tracking-wider mb-1">Licitação atual</p>
							<p className="text-white text-2xl font-bold tabular-nums" style={{ fontFamily: "var(--font-mono)" }}>
								{formatCents(bidCents)}
							</p>
						</div>
						<div>
							<p className="text-white/50 text-[10px] uppercase tracking-wider mb-1">Encerra</p>
							<p
								className="text-sm font-semibold"
								style={{ color: timeLeft.urgent ? "#FCA5A5" : "#D1D5DB" }}
							>
								{timeLeft.text}
							</p>
						</div>
						{lot.bidCount > 0 && (
							<div>
								<p className="text-white/50 text-[10px] uppercase tracking-wider mb-1">Lances</p>
								<p className="text-sm font-semibold text-white/80">{lot.bidCount}</p>
							</div>
						)}
					</div>
					<div className="mt-5">
						<span className="inline-flex items-center bg-white text-[#0D0D0D] text-sm font-semibold px-5 py-2.5 rounded-full group-hover:bg-[#1D4ED8] group-hover:text-white transition-colors duration-200">
							Dar lance →
						</span>
					</div>
				</div>
			</div>
		</Link>
	);
}

function SectionRow({
	title,
	icon,
	lots: sectionLots,
}: {
	title: string;
	icon: ReactNode;
	lots: Lot[];
}) {
	if (sectionLots.length === 0) return null;
	return (
		<section className="mb-10">
			<div className="flex items-center justify-between mb-4">
				<h2 className="flex items-center gap-2 text-lg font-bold text-[#0D0D0D]">
					{icon}
					{title}
					<span className="text-sm font-normal text-[#9CA3AF]">({sectionLots.length})</span>
				</h2>
			</div>
			<div
				className="flex gap-4 overflow-x-auto pb-2"
				style={{ scrollbarWidth: "none" }}
			>
				{sectionLots.map((lot) => (
					<div key={lot.id} className="flex-none w-64">
						<LotCard lot={lot} />
					</div>
				))}
			</div>
		</section>
	);
}

export function LotsPage() {
	const [searchParams, setSearchParams] = useSearchParams();
	const [filter, setFilter] = useState<StatusFilter>("ALL");
	const [timeFilter, setTimeFilter] = useState<TimeFilter>("NONE");

	const urlCategory = searchParams.get("lotCategory") ?? undefined;

	const { data, isLoading, error } = useQuery({
		queryKey: ["lots", filter, timeFilter, urlCategory],
		queryFn: () => lots.list({
			status: filter !== "ALL" ? filter : undefined,
			endsToday: timeFilter === "ENDS_TODAY" ? true : undefined,
			lotCategory: urlCategory,
		}),
		refetchInterval: 15_000,
	});

	const allLots = data?.items.filter((l) => l.status !== "CANCELLED") ?? [];
	const liveLots = allLots.filter((l) => l.status === "LIVE");
	const scheduledLots = allLots.filter((l) => l.status === "SCHEDULED");
	const closedLots = allLots.filter((l) => l.status === "CLOSED");
	const heroLot = liveLots[0] ?? scheduledLots[0] ?? null;

	const filtered = allLots;

	const hasActiveFilter = filter !== "ALL" || timeFilter !== "NONE" || !!urlCategory;

	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-64 text-sm text-[#6B7280]">
				Carregando lotes…
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex items-center justify-center h-64 text-sm text-[#DC2626]">
				Falha ao carregar lotes.
			</div>
		);
	}

	return (
		<div className="max-w-7xl mx-auto px-6 py-8">
			{/* Hero */}
			{heroLot && !hasActiveFilter && (
				<div className="mb-10">
					<HeroLot lot={heroLot} />
				</div>
			)}

			{/* Filter chips */}
			<div className="flex items-center gap-2 flex-wrap mb-8">
				{/* Todos */}
				{(() => {
					const active = filter === "ALL" && timeFilter === "NONE" && !urlCategory;
					return (
						<button
							type="button"
							onClick={() => { setFilter("ALL"); setTimeFilter("NONE"); setSearchParams({}); }}
							className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors"
							style={{
								background: active ? "#0D0D0D" : "#FFFFFF",
								color: active ? "#FFFFFF" : "#6B7280",
								border: active ? "1px solid #0D0D0D" : "1px solid #E4E4E2",
							}}
						>
							<IconGrid color={active ? "#fff" : "#6B7280"} />
							Todos
						</button>
					);
				})()}

				{/* Livestream (LIVE) */}
				{(() => {
					const active = filter === "LIVE";
					return (
						<button
							type="button"
							onClick={() => { setFilter(active ? "ALL" : "LIVE"); }}
							className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors"
							style={{
								background: active ? "#DC2626" : "#FFFFFF",
								color: active ? "#FFFFFF" : "#6B7280",
								border: active ? "1px solid #DC2626" : "1px solid #E4E4E2",
							}}
						>
							<span className="w-2 h-2 rounded-full" style={{ background: active ? "#fff" : "#DC2626" }} />
							Livestream
						</button>
					);
				})()}

				{/* Termina hoje */}
				{(() => {
					const active = timeFilter === "ENDS_TODAY";
					return (
						<button
							type="button"
							onClick={() => setTimeFilter(active ? "NONE" : "ENDS_TODAY")}
							className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors"
							style={{
								background: active ? "#0D0D0D" : "#FFFFFF",
								color: active ? "#FFFFFF" : "#6B7280",
								border: active ? "1px solid #0D0D0D" : "1px solid #E4E4E2",
							}}
						>
							<IconClock color={active ? "#fff" : "#6B7280"} />
							Termina hoje
						</button>
					);
				})()}

				{/* Começa em breve (SCHEDULED) */}
				{(() => {
					const active = filter === "SCHEDULED";
					return (
						<button
							type="button"
							onClick={() => setFilter(active ? "ALL" : "SCHEDULED")}
							className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors"
							style={{
								background: active ? "#0D0D0D" : "#FFFFFF",
								color: active ? "#FFFFFF" : "#6B7280",
								border: active ? "1px solid #0D0D0D" : "1px solid #E4E4E2",
							}}
						>
							<svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden>
								<circle cx="6.5" cy="6.5" r="5.5" stroke={active ? "#fff" : "#6B7280"} strokeWidth="1.5"/>
								<path d="M4 6.5h5M8 4l2 2.5-2 2.5" stroke={active ? "#fff" : "#6B7280"} strokeWidth="1.2" strokeLinecap="round"/>
							</svg>
							Começa em breve
						</button>
					);
				})()}

				{/* Category tag (when active) */}
				{urlCategory && (
					<button
						type="button"
						onClick={() => setSearchParams({})}
						className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors"
						style={{ background: "#1D4ED8", color: "#fff", border: "1px solid #1D4ED8" }}
					>
						{LOT_CATEGORY_LABELS[urlCategory] ?? urlCategory}
						<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
							<path d="M18 6L6 18M6 6l12 12"/>
						</svg>
					</button>
				)}

				{hasActiveFilter && (
					<span className="text-xs text-[#6B7280] ml-2">
						{allLots.length} {allLots.length === 1 ? "leilão" : "leilões"}
					</span>
				)}
			</div>

			{/* Filtered view (any active filter) */}
			{hasActiveFilter ? (
				<>
					{filtered.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-24 text-sm text-[#6B7280]">
							Nenhum lote encontrado.
						</div>
					) : (
						<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
							{filtered.map((lot) => (
								<LotCard key={lot.id} lot={lot} />
							))}
						</div>
					)}
				</>
			) : (
				/* ALL view: marketplace sections */
				<>
					<SectionRow
						title="Leilões ao vivo"
						icon={<span className="w-2.5 h-2.5 rounded-full bg-[#DC2626] animate-pulse" />}
						lots={liveLots}
					/>
					<SectionRow
						title="Agendados"
						icon={<IconClock color="#6B7280" />}
						lots={scheduledLots}
					/>
					<SectionRow
						title="Encerrados"
						icon={<IconCheck color="#6B7280" />}
						lots={closedLots}
					/>
					{allLots.length === 0 && (
						<div className="flex flex-col items-center justify-center py-24 text-sm text-[#6B7280]">
							Nenhum lote disponível no momento.
						</div>
					)}
				</>
			)}
		</div>
	);
}
