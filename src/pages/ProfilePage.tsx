import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth.store";
import { users } from "@/lib/api";
import { useState } from "react";

const ROLE_LABEL: Record<string, string> = {
	BIDDER: "Licitante",
	AUCTIONEER: "Leiloeiro",
};

export function ProfilePage() {
	const user = useAuthStore((s) => s.user);
	const [exporting, setExporting] = useState(false);
	const [exportDone, setExportDone] = useState(false);

	async function handleExport() {
		setExporting(true);
		try {
			const blob = await users.exportData();
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `meus-dados-${Date.now()}.json`;
			a.click();
			URL.revokeObjectURL(url);
			setExportDone(true);
		} finally {
			setExporting(false);
		}
	}

	const { data: profile } = useQuery({
		queryKey: ["user-me"],
		queryFn: () => users.me(),
		enabled: !!user,
	});

	if (!user) return null;

	const initials = user.name
		.split(" ")
		.slice(0, 2)
		.map((w) => w[0])
		.join("")
		.toUpperCase();

	return (
		<div style={{ background: "var(--ground)", minHeight: "100vh" }}>
			{/* Header */}
			<div style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
				<div className="max-w-2xl mx-auto px-6 py-6">
					<p className="text-xs font-medium tracking-wider uppercase mb-1" style={{ color: "var(--ink-subtle)" }}>
						Conta
					</p>
					<h1
						className="text-2xl font-bold"
						style={{ fontFamily: "var(--font-display)", color: "var(--ink)" }}
					>
						Meu Perfil
					</h1>
				</div>
			</div>

			<div className="max-w-2xl mx-auto px-6 py-8 space-y-5">
				{/* Identity card */}
				<div
					className="rounded-2xl p-6 flex items-center gap-5"
					style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
				>
					<div
						className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold shrink-0 select-none"
						style={{ background: "var(--accent)", color: "#fff", fontFamily: "var(--font-display)" }}
					>
						{initials}
					</div>
					<div className="flex-1 min-w-0">
						<h2 className="text-lg font-bold truncate" style={{ color: "var(--ink)", fontFamily: "var(--font-display)" }}>
							{user.name}
						</h2>
						<p className="text-sm mt-0.5 font-mono" style={{ color: "var(--ink-muted)" }}>
							{profile?.maskedEmail ?? "••••@••••"}
						</p>
						{user.role === "AUCTIONEER" && (
							<span
								className="inline-block mt-2 text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
								style={{ background: "rgba(220,38,38,0.1)", color: "var(--live)" }}
							>
								{ROLE_LABEL["AUCTIONEER"]}
							</span>
						)}
					</div>
				</div>

				{/* Account info */}
				<div
					className="rounded-2xl overflow-hidden"
					style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
				>
					<div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
						<h3 className="text-sm font-semibold" style={{ color: "var(--ink)" }}>Informações da conta</h3>
					</div>
					<div className="divide-y divide-[var(--border)]">
						<div className="flex items-center justify-between px-5 py-3.5">
							<span className="text-sm" style={{ color: "var(--ink-subtle)" }}>Nome</span>
							<span className="text-sm font-medium" style={{ color: "var(--ink)" }}>{user.name}</span>
						</div>
						<div className="flex items-center justify-between px-5 py-3.5">
							<span className="text-sm" style={{ color: "var(--ink-subtle)" }}>E-mail</span>
							<span className="text-sm font-mono" style={{ color: "var(--ink)" }}>
								{profile?.maskedEmail ?? "••••@••••"}
							</span>
						</div>
						{user.role === "AUCTIONEER" && (
							<div className="flex items-center justify-between px-5 py-3.5">
								<span className="text-sm" style={{ color: "var(--ink-subtle)" }}>Função</span>
								<span className="text-sm font-medium" style={{ color: "var(--ink)" }}>{ROLE_LABEL["AUCTIONEER"]}</span>
							</div>
						)}
						<div className="flex items-center justify-between px-5 py-3.5">
							<span className="text-sm" style={{ color: "var(--ink-subtle)" }}>ID da conta</span>
							<code className="text-[11px] font-mono" style={{ color: "var(--ink-muted)" }}>{user.id}</code>
						</div>
					</div>
				</div>

				{/* Quick links */}
				{user.role === "BIDDER" && (
					<div
						className="rounded-2xl overflow-hidden"
						style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
					>
						<div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
							<h3 className="text-sm font-semibold" style={{ color: "var(--ink)" }}>Acesso rápido</h3>
						</div>
						<div className="divide-y divide-[var(--border)]">
							{[
								{ to: "/wallet", label: "Carteira", icon: <><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M16 12h.01"/></> },
								{ to: "/activity", label: "Atividade", icon: <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/> },
								{ to: "/bidder", label: "Painel", icon: <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></> },
							].map(({ to, label, icon }) => (
								<Link
									key={to}
									to={to}
									className="flex items-center justify-between px-5 py-3.5 transition-colors"
									style={{ color: "var(--ink)" }}
									onMouseEnter={(e) => (e.currentTarget.style.background = "var(--subtle-bg2)")}
									onMouseLeave={(e) => (e.currentTarget.style.background = "")}
								>
									<div className="flex items-center gap-3">
										<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
											{icon}
										</svg>
										<span className="text-sm">{label}</span>
									</div>
									<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "var(--ink-subtle)" }}>
										<path d="M9 18l6-6-6-6"/>
									</svg>
								</Link>
							))}
						</div>
					</div>
				)}

				{/* LGPD */}
				<div
					className="rounded-2xl p-5 space-y-3"
					style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
				>
					<div className="flex items-start gap-3">
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mt-0.5 shrink-0" style={{ color: "var(--ink-subtle)" }}>
							<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
						</svg>
						<div>
							<p className="text-sm font-semibold" style={{ color: "var(--ink)" }}>Privacidade e LGPD</p>
							<p className="text-xs mt-1 leading-relaxed" style={{ color: "var(--ink-muted)" }}>
								Seus dados pessoais são criptografados com Fernet e armazenados com segurança.
								Você pode exportar todos seus dados a qualquer momento.
							</p>
						</div>
					</div>
					<button
						type="button"
						onClick={handleExport}
						disabled={exporting}
						className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
						style={{ background: "var(--subtle-bg2)", color: "var(--ink)", border: "1px solid var(--border)" }}
					>
						{exporting ? (
							<>
								<svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
									<path d="M21 12a9 9 0 11-6.219-8.56"/>
								</svg>
								Exportando…
							</>
						) : (
							<>
								<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
									<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
								</svg>
								Exportar meus dados
							</>
						)}
					</button>
					{exportDone && (
						<p className="text-xs text-center" style={{ color: "#16A34A" }}>
							Download iniciado.
						</p>
					)}
				</div>
			</div>
		</div>
	);
}
