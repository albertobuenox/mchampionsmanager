"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CardTable, TableCard } from "@/components/card-table";

type Kit = {
  id: string;
  name: string;
  headshotUrl: string;
  cards: TableCard[];
};

export function HeroDetailClient({ kit }: { kit: Kit }) {
  const router = useRouter();
  const [name, setName] = useState(kit.name);
  const [headshotUrl, setHeadshotUrl] = useState(kit.headshotUrl);
  const [cards, setCards] = useState(kit.cards);
  const [status, setStatus] = useState("");

  async function saveMeta(patch: { name?: string; headshotUrl?: string }) {
    const res = await fetch(`/api/heroes/${kit.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (res.ok) {
      setStatus("Guardado");
      router.refresh();
    } else {
      setStatus("Error al guardar");
    }
  }

  async function uploadHeadshot(file: File) {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: form });
    if (!res.ok) {
      setStatus("Error al subir imagen");
      return;
    }
    const data = await res.json();
    setHeadshotUrl(data.url);
    await saveMeta({ headshotUrl: data.url });
    setCards((prev) => prev.map((c) => ({ ...c })));
  }

  async function onPatch(id: string, patch: Partial<TableCard>) {
    const res = await fetch(`/api/cards/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) throw new Error("patch failed");
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }

  return (
    <div className="p-8">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-[0.18em] text-[#8a8174]">Kit de héroe</p>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => {
              if (name !== kit.name) saveMeta({ name });
            }}
            className="mt-1 w-full max-w-xl border-0 bg-transparent text-3xl font-semibold tracking-tight outline-none"
          />
          <p className="mt-1 text-sm text-[#6b6358]">
            {cards.length} cartas · retrato de esquina compartido
          </p>
          {status ? <p className="mt-2 text-xs text-[#8a8174]">{status}</p> : null}
        </div>
        <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-[#cfc6b6] bg-white px-4 py-3 text-sm">
          {headshotUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={headshotUrl} alt="" className="h-20 w-20 rounded-full object-cover" />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#eee6d8] text-xs text-[#8a8174]">
              Cabeza
            </div>
          )}
          <span className="font-medium">Retrato del héroe</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) uploadHeadshot(file);
            }}
          />
        </label>
      </div>

      <div className="mt-8">
        <CardTable cards={cards} totalLabel="15" onPatch={onPatch} />
      </div>
    </div>
  );
}
