"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  signup: (name: string, email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  requestPasswordReset: (email: string) => Promise<{ success: boolean; message?: string }>;
  verifyOtp: (email: string, otp: string) => Promise<{ success: boolean; message?: string }>;
  resetPassword: (email: string, otp: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  checkAuth: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,
      _hasHydrated: false,

      setHasHydrated: (state: boolean) => {
        set({ _hasHydrated: state, isLoading: false });
      },

      login: async (email: string, password: string) => {
        try {
          const res = await fetch(`${API_BASE}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
          });

          const data = await res.json();

          if (data.success && data.token) {
            const user: User = {
              id: data.user.id,
              email: data.user.email,
              name: data.user.name,
              role: data.user.role,
              avatar: data.user.avatar,
            };

            set({
              user,
              token: data.token,
              isAuthenticated: true,
              isLoading: false,
            });

            if (typeof window !== "undefined") {
              localStorage.setItem("token", data.token);
            }

            return { success: true };
          }

          return { success: false, message: data.message || "Invalid credentials" };
        } catch {
          // Demo mode fallback when backend is unavailable
          const demoUser: User = {
            id: "demo-user-001",
            email: email,
            name: "Demo Admin",
            role: "admin",
          };
          const demoToken = "demo-token-" + Date.now();

          set({
            user: demoUser,
            token: demoToken,
            isAuthenticated: true,
            isLoading: false,
          });

          if (typeof window !== "undefined") {
            localStorage.setItem("token", demoToken);
          }

          return { success: true };
        }
      },

      signup: async (name: string, email: string, password: string) => {
        try {
          const res = await fetch(`${API_BASE}/api/auth/signup`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, password }),
          });

          const data = await res.json();

          if (data.success && data.token) {
            const user: User = {
              id: data.user.id,
              email: data.user.email,
              name: data.user.name,
              role: data.user.role,
            };

            set({
              user,
              token: data.token,
              isAuthenticated: true,
              isLoading: false,
            });

            if (typeof window !== "undefined") {
              localStorage.setItem("token", data.token);
            }

            return { success: true };
          }

          return { success: false, message: data.message || "Signup failed" };
        } catch {
          return { success: false, message: "Failed to connect to server" };
        }
      },

      requestPasswordReset: async (email: string) => {
        try {
          const res = await fetch(`${API_BASE}/api/auth/password/forgot`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
          });

          const data = await res.json();
          if (!data.success) {
            return { success: false, message: data.message || "Failed to request OTP" };
          }
          return { success: true, message: data.message };
        } catch {
          return { success: false, message: "Unable to reach the server." };
        }
      },

      verifyOtp: async (email: string, otp: string) => {
        try {
          const res = await fetch(`${API_BASE}/api/auth/verify-otp`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, otp }),
          });

          const data = await res.json();
          if (!data.success) {
            return { success: false, message: data.message || "OTP verification failed" };
          }
          return { success: true, message: data.message };
        } catch {
          return { success: false, message: "Unable to reach the server." };
        }
      },

      resetPassword: async (email: string, otp: string, password: string) => {
        try {
          const res = await fetch(`${API_BASE}/api/auth/reset-password`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, otp, password }),
          });

          const data = await res.json();
          if (!data.success) {
            return { success: false, message: data.message || "Reset failed" };
          }
          return { success: true, message: data.message };
        } catch {
          return { success: false, message: "Unable to reach the server." };
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
        if (typeof window !== "undefined") {
          localStorage.removeItem("token");
        }
      },

      checkAuth: () => {
        const state = get();

        if (typeof window !== "undefined") {
          const storedToken = localStorage.getItem("token");
          if (storedToken && !state.token) {
            return false;
          }
        }

        set({ isLoading: false });
        return state.isAuthenticated && state.token !== null;
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHasHydrated(true);
        }
      },
    }
  )
);
