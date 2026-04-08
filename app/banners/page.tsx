"use client";

import { useAdmin } from "@/lib/hooks/useAdmin";
import { BannerList } from "../_components/BannerList";

export default function BannersPage() {
  const { token, ready } = useAdmin();

  if (!ready || !token) return null;

  return <BannerList token={token} />;
}
