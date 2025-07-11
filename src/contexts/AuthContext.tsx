import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  login: (password: string) => boolean;
  logout: () => void;
  checkAuth: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [token, setToken] = useState<string | null>(null);

  const checkAuth = (): boolean => {
    const storedToken = localStorage.getItem('token');
    const expectedToken = import.meta.env.VITE_API_TOKEN;
    
    if (!storedToken || !expectedToken) {
      setIsAuthenticated(false);
      setToken(null);
      return false;
    }
    
    if (storedToken === expectedToken) {
      setIsAuthenticated(true);
      setToken(storedToken);
      return true;
    } else {
      // Token doesn't match, remove it
      localStorage.removeItem('token');
      setIsAuthenticated(false);
      setToken(null);
      return false;
    }
  };

  const login = (password: string): boolean => {
    const expectedToken = import.meta.env.VITE_API_TOKEN;
    
    if (password === expectedToken) {
      localStorage.setItem('token', password);
      setToken(password);
      setIsAuthenticated(true);
      return true;
    }
    
    return false;
  };

  const logout = (): void => {
    localStorage.removeItem('token');
    setToken(null);
    setIsAuthenticated(false);
  };

  // Check authentication on component mount
  useEffect(() => {
    checkAuth();
  }, []);

  const value: AuthContextType = {
    isAuthenticated,
    token,
    login,
    logout,
    checkAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 