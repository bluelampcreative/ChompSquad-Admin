"use client";

import { useAdmin } from "@/lib/hooks/useAdmin";
import { FeedManager } from "./_components/FeedManager";

export default function Home() {
  const { token, ready } = useAdmin();

  if (!ready || !token) return null;

  return <FeedManager token={token} />;
}
