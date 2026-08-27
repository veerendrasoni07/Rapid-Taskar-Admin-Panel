import { create } from 'zustand';

interface AuthState {
  token: string | null;
  user: any | null;
  setAuth: (token: string, user: any) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('adminToken'),
  user: null, // would ideally be populated via a /me endpoint or token decode
  setAuth: (token, user) => {
    localStorage.setItem('adminToken', token);
    set({ token, user });
  },
  logout: () => {
    localStorage.removeItem('adminToken');
    set({ token: null, user: null });
  },
}));
