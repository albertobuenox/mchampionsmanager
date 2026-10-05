"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { TYPE_LABELS, TYPE_ORDER } from "@/lib/hero-template";
import { parseResources } from "@/lib/card-defaults";
import {
  countDeckTraits,
  parseTraits,
  tokenizeAbility,
  type AbilityPart,
} from "@/lib/traits";
import { DeckStatsModal } from "@/components/deck-stats-modal";

export type SummaryCard = {
  id: string;
  type: string;
  title: string;
  quantity: number;
  aspect: string;
  resources: string;
  cost?: string;
  traits?: string;
  rules?: string;
  atk?: string;
  thw?: string;
  def?: string;
  rec?: string;
  handSize?: string;
  identityHp?: string;
  photo?: string;
  appPreview?: string;
};

const ASPECT_DOT: Record<string, string> = {
  Agresión: "#b12020",
  Justicia: "#c9b42e",
  Liderazgo: "#2ea7b8",
  Protección: "#46991b",
  Básico: "#87868f",
  Pool: "#d074ac",
  Identidad: "#c41218",
};

function ResourceIcons({ resources }: { resources: string[] }) {
  const icons = resources.filter((r) => r && r !== "none");
  if (!icons.length) return null;
  return (
    <span className="ml-auto flex items-center gap-0.5">
      {icons.map((kind, i) => (
        <span
          key={`${kind}-${i}`}
          title={kind}
          className={`inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-white ${
            kind === "energy"
              ? "bg-amber-500"
              : kind === "physical"
                ? "bg-red-700"
                : kind === "mental"
                  ? "bg-sky-600"
                  : "bg-violet-600"
          }`}
        >
          {kind === "energy" ? "⚡" : kind === "physical" ? "✊" : kind === "mental" ? "🧠" : "★"}
        </span>
      ))}
    </span>
  );
}

function AspectDot({ aspect }: { aspect: string }) {
  const color = ASPECT_DOT[aspect] || "#a8a29a";
  return (
    <span
      className="inline-block h-2.5 w-2.5 shrink-0 rounded-full border border-black/10"
      style={{ background: color }}
      title={aspect || "Sin aspecto"}
    />
  );
}

function AbilityChip({ part }: { part: AbilityPart & { kind: "chip" } }) {
  const tone =
    part.tone === "aspect"
      ? "bg-[#3d6ea8] text-white"
      : part.tone === "trait"
        ? "bg-[#c9a227] text-[#1a1612]"
        : "bg-[#dbe4f2] text-[#1a3a6b]";
  return (
    <span
      className={`mx-0.5 inline-flex translate-y-px items-center rounded px-1 py-px text-[8px] font-semibold leading-none ${tone}`}
    >
      {part.value}
    </span>
  );
}

function AbilityText({ rules, traits }: { rules: string; traits: string[] }) {
  const parts = useMemo(() => tokenizeAbility(rules, traits), [rules, traits]);
  if (!parts.length) {
    return <p className="text-[10px] text-[#9aa3b2]">Sin texto de habilidades.</p>;
  }
  return (
    <p className="text-[10px] leading-snug text-[#c8ced8]">
      {parts.map((part, i) =>
        part.kind === "chip" ? (
          <AbilityChip key={`${part.value}-${i}`} part={part} />
        ) : (
          <span key={i}>{part.value}</span>
        ),
      )}
    </p>
  );
}

type Face = "identity" | "alter-ego";

export function DeckSummary({
  deckName,
  heroName,
  aspect,
  cards,
  selectedTraits,
  onToggleTrait,
  onClearTraits,
  tags,
}: {
  deckName: string;
  heroName: string;
  aspect: string;
  cards: SummaryCard[];
  selectedTraits: string[];
  onToggleTrait: (trait: string) => void;
  onClearTraits: () => void;
  tags?: string;
}) {
  const identity = cards.find((c) => c.type === "identity");
  const alterEgo = cards.find((c) => c.type === "alter-ego");
  const deckCards = cards.filter((c) => c.type !== "identity" && c.type !== "alter-ego");
  const totalQty = deckCards.reduce((sum, c) => sum + (c.quantity || 1), 0);

  const [face, setFace] = useState<Face>(identity ? "identity" : "alter-ego");
  const [traitsOpen, setTraitsOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);

  const activeCard = face === "identity" ? identity || alterEgo : alterEgo || identity;
  const canFlip = Boolean(identity && alterEgo);

  const faceTraits = useMemo(() => parseTraits(activeCard?.traits), [activeCard?.traits]);
  const traitStats = useMemo(() => countDeckTraits(cards), [cards]);

  const filteredDeckCards = useMemo(() => {
    if (!selectedTraits.length) return deckCards;
    return deckCards.filter((card) => {
      const traits = parseTraits(card.traits).map((t) => t.toLowerCase());
      return selectedTraits.some((s) => traits.includes(s.toLowerCase()));
    });
  }, [deckCards, selectedTraits]);

  const groups = useMemo(() => {
    const map = new Map<string, SummaryCard[]>();
    for (const type of TYPE_ORDER) map.set(type, []);
    for (const card of filteredDeckCards) {
      if (!map.has(card.type)) map.set(card.type, []);
      map.get(card.type)!.push(card);
    }
    return [...map.entries()]
      .filter(([, list]) => list.length > 0)
      .map(([type, list]) => ({
        type,
        label: TYPE_LABELS[type] || type,
        cards: list,
        count: list.reduce((s, c) => s + (c.quantity || 1), 0),
      }));
  }, [filteredDeckCards]);

  const left = groups.filter((g) => ["ally", "event", "resource"].includes(g.type));
  const right = groups.filter((g) => !["ally", "event", "resource"].includes(g.type));

  function flip() {
    if (!canFlip) return;
    setFace((prev) => (prev === "identity" ? "alter-ego" : "identity"));
  }

  return (
    <div className="mb-6 overflow-hidden rounded-xl border border-[#ddd4c4] bg-white">
      <div className="deck-header-grid">
        <div className="deck-header-meta">
          <p className="text-xs uppercase tracking-[0.16em] text-[#9aa3b2]">{deckName}</p>
          <h3 className="mt-1 truncate text-2xl font-semibold text-[#6eb6ff]">
            {heroName || activeCard?.title || "Héroe"}
          </h3>
          <div className="mt-2 space-y-0.5 text-sm text-[#c8ced8]">
            {aspect ? <p>{aspect}</p> : null}
            <p>
              {totalQty} cartas en el mazo
              {selectedTraits.length
                ? ` · filtro: ${filteredDeckCards.reduce((s, c) => s + (c.quantity || 1), 0)}`
                : ""}
            </p>
            {alterEgo || identity ? (
              <p>
                {alterEgo ? `Alter-ego: ${alterEgo.title || "—"}` : null}
                {alterEgo && identity ? " · " : null}
                {identity ? `Identidad: ${identity.title || "—"}` : null}
              </p>
            ) : (
              <p className="text-amber-200">Sin Alter-ego / Identidad en la importación</p>
            )}
            {tags ? <p className="text-[#9aa3b2]">{tags}</p> : null}
            <p className="text-[11px] text-[#9aa3b2]">
              Cara activa: {face === "identity" ? "Identidad" : "Alter-ego"}
            </p>
          </div>

          <div className="mt-3 flex flex-col items-start gap-1">
            {traitStats.length ? (
              <>
                <button
                  type="button"
                  onClick={() => setTraitsOpen((v) => !v)}
                  className="border-0 bg-transparent p-0 text-[11px] font-medium text-[#9aa3b2] underline-offset-2 hover:text-white hover:underline"
                >
                  {traitsOpen ? "Ocultar rasgos" : "Ver Rasgos"}
                  {selectedTraits.length ? ` (${selectedTraits.length})` : ""}
                </button>
                {traitsOpen ? (
                  <div className="mt-1">
                    <div className="flex flex-wrap gap-1">
                      {traitStats.map(({ trait, count }) => {
                        const active = selectedTraits.some(
                          (s) => s.toLowerCase() === trait.toLowerCase(),
                        );
                        return (
                          <button
                            key={trait}
                            type="button"
                            onClick={() => onToggleTrait(trait)}
                            className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold leading-none transition ${
                              active
                                ? "bg-[#f0c419] text-[#1a1612]"
                                : "bg-white/10 text-[#d7dde8] hover:bg-white/20"
                            }`}
                          >
                            {trait} · {count}
                          </button>
                        );
                      })}
                    </div>
                    {selectedTraits.length ? (
                      <button
                        type="button"
                        onClick={onClearTraits}
                        className="mt-1.5 border-0 bg-transparent p-0 text-[9px] text-[#9aa3b2] underline hover:text-white"
                      >
                        Quitar filtros
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </>
            ) : null}
            <button
              type="button"
              onClick={() => setStatsOpen(true)}
              className="border-0 bg-transparent p-0 text-[11px] font-medium text-[#9aa3b2] underline-offset-2 hover:text-white hover:underline"
            >
              Ver estadísticas
            </button>
          </div>

          <div className="mt-auto flex flex-wrap gap-2 pt-4">
            {alterEgo ? (
              <Link
                href={`/cards/${alterEgo.id}`}
                className="rounded bg-white/10 px-2 py-1 text-xs hover:bg-white/20"
              >
                Editar Alter-ego
              </Link>
            ) : null}
            {identity ? (
              <Link
                href={`/cards/${identity.id}`}
                className="rounded bg-white/10 px-2 py-1 text-xs hover:bg-white/20"
              >
                Editar Identidad
              </Link>
            ) : null}
          </div>
        </div>

        <div className="deck-header-ability">
          <div className="flex-1" />
          <div key={`text-${face}`} className="deck-face-anim deck-header-ability-body">
            <p className="mb-1 text-[9px] uppercase tracking-[0.12em] text-[#9aa3b2]">
              {face === "identity" ? "Identidad" : "Alter-ego"}
            </p>
            {faceTraits.length ? (
              <div className="mb-1.5 flex flex-wrap gap-1">
                {faceTraits.map((trait) => (
                  <span
                    key={trait}
                    className="rounded bg-[#c9a227] px-1 py-px text-[8px] font-semibold leading-none text-[#1a1612]"
                  >
                    {trait}
                  </span>
                ))}
              </div>
            ) : null}
            <AbilityText rules={activeCard?.rules || ""} traits={faceTraits} />
          </div>
        </div>

        <div className="deck-header-card">
          {activeCard?.appPreview || activeCard?.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={`card-${face}-${activeCard.id}`}
              src={activeCard.appPreview || activeCard.photo}
              alt={activeCard.title || face}
              className="deck-card-anim"
            />
          ) : (
            <div
              key={`empty-${face}`}
              className="deck-card-anim flex h-full min-h-[260px] w-full items-center justify-center text-xs text-[#8a8174]"
            >
              Sin arte
            </div>
          )}
          {canFlip ? (
            <button
              type="button"
              onClick={flip}
              className="absolute bottom-3 right-3 z-20 rounded-full bg-black/70 px-3 py-1.5 text-[10px] font-semibold text-white shadow-lg backdrop-blur transition-colors duration-200 hover:bg-[#c41218]"
              title="Alternar Identidad / Alter-ego"
            >
              Flip → {face === "identity" ? "Alter-ego" : "Identidad"}
            </button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-6 p-5 md:grid-cols-2">
        {groups.length === 0 ? (
          <p className="text-sm text-[#8a8174] md:col-span-2">
            Ninguna carta coincide con los rasgos seleccionados.
          </p>
        ) : (
          [left, right].map((column, colIdx) => (
            <div key={colIdx} className="space-y-4">
              {column.map((group) => (
                <section key={group.type}>
                  <h4 className="mb-1 text-sm font-bold text-[#1a1612]">
                    {group.label} ({group.count})
                  </h4>
                  <ul className="space-y-0.5">
                    {group.cards.map((card) => {
                      const resources = parseResources(card.resources || "[]");
                      return (
                        <li key={card.id} className="flex items-center gap-2 text-sm">
                          <span className="w-7 shrink-0 tabular-nums text-[#6b6358]">
                            {card.quantity || 1}x
                          </span>
                          <AspectDot aspect={card.aspect} />
                          <Link
                            href={`/cards/${card.id}`}
                            className="truncate text-[#1a5fb4] hover:underline"
                          >
                            {card.title || "Sin título"}
                          </Link>
                          <ResourceIcons resources={resources} />
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))}
            </div>
          ))
        )}
      </div>

      <DeckStatsModal
        open={statsOpen}
        onClose={() => setStatsOpen(false)}
        cards={cards}
        deckName={deckName}
      />
    </div>
  );
}
