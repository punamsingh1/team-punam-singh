import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosError } from 'axios';

// 1. Extend the Axios interface to include our custom '_retry' property
// This replaces the need for 'as any'
interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
}

interface FailedRequest {
  resolve: (token: string | null) => void;
  reject: (error: AxiosError | Error) => void;
}

let isRefreshing = false;
let failedQueue: FailedRequest[] = [];

const processQueue = (error: AxiosError | Error | null, token: string | null = null): void => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// 2. Create the Instance
export const api: AxiosInstance = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// 3. Request Interceptor
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('accessToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// 4. Response Interceptor
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    // Cast the config to our custom interface instead of 'any'
    const originalRequest = error.config as CustomAxiosRequestConfig;

    if (!originalRequest) {
      return Promise.reject(error);
    }

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      
      if (isRefreshing) {
        return new Promise<string | null>((resolve, reject) => {
          failedQueue.push({ 
            resolve: (token) => resolve(token), 
            reject: (err) => reject(err) 
          });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      // Now this is type-safe! No 'any' used here.
      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error("No refresh token available");

        const res = await axios.post<LoginResponse>('/api/auth/refresh', { 
          refreshToken 
        });

        const { accessToken } = res.data;
        localStorage.setItem('accessToken', accessToken);

        processQueue(null, accessToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }
        return api(originalRequest);

      } catch (refreshError) {
        const typedError = refreshError instanceof Error ? refreshError : new Error('Refresh failed');
        processQueue(typedError, null);
        localStorage.clear();
        if (typeof window !== 'undefined') {
          window.location.replace('/login?error=session_expired');
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      localStorage.clear();
      if (typeof window !== 'undefined') {
        window.location.replace('/login?error=session_revoked');
      }
    }

    return Promise.reject(error);
  }
);