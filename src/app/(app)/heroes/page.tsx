import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { HeroesClient } from "@/components/heroes-client";

export default async function HeroesPage() {
  const session = await auth();
  const isAdmin = session?.user?.role === "admin";
  const heroes = await prisma.heroKit.findMany({
    where: isAdmin ? undefined : { ownerId: session!.user.id },
    include: {
      owner: { select: { name: true, email: true } },
      _count: { select: { cards: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <HeroesClient
      isAdmin={!!isAdmin}
      initial={heroes.map((h) => ({
        ...h,
        updatedAt: h.updatedAt.toISOString(),
      }))}
    />
  );
}
