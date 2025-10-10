"use client";

import { createContext, useContext, useEffect, useState } from "react";

type User = {
  id: number;
  username: string;
  nombre: string;
  tipo: string;
  id_ente: string;
  tipo_usuario?: string;
};

type UserContextType = {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => void;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);

  // Guarda/borra en localStorage cuando cambia
  const setUser = (userData: User | null) => {
    setUserState(userData);
    if (userData) {
      localStorage.setItem("user", JSON.stringify(userData));
    } else {
      localStorage.removeItem("user");
    }
  };

  // Restaura desde localStorage al montar
  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) setUserState(JSON.parse(stored));
    } catch {
      // si hay algo corrupto, lo limpiamos
      localStorage.removeItem("user");
    }
  }, []);

  const logout = () => setUser(null);

  return (
    <UserContext.Provider value={{ user, setUser, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within a UserProvider");
  return ctx;
}