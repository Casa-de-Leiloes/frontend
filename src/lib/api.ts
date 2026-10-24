const BASE = "/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { message?: string }).message ?? `HTTP ${res.status}`);
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
}

export interface Bid {
  id: string;
  sequence: number;
  amountCents: string;
  placedAt: string;
  pseudonym: string;
}

export interface WalletBalance {
  totalCents: string;
  committedCents: string;
  availableCents: string;
}

export const auth = {
  signUp: (email: string, password: string, name: string, role: "BIDDER" | "AUCTIONEER") =>
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
  list: (status?: string) =>
    request<{ items: Lot[]; nextCursor: string | null }>(`/lots${status ? `?status=${status}` : ""}`),
  get: (id: string) => request<Lot>(`/lots/${id}`),
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
};
