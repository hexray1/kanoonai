const GUEST_TOKEN_KEY = "kanoon_guest_token";

/** Returns a stable per-device guest token (UUID), creating one if needed. */
export function getGuestToken(): string {
  try {
    const existing = localStorage.getItem(GUEST_TOKEN_KEY);
    if (existing) return existing;
    const newToken = crypto.randomUUID();
    localStorage.setItem(GUEST_TOKEN_KEY, newToken);
    return newToken;
  } catch {
    return "guest-fallback";
  }
}

/** Fetch helper for Kanoon AI's guest-only document flow. */
export function guestFetch(url: string, options: RequestInit = {}): Promise<Response> {
  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-guest-token": getGuestToken(),
      ...options.headers,
    },
  });
}