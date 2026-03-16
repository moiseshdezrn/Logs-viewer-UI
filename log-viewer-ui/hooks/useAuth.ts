"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated, clearAuth, getAuthData, type AuthData } from "@/lib/auth";

export function useAuth(redirectTo: string = "/login") {
  const router = useRouter();
  const [authData, setAuthData] = useState<AuthData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push(redirectTo);
      return;
    }

    setAuthData(getAuthData());
    setIsLoading(false);

    const interval = setInterval(() => {
      if (!isAuthenticated()) {
        clearAuth();
        router.push(redirectTo);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [router, redirectTo]);

  const logout = () => {
    clearAuth();
    router.push("/login");
  };

  return { authData, isLoading, logout };
}
