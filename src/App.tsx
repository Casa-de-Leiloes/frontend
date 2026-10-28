import { useEffect, type ReactNode } from "react";
import {
	BrowserRouter,
	Routes,
	Route,
	Navigate,
	useLocation,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { auth } from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import { TopNav } from "@/components/TopNav";
import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { LotsPage } from "@/pages/LotsPage";
import { LotDetailPage } from "@/pages/LotDetailPage";
import { WalletPage } from "@/pages/WalletPage";
import { AuctioneerPage } from "@/pages/AuctioneerPage";
import { BidderPage } from "@/pages/BidderPage";
import { MyActivityPage } from "@/pages/MyActivityPage";
import { AuditPage } from "@/pages/AuditPage";
import { ReceiptPage } from "@/pages/ReceiptPage";

const qc = new QueryClient({
	defaultOptions: { queries: { staleTime: 10_000 } },
});

function AuthLoader({ children }: { children: React.ReactNode }) {
	const setUser = useAuthStore((s) => s.setUser);
	const setLoading = useAuthStore((s) => s.setLoading);
	useEffect(() => {
		auth
			.session()
			.then((r) => setUser(r.user))
			.catch(() => setUser(null))
			.finally(() => setLoading(false));
	}, [setUser, setLoading]);
	return <>{children}</>;
}

const AUTH_ROUTES = ["/login", "/register"];

function RequireRole({ role, children }: { role: "AUCTIONEER" | "BIDDER"; children: ReactNode }) {
	const user = useAuthStore((s) => s.user);
	const loading = useAuthStore((s) => s.loading);
	if (loading) return null;
	if (!user) return <Navigate to="/login" replace />;
	if (user.role !== role) return <Navigate to="/" replace />;
	return <>{children}</>;
}

function RequireAuth({ children }: { children: ReactNode }) {
	const user = useAuthStore((s) => s.user);
	const loading = useAuthStore((s) => s.loading);
	if (loading) return null;
	if (!user) return <Navigate to="/login" replace />;
	return <>{children}</>;
}

function Shell({ children }: { children: React.ReactNode }) {
	const location = useLocation();
	const isAuthRoute = AUTH_ROUTES.includes(location.pathname);

	if (isAuthRoute) {
		return (
			<div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--ground)" }}>
				{children}
			</div>
		);
	}

	return (
		<div className="min-h-screen" style={{ background: "var(--ground)" }}>
			<TopNav />
			<main className="min-h-screen">
				{children}
			</main>
		</div>
	);
}

export function App() {
	return (
		<QueryClientProvider client={qc}>
			<BrowserRouter>
				<AuthLoader>
					<Shell>
						<Routes>
							<Route path="/" element={<LotsPage />} />
							<Route path="/lots/:id" element={<LotDetailPage />} />
							<Route path="/bidder" element={<RequireRole role="BIDDER"><BidderPage /></RequireRole>} />
							<Route path="/wallet" element={<RequireRole role="BIDDER"><WalletPage /></RequireRole>} />
							<Route path="/auctioneer" element={<RequireRole role="AUCTIONEER"><AuctioneerPage /></RequireRole>} />
							<Route path="/activity" element={<RequireAuth><MyActivityPage /></RequireAuth>} />
							<Route path="/audit/:lotId" element={<AuditPage />} />
							<Route path="/receipt/:token" element={<ReceiptPage />} />
							<Route path="/login" element={<LoginPage />} />
							<Route path="/register" element={<RegisterPage />} />
							<Route path="*" element={<Navigate to="/" replace />} />
						</Routes>
					</Shell>
				</AuthLoader>
			</BrowserRouter>
		</QueryClientProvider>
	);
}
