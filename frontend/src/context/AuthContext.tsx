"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { api, tokenStorage } from "@/lib/api";
import { LoginCredentials } from "@/Types/Types";

interface AuthContextType {
  isLoggedIn: boolean;
  isLoading: boolean;
  user: { id: number; username: string; email: string } | null;
  login: (credentials: LoginCredentials) => Promise<void>;
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
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [accessToken, setAccessToken] = useState("");
  const [user, setUser] = useState<{ id: number; username: string; email: string } | null>(null);

  useEffect(() => {
    const hydrate = async () => {
      const existingAccess = tokenStorage.getAccess();
      const existingRefresh = tokenStorage.getRefresh();
      if (!existingAccess || !existingRefresh) {
        setIsLoading(false);
        return;
      }
      try {
        setAccessToken(existingAccess);
        const profile = await api.profile();
        setUser({
          id: profile.data.id,
          username: profile.data.username,
          email: profile.data.email,
        });
        setIsLoggedIn(true);
      } catch {
        tokenStorage.clear();
        setIsLoggedIn(false);
        setAccessToken("");
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    void hydrate();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    const response = await api.login(credentials);
    tokenStorage.set({
      access: response.data.access,
      refresh: response.data.refresh,
    });
    setAccessToken(response.data.access);
    const profile = await api.profile();
    setUser({
      id: profile.data.id,
      username: profile.data.username,
      email: profile.data.email,
    });
    setIsLoggedIn(true);
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