import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserDetailClient } from "@/components/user-detail-client";

type Props = { params: Promise<{ id: string }> };

export default async function UserDetailPage({ params }: Props) {
  const session = await auth();
  if (session?.user?.role !== "admin") redirect("/heroes");
  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      heroKits: { orderBy: { updatedAt: "desc" }, select: { id: true, name: true } },
      importedDecks: {
        orderBy: { updatedAt: "desc" },
        select: { id: true, name: true, marvelcdbId: true },
      },
    },
  });
  if (!user) notFound();
  return <UserDetailClient user={user} />;
}
