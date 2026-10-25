import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { lots, catalog } from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { CatalogItem } from "@/lib/api";

const PROVIDERS = [
  { key: "ART_INSTITUTE_CHICAGO", label: "Art Institute of Chicago" },
  { key: "SCRYFALL", label: "Magic: the Gathering (Scryfall)" },
  { key: "OPEN_LIBRARY", label: "Open Library (Books)" },
] as const;

function formatCents(cents: string | null | undefined): string {
  if (!cents) return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    Number(cents) / 100,
  );
}

function badgeVariant(
  status: string,
): "default" | "secondary" | "destructive" | "outline" {
  if (status === "LIVE") return "default";
  if (status === "SCHEDULED") return "secondary";
  if (status === "CANCELLED") return "destructive";
  return "outline";
}

interface CreateLotForm {
  provider: (typeof PROVIDERS)[number]["key"];
  query: string;
  selectedItem: CatalogItem | null;
  title: string;
  description: string;
  startingBid: string;
  minIncrement: string;
  startsAt: string;
  endsAt: string;
}

function isoLocal(dateStr: string): string {
  return new Date(dateStr).toISOString();
}

export function AuctioneerPage() {
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();

  const [form, setForm] = useState<CreateLotForm>({
    provider: "ART_INSTITUTE_CHICAGO",
    query: "",
    selectedItem: null,
    title: "",
    description: "",
    startingBid: "",
    minIncrement: "",
    startsAt: "",
    endsAt: "",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState(false);

  const { data: allLots } = useQuery({
    queryKey: ["lots"],
    queryFn: () => lots.list(),
  });

  const myLots = allLots?.items.filter((l) => l.auctioneerId === user?.id) ?? [];

  const { data: searchResults, isFetching: searching } = useQuery({
    queryKey: ["catalog-search", form.provider, searchQuery],
    queryFn: () => catalog.search(searchQuery, form.provider),
    enabled: searchQuery.length > 2,
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => lots.cancel(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lots"] }),
  });

  const createMutation = useMutation({
    mutationFn: () => {
      if (!form.selectedItem) throw new Error("Selecione um item do catálogo");
      return lots.create({
        providerKey: form.provider,
        providerId: form.selectedItem.providerId,
        title: form.title,
        description: form.description || undefined,
        category: form.provider,
        startingBidCents: Math.round(parseFloat(form.startingBid) * 100),
        minIncrementCents: Math.round(parseFloat(form.minIncrement) * 100),
        startsAt: isoLocal(form.startsAt),
        endsAt: isoLocal(form.endsAt),
      });
    },
    onSuccess: () => {
      setCreateSuccess(true);
      setCreateError(null);
      setForm({
        provider: "ART_INSTITUTE_CHICAGO",
        query: "",
        selectedItem: null,
        title: "",
        description: "",
        startingBid: "",
        minIncrement: "",
        startsAt: "",
        endsAt: "",
      });
      setSearchQuery("");
      void qc.invalidateQueries({ queryKey: ["lots"] });
    },
    onError: (err) => {
      setCreateError(err instanceof Error ? err.message : "Erro ao criar lote");
      setCreateSuccess(false);
    },
  });

  function selectItem(item: CatalogItem) {
    setForm((prev) => ({
      ...prev,
      selectedItem: item,
      title: item.title,
      description: item.description,
    }));
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-bold">Painel do Leiloeiro</h1>

      {/* Create lot */}
      <Card>
        <CardHeader>
          <CardTitle>Criar novo lote</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {createSuccess && (
            <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2">
              Lote criado com sucesso!
            </p>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Provedor de catálogo</label>
            <div className="flex gap-2 flex-wrap">
              {PROVIDERS.map((p) => (
                <Button
                  key={p.key}
                  type="button"
                  size="sm"
                  variant={form.provider === p.key ? "default" : "outline"}
                  onClick={() => {
                    setForm((prev) => ({ ...prev, provider: p.key, selectedItem: null }));
                    setSearchQuery("");
                  }}
                >
                  {p.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Buscar no catálogo</label>
            <div className="flex gap-2">
              <Input
                placeholder="Ex: Van Gogh, Mona Lisa, Black Lotus..."
                value={form.query}
                onChange={(e) => setForm((prev) => ({ ...prev, query: e.target.value }))}
              />
              <Button
                type="button"
                onClick={() => setSearchQuery(form.query)}
                disabled={form.query.length < 3 || searching}
              >
                {searching ? "…" : "Buscar"}
              </Button>
            </div>
          </div>

          {searchResults && searchResults.items.length > 0 && (
            <div className="border rounded divide-y max-h-48 overflow-y-auto">
              {searchResults.items.map((item) => (
                <button
                  key={item.providerId}
                  type="button"
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors ${
                    form.selectedItem?.providerId === item.providerId
                      ? "bg-primary/10 font-semibold"
                      : ""
                  }`}
                  onClick={() => selectItem(item)}
                >
                  <span className="font-medium">{item.title}</span>
                  {item.description && (
                    <span className="text-muted-foreground ml-2 line-clamp-1">
                      — {item.description}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {form.selectedItem && (
            <p className="text-sm text-primary">
              ✓ Selecionado: <strong>{form.selectedItem.title}</strong>
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1 sm:col-span-2">
              <label className="text-sm font-medium">Título do lote</label>
              <Input
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Título"
                required
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className="text-sm font-medium">Descrição (opcional)</label>
              <Input
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Descrição"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Lance inicial (R$)</label>
              <Input
                type="number"
                min="0.01"
                step="0.01"
                value={form.startingBid}
                onChange={(e) => setForm((prev) => ({ ...prev, startingBid: e.target.value }))}
                placeholder="Ex: 100.00"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Incremento mínimo (R$)</label>
              <Input
                type="number"
                min="0.01"
                step="0.01"
                value={form.minIncrement}
                onChange={(e) => setForm((prev) => ({ ...prev, minIncrement: e.target.value }))}
                placeholder="Ex: 10.00"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Início</label>
              <Input
                type="datetime-local"
                value={form.startsAt}
                onChange={(e) => setForm((prev) => ({ ...prev, startsAt: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Encerramento</label>
              <Input
                type="datetime-local"
                value={form.endsAt}
                onChange={(e) => setForm((prev) => ({ ...prev, endsAt: e.target.value }))}
              />
            </div>
          </div>

          {createError && <p className="text-sm text-destructive">{createError}</p>}

          <Button
            onClick={() => {
              setCreateError(null);
              setCreateSuccess(false);
              createMutation.mutate();
            }}
            disabled={
              createMutation.isPending ||
              !form.selectedItem ||
              !form.title ||
              !form.startingBid ||
              !form.minIncrement ||
              !form.startsAt ||
              !form.endsAt
            }
          >
            {createMutation.isPending ? "Criando…" : "Criar lote"}
          </Button>
        </CardContent>
      </Card>

      {/* My lots */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Meus lotes ({myLots.length})</h2>
        {myLots.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhum lote criado ainda.</p>
        )}
        <div className="space-y-3">
          {myLots.map((lot) => (
            <div
              key={lot.id}
              className="flex items-center justify-between border rounded px-4 py-3 gap-4"
            >
              <div className="flex-1 min-w-0">
                <Link
                  to={`/lots/${lot.id}`}
                  className="font-medium hover:underline line-clamp-1"
                >
                  {lot.title}
                </Link>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {lot.bidCount} lance(s) · Lance: {formatCents(lot.currentBidCents ?? lot.startingBidCents)}
                </p>
              </div>
              <Badge variant={badgeVariant(lot.status)}>{lot.status}</Badge>
              {(lot.status === "SCHEDULED" || lot.status === "LIVE") && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    if (confirm(`Cancelar lote "${lot.title}"?`)) {
                      cancelMutation.mutate(lot.id);
                    }
                  }}
                  disabled={cancelMutation.isPending}
                >
                  Cancelar
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
