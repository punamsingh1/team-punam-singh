/**
 * --- IDENTITY MODELS ---
 */

/**
 * Standard User Profile
 */
export interface User {
  id: string;
  email: string;
  name?: string;
}

/**
 * CouchDB Session Document Structure
 * Requirement: Device-Aware CouchDB Session
 */
export interface UserSession {
  _id: string;          // Mandatory CouchDB Document ID
  deviceName: string;   // Hardware identifier (e.g., "Chrome on MacOS")
  isCurrent: boolean;   // Logical check against the active session
  lastActive?: string;  // ISO Timestamp for activity tracking
  ipAddress?: string;   // Network location tracking
}

/**
 * --- REQUEST PAYLOADS (The "Contracts") ---
 */

/**
 * Ttteeee Requirement: Device-Aware Credentials
 * Mandatory contract for the login payload to track hardware metadata.
 */
export interface DeviceAwareCredentials {
  email: string;
  password: string;
  deviceName: string; 
}

/**
 * --- API RESPONSE SHAPES ---
 */

/**
 * Standard API Login Response
 */
export interface LoginResponse {
  success: boolean;
  accessToken: string;
  refreshToken: string;
  user: User;
}

/**
 * API Response for the Sessions List
 */
export interface GetSessionsResponse {
  success: boolean;
  sessions: UserSession[];
}

/**
 * Ttteeee Requirement: Professional Dashboard Model
 * Groups the user profile and their active CouchDB sessions for the UI.
 */
export interface DashboardData {
  user: User;
  activeSessions: UserSession[];
}