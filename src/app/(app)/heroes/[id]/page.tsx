import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessOwner } from "@/lib/permissions";
import { HeroDetailClient } from "@/components/hero-detail-client";

type Props = { params: Promise<{ id: string }> };

export default async function HeroDetailPage({ params }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const { id } = await params;
  const kit = await prisma.heroKit.findUnique({
    where: { id },
    include: { cards: { orderBy: { slotIndex: "asc" } } },
  });
  if (!kit || !canAccessOwner(session, kit.ownerId)) notFound();

  return (
    <HeroDetailClient
      kit={{
        id: kit.id,
        name: kit.name,
        headshotUrl: kit.headshotUrl,
        cards: kit.cards.map((c) => ({
          id: c.id,
          slotIndex: c.slotIndex,
          quantity: c.quantity,
          type: c.type,
          title: c.title,
          cost: c.cost,
          traits: c.traits,
          rules: c.rules,
          photo: c.photo,
          appPreview: c.appPreview,
        })),
      }}
    />
  );
}
