"use client";

import { fetchAdminAccess } from "@/services/admin.service";
import { useAuthStore } from "@/store/auth.store";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isHydrated) return;
    const token = localStorage.getItem("wrt_access");
    if (!token) {
      router.replace("/login");
      return;
    }

    const check =
      user?.is_superuser || user?.is_staff || user?.is_school_moderator;

    if (check) {
      setAllowed(true);
      return;
    }

    fetchAdminAccess()
      .then((r) => {
        if (r.allowed) setAllowed(true);
        else router.replace("/feed");
      })
      .catch(() => router.replace("/feed"));
  }, [isHydrated, user, router]);

  if (!isHydrated || allowed === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0c0e14]">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
