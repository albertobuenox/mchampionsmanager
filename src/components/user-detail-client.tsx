"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Detail = {
  id: string;
  email: string;
  name: string;
  role: string;
  heroKits: { id: string; name: string }[];
  importedDecks: { id: string; name: string; marvelcdbId: number }[];
};

export function UserDetailClient({ user }: { user: Detail }) {
  const router = useRouter();
  const [status, setStatus] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const password = String(form.get("password") || "");
    const body: Record<string, string> = {
      name: String(form.get("name")),
      email: String(form.get("email")),
      role: String(form.get("role")),
    };
    if (password) body.password = password;
    const res = await fetch(`/api/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setStatus(res.ok ? "Guardado" : "Error al guardar");
    if (res.ok) router.refresh();
  }

  return (
    <div className="p-8">
      <Link href="/users" className="text-sm text-[#8a8174] hover:text-[#c41218]">
        ← Usuarios
      </Link>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">{user.name}</h1>

      <form onSubmit={onSubmit} className="mt-6 max-w-lg space-y-3 rounded-xl border border-[#ddd4c4] bg-white p-5">
        <label className="block text-sm">
          Nombre
          <input name="name" defaultValue={user.name} className="mt-1 w-full rounded-lg border border-[#cfc6b6] px-3 py-2" />
        </label>
        <label className="block text-sm">
          Email
          <input name="email" type="email" defaultValue={user.email} className="mt-1 w-full rounded-lg border border-[#cfc6b6] px-3 py-2" />
        </label>
        <label className="block text-sm">
          Rol
          <select name="role" defaultValue={user.role} className="mt-1 w-full rounded-lg border border-[#cfc6b6] px-3 py-2">
            <option value="user">user</option>
            <option value="admin">admin</option>
          </select>
        </label>
        <label className="block text-sm">
          Nueva contraseña (opcional)
          <input name="password" type="password" minLength={6} className="mt-1 w-full rounded-lg border border-[#cfc6b6] px-3 py-2" />
        </label>
        <button type="submit" className="rounded-lg bg-[#1a1612] px-4 py-2 text-sm font-semibold text-white">
          Guardar
        </button>
        {status ? <p className="text-xs text-[#8a8174]">{status}</p> : null}
      </form>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[#8a8174]">Héroes</h2>
          <ul className="mt-2 divide-y divide-[#eee6d8] rounded-xl border border-[#ddd4c4] bg-white">
            {user.heroKits.length === 0 ? (
              <li className="px-4 py-3 text-sm text-[#8a8174]">Sin héroes</li>
            ) : (
              user.heroKits.map((h) => (
                <li key={h.id} className="px-4 py-3">
                  <Link href={`/heroes/${h.id}`} className="font-medium hover:text-[#c41218]">
                    {h.name}
                  </Link>
                </li>
              ))
            )}
          </ul>
        </section>
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[#8a8174]">Mazos importados</h2>
          <ul className="mt-2 divide-y divide-[#eee6d8] rounded-xl border border-[#ddd4c4] bg-white">
            {user.importedDecks.length === 0 ? (
              <li className="px-4 py-3 text-sm text-[#8a8174]">Sin mazos</li>
            ) : (
              user.importedDecks.map((d) => (
                <li key={d.id} className="px-4 py-3">
                  <Link href="/imported" className="font-medium hover:text-[#c41218]">
                    {d.name} <span className="text-xs text-[#8a8174]">#{d.marvelcdbId}</span>
                  </Link>
                </li>
              ))
            )}
          </ul>
        </section>
      </div>
    </div>
  );
}
