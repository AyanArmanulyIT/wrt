"use client";

import { fetchMe } from "@/services/auth.service";
import { useAuthStore } from "@/store/auth.store";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, setUser, isHydrated, setHydrated } = useAuthStore();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!isHydrated) return;

    const token = localStorage.getItem("wrt_access");
    if (!token) {
      router.replace("/login");
      return;
    }

    if (user) {
      setChecking(false);
      return;
    }

    fetchMe()
      .then(setUser)
      .catch(() => {
        localStorage.removeItem("wrt_access");
        localStorage.removeItem("wrt_refresh");
        router.replace("/login");
      })
      .finally(() => setChecking(false));
  }, [isHydrated, user, router, setUser]);

  useEffect(() => {
    const t = setTimeout(() => setHydrated(true), 0);
    return () => clearTimeout(t);
  }, [setHydrated]);

  if (!isHydrated || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
