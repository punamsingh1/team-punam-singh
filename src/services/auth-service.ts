import { api } from './api-instance';

/**
 * --- 1. THE CONTRACT (Interfaces) ---
 */
export interface User {
  id: string;
  email: string;
  name?: string; // Added name for Dashboard display
}

export interface UserSession {
  _id: string;
  deviceName: string;
  isCurrent: boolean;
  lastActive?: string;
  ipAddress?: string;
}

export interface LoginResponse {
  success: boolean;
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface GetSessionsResponse {
  success: boolean;
  sessions: UserSession[];
}

export interface RefreshResponse {
  success: boolean;
  accessToken: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  deviceName?: string;
}

/**
 * --- 2. THE SERVICE METHODS ---
 */
export const authService = {
  /**
   * 1. Login: Authenticates and PERSISTS tokens to LocalStorage.
   */
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const res = await api.post<LoginResponse>('/auth/login', credentials);
    
    // TTTEEEE CRITICAL PERSISTENCE: 
    // This allows the Dashboard to "see" that you are logged in.
    if (res.data.success) {
      localStorage.setItem('accessToken', res.data.accessToken);
      localStorage.setItem('refreshToken', res.data.refreshToken);
      localStorage.setItem('user', JSON.stringify(res.data.user));
    }
    
    return res.data; 
  },

  /**
   * 2. Refresh: Rotates Access Tokens for persistent security.
   */
  refresh: async (refreshToken: string): Promise<RefreshResponse> => {
    const res = await api.post<RefreshResponse>('/auth/refresh', { refreshToken });
    if (res.data.success) {
      localStorage.setItem('accessToken', res.data.accessToken);
    }
    return res.data;
  },

  /**
   * 3. Session List: Retrieves all device-aware sessions.
   */
  getSessions: async (): Promise<GetSessionsResponse> => {
    const res = await api.get<GetSessionsResponse>('/auth/sessions');
    return res.data; 
  },

  /**
   * 4. Selective Revoke: Remotely terminates a specific device session.
   */
  revokeSession: async (sessionId: string): Promise<{ success: boolean }> => {
    const res = await api.post<{ success: boolean }>('/auth/logout', { sessionId });
    return res.data;
  },

  /**
   * 5. Logout: Clears current device tokens and DB session.
   */
  logout: async (refreshToken: string): Promise<{ success: boolean }> => {
    try {
      const res = await api.post<{ success: boolean }>('/auth/logout', { refreshToken });
      return res.data;
    } finally {
      // Always clear local storage even if the server call fails
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
  }
};