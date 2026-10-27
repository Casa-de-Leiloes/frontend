import { useEffect } from "react";
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
import { MyActivityPage } from "@/pages/MyActivityPage";
import { AuditPage } from "@/pages/AuditPage";
import { ReceiptPage } from "@/pages/ReceiptPage";

const qc = new QueryClient({
	defaultOptions: { queries: { staleTime: 10_000 } },
});

function AuthLoader({ children }: { children: React.ReactNode }) {
	const setUser = useAuthStore((s) => s.setUser);
	useEffect(() => {
		auth
			.session()
			.then((r) => setUser(r.user))
			.catch(() => {});
	}, [setUser]);
	return <>{children}</>;
}

const AUTH_ROUTES = ["/login", "/register"];

function Shell({ children }: { children: React.ReactNode }) {
	const location = useLocation();
	const isAuthRoute = AUTH_ROUTES.includes(location.pathname);

	if (isAuthRoute) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-[#F5F4F0] px-4">
				{children}
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-[#F5F4F0]">
			<TopNav />
			<main className="pt-[152px] min-h-screen">
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
							<Route path="/wallet" element={<WalletPage />} />
							<Route path="/auctioneer" element={<AuctioneerPage />} />
							<Route path="/activity" element={<MyActivityPage />} />
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
