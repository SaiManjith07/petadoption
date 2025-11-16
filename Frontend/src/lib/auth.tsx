import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

const API_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:8000/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: { name: string; email: string; password: string; role?: string; full_name?: string; pincode?: string; age?: number; gender?: string; phone?: string; agree_terms?: boolean; }) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Load stored user on mount
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      return;
    }

    // If token exists but user not in storage, try to fetch current user
    const token = localStorage.getItem('token');
    if (token) {
      (async () => {
        try {
          const res = await fetch(`${API_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const data = await res.json();
            if (data.user) {
              setUser(data.user);
              localStorage.setItem('user', JSON.stringify(data.user));
            }
          } else {
            // token invalid or expired, remove it
            localStorage.removeItem('token');
          }
        } catch (e) {
          // network error - keep as unauthenticated
        }
      })();
    }
  }, []);

  const login = async (email: string, password: string) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.message || 'Login failed');
    }

    const data = await res.json();
    const { token, user: returnedUser } = data;
    if (token) localStorage.setItem('token', token);
    setUser(returnedUser);
    localStorage.setItem('user', JSON.stringify(returnedUser));
  };

  const register = async (payload: { name: string; email: string; password: string; role?: string; full_name?: string; pincode?: string; age?: number; gender?: string; phone?: string; agree_terms?: boolean; }) => {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      // if backend returns field errors, include them on the Error message so caller can parse
      const message = err?.message || (err?.errors ? JSON.stringify(err.errors) : 'Registration failed');
      throw new Error(message);
    }

    const data = await res.json();
    const { token, user: returnedUser } = data;
    if (token) localStorage.setItem('token', token);
    setUser(returnedUser);
    localStorage.setItem('user', JSON.stringify(returnedUser));
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
