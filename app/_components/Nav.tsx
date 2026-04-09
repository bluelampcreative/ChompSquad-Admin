"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clearToken } from "@/lib/hooks/useAdmin";
import { useRouter } from "next/navigation";

export function Nav() {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === "/login") return null;

  function handleSignOut() {
    clearToken();
    router.replace("/login");
  }

  const linkClass = (href: string) =>
    `text-sm font-medium transition-colors ${
      pathname === href
        ? "text-gray-900"
        : "text-gray-400 hover:text-gray-700"
    }`;

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="max-w-2xl mx-auto px-4 h-12 flex items-center justify-between">
        <nav className="flex items-center gap-6">
          <Link href="/banners" className={linkClass("/banners")}>
            Banners
          </Link>
          <Link href="/reports" className={linkClass("/reports")}>
            Reports
          </Link>
        </nav>
        <button
          onClick={handleSignOut}
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
