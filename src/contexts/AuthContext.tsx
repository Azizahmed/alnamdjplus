import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { insforge } from '../config';

interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<{ requireEmailVerification: boolean }>;
  verifyEmail: (email: string, otp: string) => Promise<void>;
  resendVerificationEmail: (email: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: { name?: string; avatar_url?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data } = await insforge.auth.getCurrentUser();
      if (data?.user) {
        setUser({
          id: data.user.id,
          email: data.user.email || '',
          name: data.user.profile?.name,
          avatar_url: data.user.profile?.avatar_url,
        });
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await insforge.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    if (data?.user) {
      setUser({
        id: data.user.id,
        email: data.user.email || '',
        name: data.user.profile?.name,
        avatar_url: data.user.profile?.avatar_url,
      });
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    const { data, error } = await insforge.auth.signUp({ email, password, name });
    if (error) throw new Error(error.message);
    if (data?.requireEmailVerification) {
      return { requireEmailVerification: true };
    }
    await checkUser();
    return { requireEmailVerification: false };
  };

  const verifyEmail = async (email: string, otp: string) => {
    const { data, error } = await insforge.auth.verifyEmail({ email, otp });
    if (error) throw new Error(error.message);
    if (data?.user) {
      setUser({
        id: data.user.id,
        email: data.user.email || '',
        name: data.user.profile?.name,
        avatar_url: data.user.profile?.avatar_url,
      });
    }
  };

  const resendVerificationEmail = async (email: string) => {
    const { error } = await insforge.auth.resendVerificationEmail({ email });
    if (error) throw new Error(error.message);
  };

  const signInWithGoogle = async () => {
    const { data, error } = await insforge.auth.signInWithOAuth({ provider: 'google' });
    if (error) throw new Error(error.message);
    if (data?.url) {
      window.location.href = data.url;
    }
  };

  const signOut = async () => {
    const { error } = await insforge.auth.signOut();
    if (error) throw new Error(error.message);
    setUser(null);
  };

  const updateProfile = async (data: { name?: string; avatar_url?: string }) => {
    const { error } = await insforge.auth.setProfile(data);
    if (error) throw new Error(error.message);
    await checkUser();
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signIn,
      signUp,
      verifyEmail,
      resendVerificationEmail,
      signInWithGoogle,
      signOut,
      updateProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
