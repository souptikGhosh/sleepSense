import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  age: number;
  bloodType: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  signup: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const stored = await AsyncStorage.getItem("sleepsense_user");
        if (stored) setUser(JSON.parse(stored));
      } catch {
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const login = useCallback(async (email: string, _password: string) => {
    const mockUser: User = {
      id: "user_" + Date.now(),
      name: email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      email,
      age: 28,
      bloodType: "O+",
    };
    await AsyncStorage.setItem("sleepsense_user", JSON.stringify(mockUser));
    setUser(mockUser);
  }, []);

  const signup = useCallback(async (email: string, _password: string, name: string) => {
    const mockUser: User = {
      id: "user_" + Date.now(),
      name,
      email,
      age: 28,
      bloodType: "O+",
    };
    await AsyncStorage.setItem("sleepsense_user", JSON.stringify(mockUser));
    setUser(mockUser);
  }, []);

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem("sleepsense_user");
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
