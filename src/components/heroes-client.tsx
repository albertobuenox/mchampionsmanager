"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Hero = {
  id: string;
  name: string;
  updatedAt: string;
  _count: { cards: number };
  owner?: { name: string; email: string };
};

export function HeroesClient({
  initial,
  isAdmin,
}: {
  initial: Hero[];
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [heroes, setHeroes] = useState(initial);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  async function createHero() {
    setLoading(true);
    const res = await fetch("/api/heroes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name || "Nuevo héroe" }),
    });
    setLoading(false);
    if (!res.ok) return;
    const kit = await res.json();
    router.push(`/heroes/${kit.id}`);
  }

  async function remove(id: string) {
    if (!confirm("¿Borrar este héroe y sus cartas?")) return;
    const res = await fetch(`/api/heroes/${id}`, { method: "DELETE" });
    if (res.ok) setHeroes((prev) => prev.filter((h) => h.id !== id));
  }

  return (
    <div className="p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-[#8a8174]">Crear héroes</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Héroes</h1>
          <p className="mt-1 text-sm text-[#6b6358]">
            Cada héroe nace con 15 cartas agrupadas por tipo.
          </p>
        </div>
        <div className="flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nombre del héroe"
            className="rounded-lg border border-[#cfc6b6] bg-white px-3 py-2 text-sm"
          />
          <button
            type="button"
            disabled={loading}
            onClick={createHero}
            className="rounded-lg bg-[#c41218] px-4 py-2 text-sm font-semibold text-white hover:bg-[#9e0e13] disabled:opacity-60"
          >
            Crear héroe
          </button>
        </div>
      </div>

      <ul className="mt-8 divide-y divide-[#ddd4c4] overflow-hidden rounded-xl border border-[#ddd4c4] bg-white">
        {heroes.length === 0 ? (
          <li className="px-4 py-8 text-sm text-[#8a8174]">Todavía no hay héroes.</li>
        ) : (
          heroes.map((hero) => (
            <li key={hero.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div>
                <Link href={`/heroes/${hero.id}`} className="font-semibold hover:text-[#c41218]">
                  {hero.name}
                </Link>
                <p className="text-xs text-[#8a8174]">
                  {hero._count.cards} cartas
                  {isAdmin && hero.owner ? ` · ${hero.owner.name}` : ""}
                </p>
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/heroes/${hero.id}`}
                  className="rounded-lg border border-[#cfc6b6] px-3 py-1.5 text-xs font-semibold hover:bg-[#f3efe6]"
                >
                  Abrir
                </Link>
                <button
                  type="button"
                  onClick={() => remove(hero.id)}
                  className="rounded-lg border border-[#e3b4b4] px-3 py-1.5 text-xs font-semibold text-[#c41218] hover:bg-[#fbeaea]"
                >
                  Borrar
                </button>
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
