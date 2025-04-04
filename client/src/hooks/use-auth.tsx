import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// User type definition
export interface User {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "admin" | "faculty" | "student";
  profileImage?: string;
  department?: string;
}

// Registration data type
export interface RegisterData {
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  email: string;
  role?: "student" | "faculty" | "admin";
}

// Auth context type
interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  register: (data: RegisterData) => Promise<User>;
}

// Create the auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider props
interface AuthProviderProps {
  children: ReactNode;
}

// Auth provider component
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  // Check if user is already logged in
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await fetch("/api/auth/me", {
          credentials: "include"
        });
        
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        }
      } catch (error) {
        console.error("Failed to check auth status:", error);
      } finally {
        setLoading(false);
      }
    };
    
    checkAuthStatus();
  }, []);
  
  // Login function
  const login = async (username: string, password: string): Promise<User> => {
    try {
      const response = await apiRequest("POST", "/api/auth/login", { username, password });
      const userData = await response.json();
      setUser(userData);
      return userData;
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  };
  
  // Logout function
  const logout = async (): Promise<void> => {
    try {
      await apiRequest("POST", "/api/auth/logout");
      setUser(null);
    } catch (error) {
      console.error("Logout failed:", error);
      toast({
        variant: "destructive",
        title: "Logout failed",
        description: "Failed to log out. Please try again."
      });
      throw error;
    }
  };
  
  // Register function
  const register = async (data: RegisterData): Promise<User> => {
    try {
      // Set default role to student if not provided
      const registerData = {
        ...data,
        role: data.role || "student"
      };
      
      const response = await apiRequest("POST", "/api/auth/register", registerData);
      const userData = await response.json();
      setUser(userData);
      return userData;
    } catch (error) {
      console.error("Registration failed:", error);
      throw error;
    }
  };
  
  // Auth context value
  const value = {
    user,
    loading,
    login,
    logout,
    register
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  
  return context;
}
