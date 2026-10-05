"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@mchampions.local");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);
    setError("");
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("Email o contraseña incorrectos");
      return;
    }
    router.push("/heroes");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_20%_20%,#fff7ea,transparent_40%),radial-gradient(circle_at_80%_0%,#f5d7d7,transparent_35%),#ebe4d8] p-6">
      <form
        method="post"
        onSubmit={onSubmit}
        className="w-full max-w-md rounded-2xl border border-[#ddd4c4] bg-[#f8f4ec] p-8 shadow-[0_20px_60px_rgba(26,22,18,0.12)]"
      >
        <p className="text-xs uppercase tracking-[0.22em] text-[#8a8174]">MChampions Manager</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Iniciar sesión</h1>
        <p className="mt-2 text-sm text-[#6b6358]">Admin: admin@mchampions.local / admin123</p>
        <label className="mt-6 block text-sm font-medium">
          Email
          <input
            name="email"
            type="email"
            required
            autoComplete="username"
            className="mt-1 w-full rounded-lg border border-[#cfc6b6] bg-white px-3 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="mt-4 block text-sm font-medium">
          Contraseña
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="mt-1 w-full rounded-lg border border-[#cfc6b6] bg-white px-3 py-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {error ? <p className="mt-3 text-sm text-[#c41218]">{error}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-lg bg-[#1a1612] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#c41218] disabled:opacity-60"
        >
          {loading ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </div>
  );
}
