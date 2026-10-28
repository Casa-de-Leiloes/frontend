import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
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

function timeAgo(dateStr: string): string {
	const diff = Date.now() - new Date(dateStr).getTime();
	const mins = Math.floor(diff / 60000);
	if (mins < 1) return "Agora";
	if (mins < 60) return `Há ${mins} min`;
	const hours = Math.floor(mins / 60);
	if (hours < 24) return `Há ${hours}h`;
	const days = Math.floor(hours / 24);
	return `Há ${days} dia${days > 1 ? "s" : ""}`;
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

function LightboxMagnifier({ src, alt }: { src: string; alt: string }) {
	const containerRef = useRef<HTMLDivElement>(null);
	const [lens, setLens] = useState<{ x: number; y: number } | null>(null);
	const LENS = 160;
	const ZOOM = 3;

	function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
		const rect = e.currentTarget.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const y = e.clientY - rect.top;
		setLens({ x, y });
	}

	return (
		<div
			ref={containerRef}
			className="relative select-none"
			style={{ cursor: lens ? "none" : "crosshair", display: "inline-block", maxWidth: "100%", maxHeight: "100%", overflow: "visible" }}
			onMouseMove={onMouseMove}
			onMouseLeave={() => setLens(null)}
		>
			<img
				src={src}
				alt={alt}
				className="block max-w-[80vw] max-h-[70vh] object-contain"
				draggable={false}
			/>
			{lens && containerRef.current && (() => {
				const rect = containerRef.current.getBoundingClientRect();
				const bgX = -(lens.x * ZOOM - LENS / 2);
				const bgY = -(lens.y * ZOOM - LENS / 2);
				return (
					<div
						style={{
							position: "absolute",
							left: lens.x - LENS / 2,
							top: lens.y - LENS / 2,
							width: LENS,
							height: LENS,
							border: "2px solid rgba(255,255,255,0.8)",
							borderRadius: 4,
							backgroundImage: `url(${src})`,
							backgroundRepeat: "no-repeat",
							backgroundSize: `${rect.width * ZOOM}px ${rect.height * ZOOM}px`,
							backgroundPosition: `${bgX}px ${bgY}px`,
							pointerEvents: "none",
							boxShadow: "0 4px 24px rgba(0,0,0,0.6)",
							overflow: "hidden",
						}}
					/>
				);
			})()}
		</div>
	);
}

function GalleryLightbox({
	images,
	startIndex,
	title,
	onClose,
}: {
	images: string[];
	startIndex: number;
	title: string;
	onClose: () => void;
}) {
	const [idx, setIdx] = useState(startIndex);
	const [zoomed, setZoomed] = useState(false);
	const thumbsRef = useRef<HTMLDivElement>(null);
	const total = images.length;
	const src = imgProxy(images[idx]) ?? images[idx];

	function prev() { setIdx((i) => (i - 1 + total) % total); setZoomed(false); }
	function next() { setIdx((i) => (i + 1) % total); setZoomed(false); }

	useEffect(() => {
		function onKey(e: KeyboardEvent) {
			if (e.key === "Escape") onClose();
			if (e.key === "ArrowLeft") prev();
			if (e.key === "ArrowRight") next();
		}
		document.addEventListener("keydown", onKey);
		document.body.style.overflow = "hidden";
		return () => {
			document.removeEventListener("keydown", onKey);
			document.body.style.overflow = "";
		};
	}, [idx]);

	useEffect(() => {
		const el = thumbsRef.current?.children[idx] as HTMLElement | undefined;
		el?.scrollIntoView({ inline: "center", behavior: "smooth" });
	}, [idx]);

	return createPortal(
		<div className="fixed inset-0 z-50 flex flex-col" style={{ background: "#000" }}>
			{/* Top bar */}
			<div className="flex items-center justify-between px-5 py-3 flex-shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
				<span className="text-sm font-mono" style={{ color: "rgba(255,255,255,0.6)" }}>
					{idx + 1} / {total}
				</span>
				<div className="flex items-center gap-2">
					<button
						type="button"
						onClick={() => setZoomed((v) => !v)}
						aria-label={zoomed ? "Reduzir zoom" : "Ampliar zoom"}
						className="w-9 h-9 flex items-center justify-center rounded transition-colors"
						style={{ background: zoomed ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.08)", color: "#fff" }}
					>
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
							{zoomed
								? <><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/><line x1="8" y1="11" x2="14" y2="11"/></>
								: <><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></>
							}
						</svg>
					</button>
					<button
						type="button"
						onClick={onClose}
						aria-label="Fechar"
						className="w-9 h-9 flex items-center justify-center rounded transition-colors"
						style={{ background: "rgba(255,255,255,0.08)", color: "#fff" }}
					>
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
							<path d="M18 6L6 18M6 6l12 12"/>
						</svg>
					</button>
				</div>
			</div>

			{/* Image area */}
			<div
				className="flex-1 flex items-center justify-center relative overflow-hidden"
				onClick={onClose}
			>
				{/* Prev */}
				{total > 1 && (
					<button
						type="button"
						onClick={(e) => { e.stopPropagation(); prev(); }}
						className="absolute left-4 z-10 w-10 h-10 flex items-center justify-center rounded transition-colors"
						style={{ background: "rgba(255,255,255,0.1)", color: "#fff" }}
					>
						<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
					</button>
				)}

				<div onClick={(e) => e.stopPropagation()}>
					{zoomed
						? <LightboxMagnifier src={src} alt={title} />
						: <img
							src={src}
							alt={title}
							className="block max-w-[80vw] max-h-[70vh] object-contain select-none"
							draggable={false}
						/>
					}
				</div>

				{/* Next */}
				{total > 1 && (
					<button
						type="button"
						onClick={(e) => { e.stopPropagation(); next(); }}
						className="absolute right-4 z-10 w-10 h-10 flex items-center justify-center rounded transition-colors"
						style={{ background: "rgba(255,255,255,0.1)", color: "#fff" }}
					>
						<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
					</button>
				)}
			</div>

			{/* Thumbnail strip */}
			{total > 1 && (
				<div
					ref={thumbsRef}
					className="flex gap-2 px-4 py-3 overflow-x-auto flex-shrink-0"
					style={{ scrollbarWidth: "none", borderTop: "1px solid rgba(255,255,255,0.1)" }}
				>
					{images.map((url, i) => (
						<button
							key={i}
							type="button"
							onClick={() => { setIdx(i); setZoomed(false); }}
							className="flex-shrink-0 w-16 h-16 rounded overflow-hidden transition-all"
							style={{
								border: i === idx ? "2px solid var(--accent)" : "2px solid rgba(255,255,255,0.15)",
								opacity: i === idx ? 1 : 0.55,
							}}
						>
							<img src={imgProxy(url) ?? url} alt={`${title} ${i + 1}`} className="w-full h-full object-cover" />
						</button>
					))}
				</div>
			)}
		</div>,
		document.body,
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
	const allImages = [mainImage, ...additionalImages].filter((u): u is string => Boolean(u));
	const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

	if (allImages.length === 0) {
		return (
			<div className="rounded-xl bg-[var(--subtle-bg)] border border-[var(--border)] flex items-center justify-center" style={{ aspectRatio: "4/3" }}>
				<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1">
					<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/>
				</svg>
			</div>
		);
	}

	const thumbs = allImages.slice(1, 5);

	return (
		<>
			<div className="flex gap-2 rounded-xl overflow-hidden" style={{ aspectRatio: "4/3" }}>
				{/* Main image */}
				<button
					type="button"
					className="relative flex-1 overflow-hidden"
					style={{ cursor: "zoom-in", background: "#0a0a0a", minWidth: 0 }}
					onClick={() => setLightboxIdx(0)}
				>
					<img
						src={imgProxy(allImages[0]) ?? allImages[0]}
						alt={title}
						className="w-full h-full object-contain transition-transform duration-300 hover:scale-105"
						draggable={false}
					/>
				</button>

				{/* Thumbnail grid — only if more images */}
				{thumbs.length > 0 && (
					<div className="grid grid-rows-2 grid-cols-2 gap-2 flex-shrink-0" style={{ width: "38%" }}>
						{thumbs.map((url, i) => {
							const globalIdx = i + 1;
							const isLast = i === 3 && (allImages.length > 5);
							return (
								<button
									key={i}
									type="button"
									className="relative overflow-hidden rounded-sm"
									style={{ cursor: "zoom-in", background: "#0a0a0a" }}
									onClick={() => setLightboxIdx(globalIdx)}
								>
									<img
										src={imgProxy(url) ?? url}
										alt={`${title} ${globalIdx + 1}`}
										className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
										draggable={false}
									/>
									{isLast && (
										<div className="absolute inset-0 flex flex-col items-center justify-center gap-1" style={{ background: "rgba(0,0,0,0.65)" }}>
											<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5">
												<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
											</svg>
											<span className="text-white text-[11px] font-medium leading-tight text-center">
												Ver todas ({allImages.length})
											</span>
										</div>
									)}
								</button>
							);
						})}
					</div>
				)}
			</div>

			{lightboxIdx !== null && (
				<GalleryLightbox
					images={allImages}
					startIndex={lightboxIdx}
					title={title}
					onClose={() => setLightboxIdx(null)}
				/>
			)}
		</>
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

	const EXTRA_BLOCKLIST = new Set([
		"isPublicDomain", "isHighlight", "isTimelineWork", "accessionYear",
		"primaryImageSmall", "primaryImage", "objectURL", "objectID",
		"externalUrl", "description", "imageUrl", "additionalImages",
		"rightsAndReproduction",
	]);

	const extra = Object.entries(attributes).filter(
		([k, v]) =>
			!ATTR_ORDER.includes(k) &&
			Boolean(v) &&
			!k.startsWith("_") &&
			!EXTRA_BLOCKLIST.has(k),
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
			<div className="flex items-center justify-center h-64 gap-3" style={{ color: "var(--ink-subtle)" }}>
				<svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
					<path d="M21 12a9 9 0 11-6.219-8.56" />
				</svg>
				<span className="text-sm">Loading…</span>
			</div>
		);

	const minNext = lot.currentBidCents
		? Number(lot.currentBidCents) + Number(lot.minIncrementCents)
		: Number(lot.startingBidCents);

	const attrs = lot.attributes ?? {};

	return (
		<div className="bg-[var(--ground)] min-h-screen">
			{/* Top breadcrumb bar */}
			<div className="border-b border-[var(--border)] bg-[var(--surface)]">
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
								<div
									className="prose-description text-sm text-[var(--ink-muted)] leading-relaxed"
									// eslint-disable-next-line react/no-danger
									dangerouslySetInnerHTML={{
										__html: (() => {
											const tmp = document.createElement("div");
											tmp.innerHTML = lot.description ?? "";
											const text = tmp.textContent ?? tmp.innerText ?? "";
											return text
												.split(/\n{2,}/)
												.map((p) => p.trim())
												.filter(Boolean)
												.map((p) => `<p>${p}</p>`)
												.join("");
										})(),
									}}
								/>
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
					<div className="lg:sticky space-y-4" style={{ top: "calc(var(--header-h, 152px) + 1rem)" }}>
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

						{/* Mini bid history */}
						{liveBids.length > 0 && (
							<div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4">
								<div className="flex items-center justify-between mb-3">
									<p className="text-xs font-semibold text-[var(--ink)]">
										{liveBids.length} {liveBids.length === 1 ? "lance" : "lances"}
									</p>
									<Link
										to={`/audit/${lot.id}`}
										className="text-xs text-[var(--accent)] hover:underline"
									>
										Ver todos →
									</Link>
								</div>
								<div className="space-y-2">
									{[...liveBids].reverse().slice(0, 4).map((bid) => (
										<div key={bid.id} className="flex items-center justify-between text-xs">
											<span className="text-[var(--ink-muted)] font-mono truncate max-w-[100px]">
												{bid.pseudonym}
											</span>
											<span className="text-[var(--ink-subtle)]">
												{timeAgo(bid.placedAt)}
											</span>
											<span className="font-semibold tabular-nums" style={{ color: "var(--accent)" }}>
												{formatCents(bid.amountCents)}
											</span>
										</div>
									))}
								</div>
							</div>
						)}

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
								{/* Quick bid chips */}
								{(() => {
									const inc = Number(lot.minIncrementCents);
									const chips = [minNext, minNext + inc, minNext + inc * 4];
									return (
										<div className="flex gap-2">
											{chips.map((c) => (
												<button
													key={c}
													type="button"
													onClick={() => setBidAmount((c / 100).toFixed(2))}
													className="flex-1 text-xs font-medium rounded-lg px-2 py-2 border transition-colors"
													style={{
														borderColor: bidAmount === (c / 100).toFixed(2) ? "var(--accent)" : "var(--border)",
														background: bidAmount === (c / 100).toFixed(2) ? "rgba(29,78,216,0.08)" : "var(--subtle-bg)",
														color: bidAmount === (c / 100).toFixed(2) ? "var(--accent)" : "var(--ink)",
													}}
												>
													{formatCents(String(c))}
												</button>
											))}
										</div>
									);
								})()}
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
