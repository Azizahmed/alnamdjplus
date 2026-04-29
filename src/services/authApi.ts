import { insforge } from './apiClient';

export const authApi = {
  getCurrentUser: () => insforge.auth.getCurrentUser(),
  signIn: (email: string, password: string) => insforge.auth.signInWithPassword({ email, password }),
  signUp: (email: string, password: string, name?: string) => insforge.auth.signUp({ email, password, name }),
  signInWithOAuth: (provider: string) => insforge.auth.signInWithOAuth({ provider }),
  signOut: () => insforge.auth.signOut(),
  updateProfile: (data: Record<string, any>) => insforge.auth.setProfile(data),
};
