// Auth is disabled - always return unauthenticated state
export function useAuth() {
  return {
    user: null,
    loading: false,
    error: null,
    isAuthenticated: false,
    refresh: () => Promise.resolve(),
    logout: async () => {},
  };
}
