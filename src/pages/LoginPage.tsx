import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { auth } from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import { translateError } from "@/lib/errors";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function LoginPage() {
	const navigate = useNavigate();
	const setUser = useAuthStore((s) => s.setUser);
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setLoading(true);
		setError(null);
		try {
			const res = await auth.signIn(email, password);
			if (res.user) setUser(res.user);
			navigate("/");
		} catch (err) {
			setError(translateError(err));
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
					Entrar na sua conta
				</h2>

				<form onSubmit={handleSubmit} className="space-y-4">
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
							Senha
						</label>
						<Input
							id="password"
							type="password"
							placeholder="••••••••"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
						/>
					</div>

					{error && (
						<p className="text-sm text-destructive bg-destructive/5 border border-destructive/20 rounded px-3 py-2">
							{error}
						</p>
					)}

					<Button type="submit" className="w-full" disabled={loading}>
						{loading ? "Entrando…" : "Entrar"}
					</Button>
				</form>

				<p className="text-sm text-center text-muted-foreground mt-5">
					Não tem conta?{" "}
					<Link
						to="/register"
						className="text-foreground font-medium hover:underline"
					>
						Criar conta
					</Link>
				</p>
			</div>
		</div>
	);
}
