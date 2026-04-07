"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const TOKEN_KEY = "chompsquad_admin_token";

function decodeJwtPayload(token: string): { exp?: unknown } {
  const parts = token.split(".");

  if (parts.length < 2 || !parts[1]) {
    throw new Error("Invalid JWT");
  }

  const base64 = parts[1]
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(Math.ceil(parts[1].length / 4) * 4, "=");

  return JSON.parse(atob(base64));
}

function isTokenExpired(token: string): boolean {
  try {
    const payload = decodeJwtPayload(token);
    const exp = payload.exp;

    if (typeof exp !== "number" || !Number.isFinite(exp)) {
      return true;
    }

    return exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

export function saveToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getValidToken(): string | null {
  const token = getToken();
  if (!token || isTokenExpired(token)) {
    clearToken();
    return null;
  }
  return token;
}

export function useAdmin() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function checkAuth() {
      const valid = getValidToken();
      if (!valid) {
        router.replace("/login");
        return;
      }
      if (!cancelled) {
        setToken(valid);
        setReady(true);
      }
    }

    checkAuth();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return { token, ready };
}
