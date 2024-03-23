// AuthContext.tsx
import React, { createContext, useContext, useState } from 'react';

interface User {
  username: string;
  password: string;
  // You can add more user-related fields here
}

interface AuthContextType {
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = (userData: User) => {
    // Simulating authentication, replace with actual authentication logic
    setUser(userData);
    // Save user data to local storage
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    // Clear user data from state and local storage
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
