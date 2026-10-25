const BASE = "/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
	const res = await fetch(`${BASE}${path}`, {
		credentials: "include",
		headers: { "Content-Type": "application/json", ...init?.headers },
		...init,
	});
	if (!res.ok) {
		const body = await res.json().catch(() => ({}));
		const b = body as { message?: string };
		throw new Error(b.message ?? `HTTP ${res.status}`);
	}
	return res.json() as Promise<T>;
}

export interface User {
	id: string;
	name: string;
	email: string;
	role: "BIDDER" | "AUCTIONEER";
}

export interface Lot {
	id: string;
	auctioneerId: string;
	title: string;
	description: string | null;
	category: string;
	startingBidCents: string;
	currentBidCents: string | null;
	minIncrementCents: string;
	startsAt: string;
	endsAt: string;
	status: "SCHEDULED" | "LIVE" | "CLOSED" | "CANCELLED";
	bidCount: number;
	snapshotId: string;
	imageUrl: string | null;
}

export interface Bid {
	id: string;
	sequence: number;
	amountCents: string;
	placedAt: string;
	pseudonym: string;
	lotId?: string;
}

export interface WalletBalance {
	totalCents: string;
	committedCents: string;
	availableCents: string;
}

export interface CatalogItem {
	providerId: string;
	provider: string;
	title: string;
	description: string;
	imageUrl: string | null;
	externalUrl: string | null;
	metadata: Record<string, string | number | boolean | null>;
}

export interface BidPosition {
	rank: number;
	lastBidCents: string | null;
	currentPriceCents: string | null;
	gapToLeadCents: string | null;
	isLeading: boolean;
}

export interface AuditResult {
	lotId: string;
	bidCount: number;
	chainValid: boolean;
	firstHash: string | null;
	lastHash: string | null;
}

export interface Win {
	lotId: string;
	amountCents: string;
	receiptToken: string | null;
}

export interface Receipt {
	lotId: string;
	lotTitle: string;
	winnerId: string;
	amountCents: string;
	publicToken: string;
	issuedAt: string;
	finalChainHash: string;
}

export const auth = {
	signUp: (
		email: string,
		password: string,
		name: string,
		role: "BIDDER" | "AUCTIONEER",
	) =>
		request<{ user: User }>("/auth/sign-up/email", {
			method: "POST",
			body: JSON.stringify({ email, password, name, role }),
		}),
	signIn: (email: string, password: string) =>
		request<{ user: User }>("/auth/sign-in/email", {
			method: "POST",
			body: JSON.stringify({ email, password }),
		}),
	signOut: () => request<void>("/auth/sign-out", { method: "POST" }),
	session: () => request<{ user: User | null }>("/auth/get-session"),
};

export const lots = {
	list: (params?: { status?: string }) => {
		const qs = params?.status ? `?status=${params.status}` : "";
		return request<{ items: Lot[]; nextCursor: string | null }>(`/lots${qs}`);
	},
	get: (id: string) => request<Lot>(`/lots/${id}`),
	create: (body: {
		snapshotId?: string;
		providerKey?: string;
		providerId?: string;
		title: string;
		description?: string;
		category: string;
		startingBidCents: number;
		minIncrementCents: number;
		startsAt: string;
		endsAt: string;
	}) => request<Lot>("/lots", { method: "POST", body: JSON.stringify(body) }),
	cancel: (id: string) => request<Lot>(`/lots/${id}`, { method: "DELETE" }),
	getPosition: (id: string) => request<BidPosition>(`/lots/${id}/position`),
	getReceipt: (token: string) => request<Receipt>(`/lots/receipt/${token}`),
};

export const bids = {
	list: (lotId: string) => request<Bid[]>(`/lots/${lotId}/bids`),
	place: (lotId: string, amountCents: number) =>
		request<Bid>(`/lots/${lotId}/bids`, {
			method: "POST",
			body: JSON.stringify({ amountCents }),
		}),
};

export const wallet = {
	balance: () => request<WalletBalance>("/wallets/me/balance"),
	deposit: (amountCents: number) =>
		request<WalletBalance>("/wallets/me/deposit", {
			method: "POST",
			body: JSON.stringify({ amountCents }),
		}),
	ledger: () =>
		request<
			Array<{
				id: string;
				kind: string;
				amountCents: string;
				createdAt: string;
			}>
		>("/wallets/me/ledger"),
};

export const users = {
	myBids: (cursor?: string) => {
		const qs = cursor ? `?cursor=${cursor}` : "";
		return request<{ items: Bid[]; nextCursor: string | null }>(
			`/users/me/bids${qs}`,
		);
	},
	myWins: () => request<Win[]>("/users/me/wins"),
};

export const catalog = {
	search: (q: string, provider: string) =>
		request<{ items: CatalogItem[] }>(
			`/catalog/search?q=${encodeURIComponent(q)}&provider=${encodeURIComponent(provider)}`,
		),
};

export const audit = {
	getLot: (lotId: string) => request<AuditResult>(`/lots/${lotId}/audit`),
	getBids: (lotId: string) => request<Bid[]>(`/lots/${lotId}/bids`),
};
