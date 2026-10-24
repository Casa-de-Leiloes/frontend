import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { auth } from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import { NavBar } from "@/components/NavBar";
import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { LotsPage } from "@/pages/LotsPage";
import { LotDetailPage } from "@/pages/LotDetailPage";
import { WalletPage } from "@/pages/WalletPage";

const qc = new QueryClient({ defaultOptions: { queries: { staleTime: 10_000 } } });

function AuthLoader({ children }: { children: React.ReactNode }) {
  const setUser = useAuthStore((s) => s.setUser);
  useEffect(() => {
    auth.session().then((r) => setUser(r.user)).catch(() => {});
  }, [setUser]);
  return <>{children}</>;
}

export function App() {
  return (
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <AuthLoader>
          <div className="min-h-screen flex flex-col">
            <NavBar />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<LotsPage />} />
                <Route path="/lots/:id" element={<LotDetailPage />} />
                <Route path="/wallet" element={<WalletPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>
        </AuthLoader>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
