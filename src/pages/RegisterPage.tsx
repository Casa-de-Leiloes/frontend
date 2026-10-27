import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { auth } from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function RegisterPage() {
	const navigate = useNavigate();
	const setUser = useAuthStore((s) => s.setUser);
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [role, setRole] = useState<"BIDDER" | "AUCTIONEER">("BIDDER");
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setLoading(true);
		setError(null);
		try {
			const res = await auth.signUp(email, password, name, role);
			if (res.user) setUser(res.user);
			navigate("/");
		} catch (err) {
			setError(err instanceof Error ? err.message : "Falha ao criar conta");
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="w-full max-w-sm">
			<div className="mb-8 text-center">
				<p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-1">
					Casa de
				</p>
				<h1 className="text-2xl font-bold text-foreground">Leilões</h1>
			</div>

			<div className="bg-surface rounded-lg border border-border p-8 shadow-sm">
				<h2 className="text-lg font-semibold text-foreground mb-6">
					Criar conta
				</h2>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-1.5">
						<label
							htmlFor="name"
							className="text-sm font-medium text-foreground"
						>
							Nome completo
						</label>
						<Input
							id="name"
							placeholder="João Silva"
							value={name}
							onChange={(e) => setName(e.target.value)}
							required
						/>
					</div>

					<div className="space-y-1.5">
						<label
							htmlFor="email"
							className="text-sm font-medium text-foreground"
						>
							E-mail
						</label>
						<Input
							id="email"
							type="email"
							placeholder="seu@email.com"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
						/>
					</div>

					<div className="space-y-1.5">
						<label
							htmlFor="password"
							className="text-sm font-medium text-foreground"
						>
							Senha{" "}
							<span className="text-muted-foreground font-normal">
								(mín. 8 caracteres)
							</span>
						</label>
						<Input
							id="password"
							type="password"
							placeholder="••••••••"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
							minLength={8}
						/>
					</div>

					<div className="space-y-1.5">
						<label className="text-sm font-medium text-foreground">
							Tipo de conta
						</label>
						<div className="flex gap-4">
							<label className="flex items-center gap-2 cursor-pointer">
								<input
									type="radio"
									value="BIDDER"
									checked={role === "BIDDER"}
									onChange={() => setRole("BIDDER")}
									className="accent-primary"
								/>
								<span className="text-sm">Arrematante</span>
							</label>
							<label className="flex items-center gap-2 cursor-pointer">
								<input
									type="radio"
									value="AUCTIONEER"
									checked={role === "AUCTIONEER"}
									onChange={() => setRole("AUCTIONEER")}
									className="accent-primary"
								/>
								<span className="text-sm">Leiloeiro</span>
							</label>
						</div>
					</div>

					{error && (
						<p className="text-sm text-destructive bg-destructive/5 border border-destructive/20 rounded px-3 py-2">
							{error}
						</p>
					)}

					<Button type="submit" className="w-full" disabled={loading}>
						{loading ? "Criando conta…" : "Criar conta"}
					</Button>
				</form>

				<p className="text-sm text-center text-muted-foreground mt-5">
					Já tem uma conta?{" "}
					<Link
						to="/login"
						className="text-foreground font-medium hover:underline"
					>
						Entrar
					</Link>
				</p>
			</div>
		</div>
	);
}
