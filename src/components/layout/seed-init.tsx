"use client";

import { useSeed } from "@/hooks/use-store";

export function SeedInit({ children }: { children: React.ReactNode }) {
  const seeded = useSeed();
  if (!seeded) return null;
  return <>{children}</>;
}
