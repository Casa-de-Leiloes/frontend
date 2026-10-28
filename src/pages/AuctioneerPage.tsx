import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { lots, catalog, imgProxy } from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import { translateError } from "@/lib/errors";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import type { CatalogItem } from "@/lib/api";

function stripHtml(html: string): string {
	return html
		.replace(/<[^>]*>/g, " ")
		.replace(/\s{2,}/g, " ")
		.trim();
}

const PROVIDERS = [
	{ key: "ART_INSTITUTE_CHICAGO", label: "Art Institute of Chicago" },
	{ key: "SCRYFALL", label: "Magic: the Gathering (Scryfall)" },
	{ key: "OPEN_LIBRARY", label: "Open Library (Books)" },
] as const;

function formatCents(cents: string | null | undefined): string {
	if (!cents) return "-";
	return new Intl.NumberFormat("pt-BR", {
		style: "currency",
		currency: "BRL",
	}).format(Number(cents) / 100);
}

function StatusBadge({ status }: { status: string }) {
	if (status === "LIVE")
		return (
			<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[var(--live)] text-white">
				<span className="w-1.5 h-1.5 rounded-full bg-[var(--surface)] animate-pulse" />
				Ao vivo
			</span>
		);
	if (status === "SCHEDULED")
		return (
			<span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#EFF6FF] text-[var(--accent)] border border-[#BFDBFE]">
				Agendado
			</span>
		);
	if (status === "CANCELLED")
		return (
			<span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#FEF2F2] text-[var(--live)] border border-[#FECACA]">
				Cancelado
			</span>
		);
	return (
		<span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[var(--subtle-bg2)] text-[#374151] border border-[#E5E7EB]">
			Encerrado
		</span>
	);
}

interface CreateLotForm {
	provider: (typeof PROVIDERS)[number]["key"];
	query: string;
	selectedItem: CatalogItem | null;
	title: string;
	description: string;
	additionalImages: string[];
	startingBid: string;
	minIncrement: string;
	startsAt: string;
	endsAt: string;
}

function isoLocal(dateStr: string): string {
	return new Date(dateStr).toISOString();
}

type LotTab = "ALL" | "LIVE" | "SCHEDULED" | "CLOSED" | "CANCELLED";

export function AuctioneerPage() {
	const user = useAuthStore((s) => s.user);
	const qc = useQueryClient();
	const [formOpen, setFormOpen] = useState(false);
	const [lotTab, setLotTab] = useState<LotTab>("ALL");

	const [form, setForm] = useState<CreateLotForm>({
		provider: "ART_INSTITUTE_CHICAGO",
		query: "",
		selectedItem: null,
		title: "",
		description: "",
		additionalImages: [],
		startingBid: "",
		minIncrement: "",
		startsAt: "",
		endsAt: "",
	});
	const [searchQuery, setSearchQuery] = useState("");
	const [createError, setCreateError] = useState<string | null>(null);
	const [createSuccess, setCreateSuccess] = useState(false);

	const { data: allLots } = useQuery({
		queryKey: ["lots"],
		queryFn: () => lots.list(),
	});

	const myLots =
		allLots?.items.filter((l) => l.auctioneerId === user?.id) ?? [];

	const stats = useMemo(() => {
		const live = myLots.filter((l) => {
			const nowMs = Date.now();
			const s = l.startsAt ? new Date(l.startsAt).getTime() : 0;
			const e = l.endsAt ? new Date(l.endsAt).getTime() : 0;
			return l.status === "LIVE" && s <= nowMs && e > nowMs;
		});
		const scheduled = myLots.filter((l) => l.status === "SCHEDULED");
		const closed = myLots.filter((l) => l.status === "CLOSED");
		const totalBids = myLots.reduce((s, l) => s + l.bidCount, 0);
		// Recebido = soma dos lotes CLOSED que tiveram lances (arrematados)
		const totalReceived = closed
			.filter((l) => l.bidCount > 0)
			.reduce((s, l) => s + Number(l.currentBidCents ?? 0), 0);
		return { live, scheduled, closed, totalBids, totalReceived };
	}, [myLots]);

	const visibleLots =
		lotTab === "ALL" ? myLots : myLots.filter((l) => l.status === lotTab);

	const { data: searchResults, isFetching: searching } = useQuery({
		queryKey: ["catalog-search", form.provider, searchQuery],
		queryFn: () => catalog.search(searchQuery, form.provider),
		enabled: searchQuery.length > 2,
	});

	const cancelMutation = useMutation({
		mutationFn: (id: string) => lots.cancel(id),
		onSuccess: () => qc.invalidateQueries({ queryKey: ["lots"] }),
	});

	const createMutation = useMutation({
		mutationFn: () => {
			if (!form.selectedItem) throw new Error("Selecione um item do catálogo");
			return lots.create({
				providerKey: form.provider,
				providerId: form.selectedItem.providerId,
				title: form.title,
				description: form.description || undefined,
				additionalImages: form.additionalImages.filter((u) => u.trim() !== ""),
				category: form.provider,
				startingBidCents: Math.round(parseFloat(form.startingBid) * 100),
				minIncrementCents: Math.round(parseFloat(form.minIncrement) * 100),
				startsAt: isoLocal(form.startsAt),
				endsAt: isoLocal(form.endsAt),
			});
		},
		onSuccess: () => {
			setCreateSuccess(true);
			setCreateError(null);
			setForm({
				provider: "ART_INSTITUTE_CHICAGO",
				query: "",
				selectedItem: null,
				title: "",
				description: "",
				additionalImages: [],
				startingBid: "",
				minIncrement: "",
				startsAt: "",
				endsAt: "",
			});
			setSearchQuery("");
			void qc.invalidateQueries({ queryKey: ["lots"] });
		},
		onError: (err) => {
			setCreateError(translateError(err));
			setCreateSuccess(false);
		},
	});

	function selectItem(item: CatalogItem) {
		setForm((prev) => ({
			...prev,
			selectedItem: item,
			title: item.title,
			description: item.description ? stripHtml(item.description) : "",
		}));
	}

	return (
		<div className="min-h-screen bg-[var(--ground)]">
			{/* Dashboard header */}
			<div className="bg-[var(--surface)] border-b border-[var(--border)]">
				<div className="max-w-5xl mx-auto px-6 py-6">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-xs text-[var(--ink-subtle)] font-medium tracking-wider uppercase mb-1">
								Painel do Leiloeiro
							</p>
							<h1
								className="text-2xl font-bold text-[var(--ink)]"
								style={{ fontFamily: "var(--font-display)" }}
							>
								Olá, {user?.name?.split(" ")[0] ?? "Leiloeiro"}
							</h1>
						</div>
						<button
							type="button"
							onClick={() => { setFormOpen((v) => !v); setCreateSuccess(false); setCreateError(null); }}
							className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors"
							style={{ background: formOpen ? "#374151" : "#1D4ED8" }}
						>
							{formOpen ? (
								<>
									<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden><path d="M18 6L6 18M6 6l12 12"/></svg>
									Fechar
								</>
							) : (
								<>
									<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden><path d="M12 5v14M5 12h14"/></svg>
									Novo lote
								</>
							)}
						</button>
					</div>
				</div>
			</div>

			<div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
				{/* Stats row */}
				<div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
					<div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] px-5 py-4">
						<p className="text-[11px] text-[var(--ink-subtle)] font-medium uppercase tracking-wider mb-1.5">Ao vivo</p>
						<p className="text-3xl font-bold text-[var(--live)] tabular-nums">{stats.live.length}</p>
					</div>
					<div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] px-5 py-4">
						<p className="text-[11px] text-[var(--ink-subtle)] font-medium uppercase tracking-wider mb-1.5">Agendados</p>
						<p className="text-3xl font-bold text-[var(--accent)] tabular-nums">{stats.scheduled.length}</p>
					</div>
					<div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] px-5 py-4">
						<p className="text-[11px] text-[var(--ink-subtle)] font-medium uppercase tracking-wider mb-1.5">Total lances</p>
						<p className="text-3xl font-bold text-[var(--ink)] tabular-nums">{stats.totalBids}</p>
					</div>
					<div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] px-5 py-4">
						<p className="text-[11px] text-[var(--ink-subtle)] font-medium uppercase tracking-wider mb-1.5">Recebido</p>
						<p className="text-xl font-bold text-[var(--positive)] tabular-nums leading-tight mt-1">
							{formatCents(String(stats.totalReceived))}
						</p>
					</div>
				</div>

				{/* Create lot form — collapsible */}
				{formOpen && (
					<div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-6">
						<h2 className="text-base font-semibold text-[var(--ink)] mb-5">Criar novo lote</h2>
						<div className="space-y-5">
							{createSuccess && (
								<p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-2.5">
									Lote criado com sucesso!
								</p>
							)}

							<div className="space-y-2">
								<label className="text-sm font-medium text-[#374151]">Provedor de catálogo</label>
								<div className="flex gap-2 flex-wrap">
									{PROVIDERS.map((p) => (
										<Button
											key={p.key}
											type="button"
											size="sm"
											variant={form.provider === p.key ? "primary" : "outline"}
											onClick={() => {
												setForm((prev) => ({ ...prev, provider: p.key, selectedItem: null }));
												setSearchQuery("");
											}}
										>
											{p.label}
										</Button>
									))}
								</div>
							</div>

							<div className="space-y-2">
								<label className="text-sm font-medium text-[#374151]">Buscar no catálogo</label>
								<div className="flex gap-2">
									<Input
										placeholder="Ex: Van Gogh, Mona Lisa, Black Lotus..."
										value={form.query}
										onChange={(e) => setForm((prev) => ({ ...prev, query: e.target.value }))}
									/>
									<Button type="button" onClick={() => setSearchQuery(form.query)} disabled={form.query.length < 3 || searching}>
										{searching ? "…" : "Buscar"}
									</Button>
								</div>
							</div>

							{searchResults && searchResults.items.length > 0 && (
								<div className="border border-[var(--border)] rounded-lg divide-y max-h-48 overflow-y-auto">
									{searchResults.items.map((item) => (
										<button
											key={item.providerId}
											type="button"
											className={`w-full text-left px-4 py-2.5 text-sm hover:bg-[#F9FAFB] transition-colors ${form.selectedItem?.providerId === item.providerId ? "bg-[#EFF6FF] font-semibold" : ""}`}
											onClick={() => selectItem(item)}
										>
											<span className="font-medium">{item.title}</span>
											{item.description && (
												<span className="text-[var(--ink-subtle)] ml-2 line-clamp-1">· {stripHtml(item.description)}</span>
											)}
										</button>
									))}
								</div>
							)}

							{form.selectedItem && (() => {
								const item = form.selectedItem;
								const proxyImg = item.imageUrl ? imgProxy(item.imageUrl) : null;
								const attrs = Object.entries(item.metadata ?? {})
									.filter(([, v]) => v !== null && v !== "")
									.slice(0, 4);
								return (
									<div className="flex gap-4 bg-[#F9FAFB] border border-[var(--border)] rounded-lg p-4">
										{proxyImg && (
											<img
												src={proxyImg}
												alt={item.title}
												className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
											/>
										)}
										<div className="flex-1 min-w-0">
											<div className="flex items-start gap-2 mb-1">
												<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#1D4ED8" strokeWidth="2.5" className="mt-0.5 flex-shrink-0" aria-hidden><path d="M20 6L9 17l-5-5"/></svg>
												<p className="text-sm font-semibold text-[var(--ink)] line-clamp-2">{item.title}</p>
											</div>
											{attrs.length > 0 && (
												<div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1">
													{attrs.map(([k, v]) => (
														<span key={k} className="text-xs text-[var(--ink-muted)]">
															<span className="font-medium capitalize">{k}:</span> {String(v)}
														</span>
													))}
												</div>
											)}
										</div>
									</div>
								);
							})()}

							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div className="space-y-1.5 sm:col-span-2">
									<label className="text-sm font-medium text-[#374151]">Título do lote</label>
									<Input value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} placeholder="Título" required />
								</div>
								<div className="space-y-1.5 sm:col-span-2">
									<label className="text-sm font-medium text-[#374151]">Descrição (opcional)</label>
									<Input value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} placeholder="Descrição" />
								</div>

								<div className="space-y-2 sm:col-span-2">
									<label className="text-sm font-medium text-[#374151]">Imagens adicionais (URLs, máx. 10)</label>
									{form.additionalImages.map((url, i) => (
										<div key={i} className="flex gap-2">
											<Input
												value={url}
												onChange={(e) => {
													const next = [...form.additionalImages];
													next[i] = e.target.value;
													setForm((prev) => ({ ...prev, additionalImages: next }));
												}}
												placeholder="https://..."
												className="flex-1"
											/>
											<button
												type="button"
												onClick={() => setForm((prev) => ({ ...prev, additionalImages: prev.additionalImages.filter((_, j) => j !== i) }))}
												className="px-2 py-1 text-xs text-[var(--live)] hover:text-white hover:bg-[var(--live)] border border-[#FECACA] rounded transition-colors"
											>✕</button>
										</div>
									))}
									{form.additionalImages.length < 10 && (
										<button type="button" onClick={() => setForm((prev) => ({ ...prev, additionalImages: [...prev.additionalImages, ""] }))} className="text-xs text-[var(--accent)] hover:underline">
											+ Adicionar imagem
										</button>
									)}
								</div>

								<div className="space-y-1.5">
									<label className="text-sm font-medium text-[#374151]">Lance inicial (R$)</label>
									<CurrencyInput value={form.startingBid} onChange={(v) => setForm((prev) => ({ ...prev, startingBid: v }))} placeholder="100,00" />
								</div>
								<div className="space-y-1.5">
									<label className="text-sm font-medium text-[#374151]">Incremento mínimo (R$)</label>
									<CurrencyInput value={form.minIncrement} onChange={(v) => setForm((prev) => ({ ...prev, minIncrement: v }))} placeholder="10,00" />
								</div>
								<div className="space-y-1.5">
									<label className="text-sm font-medium text-[#374151]">Início</label>
									<Input type="datetime-local" value={form.startsAt} onChange={(e) => setForm((prev) => ({ ...prev, startsAt: e.target.value }))} />
								</div>
								<div className="space-y-1.5">
									<label className="text-sm font-medium text-[#374151]">Encerramento</label>
									<Input type="datetime-local" value={form.endsAt} onChange={(e) => setForm((prev) => ({ ...prev, endsAt: e.target.value }))} />
								</div>
							</div>

							{createError && (
								<p className="text-sm text-[var(--live)] bg-[#FEF2F2] border border-[#FECACA] rounded-lg px-4 py-2.5">
									{createError}
								</p>
							)}

							<div className="flex gap-3 pt-1">
								<Button
									onClick={() => { setCreateError(null); setCreateSuccess(false); createMutation.mutate(); }}
									disabled={createMutation.isPending || !form.selectedItem || !form.title || !form.startingBid || !form.minIncrement || !form.startsAt || !form.endsAt}
								>
									{createMutation.isPending ? "Criando…" : "Criar lote"}
								</Button>
								<button type="button" onClick={() => setFormOpen(false)} className="px-4 py-2 text-sm text-[var(--ink-muted)] hover:text-[var(--ink)] transition-colors">
									Cancelar
								</button>
							</div>
						</div>
					</div>
				)}

				{/* My lots */}
				<div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] overflow-hidden">
					{/* Lots header with tab filters */}
					<div className="px-6 py-4 border-b border-[#F3F4F6] flex items-center justify-between gap-4 flex-wrap">
						<h2 className="text-base font-semibold text-[var(--ink)]">
							Meus lotes
							<span className="ml-2 text-sm font-normal text-[var(--ink-subtle)]">{myLots.length}</span>
						</h2>
						<div className="flex gap-1">
							{(["ALL", "LIVE", "SCHEDULED", "CLOSED", "CANCELLED"] as LotTab[]).map((tab) => {
								const label: Record<LotTab, string> = { ALL: "Todos", LIVE: "Ao vivo", SCHEDULED: "Agendados", CLOSED: "Encerrados", CANCELLED: "Cancelados" };
								const count = tab === "ALL" ? myLots.length : myLots.filter((l) => l.status === tab).length;
								const active = lotTab === tab;
								return (
									<button
										key={tab}
										type="button"
										onClick={() => setLotTab(tab)}
										className="px-3 py-1 rounded-full text-xs font-medium transition-colors"
										style={{
											background: active ? "#0D0D0D" : "transparent",
											color: active ? "#fff" : "#6B7280",
										}}
									>
										{label[tab]} {count > 0 && <span className={active ? "opacity-70" : ""}>{count}</span>}
									</button>
								);
							})}
						</div>
					</div>

					{visibleLots.length === 0 ? (
						<div className="px-6 py-16 text-center">
							<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.5" className="mx-auto mb-3" aria-hidden>
								<path d="M12 2a7 7 0 1 0 0 14A7 7 0 0 0 12 2z"/><path d="M12 8v4m0 4h.01"/>
							</svg>
							<p className="text-sm text-[var(--ink-subtle)]">
								{lotTab === "ALL" ? "Nenhum lote criado ainda." : "Nenhum lote nesta categoria."}
							</p>
							{lotTab === "ALL" && (
								<button type="button" onClick={() => setFormOpen(true)} className="mt-3 text-sm text-[var(--accent)] hover:underline font-medium">
									Criar primeiro lote →
								</button>
							)}
						</div>
					) : (
						<div className="divide-y divide-[#F3F4F6]">
							{visibleLots.map((lot) => {
								const proxyUrl = imgProxy(lot.imageUrl);
								return (
									<div key={lot.id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-[#FAFAFA] transition-colors group">
										<div className="flex-shrink-0 w-11 h-11 rounded-lg overflow-hidden bg-[var(--ground)]">
											{proxyUrl ? (
												<img src={proxyUrl} alt={lot.title} className="w-full h-full object-cover" />
											) : (
												<div className="w-full h-full flex items-center justify-center">
													<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.5" aria-hidden>
														<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/>
													</svg>
												</div>
											)}
										</div>
										<div className="flex-1 min-w-0">
											<Link to={`/lots/${lot.id}`} className="text-sm font-semibold text-[var(--ink)] hover:text-[var(--accent)] transition-colors line-clamp-1">
												{lot.title}
											</Link>
											<div className="flex items-center gap-3 mt-0.5">
												<span className="text-xs text-[var(--ink-subtle)] tabular-nums">
													{lot.bidCount} lance{lot.bidCount !== 1 ? "s" : ""}
												</span>
												{lot.status === "CLOSED" ? (
													lot.bidCount > 0 ? (
														<span className="text-xs font-semibold tabular-nums text-[var(--positive)]">
															Arrematado · {formatCents(lot.currentBidCents)}
														</span>
													) : (
														<span className="text-xs text-[var(--ink-subtle)]">Sem lances</span>
													)
												) : (
													<span className="text-xs font-semibold tabular-nums" style={{ color: lot.bidCount > 0 ? "#1D4ED8" : "#9CA3AF" }}>
														{formatCents(lot.currentBidCents ?? lot.startingBidCents)}
													</span>
												)}
											</div>
										</div>
										<div className="flex items-center gap-2.5 flex-shrink-0">
											<StatusBadge status={lot.status} />
											{(lot.status === "SCHEDULED" || lot.status === "LIVE") && lot.bidCount === 0 && (
												<button
													type="button"
													onClick={() => { if (confirm(`Cancelar lote "${lot.title}"?`)) cancelMutation.mutate(lot.id); }}
													disabled={cancelMutation.isPending}
													className="opacity-0 group-hover:opacity-100 text-xs text-[var(--live)] hover:text-white hover:bg-[var(--live)] border border-[#FECACA] px-2.5 py-1 rounded-full transition-all disabled:opacity-50"
												>
													Cancelar
												</button>
											)}
										</div>
									</div>
								);
							})}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
