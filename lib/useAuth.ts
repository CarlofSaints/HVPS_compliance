"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SessionPayload } from "./roles";

const SESSION_KEY = "hvps_session";

export function getSession(): SessionPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SessionPayload;
  } catch {
    return null;
  }
}

export function setSession(payload: SessionPayload): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(payload));
}

export function updateSession(updates: Partial<SessionPayload>): void {
  const current = getSession();
  if (current) {
    setSession({ ...current, ...updates });
  }
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

export async function authFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const session = getSession();
  const headers = new Headers(options.headers);
  if (session?.id) {
    headers.set("x-user-id", session.id);
  }
  return fetch(url, { ...options, headers });
}

export function useAuth(requiredPermission?: string) {
  const router = useRouter();
  const [session, setSessionState] = useState<SessionPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const s = getSession();
    if (!s) {
      router.replace("/login");
      return;
    }
    if (requiredPermission && !s.permissions.includes(requiredPermission)) {
      router.replace("/dashboard");
      return;
    }
    setSessionState(s);
    setLoading(false);
  }, [router, requiredPermission]);

  return { session, loading };
}
