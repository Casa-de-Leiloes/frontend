import { Link, useLocation, useNavigate } from "react-router-dom";
import { auth } from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";

interface NavItem {
	label: string;
	to: string;
}

export function Sidebar() {
	const user = useAuthStore((s) => s.user);
	const setUser = useAuthStore((s) => s.setUser);
	const navigate = useNavigate();
	const location = useLocation();

	async function handleSignOut() {
		await auth.signOut().catch(() => {});
		setUser(null);
		navigate("/login");
	}

	const navItems: NavItem[] = [
		{ label: "Lotes", to: "/" },
		...(user?.role === "BIDDER"
			? [
					{ label: "Carteira", to: "/wallet" },
					{ label: "Minha Atividade", to: "/activity" },
				]
			: []),
		...(user?.role === "AUCTIONEER"
			? [{ label: "Painel do Leiloeiro", to: "/auctioneer" }]
			: []),
	];

	return (
		<aside className="fixed inset-y-0 left-0 w-64 bg-surface border-r border-border flex flex-col z-20">
			<div className="px-6 py-5 border-b border-border">
				<Link to="/" className="block">
					<span className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">
						Casa de
					</span>
					<p className="text-base font-bold text-foreground leading-tight">
						Leilões
					</p>
				</Link>
			</div>

			<nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
				{navItems.map((item) => {
					const isActive =
						item.to === "/"
							? location.pathname === "/"
							: location.pathname.startsWith(item.to);
					return (
						<Link
							key={item.to}
							to={item.to}
							className={`flex items-center px-3 py-2 rounded-md text-sm transition-colors ${
								isActive
									? "bg-muted text-foreground font-medium"
									: "text-muted-foreground hover:bg-muted hover:text-foreground"
							}`}
						>
							{item.label}
						</Link>
					);
				})}
			</nav>

			<div className="px-4 py-4 border-t border-border">
				{user ? (
					<div className="space-y-1">
						<p className="text-sm font-medium text-foreground truncate">
							{user.name}
						</p>
						<p className="text-xs text-muted-foreground">
							{user.role === "BIDDER" ? "Arrematante" : "Leiloeiro"}
						</p>
						<button
							type="button"
							onClick={handleSignOut}
							className="text-xs text-muted-foreground hover:text-foreground underline mt-2 block"
						>
							Sair da conta
						</button>
					</div>
				) : (
					<div className="space-y-2">
						<Link
							to="/login"
							className="block text-sm font-medium text-foreground hover:underline"
						>
							Entrar
						</Link>
						<Link
							to="/register"
							className="block text-sm text-muted-foreground hover:text-foreground hover:underline"
						>
							Criar conta
						</Link>
					</div>
				)}
			</div>
		</aside>
	);
}
