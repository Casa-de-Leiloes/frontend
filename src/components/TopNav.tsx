import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
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
	const [catDropdownOpen, setCatDropdownOpen] = useState(false);
	const [userDropdownOpen, setUserDropdownOpen] = useState(false);
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
	const [hidden, setHidden] = useState(false);
	const headerRef = useRef<HTMLElement>(null);
	const catBtnRef = useRef<HTMLButtonElement>(null);
	const userBtnRef = useRef<HTMLButtonElement>(null);
	const lastScrollY = useRef(0);

	// Hide on scroll down, reveal on scroll up
	useEffect(() => {
		function onScroll() {
			const y = window.scrollY;
			if (y > lastScrollY.current && y > 80) {
				setHidden(true);
				setCatDropdownOpen(false);
				setMobileMenuOpen(false);
			} else if (y < lastScrollY.current) {
				setHidden(false);
			}
			lastScrollY.current = y;
		}
		window.addEventListener("scroll", onScroll, { passive: true });
		return () => window.removeEventListener("scroll", onScroll);
	}, []);

	// Set CSS var for header height (used by main padding)
	useEffect(() => {
		const header = headerRef.current;
		if (!header) return;
		const ro = new ResizeObserver(() => {
			document.documentElement.style.setProperty("--header-h", `${header.offsetHeight}px`);
		});
		ro.observe(header);
		return () => ro.disconnect();
	}, []);

	// Close menus on route change
	useEffect(() => {
		setMobileMenuOpen(false);
		setCatDropdownOpen(false);
		setUserDropdownOpen(false);
	}, [location.pathname, location.search]);

	// Close user dropdown on outside click
	useEffect(() => {
		if (!userDropdownOpen) return;
		function onClickOutside(e: MouseEvent) {
			if (userBtnRef.current && !userBtnRef.current.closest("[data-user-dropdown]")?.contains(e.target as Node)) {
				setUserDropdownOpen(false);
			}
		}
		document.addEventListener("mousedown", onClickOutside);
		return () => document.removeEventListener("mousedown", onClickOutside);
	}, [userDropdownOpen]);

	// Close cat dropdown on outside click
	useEffect(() => {
		if (!catDropdownOpen) return;
		function onClickOutside(e: MouseEvent) {
			if (catBtnRef.current && !catBtnRef.current.closest("[data-cat-dropdown]")?.contains(e.target as Node)) {
				setCatDropdownOpen(false);
			}
		}
		document.addEventListener("mousedown", onClickOutside);
		return () => document.removeEventListener("mousedown", onClickOutside);
	}, [catDropdownOpen]);

	async function handleSignOut() {
		await auth.signOut().catch(() => {});
		setUser(null);
		navigate("/login");
	}

	const INTERNAL_ROUTES = ["/profile", "/wallet", "/activity", "/bidder", "/auctioneer", "/receipt"];
	const isInternal = INTERNAL_ROUTES.some((r) => location.pathname === r || location.pathname.startsWith(`${r}/`));

	const activeCatHref = location.pathname === "/" && location.search
		? `/?${location.search.replace(/^\?/, "")}`
		: location.pathname === "/"
			? "/"
			: null;
	const activeCat = CATEGORIES.find((c) => c.href === (activeCatHref ?? "/")) ?? CATEGORIES[0];

	return (
		<>
		<header
			ref={headerRef}
			className="fixed top-0 inset-x-0 z-30"
			style={{
				background: "var(--surface)",
				borderBottom: "1px solid var(--border)",
			}}
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

				{/* Categorias dropdown button */}
				<div className="relative" data-cat-dropdown="">
					<button
						ref={catBtnRef}
						type="button"
						onClick={() => setCatDropdownOpen((v) => !v)}
						className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors rounded-md flex-shrink-0"
						style={{ color: catDropdownOpen ? "var(--accent)" : "var(--ink)", background: catDropdownOpen ? "var(--subtle-bg2)" : "transparent" }}
					>
						Categorias
						<svg
							width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
							aria-hidden
							style={{ transition: "transform 0.2s", transform: catDropdownOpen ? "rotate(180deg)" : "rotate(0deg)" }}
						>
							<path d="M6 9l6 6 6-6"/>
						</svg>
					</button>

					{/* Categorias dropdown panel */}
					{catDropdownOpen && (
						<div
							className="absolute top-full left-0 mt-2 w-[480px] rounded-xl shadow-2xl p-4 z-50"
							style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
						>
							<p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--ink-subtle)" }}>
								Categorias
							</p>
							<div className="grid grid-cols-2 gap-2">
								{LOT_CATEGORIES.map((cat) => (
									<Link
										key={cat.key}
										to={`/?lotCategory=${cat.key}`}
										onClick={() => setCatDropdownOpen(false)}
										className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-colors group"
										style={{ background: "var(--subtle-bg)" }}
									>
										<span
											className="w-3 h-3 rounded-full flex-shrink-0"
											style={{ background: cat.color }}
										/>
										<span className="text-sm font-medium group-hover:underline" style={{ color: "var(--ink)" }}>
											{cat.label}
										</span>
									</Link>
								))}
							</div>
						</div>
					)}
				</div>

				{/* Spacer */}
				<div className="flex-1" />

				{/* Right side — desktop */}
				<div className="flex items-center gap-3 flex-shrink-0">
					<div className="hidden sm:block">
						<ThemeToggle />
					</div>
					{user ? (
						<div className="relative hidden sm:block" data-user-dropdown="">
							<button
								ref={userBtnRef}
								type="button"
								onClick={() => setUserDropdownOpen((v) => !v)}
								className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors"
								style={{
									color: "var(--ink)",
									background: userDropdownOpen ? "var(--subtle-bg2)" : "transparent",
								}}
							>
								<span className="max-w-[100px] truncate">{user.name}</span>
								<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden
									style={{ transition: "transform 0.2s", transform: userDropdownOpen ? "rotate(180deg)" : "rotate(0deg)" }}>
									<path d="M6 9l6 6 6-6"/>
								</svg>
							</button>

							{userDropdownOpen && (
								<div
									className="absolute top-full right-0 mt-2 w-48 rounded-xl shadow-2xl py-1 z-50"
									style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
								>
									<Link to="/profile" className="flex items-center gap-2 px-4 py-2.5 text-sm transition-colors hover:bg-[var(--subtle-bg)]" style={{ color: "var(--ink)" }}>
										<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
										Perfil
									</Link>
									{user.role === "BIDDER" && (
										<>
											<Link to="/bidder" className="flex items-center gap-2 px-4 py-2.5 text-sm transition-colors hover:bg-[var(--subtle-bg)]" style={{ color: "var(--ink)" }}>
												<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
												Painel
											</Link>
											<Link to="/wallet" className="flex items-center gap-2 px-4 py-2.5 text-sm transition-colors hover:bg-[var(--subtle-bg)]" style={{ color: "var(--ink)" }}>
												<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M16 12h.01"/></svg>
												Carteira
											</Link>
											<Link to="/activity" className="flex items-center gap-2 px-4 py-2.5 text-sm transition-colors hover:bg-[var(--subtle-bg)]" style={{ color: "var(--ink)" }}>
												<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
												Atividade
											</Link>
										</>
									)}
									{user.role === "AUCTIONEER" && (
										<Link to="/auctioneer" className="flex items-center gap-2 px-4 py-2.5 text-sm transition-colors hover:bg-[var(--subtle-bg)]" style={{ color: "var(--ink)" }}>
											<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
											Painel
										</Link>
									)}
									<div className="my-1" style={{ borderTop: "1px solid var(--border)" }} />
									<button
										type="button"
										onClick={handleSignOut}
										className="w-full flex items-center gap-2 px-4 py-2.5 text-sm transition-colors hover:bg-[var(--subtle-bg)]"
										style={{ color: "var(--live)" }}
									>
										<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
										Sair
									</button>
								</div>
							)}
						</div>
					) : (
						<div className="hidden sm:flex items-center gap-2">
							<Link to="/login" className="text-sm font-medium transition-colors" style={{ color: "var(--ink)" }}>
								Entrar
							</Link>
							<Link
								to="/register"
								className="px-3 py-1.5 text-sm font-semibold text-white rounded-md transition-colors"
								style={{ background: "var(--accent)" }}
							>
								Criar conta
							</Link>
						</div>
					)}

					{/* Hamburger — mobile only */}
					<button
						type="button"
						aria-label={mobileMenuOpen ? "Fechar menu" : "Abrir menu"}
						onClick={() => setMobileMenuOpen((v) => !v)}
						className="sm:hidden w-9 h-9 flex flex-col items-center justify-center gap-1.5 rounded-md transition-colors"
						style={{ color: "var(--ink)" }}
					>
						<span
							className="block w-5 h-0.5 transition-all duration-200 origin-center"
							style={{
								background: "currentColor",
								transform: mobileMenuOpen ? "rotate(45deg) translate(2px, 2px)" : "none",
							}}
						/>
						<span
							className="block w-5 h-0.5 transition-all duration-200"
							style={{
								background: "currentColor",
								opacity: mobileMenuOpen ? 0 : 1,
							}}
						/>
						<span
							className="block w-5 h-0.5 transition-all duration-200 origin-center"
							style={{
								background: "currentColor",
								transform: mobileMenuOpen ? "rotate(-45deg) translate(2px, -2px)" : "none",
							}}
						/>
					</button>
				</div>
			</div>

			{/* Mobile dropdown menu */}
			{mobileMenuOpen && (
				<div
					className="sm:hidden border-t"
					style={{ background: "var(--surface)", borderColor: "var(--border)" }}
				>
					{/* Categorias section */}
					<div className="px-4 pt-4 pb-2">
						<p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--ink-subtle)" }}>
							Categorias
						</p>
						<div className="grid grid-cols-2 gap-1.5">
							{LOT_CATEGORIES.map((cat) => (
								<Link
									key={cat.key}
									to={`/?lotCategory=${cat.key}`}
									className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
									style={{ background: "var(--subtle-bg)", color: "var(--ink)" }}
								>
									<span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: cat.color }} />
									{cat.label}
								</Link>
							))}
						</div>
					</div>

					{/* User links */}
					<div className="px-4 py-3 border-t" style={{ borderColor: "var(--border)" }}>
						{user ? (
							<>
								<p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--ink-subtle)" }}>
									Minha conta — {user.name}
								</p>
								<div className="flex flex-col gap-1">
									<Link to="/profile" className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium" style={{ color: "var(--ink)", background: "var(--subtle-bg)" }}>
										<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
										Perfil
									</Link>
									{user.role === "BIDDER" && (
										<>
											<Link to="/bidder" className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium" style={{ color: "var(--ink)", background: "var(--subtle-bg)" }}>
												<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
												Painel
											</Link>
											<Link to="/wallet" className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium" style={{ color: "var(--ink)", background: "var(--subtle-bg)" }}>
												<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M16 12h.01"/></svg>
												Carteira
											</Link>
											<Link to="/activity" className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium" style={{ color: "var(--ink)", background: "var(--subtle-bg)" }}>
												<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
												Atividade
											</Link>
										</>
									)}
									{user.role === "AUCTIONEER" && (
										<Link to="/auctioneer" className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium" style={{ color: "var(--ink)", background: "var(--subtle-bg)" }}>
											<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
											Painel
										</Link>
									)}
								</div>
								<button
									type="button"
									onClick={handleSignOut}
									className="mt-2 w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium"
									style={{ color: "var(--live)", background: "var(--subtle-bg)" }}
								>
									<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
									Sair
								</button>
							</>
						) : (
							<div className="flex flex-col gap-2">
								<Link
									to="/login"
									className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium border"
									style={{ color: "var(--ink)", borderColor: "var(--border)", background: "var(--subtle-bg)" }}
								>
									Entrar
								</Link>
								<Link
									to="/register"
									className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold text-white"
									style={{ background: "var(--accent)" }}
								>
									Criar conta
								</Link>
							</div>
						)}
					</div>

					{/* Theme toggle */}
					<div className="px-4 py-3 border-t flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
						<span className="text-sm" style={{ color: "var(--ink-muted)" }}>Tema</span>
						<ThemeToggle />
					</div>
				</div>
			)}
		</header>

		{/* Spacer to push content below fixed header */}
		<div style={{ height: "var(--header-h, 56px)" }} aria-hidden />

		{/* Trust bar — normal flow, scrolls away */}
		{!isInternal && (
			<div className="hidden sm:block" style={{ background: "var(--subtle-bg)", borderBottom: "1px solid var(--border)", padding: "6px 0" }}>
				<div className="max-w-7xl mx-auto px-6 flex items-center justify-center gap-6 text-xs" style={{ color: "var(--ink-muted)" }}>
					<span className="flex items-center gap-1">
						<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--positive)" strokeWidth="2">
							<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
						</svg>
						Lances auditáveis com hash chain
					</span>
					<span style={{ color: "var(--border)" }}>·</span>
					<span className="flex items-center gap-1">
						<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
							<rect x="3" y="11" width="18" height="11" rx="2"/>
							<path d="M7 11V7a5 5 0 0 1 10 0v4"/>
						</svg>
						Dados protegidos pela LGPD
					</span>
				</div>
			</div>
		)}

		{/* Category tabs — normal flow, scrolls away */}
		{!isInternal && (
			<div className="overflow-x-auto" style={{ scrollbarWidth: "none", background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
				<div className="flex items-stretch gap-1 justify-center min-w-max mx-auto px-4">
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
		)}
		</>
	);
}
