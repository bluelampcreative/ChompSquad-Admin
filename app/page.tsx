"use client";

import { useAdmin } from "@/lib/hooks/useAdmin";

export default function Home() {
  // useAdmin redirects to /login if unauthenticated
  const { ready } = useAdmin();

  if (!ready) return null;

  // Feed manager will live here (B.3)
  return (
    <main className="p-8">
      <h1 className="text-xl font-semibold">Feed Manager</h1>
      <p className="text-gray-500 mt-2">Coming soon.</p>
    </main>
  );
}
