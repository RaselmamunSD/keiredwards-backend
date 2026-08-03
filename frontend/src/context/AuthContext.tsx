"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { api, tokenStorage } from "@/lib/api";
import { LoginCredentials } from "@/Types/Types";

interface AuthContextType {
  isLoggedIn: boolean;
  isLoading: boolean;
  user: { id: number; username: string; email: string } | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  accessToken: string;
}

const AuthContext = createContext<AuthContextType>({
  isLoggedIn: false,
  isLoading: true,
  user: null,
  login: async () => {},
  logout: async () => {},
  accessToken: "",
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // SSR safe initial state: always start loading, assume not logged in.
  // This prevents React hydration mismatches where the server renders one thing
  // and the client renders another, causing the DOM to flash or Next.js router
  // to get confused and trigger incorrect redirects.
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true); 
  const [accessToken, setAccessToken] = useState("");
  const [user, setUser] = useState<{ id: number; username: string; email: string } | null>(null);

  useEffect(() => {
    const hydrate = async () => {
      const existingAccess = tokenStorage.getAccess();
      const existingRefresh = tokenStorage.getRefresh();
      
      // If we don't have tokens, we are definitively not logged in.
      if (!existingAccess || !existingRefresh) {
        setIsLoggedIn(false);
        setIsLoading(false);
        return;
      }
      
      // We have tokens. Temporarily set isLoggedIn to true so the UI doesn't 
      // flash the "logged out" state (like redirecting to /login) while we fetch profile.
      setIsLoggedIn(true);
      setAccessToken(existingAccess);
      
      try {
        const profile = await api.profile();
        setUser({
          id: profile.data.id,
          username: profile.data.username,
          email: profile.data.email,
        });
      } catch {
        if (!tokenStorage.getAccess()) {
          setIsLoggedIn(false);
          setAccessToken("");
          setUser(null);
        }
      } finally {
        setIsLoading(false);
      }
    };
    void hydrate();
  }, []);

  const login = async () => {
    const access = tokenStorage.getAccess();
    if (!access) return;
    setAccessToken(access);
    setIsLoggedIn(true);
    try {
      const profile = await api.profile();
      setUser({
        id: profile.data.id,
        username: profile.data.username,
        email: profile.data.email,
      });
    } catch (e) {
      console.warn("Could not fetch profile during login:", e);
    }
  };

  const logout = async () => {
    try {
      if (tokenStorage.getRefresh()) {
        await api.logout();
      }
    } catch {
      // Ignore logout API failure and always clear local auth state.
    }
    tokenStorage.clear();
    setIsLoggedIn(false);
    setAccessToken("");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, isLoading, user, login, logout, accessToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);