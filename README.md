# Auction House — Frontend

Real-time auction house UI built as a technical test for Verzel's Elite Dev Junior Full Stack position.

## Stack

| Layer      | Technology                                     |
| ---------- | ---------------------------------------------- |
| Runtime    | Bun 1.x                                        |
| Framework  | React 19 + Vite 6                              |
| Routing    | React Router v7                                |
| State      | Zustand (auth) + TanStack Query (server state) |
| Styling    | Tailwind CSS v4                                |
| Components | Custom shadcn/ui-style (Radix UI primitives)   |
| Validation | Zod                                            |
| Linting    | Biome                                          |
| CI         | GitHub Actions                                 |

## Features

- **Auth flows** — sign-in and sign-up with role selection (AUCTIONEER / BIDDER)
- **Lot catalog** — paginated grid with live status badges
- **Lot detail** — real-time bid feed via SSE (`EventSource`), bid placement form
- **Wallet** — balance overview (total / available / committed) + deposit form
- **Navigation** — auth-aware navbar

## Local Setup

### Prerequisites

- [Bun](https://bun.sh) ≥ 1.4
- Backend API running on `localhost:3000`

### Install and run

```bash
bun install
bun run dev
```

App available at `http://localhost:5173`. API calls are proxied to `localhost:3000`.

## Build

```bash
bun run build        # production build → dist/
bun run preview      # preview the build locally
```

## Docker (production)

```bash
docker build -t auction-frontend .
docker run -p 80:80 auction-frontend
```

The nginx container proxies `/api/*` to the backend service.

## Environment

No `.env` needed for local dev — Vite's `server.proxy` handles API routing.

For Docker, set the backend URL in `nginx.conf` or via the `API_URL` build arg.
