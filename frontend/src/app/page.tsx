"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getRole } from "@/lib/auth";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const role = getRole();
    if (!role) router.replace("/login");
    else router.replace(role === "ADMIN" ? "/admin" : "/scan");
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center">
      <p className="text-neutral-500">Loading…</p>
    </main>
  );
}
