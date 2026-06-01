import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  age: number;
  biologicalSex: "male" | "female" | "other";
  bloodType: string;
  usualBedtime: string;
  usualWakeTime: string;
  avgSleepHours: number;
  sleepConsistency: boolean;
  snoringOrApnea: boolean;
  existingSleepDisorder: boolean;
  caffeineIntake: boolean;
  activityLevel: "sedentary" | "moderate" | "active" | "very_active";
}

type ProfileData = Omit<User, "id" | "name" | "email" | "password">;

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  updateProfile: (data: ProfileData) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  signup: async () => {},
  updateProfile: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const stored = await AsyncStorage.getItem("sleepsense_current_user");
        if (stored) setUser(JSON.parse(stored));
      } catch {
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const signup = useCallback(async (email: string, password: string, name: string) => {
    const registryRaw = await AsyncStorage.getItem("sleepsense_registry");
    const registry: User[] = registryRaw ? JSON.parse(registryRaw) : [];

    const exists = registry.find((u) => u.email === email);
    if (exists) throw new Error("An account with this email already exists. Please log in.");

    const newUser: User = {
      id: "user_" + Date.now(),
      name,
      email,
      password,
      age: 0,
      biologicalSex: "other",
      bloodType: "",
      usualBedtime: "",
      usualWakeTime: "",
      avgSleepHours: 0,
      sleepConsistency: false,
      snoringOrApnea: false,
      existingSleepDisorder: false,
      caffeineIntake: false,
      activityLevel: "moderate",
    };

    registry.push(newUser);
    await AsyncStorage.setItem("sleepsense_registry", JSON.stringify(registry));
    await AsyncStorage.setItem("sleepsense_current_user", JSON.stringify(newUser));
    setUser(newUser);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const registryRaw = await AsyncStorage.getItem("sleepsense_registry");
    const registry: User[] = registryRaw ? JSON.parse(registryRaw) : [];

    const found = registry.find((u) => u.email === email);
    if (!found) throw new Error("No account found with this email. Please sign up first.");
    if (found.password !== password) throw new Error("Incorrect password.");

    await AsyncStorage.setItem("sleepsense_current_user", JSON.stringify(found));
    setUser(found);
  }, []);

  const updateProfile = useCallback(async (data: ProfileData) => {
    if (!user) throw new Error("No user logged in.");

    const updatedUser = { ...user, ...data };

    const registryRaw = await AsyncStorage.getItem("sleepsense_registry");
    const registry: User[] = registryRaw ? JSON.parse(registryRaw) : [];
    const updatedRegistry = registry.map((u) => u.id === updatedUser.id ? updatedUser : u);

    await AsyncStorage.setItem("sleepsense_registry", JSON.stringify(updatedRegistry));
    await AsyncStorage.setItem("sleepsense_current_user", JSON.stringify(updatedUser));
    setUser(updatedUser);
  }, [user]);

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem("sleepsense_current_user");
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, signup, updateProfile, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}