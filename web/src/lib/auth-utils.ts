import { prisma } from "@/lib/prisma";

export async function checkProfileComplete(userId: string): Promise<boolean> {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { username: true, displayName: true },
  });

  return !!(profile?.username && profile?.displayName);
}
