import { create } from 'zustand';
import { UserProfile, UserRole } from '../api/types';

interface AuthState {
  isAuthenticated: boolean;
  user: UserProfile | null;
  login: (email: string, role: UserRole) => void;
  logout: () => void;
  switchRole: (role: UserRole) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: true, // default logged in for seamless demo UX
  user: {
    name: 'Alexandra Vance',
    email: 'alexandra.vance@acme-corp.com',
    role: 'finance_manager',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  },
  login: (email: string, role: UserRole) => {
    set({
      isAuthenticated: true,
      user: {
        name: email.split('@')[0].replace('.', ' ').toUpperCase(),
        email,
        role,
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      },
    });
  },
  logout: () => {
    set({ isAuthenticated: false, user: null });
  },
  switchRole: (role: UserRole) => {
    set((state) => ({
      user: state.user ? { ...state.user, role } : null,
    }));
  },
}));
