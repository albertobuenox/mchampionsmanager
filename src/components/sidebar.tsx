"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const links = [
  { href: "/heroes", label: "Héroes" },
  { href: "/imported", label: "Mazos importados" },
  { href: "/users", label: "Usuarios", adminOnly: true },
];

export function Sidebar({
  user,
}: {
  user: { name?: string | null; email?: string | null; role?: string };
}) {
  const pathname = usePathname();
  const isAdmin = user.role === "admin";

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-[#ddd4c4] bg-[#1a1612] text-[#f3efe6]">
      <div className="border-b border-white/10 px-5 py-5">
        <p className="text-xs uppercase tracking-[0.2em] text-[#c4a574]">MChampions</p>
        <h1 className="mt-1 font-semibold text-lg leading-tight">Manager</h1>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {links
          .filter((l) => !l.adminOnly || isAdmin)
          .map((link) => {
            const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-3 py-2 text-sm transition ${
                  active ? "bg-[#c41218] text-white" : "text-[#ddd4c4] hover:bg-white/10"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
      </nav>
      <div className="border-t border-white/10 p-4 text-sm">
        <p className="font-medium">{user.name}</p>
        <p className="truncate text-xs text-[#a89b88]">{user.email}</p>
        <p className="mt-1 text-xs uppercase tracking-wide text-[#c4a574]">{user.role}</p>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="mt-3 w-full rounded-lg border border-white/20 px-3 py-1.5 text-xs hover:bg-white/10"
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
