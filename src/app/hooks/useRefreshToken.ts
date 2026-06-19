import { authService, LoginResponse, LoginCredentials } from '@/services/auth-service';

// 1. The Login Handler
// Professional Note: We pass credentials + deviceName for CouchDB tracking
export const handleLogin = async (credentials: LoginCredentials): Promise<LoginResponse> => {
  try {
    // We use authService directly. It returns clean data, not the Axios wrapper.
    const data = await authService.login({
      ...credentials,
      deviceName: typeof window !== 'undefined' ? window.navigator.userAgent : 'Web Browser'
    });
    
    // Ttteeee Requirement: "clearing/setting on the client side"
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);

    return data;
  } catch (error) {
    console.error("Login Error:", error);
    throw error; 
  }
};

// 2. The Refresh Token Hook
export const useRefreshToken = () => {
  const refresh = async (): Promise<string | null> => {
    const oldRefreshToken = localStorage.getItem('refreshToken');
    if (!oldRefreshToken) return null;

    try {
      // Ttteeee Requirement: "/refresh logic checks if that refreshToken still exists in DB"
      // authService.refresh handles the API call and returns the clean data object
      const data = await authService.refresh(oldRefreshToken);
      
      const newAccessToken = data.accessToken;
      
      localStorage.setItem('accessToken', newAccessToken); 
      return newAccessToken;
    } catch {
      // Requirement: Invalidate/Clear client side on failure (e.g., 403 Revoked)
      console.warn("Session expired or revoked. Clearing storage.");
      localStorage.clear();
      return null;
    }
  };
  return refresh;
};