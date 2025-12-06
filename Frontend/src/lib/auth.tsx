import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from '@/api/authApi';
import { tokenStorage } from '@/api/apiClient';
import { User } from '@/models';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<User>;
  register: (payload: {
    name: string;
    email: string;
    password: string;
    confirm_password: string;
    role?: 'user' | 'rescuer' | 'shelter';
    pincode?: string;
    age?: number;
    gender?: 'Male' | 'Female' | 'Other' | 'Prefer not to say';
    phone?: string;
    country_code?: string;
    address?: string;
    landmark?: string;
  }) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Load stored user on mount
    const storedUser = tokenStorage.getUser();
    if (storedUser) {
      setUser(storedUser);
      return;
    }

    // If token exists but user not in storage, try to fetch current user
    const accessToken = tokenStorage.getAccessToken();
    if (accessToken) {
      (async () => {
        try {
          const data = await authApi.getMe();
          if (data.user) {
            setUser(data.user);
            tokenStorage.setUser(data.user);
          }
        } catch (e) {
          // token invalid or expired, clear it
          tokenStorage.clearTokens();
        }
      })();
    }
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    try {
      const data = await authApi.login(email, password);
      
      // Store tokens
      tokenStorage.setTokens({
        access: data.token,
        refresh: data.refresh,
      });
      
      // Store user data
      const userData = {
        ...data.user,
        id: data.user.id,
      };
      
      setUser(userData);
      tokenStorage.setUser(userData);
      
      return userData;
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Login failed';
      throw new Error(message);
    }
  };

  const register = async (payload: {
    name: string;
    email: string;
    password: string;
    confirm_password: string;
    role?: 'user' | 'rescuer' | 'shelter';
    pincode?: string;
    age?: number;
    gender?: 'Male' | 'Female' | 'Other' | 'Prefer not to say';
    phone?: string;
    country_code?: string;
    address?: string;
    landmark?: string;
  }): Promise<void> => {
    try {
      const data = await authApi.register(payload);
      
      // Store tokens
      if (data.token && data.refresh) {
        tokenStorage.setTokens({
          access: data.token,
          refresh: data.refresh,
        });
      }
      
      // Store user data
      setUser(data.user);
      tokenStorage.setUser(data.user);
    } catch (error: any) {
      // Handle validation errors from Django
      if (error?.response?.data) {
        const errors = error.response.data;
        if (typeof errors === 'object' && !errors.message) {
          // Field-specific errors
          const errorMessages = Object.entries(errors)
            .map(([field, messages]) => {
              const msgArray = Array.isArray(messages) ? messages : [messages];
              return `${field}: ${msgArray.join(', ')}`;
            })
            .join('; ');
          throw new Error(errorMessages);
        }
        throw new Error(errors.message || JSON.stringify(errors));
      }
      throw new Error(error?.message || 'Registration failed');
    }
  };

  const refreshUser = async (): Promise<void> => {
    try {
      const data = await authApi.getMe();
      if (data.user) {
        setUser(data.user);
        tokenStorage.setUser(data.user);
      }
    } catch (e) {
      console.error('Error refreshing user:', e);
    }
  };

  const logout = (): void => {
    tokenStorage.clearTokens();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        refreshUser,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin' || user?.role === 'sub_admin' || user?.is_staff === true,
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
