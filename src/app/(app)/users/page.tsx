import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { UsersClient } from "@/components/users-client";

export default async function UsersPage() {
  const session = await auth();
  if (session?.user?.role !== "admin") redirect("/heroes");
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      _count: { select: { heroKits: true, importedDecks: true, cards: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <UsersClient
      initial={users.map((u) => ({ ...u, createdAt: u.createdAt.toISOString() }))}
    />
  );
}
