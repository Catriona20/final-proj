import { create } from 'zustand';
import { AuthState, Patient } from '../types';
import { authService, LoginParams, RegisterParams } from '../services/authService';
import { patientService } from '../services/patientService';

interface AuthStoreActions {
  initializeAuth: () => Promise<void>;
  login: (params: LoginParams) => Promise<void>;
  register: (params: RegisterParams) => Promise<{ requiresOtp: boolean }>;
  verifyOtp: (phoneOrEmail: string, code: string) => Promise<void>;
  forgotPassword: (emailOrPhone: string) => Promise<void>;
  resetPassword: (token: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updatedData: Partial<Patient>) => void;
  setHasCompletedOnboarding: (val: boolean) => Promise<void>;
  isSplashTriggered: boolean;
  clearSplashTrigger: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState & AuthStoreActions>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  isSplashTriggered: false,
  error: null,
  hasCompletedOnboarding: false,

  initializeAuth: async () => {
    set({ isLoading: true, error: null });
    try {
      const hasOnboarded = await authService.hasCompletedOnboarding();
      const session = await authService.getCurrentSession();

      if (session && session.token && session.user) {
        set({
          user: session.user,
          token: session.token,
          isAuthenticated: true,
          hasCompletedOnboarding: true,
          isLoading: false,
        });
      } else {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          hasCompletedOnboarding: hasOnboarded,
          isLoading: false,
        });
      }
    } catch (err: any) {
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: err.message || 'Initialization error',
      });
    }
  },

  login: async (params: LoginParams) => {
    set({ isLoading: true, error: null });
    try {
      const session = await authService.login(params);
      set({
        user: session.user,
        token: session.token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (err: any) {
      set({ isLoading: false, error: err.message || 'Failed to login' });
      throw err;
    }
  },

  register: async (params: RegisterParams) => {
    set({ isLoading: true, error: null });
    try {
      const res = await authService.register(params);
      set({ isLoading: false });
      return res;
    } catch (err: any) {
      set({ isLoading: false, error: err.message || 'Failed to register' });
      throw err;
    }
  },

  verifyOtp: async (phoneOrEmail: string, code: string) => {
    set({ isLoading: true, error: null });
    try {
      const session = await authService.verifyOtp(phoneOrEmail, code);
      set({
        user: session.user,
        token: session.token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (err: any) {
      set({ isLoading: false, error: err.message || 'Invalid OTP code' });
      throw err;
    }
  },

  forgotPassword: async (emailOrPhone: string) => {
    set({ isLoading: true, error: null });
    try {
      await authService.forgotPassword(emailOrPhone);
      set({ isLoading: false });
    } catch (err: any) {
      set({ isLoading: false, error: err.message || 'Error requesting password reset' });
      throw err;
    }
  },

  resetPassword: async (token: string, pass: string) => {
    set({ isLoading: true, error: null });
    try {
      await authService.resetPassword(token, pass);
      set({ isLoading: false });
    } catch (err: any) {
      set({ isLoading: false, error: err.message || 'Error resetting password' });
      throw err;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    await authService.logout();
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      isSplashTriggered: true,
    });
  },

  clearSplashTrigger: () => set({ isSplashTriggered: false }),

  updateProfile: (updatedData: Partial<Patient>) => {
    const current = get().user;
    if (current) {
      const updated = { ...current, ...updatedData };
      set({ user: updated });
      patientService.updateProfile(updatedData).catch(() => {});
    }
  },

  setHasCompletedOnboarding: async (val: boolean) => {
    await authService.setOnboardingCompleted();
    set({ hasCompletedOnboarding: val });
  },

  clearError: () => set({ error: null }),
}));
