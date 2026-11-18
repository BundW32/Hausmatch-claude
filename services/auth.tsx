import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import { loadOwnProfile, logoutUser, refreshVerification } from './dataService';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  /** Profil und Bestätigungsstatus neu laden. */
  refreshUser: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: async () => undefined,
  refreshUser: async () => null,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (): Promise<User | null> => {
    const fbUser = auth.currentUser;
    if (!fbUser) {
      setUser(null);
      return null;
    }
    try {
      const profile = await loadOwnProfile(fbUser);
      const next: User = { ...profile, email: fbUser.email || '', emailVerified: fbUser.emailVerified };
      setUser(next);
      return next;
    } catch (err) {
      console.error('Profil konnte nicht geladen werden:', err);
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    return onAuthStateChanged(auth, async () => {
      await load();
      setLoading(false);
    });
  }, [load]);

  const logout = useCallback(async () => {
    await logoutUser();
    setUser(null);
    // Der Entwurf des Objekt-Formulars gehört zum abgemeldeten Nutzer – nicht dem nächsten am selben Gerät zeigen.
    try {
      localStorage.removeItem('hm_wizard_draft_v1');
    } catch {
      /* ignore */
    }
  }, []);

  const refreshUser = useCallback(async () => {
    await refreshVerification().catch(() => false);
    return load();
  }, [load]);

  return <AuthContext.Provider value={{ user, loading, logout, refreshUser }}>{children}</AuthContext.Provider>;
};
