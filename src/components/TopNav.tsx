import { Link, useNavigate } from "react-router-dom";
import { auth } from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";

export function TopNav() {
	const user = useAuthStore((s) => s.user);
	const setUser = useAuthStore((s) => s.setUser);
	const navigate = useNavigate();

	async function handleSignOut() {
		await auth.signOut().catch(() => {});
		setUser(null);
		navigate("/login");
	}

	return (
		<header
			className="fixed top-0 inset-x-0 z-30 bg-white border-b"
			style={{ borderColor: "#E4E4E2" }}
		>
			<div className="max-w-7xl mx-auto px-6 h-14 flex items-center gap-6">
				{/* Logo */}
				<Link to="/" className="flex-shrink-0 mr-2">
					<span
						className="text-[10px] font-semibold tracking-[0.2em] text-[#6B7280] uppercase block leading-none"
					>
						Casa de
					</span>
					<span
						className="text-lg font-bold text-[#0D0D0D] leading-tight block"
						style={{ fontFamily: "var(--font-display)" }}
					>
						Leilões
					</span>
				</Link>

				{/* Primary nav */}
				<nav className="flex items-center gap-1 flex-1">
					<Link
						to="/"
						className="px-3 py-1.5 text-sm font-medium text-[#0D0D0D] hover:bg-[#F5F4F0] rounded-md transition-colors"
					>
						Lotes
					</Link>
				</nav>

				{/* Right side */}
				<div className="flex items-center gap-3 flex-shrink-0">
					{user ? (
						<>
							{user.role === "BIDDER" && (
								<>
									<Link
										to="/wallet"
										className="text-sm text-[#6B7280] hover:text-[#0D0D0D] transition-colors"
									>
										Carteira
									</Link>
									<Link
										to="/activity"
										className="text-sm text-[#6B7280] hover:text-[#0D0D0D] transition-colors"
									>
										Atividade
									</Link>
								</>
							)}
							{user.role === "AUCTIONEER" && (
								<Link
									to="/auctioneer"
									className="text-sm text-[#6B7280] hover:text-[#0D0D0D] transition-colors"
								>
									Painel
								</Link>
							)}
							<div className="flex items-center gap-3 border-l pl-3" style={{ borderColor: "#E4E4E2" }}>
								<span className="text-sm font-medium text-[#0D0D0D] max-w-[120px] truncate">
									{user.name}
								</span>
								<button
									type="button"
									onClick={handleSignOut}
									className="text-sm text-[#6B7280] hover:text-[#0D0D0D] transition-colors"
								>
									Sair
								</button>
							</div>
						</>
					) : (
						<>
							<Link
								to="/login"
								className="text-sm font-medium text-[#0D0D0D] hover:text-[#1D4ED8] transition-colors"
							>
								Entrar
							</Link>
							<Link
								to="/register"
								className="px-4 py-1.5 text-sm font-medium text-white bg-[#0D0D0D] rounded-md hover:bg-[#1a1a1a] transition-colors"
							>
								Criar conta
							</Link>
						</>
					)}
				</div>
			</div>
		</header>
	);
}
