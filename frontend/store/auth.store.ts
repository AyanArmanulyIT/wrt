import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/types/api.types";

interface AuthState {
  user: User | null;
  isHydrated: boolean;
  setUser: (user: User | null) => void;
  setHydrated: (v: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isHydrated: false,
      setUser: (user) => set({ user }),
      setHydrated: (isHydrated) => set({ isHydrated }),
      logout: () => {
        localStorage.removeItem("wrt_access");
        localStorage.removeItem("wrt_refresh");
        set({ user: null });
      },
    }),
    {
      name: "wrt-auth",
      partialize: (s) => ({ user: s.user }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);
