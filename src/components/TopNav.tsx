import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import { auth } from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import { useThemeStore } from "@/store/theme.store";

const LOT_CATEGORIES = [
	{ key: "FINE_ART", label: "Arte", color: "#7AB8A0" },
	{ key: "JEWELRY", label: "Joalharia e pedras preciosas", color: "#B8A0C8" },
	{ key: "WATCHES", label: "Relógios e câmeras", color: "#4A90D9" },
	{ key: "ANTIQUITIES", label: "Antiguidades", color: "#C8A87A" },
	{ key: "NUMISMATICS", label: "Moedas e selos", color: "#8BA8C8" },
	{ key: "FASHION", label: "Moda", color: "#D4A8B0" },
	{ key: "VEHICLES", label: "Carros e motos", color: "#A8B878" },
	{ key: "BOOKS", label: "Livros e memorabilia", color: "#7A9878" },
	{ key: "WINE", label: "Vinho e bebidas", color: "#A87878" },
	{ key: "OTHER", label: "Outras categorias", color: "#A8A8A8" },
];

const CATEGORIES = [
	{
		label: "Esta semana",
		href: "/",
		icon: (
			<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
				<rect x="3" y="4" width="18" height="18" rx="2"/>
				<line x1="16" y1="2" x2="16" y2="6"/>
				<line x1="8" y1="2" x2="8" y2="6"/>
				<line x1="3" y1="10" x2="21" y2="10"/>
			</svg>
		),
	},
	{
		label: "Ao Vivo",
		href: "/?status=LIVE",
		icon: (
			<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
				<circle cx="12" cy="12" r="3"/>
				<path d="M5.6 5.6a9 9 0 0 0 0 12.8"/>
				<path d="M18.4 5.6a9 9 0 0 1 0 12.8"/>
				<path d="M8.5 8.5a5 5 0 0 0 0 7"/>
				<path d="M15.5 8.5a5 5 0 0 1 0 7"/>
			</svg>
		),
	},
	{
		label: "Arte",
		href: "/?lotCategory=FINE_ART",
		icon: (
			<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
				<path d="M2 12C2 6.48 6.48 2 12 2s10 4.48 10 10-4.48 10-10 10"/>
				<path d="M7 15c0-2.76 2.24-5 5-5s5 2.24 5 5"/>
				<circle cx="12" cy="7" r="1"/>
			</svg>
		),
	},
	{
		label: "Joalharia",
		href: "/?lotCategory=JEWELRY",
		icon: (
			<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
				<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
			</svg>
		),
	},
	{
		label: "Relógios",
		href: "/?lotCategory=WATCHES",
		icon: (
			<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
				<circle cx="12" cy="12" r="7"/>
				<polyline points="12 9 12 12 13.5 13.5"/>
				<path d="M9 1h6M9 23h6"/>
			</svg>
		),
	},
	{
		label: "Antiguidades",
		href: "/?lotCategory=ANTIQUITIES",
		icon: (
			<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
				<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
				<polyline points="9 22 9 12 15 12 15 22"/>
			</svg>
		),
	},
	{
		label: "Numismática",
		href: "/?lotCategory=NUMISMATICS",
		icon: (
			<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
				<circle cx="12" cy="12" r="9"/>
				<path d="M12 6v2M12 16v2M8.5 9.5l1.5 1M14 13.5l1.5 1M6 12h2M16 12h2M8.5 14.5l1.5-1M14 10.5l1.5-1"/>
			</svg>
		),
	},
	{
		label: "Moda",
		href: "/?lotCategory=FASHION",
		icon: (
			<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
				<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
				<line x1="3" y1="6" x2="21" y2="6"/>
				<path d="M16 10a4 4 0 0 1-8 0"/>
			</svg>
		),
	},
];

function ThemeToggle() {
	const { theme, toggle } = useThemeStore();
	return (
		<button
			type="button"
			onClick={toggle}
			aria-label={theme === "dark" ? "Mudar para tema claro" : "Mudar para tema escuro"}
			className="w-8 h-8 flex items-center justify-center rounded-md transition-colors hover:bg-[var(--subtle-bg2)] text-[var(--ink-muted)] hover:text-[var(--ink)]"
		>
			{theme === "dark" ? (
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
					<circle cx="12" cy="12" r="5"/>
					<path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
				</svg>
			) : (
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
					<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
				</svg>
			)}
		</button>
	);
}

export function TopNav() {
	const user = useAuthStore((s) => s.user);
	const setUser = useAuthStore((s) => s.setUser);
	const navigate = useNavigate();
	const location = useLocation();
	const [catModalOpen, setCatModalOpen] = useState(false);

	async function handleSignOut() {
		await auth.signOut().catch(() => {});
		setUser(null);
		navigate("/login");
	}

	const activeCatHref = location.pathname === "/" && location.search
		? `/?${location.search.replace(/^\?/, "")}`
		: location.pathname === "/"
			? "/"
			: null;
	const activeCat = CATEGORIES.find((c) => c.href === (activeCatHref ?? "/")) ?? CATEGORIES[0];

	return (
		<>
		<header
			className="fixed top-0 inset-x-0 z-30"
			style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }}
		>
			{/* Main bar */}
			<div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 flex items-center gap-2 sm:gap-4">
				{/* Logo */}
				<Link to="/" className="flex-shrink-0 mr-1">
					<span className="text-[10px] font-semibold tracking-[0.2em] uppercase block leading-none" style={{ color: "var(--ink-subtle)" }}>
						Casa de
					</span>
					<span
						className="text-lg font-bold leading-tight block"
						style={{ fontFamily: "var(--font-display)", color: "var(--ink)" }}
					>
						Leilões
					</span>
				</Link>

				{/* Categorias button */}
				<button
					type="button"
					onClick={() => setCatModalOpen(true)}
					className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors rounded-md flex-shrink-0"
					style={{ color: "var(--ink)", background: "transparent" }}
					onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--subtle-bg2)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--accent)"; }}
					onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = "var(--ink)"; }}
				>
					Categorias
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
						<path d="M6 9l6 6 6-6"/>
					</svg>
				</button>

				{/* Spacer */}
				<div className="flex-1" />

				{/* Right side */}
				<div className="flex items-center gap-3 flex-shrink-0">
					<ThemeToggle />
					{user ? (
						<>
							{user.role === "BIDDER" && (
								<div className="hidden md:flex items-center gap-3">
									<Link to="/bidder" className="text-sm transition-colors" style={{ color: "var(--ink-muted)" }}>Painel</Link>
									<Link to="/wallet" className="text-sm transition-colors" style={{ color: "var(--ink-muted)" }}>Carteira</Link>
									<Link to="/activity" className="text-sm transition-colors" style={{ color: "var(--ink-muted)" }}>Atividade</Link>
								</div>
							)}
							{user.role === "AUCTIONEER" && (
								<Link to="/auctioneer" className="hidden md:inline text-sm transition-colors" style={{ color: "var(--ink-muted)" }}>Painel</Link>
							)}
							<div className="flex items-center gap-2 border-l pl-3" style={{ borderColor: "var(--border)" }}>
								<span className="hidden sm:inline text-sm font-medium max-w-[80px] truncate" style={{ color: "var(--ink)" }}>
									{user.name}
								</span>
								<button
									type="button"
									onClick={handleSignOut}
									className="text-sm transition-colors"
									style={{ color: "var(--ink-muted)" }}
								>
									Sair
								</button>
							</div>
						</>
					) : (
						<>
							<Link to="/login" className="text-sm font-medium transition-colors" style={{ color: "var(--ink)" }}>
								Entrar
							</Link>
							<Link
								to="/register"
								className="hidden sm:inline-block px-3 py-1.5 text-sm font-semibold text-white rounded-md transition-colors"
								style={{ background: "var(--accent)" }}
							>
								Criar conta
							</Link>
						</>
					)}
				</div>
			</div>

			{/* Trust bar — hidden on very small screens */}
			<div className="hidden sm:block py-1.5" style={{ background: "var(--subtle-bg)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
				<div className="max-w-7xl mx-auto px-6 flex items-center justify-center gap-6 text-xs" style={{ color: "var(--ink-muted)" }}>
					<span className="flex items-center gap-1">
						<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2">
							<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
						</svg>
						Lances auditáveis com hash chain
					</span>
					<span style={{ color: "var(--border)" }}>·</span>
					<span className="flex items-center gap-1">
						<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#1D4ED8" strokeWidth="2">
							<rect x="3" y="11" width="18" height="11" rx="2"/>
							<path d="M7 11V7a5 5 0 0 1 10 0v4"/>
						</svg>
						Dados protegidos pela LGPD
					</span>
				</div>
			</div>

			{/* Category tabs */}
			<div className="max-w-7xl mx-auto px-6 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
				<div className="flex items-stretch gap-1">
					{CATEGORIES.map((cat) => {
						const isActive = activeCat.label === cat.label;
						return (
							<Link
								key={cat.label}
								to={cat.href}
								className="flex flex-col items-center gap-1 px-3 py-2.5 text-[11px] font-medium whitespace-nowrap transition-colors flex-shrink-0 border-b-2"
								style={{
									color: isActive ? "var(--accent)" : "var(--ink-muted)",
									borderBottomColor: isActive ? "var(--accent)" : "transparent",
								}}
							>
								<span style={{ color: isActive ? "var(--accent)" : "var(--ink-subtle)" }}>
									{cat.icon}
								</span>
								{cat.label}
							</Link>
						);
					})}
				</div>
			</div>
		</header>

		{/* Categories modal */}
		{catModalOpen && (
			<div
				className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4"
				style={{ background: "rgba(0,0,0,0.6)" }}
				onClick={() => setCatModalOpen(false)}
			>
				<div
					className="rounded-xl shadow-2xl w-full max-w-3xl p-8"
					style={{ background: "var(--surface)" }}
					onClick={(e) => e.stopPropagation()}
				>
					<div className="flex items-center justify-between mb-6">
						<h2 className="text-3xl font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--ink)" }}>
							Categorias
						</h2>
						<button
							type="button"
							onClick={() => setCatModalOpen(false)}
							className="transition-colors p-1"
							style={{ color: "var(--ink-muted)" }}
							aria-label="Fechar"
						>
							<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
								<path d="M18 6L6 18M6 6l12 12"/>
							</svg>
						</button>
					</div>
					<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
						{LOT_CATEGORIES.map((cat) => (
							<Link
								key={cat.key}
								to={`/?lotCategory=${cat.key}`}
								onClick={() => setCatModalOpen(false)}
								className="relative h-24 rounded-lg overflow-hidden flex items-end p-3 group"
								style={{ background: cat.color }}
							>
								<span
									className="text-white font-semibold text-sm leading-tight drop-shadow-sm group-hover:underline"
									style={{ fontFamily: "var(--font-display)" }}
								>
									{cat.label}
								</span>
							</Link>
						))}
					</div>
				</div>
			</div>
		)}
		</>
	);
}
