import { create } from 'zustand';

interface AuthState {
  token: string | null;
  user: any | null;
  setAuth: (token: string, user: any) => void;
  logout: () => void;
}

const isDev = import.meta.env.DEV || import.meta.env.VITE_SKIP_AUTH === 'true';

const defaultDevUser = {
  _id: '000000000000000000000001',
  name: 'Dev Admin',
  role: 'ADMIN',
  phone: '+919999999999',
};

// In dev mode, initialize with a dev token and admin user if none in localStorage
const initialToken = localStorage.getItem('adminToken') || (isDev ? 'dev-mock-admin-token' : null);
const initialUser = isDev ? defaultDevUser : null;

export const useAuthStore = create<AuthState>((set) => ({
  token: initialToken,
  user: initialUser,
  setAuth: (token, user) => {
    localStorage.setItem('adminToken', token);
    set({ token, user: user || (isDev ? defaultDevUser : null) });
  },
  logout: () => {
    localStorage.removeItem('adminToken');
    // If dev mode skip is active, retain dev token on logout instead of locking out
    if (isDev) {
      set({ token: 'dev-mock-admin-token', user: defaultDevUser });
    } else {
      set({ token: null, user: null });
    }
  },
}));
