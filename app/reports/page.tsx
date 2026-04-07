"use client";

import { useAdmin } from "@/lib/hooks/useAdmin";
import { ReportsList } from "../_components/ReportsList";

export default function ReportsPage() {
  const { token, ready } = useAdmin();

  if (!ready || !token) return null;

  return <ReportsList token={token} />;
}
