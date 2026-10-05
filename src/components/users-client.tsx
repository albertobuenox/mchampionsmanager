"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type UserRow = {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
  _count: { heroKits: number; importedDecks: number; cards: number };
};

export function UsersClient({ initial }: { initial: UserRow[] }) {
  const router = useRouter();
  const [users, setUsers] = useState(initial);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");

  async function createUser(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        email: form.get("email"),
        password: form.get("password"),
        role: form.get("role"),
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Error");
      return;
    }
    setUsers((prev) => [
      {
        ...data,
        createdAt: data.createdAt || new Date().toISOString(),
        _count: { heroKits: 0, importedDecks: 0, cards: 0 },
      },
      ...prev,
    ]);
    setOpen(false);
    router.refresh();
  }

  async function remove(id: string) {
    if (!confirm("¿Borrar usuario y todo su contenido?")) return;
    const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
    if (res.ok) setUsers((prev) => prev.filter((u) => u.id !== id));
  }

  return (
    <div className="p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-[#8a8174]">Administración</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Usuarios</h1>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-lg bg-[#c41218] px-4 py-2 text-sm font-semibold text-white"
        >
          Crear usuario
        </button>
      </div>

      <div className="mt-8 overflow-hidden rounded-xl border border-[#ddd4c4] bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#f3efe6] text-xs uppercase tracking-wide text-[#8a8174]">
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Rol</th>
              <th className="px-4 py-3">Contenido</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-t border-[#eee6d8]">
                <td className="px-4 py-3 font-medium">{user.name}</td>
                <td className="px-4 py-3">{user.email}</td>
                <td className="px-4 py-3 uppercase text-xs tracking-wide">{user.role}</td>
                <td className="px-4 py-3 text-[#6b6358]">
                  {user._count.heroKits} héroes · {user._count.importedDecks} mazos ·{" "}
                  {user._count.cards} cartas
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/users/${user.id}`}
                    className="mr-2 rounded-lg border border-[#cfc6b6] px-3 py-1.5 text-xs font-semibold"
                  >
                    Editar
                  </Link>
                  <button
                    type="button"
                    onClick={() => remove(user.id)}
                    className="rounded-lg border border-[#e3b4b4] px-3 py-1.5 text-xs font-semibold text-[#c41218]"
                  >
                    Borrar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form
            onSubmit={createUser}
            className="w-full max-w-md rounded-2xl bg-[#f8f4ec] p-6 shadow-xl"
          >
            <h2 className="text-xl font-semibold">Nuevo usuario</h2>
            <label className="mt-4 block text-sm">
              Nombre
              <input name="name" required className="mt-1 w-full rounded-lg border border-[#cfc6b6] bg-white px-3 py-2" />
            </label>
            <label className="mt-3 block text-sm">
              Email
              <input name="email" type="email" required className="mt-1 w-full rounded-lg border border-[#cfc6b6] bg-white px-3 py-2" />
            </label>
            <label className="mt-3 block text-sm">
              Contraseña
              <input name="password" type="password" minLength={6} required className="mt-1 w-full rounded-lg border border-[#cfc6b6] bg-white px-3 py-2" />
            </label>
            <label className="mt-3 block text-sm">
              Rol
              <select name="role" className="mt-1 w-full rounded-lg border border-[#cfc6b6] bg-white px-3 py-2">
                <option value="user">user</option>
                <option value="admin">admin</option>
              </select>
            </label>
            {error ? <p className="mt-2 text-sm text-[#c41218]">{error}</p> : null}
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-[#cfc6b6] px-4 py-2 text-sm">
                Cancelar
              </button>
              <button type="submit" className="rounded-lg bg-[#1a1612] px-4 py-2 text-sm font-semibold text-white">
                Crear
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
