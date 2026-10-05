"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { TYPE_LABELS, TYPE_ORDER } from "@/lib/hero-template";
import { CardPreviewModal } from "@/components/card-preview-modal";

export type TableCard = {
  id: string;
  slotIndex: number;
  quantity: number;
  type: string;
  title: string;
  cost: string;
  traits: string;
  rules: string;
  photo?: string;
  appPreview?: string;
};

function PencilIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 20h4.5L19 9.5 14.5 5 4 15.5V20z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M12.5 7.5l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function CardTable({
  cards,
  totalLabel,
  onPatch,
  readOnly = false,
}: {
  cards: TableCard[];
  totalLabel?: string;
  onPatch?: (id: string, patch: Partial<TableCard>) => Promise<void>;
  readOnly?: boolean;
}) {
  const total = totalLabel || String(cards.length);
  const groups = useMemo(() => {
    const map = new Map<string, TableCard[]>();
    for (const type of TYPE_ORDER) map.set(type, []);
    for (const card of cards) {
      if (!map.has(card.type)) map.set(card.type, []);
      map.get(card.type)!.push(card);
    }
    return [...map.entries()].filter(([, list]) => list.length > 0);
  }, [cards]);

  const [saving, setSaving] = useState<string | null>(null);
  const [preview, setPreview] = useState<TableCard | null>(null);

  async function update(id: string, patch: Partial<TableCard>) {
    if (!onPatch) return;
    setSaving(id);
    try {
      await onPatch(id, patch);
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="space-y-6">
      {groups.map(([type, list]) => (
        <section key={type}>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#8a8174]">
            {TYPE_LABELS[type] || type}
          </h3>
          <div className="overflow-x-auto rounded-xl border border-[#ddd4c4] bg-white">
            <table className="w-full min-w-[640px] table-fixed text-left text-sm">
              <colgroup>
                <col className="w-[72px]" />
                <col className="w-[22%]" />
                <col className="w-[64px]" />
                <col className="w-[18%]" />
                <col />
                <col className="w-[48px]" />
              </colgroup>
              <thead className="bg-[#f3efe6] text-xs uppercase tracking-wide text-[#8a8174]">
                <tr>
                  <th className="px-3 py-2">Nº</th>
                  <th className="px-3 py-2">Nombre</th>
                  <th className="px-3 py-2">Coste</th>
                  <th className="px-3 py-2">Rasgos</th>
                  <th className="px-3 py-2">Descripción</th>
                  <th className="px-2 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {list.map((card) => (
                  <tr key={card.id} className="border-t border-[#eee6d8]">
                    <td className="whitespace-nowrap px-3 py-2 align-middle font-medium text-[#8a8174]">
                      {card.slotIndex}/{total}
                    </td>
                    <td className="px-3 py-2 align-middle">
                      {readOnly ? (
                        <button
                          type="button"
                          onClick={() => setPreview(card)}
                          className="block max-w-full truncate border-0 bg-transparent p-0 text-left font-medium text-[#1a5fb4] hover:underline"
                          title={card.title || "Sin título"}
                        >
                          {card.title || "Sin título"}
                        </button>
                      ) : (
                        <input
                          className="w-full rounded border border-transparent bg-transparent px-1 py-1 hover:border-[#cfc6b6] focus:border-[#1a1612] focus:outline-none"
                          defaultValue={card.title}
                          placeholder="Sin título"
                          onBlur={(e) => {
                            if (e.target.value !== card.title) update(card.id, { title: e.target.value });
                          }}
                        />
                      )}
                    </td>
                    <td className="px-3 py-2 align-middle whitespace-nowrap">
                      {readOnly ? (
                        <span>{card.cost || "—"}</span>
                      ) : (
                        <input
                          className="w-14 rounded border border-transparent bg-transparent px-1 py-1 hover:border-[#cfc6b6] focus:border-[#1a1612] focus:outline-none"
                          defaultValue={card.cost}
                          onBlur={(e) => {
                            if (e.target.value !== card.cost) update(card.id, { cost: e.target.value });
                          }}
                        />
                      )}
                    </td>
                    <td className="px-3 py-2 align-middle">
                      {readOnly ? (
                        <span className="block truncate text-[#6b6358]" title={card.traits || undefined}>
                          {card.traits || "—"}
                        </span>
                      ) : (
                        <input
                          className="w-full rounded border border-transparent bg-transparent px-1 py-1 hover:border-[#cfc6b6] focus:border-[#1a1612] focus:outline-none"
                          defaultValue={card.traits}
                          onBlur={(e) => {
                            if (e.target.value !== card.traits) update(card.id, { traits: e.target.value });
                          }}
                        />
                      )}
                    </td>
                    <td className="px-3 py-2 align-middle">
                      {readOnly ? (
                        <span className="block truncate text-[#6b6358]" title={card.rules || undefined}>
                          {card.rules || "—"}
                        </span>
                      ) : (
                        <input
                          className="w-full rounded border border-transparent bg-transparent px-1 py-1 hover:border-[#cfc6b6] focus:border-[#1a1612] focus:outline-none"
                          defaultValue={card.rules}
                          onBlur={(e) => {
                            if (e.target.value !== card.rules) update(card.id, { rules: e.target.value });
                          }}
                        />
                      )}
                    </td>
                    <td className="px-2 py-2 align-middle text-right">
                      <Link
                        href={`/cards/${card.id}`}
                        title="Editar carta"
                        aria-label={`Editar ${card.title || "carta"}`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#cfc6b6] bg-white text-[#1a1612] hover:border-[#1a1612] hover:bg-[#f3efe6]"
                      >
                        {saving === card.id ? "…" : <PencilIcon />}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}

      {preview ? (
        <CardPreviewModal
          cardId={preview.id}
          title={preview.title}
          printPhoto={preview.photo}
          appPreview={preview.appPreview}
          onClose={() => setPreview(null)}
        />
      ) : null}
    </div>
  );
}
