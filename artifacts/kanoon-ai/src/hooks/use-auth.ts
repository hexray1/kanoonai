import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: number;
  phone?: string;
  email?: string;
  name?: string;
  profilePicture?: string;
  plan: string;
  referralCode?: string;
  isAdmin?: boolean;
}

interface AuthState {
  token: string | null;
  user: User | null;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user }),
      logout: () => set({ token: null, user: null }),
    }),
    {
      name: 'kanoon_auth',
    }
  )
);

export function getAuthToken(): string | null {
  return useAuthStore.getState().token;
}

const GUEST_TOKEN_KEY = 'kanoox_guest_token';

/** Returns a stable per-device guest token (UUID), creating one if needed. */
export function getGuestToken(): string {
  try {
    const existing = localStorage.getItem(GUEST_TOKEN_KEY);
    if (existing) return existing;
    const newToken = crypto.randomUUID();
    localStorage.setItem(GUEST_TOKEN_KEY, newToken);
    return newToken;
  } catch {
    return 'guest-fallback';
  }
}

/** Fetch that includes both Authorization (if logged in) and x-guest-token headers. */
export function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getAuthToken();
  const guestToken = getGuestToken();
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      'x-guest-token': guestToken,
      ...options.headers,
    },
  });
}

/** Alias — same as authFetch, works for both guests and logged-in users. */
export const guestFetch = authFetch;
