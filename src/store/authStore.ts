import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { connectSocket, disconnectSocket } from '../socket/socket';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  selectedChildId: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  updateUser: (user: User) => void;
  setSelectedChildId: (id: string | null) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      selectedChildId: null,
      isAuthenticated: false,

      setAuth: (user, token) => {
        localStorage.setItem('token', token);
        connectSocket(user._id);
        const initialChildId =
          user.role === 'PARENT' && user.children && user.children.length > 0
            ? user.children[0]._id
            : null;
        set({
          user,
          token,
          isAuthenticated: true,
          selectedChildId: initialChildId,
        });
      },

      updateUser: (user) => {
        const { selectedChildId } = get();
        // If current selected child is no longer in children, fallback to first child
        let nextSelectedChild = selectedChildId;
        if (user.role === 'PARENT') {
          const hasSelected = user.children?.some((c) => c._id === selectedChildId);
          if (!hasSelected) {
            nextSelectedChild = user.children?.[0]?._id || null;
          }
        }
        set({ user, selectedChildId: nextSelectedChild });
      },

      setSelectedChildId: (id) => {
        set({ selectedChildId: id });
      },

      clearAuth: () => {
        const { user } = get();
        if (user) disconnectSocket(user._id);
        localStorage.removeItem('token');
        localStorage.removeItem('auth-storage');
        set({ user: null, token: null, selectedChildId: null, isAuthenticated: false });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        selectedChildId: state.selectedChildId,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
