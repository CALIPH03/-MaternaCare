import { create } from 'zustand';
import { User, UserRole } from '../types';

interface AuthState {
  user: User | null;
  setUser: (user: User | null) => void;
  isAuthenticated: boolean;
  setIsAuthenticated: (status: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: {
    id: 'nurse-1',
    facilityId: 'facility-1',
    name: 'Nurse Jane Nyambura',
    email: 'jane@mbagathi.go.ke',
    role: UserRole.NURSE,
  },
  setUser: (user) => set({ user }),
  isAuthenticated: false,
  setIsAuthenticated: (status) => set({ isAuthenticated: status }),
  logout: () => set({ user: null, isAuthenticated: false }),
}));
