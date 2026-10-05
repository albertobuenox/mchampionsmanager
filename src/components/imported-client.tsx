"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CardTable, TableCard } from "@/components/card-table";
import { DeckSummary, SummaryCard } from "@/components/deck-summary";
import { ASPECT_COLORS } from "@/lib/deck-stats";
import { cardHasAnyTrait } from "@/lib/traits";

type Deck = {
  id: string;
  name: string;
  marvelcdbId: number;
  heroName: string;
  aspect: string;
  _count: { cards: number };
  owner?: { name: string };
  cards?: TableCard[];
};

function parseAspectList(aspect: string): string[] {
  if (!aspect?.trim()) return [];
  return [
    ...new Set(
      aspect
        .split(/\s*(?:\/|,|\||·)\s*/)
        .map((a) => a.trim())
        .filter(Boolean),
    ),
  ];
}

function AspectSquares({ aspect }: { aspect: string }) {
  const aspects = parseAspectList(aspect);
  if (!aspects.length) return null;
  return (
    <span className="inline-flex shrink-0 items-center gap-1" aria-hidden="true">
      {aspects.map((name) => (
        <span
          key={name}
          title={name}
          className="inline-block h-3 w-3 rounded border border-black/10"
          style={{ background: ASPECT_COLORS[name] || "#a8a29a" }}
        />
      ))}
    </span>
  );
}

type FullCard = TableCard & {
  aspect: string;
  resources: string;
  photo?: string;
  appPreview?: string;
  atk?: string;
  thw?: string;
  def?: string;
  rec?: string;
  handSize?: string;
  identityHp?: string;
};

type ImportProgress = {
  current: number;
  total: number;
  label: string;
  deckName?: string;
};

type ToastState = {
  message: string;
  tone: "success" | "error";
} | null;

function mapCard(c: FullCard): FullCard {
  return {
    id: c.id,
    slotIndex: c.slotIndex,
    quantity: c.quantity,
    type: c.type,
    title: c.title,
    cost: c.cost,
    traits: c.traits,
    rules: c.rules,
    aspect: c.aspect || "",
    resources: c.resources || "[\"none\",\"none\",\"none\"]",
    photo: c.photo || "",
    appPreview: c.appPreview || "",
    atk: c.atk || "",
    thw: c.thw || "",
    def: c.def || "",
    rec: c.rec || "",
    handSize: c.handSize || "",
    identityHp: c.identityHp || "",
  };
}

type ImportedDeckPayload = Deck & { cards: FullCard[] };

async function readImportStream(
  res: Response,
  onProgress: (p: ImportProgress) => void,
): Promise<{ ok: true; deck: ImportedDeckPayload } | { ok: false; error: string }> {
  const contentType = res.headers.get("content-type") || "";

  if (!contentType.includes("ndjson")) {
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: data.error || "Error al importar el mazo." };
    }
    return { ok: true, deck: data as ImportedDeckPayload };
  }

  if (!res.body) {
    return { ok: false, error: "Respuesta vacía del servidor." };
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let deck: ImportedDeckPayload | null = null;
  let streamError: string | null = null;
  let progress: ImportProgress = { current: 0, total: 1, label: "Importando…" };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      let event: {
        type: string;
        name?: string;
        total?: number;
        current?: number;
        label?: string;
        deck?: ImportedDeckPayload;
        error?: string;
      };
      try {
        event = JSON.parse(trimmed);
      } catch {
        continue;
      }

      if (event.type === "start") {
        progress = {
          current: 0,
          total: Math.max(1, event.total || 1),
          label: "Preparando…",
          deckName: event.name,
        };
        onProgress(progress);
      } else if (event.type === "progress") {
        progress = {
          ...progress,
          current: event.current ?? progress.current,
          total: Math.max(1, event.total || progress.total),
          label: event.label || progress.label,
        };
        onProgress(progress);
      } else if (event.type === "done" && event.deck) {
        deck = event.deck;
      } else if (event.type === "error") {
        streamError = event.error || "Error al importar el mazo.";
      }
    }
  }

  if (streamError) return { ok: false, error: streamError };
  if (!deck) return { ok: false, error: "La importación terminó sin datos." };
  return { ok: true, deck };
}

export function ImportedClient({
  initial,
  isAdmin,
}: {
  initial: Deck[];
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [decks, setDecks] = useState(initial);
  const [openId, setOpenId] = useState<string | null>(null);
  const [cardsByDeck, setCardsByDeck] = useState<Record<string, FullCard[]>>({});
  const [selectedTraits, setSelectedTraits] = useState<string[]>([]);
  const [marvelId, setMarvelId] = useState("");
  const [errorModal, setErrorModal] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<ImportProgress | null>(null);
  const [toast, setToast] = useState<ToastState>(null);

  useEffect(() => {
    if (!loading) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [loading]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 4200);
    return () => window.clearTimeout(t);
  }, [toast]);

  async function importDeck() {
    const raw = marvelId.trim();
    const id = Number(raw);
    if (!raw || !Number.isFinite(id) || id <= 0) {
      setErrorModal("El ID del mazo no es válido.");
      return;
    }

    setLoading(true);
    setProgress({ current: 0, total: 1, label: "Conectando con MarvelCDB…" });
    try {
      const res = await fetch("/api/imported", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/x-ndjson",
        },
        body: JSON.stringify({ marvelcdbId: id }),
      });

      const result = await readImportStream(res, setProgress);
      if (!result.ok) {
        setErrorModal(result.error);
        return;
      }

      const data = result.deck;
      setMarvelId("");
      router.refresh();
      setDecks((prev) => [
        {
          id: data.id,
          name: data.name,
          marvelcdbId: data.marvelcdbId,
          heroName: data.heroName,
          aspect: data.aspect,
          _count: { cards: data.cards?.length || 0 },
        },
        ...prev,
      ]);
      setCardsByDeck((prev) => ({
        ...prev,
        [data.id]: (data.cards || []).map(mapCard),
      }));
      setSelectedTraits([]);
      setOpenId(data.id);
      setToast({
        tone: "success",
        message: `Importación completada: ${data.name || "mazo"}`,
      });
    } catch {
      setErrorModal("No se pudo conectar con el servidor al importar el mazo.");
    } finally {
      setLoading(false);
      setProgress(null);
    }
  }

  async function toggleDeck(id: string) {
    if (loading) return;
    if (openId === id) {
      setOpenId(null);
      setSelectedTraits([]);
      return;
    }
    setOpenId(id);
    setSelectedTraits([]);
    const res = await fetch(`/api/imported/${id}`);
    if (!res.ok) return;
    const data = await res.json();
    const cards = (data.cards || []).map(mapCard);
    setCardsByDeck((prev) => ({ ...prev, [id]: cards }));
    setDecks((prev) =>
      prev.map((d) =>
        d.id === id
          ? {
              ...d,
              heroName: data.heroName || d.heroName,
              aspect: data.aspect || d.aspect,
              _count: { cards: cards.length },
            }
          : d,
      ),
    );
  }

  function toggleTrait(trait: string) {
    setSelectedTraits((prev) => {
      const exists = prev.some((t) => t.toLowerCase() === trait.toLowerCase());
      if (exists) return prev.filter((t) => t.toLowerCase() !== trait.toLowerCase());
      return [...prev, trait];
    });
  }

  async function remove(id: string) {
    if (loading) return;
    if (!confirm("¿Borrar este mazo importado?")) return;
    const res = await fetch(`/api/imported/${id}`, { method: "DELETE" });
    if (res.ok) {
      setDecks((prev) => prev.filter((d) => d.id !== id));
      if (openId === id) setOpenId(null);
    }
  }

  const openCards = useMemo(() => (openId ? cardsByDeck[openId] || [] : []), [openId, cardsByDeck]);
  const openDeck = decks.find((d) => d.id === openId);
  const tableCards = useMemo(() => {
    if (!selectedTraits.length) return openCards;
    return openCards.filter((card) => cardHasAnyTrait(card.traits, selectedTraits));
  }, [openCards, selectedTraits]);

  const pct =
    progress && progress.total > 0
      ? Math.min(100, Math.round((progress.current / progress.total) * 100))
      : 0;

  return (
    <div className={`p-8 ${loading ? "pointer-events-none select-none" : ""}`}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-[0.18em] text-[#8a8174]">MarvelCDB</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Mazos importados</h1>
          <p className="mt-1 text-sm text-[#6b6358]">
            Importa un mazo público por ID y personaliza sus cartas.
          </p>
          <div className="mt-4 flex max-w-xl flex-wrap items-center gap-2">
            <input
              value={marvelId}
              onChange={(e) => setMarvelId(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") importDeck();
              }}
              placeholder="ID del mazo (ej. 36680)"
              inputMode="numeric"
              disabled={loading}
              className="min-w-[200px] flex-1 rounded-lg border border-[#cfc6b6] bg-white px-3 py-2 text-sm disabled:opacity-60"
            />
            <button
              type="button"
              disabled={loading || !marvelId.trim()}
              onClick={importDeck}
              className="rounded-lg bg-[#c41218] px-4 py-2 text-sm font-semibold text-white hover:bg-[#9e0e13] disabled:opacity-60"
            >
              {loading ? "Importando…" : "Importar mazo"}
            </button>
          </div>
        </div>
      </div>

      <ul className="mt-8 space-y-3">
        {decks.length === 0 ? (
          <li className="rounded-xl border border-[#ddd4c4] bg-white px-4 py-8 text-sm text-[#8a8174]">
            No hay mazos importados todavía.
          </li>
        ) : (
          decks.map((deck) => {
            const aspects = parseAspectList(deck.aspect);
            const aspectLabel = aspects.length ? aspects.join(" / ") : "";
            const open = openId === deck.id;
            return (
              <li key={deck.id} className="overflow-hidden rounded-xl border border-[#ddd4c4] bg-white">
                <div
                  role="button"
                  tabIndex={0}
                  aria-expanded={open}
                  onClick={() => toggleDeck(deck.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      toggleDeck(deck.id);
                    }
                  }}
                  className="flex cursor-pointer items-center gap-3 px-4 py-3 text-left hover:bg-[#f8f4ec] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#c41218]"
                >
                  <AspectSquares aspect={deck.aspect} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-[#1a1612]">{deck.name}</p>
                    <p className="mt-0.5 truncate text-xs text-[#8a8174]">
                      #{deck.marvelcdbId}
                      {deck.heroName ? ` · ${deck.heroName}` : ""}
                      {aspectLabel ? ` · ${aspectLabel}` : ""}
                      {` · ${deck._count.cards} cartas`}
                      {isAdmin && deck.owner ? ` · ${deck.owner.name}` : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      remove(deck.id);
                    }}
                    className="shrink-0 rounded-lg border border-[#e3b4b4] bg-transparent px-3 py-1.5 text-xs font-semibold text-[#c41218] hover:bg-[#fdf2f2]"
                  >
                    Borrar
                  </button>
                </div>
                {open ? (
                  <div className="border-t border-[#eee6d8] px-4 py-4">
                    {openCards.length ? (
                      <>
                        <DeckSummary
                          deckName={openDeck?.name || deck.name}
                          heroName={openDeck?.heroName || deck.heroName}
                          aspect={openDeck?.aspect || deck.aspect}
                          cards={openCards as SummaryCard[]}
                          selectedTraits={selectedTraits}
                          onToggleTrait={toggleTrait}
                          onClearTraits={() => setSelectedTraits([])}
                        />
                        <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#8a8174]">
                          Edición detallada
                          {selectedTraits.length
                            ? ` · ${tableCards.length}/${openCards.length} cartas`
                            : ""}
                        </h3>
                        <CardTable
                          cards={tableCards}
                          totalLabel={String(openCards.length)}
                          readOnly
                        />
                      </>
                    ) : (
                      <p className="text-sm text-[#8a8174]">Cargando cartas…</p>
                    )}
                  </div>
                ) : null}
              </li>
            );
          })
        )}
      </ul>

      {loading && progress ? (
        <div
          className="pointer-events-auto fixed inset-0 z-[60] flex items-center justify-center bg-black/45 p-4"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="import-progress-title"
          aria-busy="true"
        >
          <div className="w-full max-w-md rounded-2xl bg-[#f8f4ec] p-6 shadow-xl">
            <p className="text-xs uppercase tracking-[0.14em] text-[#8a8174]">Importando mazo</p>
            <h2 id="import-progress-title" className="mt-1 text-lg font-semibold text-[#1a1612]">
              {progress.deckName || "MarvelCDB"}
            </h2>
            <p className="mt-2 text-sm text-[#6b6358]">{progress.label}</p>
            <div
              className="mt-4 h-2.5 overflow-hidden rounded-full bg-[#e7dfd2]"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={pct}
            >
              <div
                className="h-full rounded-full bg-[#c41218] transition-[width] duration-300 ease-out"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="mt-2 text-right text-xs tabular-nums text-[#8a8174]">
              {pct}%
              {progress.total > 1 ? ` · ${progress.current}/${progress.total}` : ""}
            </p>
            <p className="mt-3 text-[11px] text-[#8a8174]">
              No cierres esta ventana. Se descarga cada carta desde MarvelCDB.
            </p>
          </div>
        </div>
      ) : null}

      {toast ? (
        <div
          className={`pointer-events-auto fixed bottom-5 right-5 z-[70] max-w-sm rounded-xl px-4 py-3 text-sm font-medium shadow-lg ${
            toast.tone === "success"
              ? "bg-[#1f5c22] text-white"
              : "bg-[#8f1f1f] text-white"
          }`}
          role="status"
        >
          {toast.message}
        </div>
      ) : null}

      {errorModal ? (
        <div className="pointer-events-auto fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#f8f4ec] p-6 shadow-xl">
            <h2 className="text-xl font-semibold text-[#c41218]">No se pudo importar</h2>
            <p className="mt-2 text-sm text-[#1a1612]">{errorModal}</p>
            <div className="mt-4 rounded-lg border border-[#ddd4c4] bg-white px-3 py-3 text-sm text-[#6b6358]">
              <p className="font-semibold text-[#1a1612]">Cómo importarlo correctamente</p>
              <ol className="mt-2 list-decimal space-y-1 pl-4">
                <li>
                  Abre el mazo en{" "}
                  <a
                    href="https://marvelcdb.com"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#1a5fb4] underline"
                  >
                    marvelcdb.com
                  </a>
                  .
                </li>
                <li>El mazo debe ser <strong>público</strong> (los privados no se pueden importar).</li>
                <li>
                  Copia solo el número del final de la URL, por ejemplo{" "}
                  <code className="rounded bg-[#f3efe6] px-1">36680</code> en{" "}
                  <code className="rounded bg-[#f3efe6] px-1">marvelcdb.com/decklist/view/36680</code>.
                </li>
                <li>Pégalo en el campo de la izquierda y pulsa <strong>Importar mazo</strong>.</li>
              </ol>
            </div>
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setErrorModal(null)}
                className="rounded-lg bg-[#1a1612] px-4 py-2 text-sm font-semibold text-white"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
