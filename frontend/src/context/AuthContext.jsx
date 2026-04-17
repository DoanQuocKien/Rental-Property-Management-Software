import { createContext, useContext, useState } from 'react';
import api from '../api';
import {
  clearAuthStorage,
  getAccessToken,
  getRefreshToken,
  getStoredUser,
  setAuthStorage,
} from '../authStorage';

const AuthContext = createContext(null);

function getInitialUser() {
  const token = getAccessToken();
  const refreshToken = getRefreshToken();
  const storedUser = getStoredUser();

  if (storedUser && token && refreshToken) {
    return storedUser;
  }

  clearAuthStorage();
  return null;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getInitialUser);

  const login = (userData, token, refreshToken) => {
    setAuthStorage({ user: userData, token, refreshToken });
    setUser(userData);
  };

  const logout = async () => {
    const refreshToken = getRefreshToken();

    try {
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken });
      }
    } catch {
      // Ignore network/auth errors and clear local auth state anyway.
    }

    clearAuthStorage();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}

