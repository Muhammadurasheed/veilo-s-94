/**
 * 🔧 ROBUST API SERVICE
 * Enterprise-grade API service with comprehensive error handling
 */

import { API_CONFIG, getApiUrl } from '@/config/api';
import { getCurrentAuthToken, getAuthHeaders } from '@/utils/authUtils';

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  status: number;
  message?: string;
}

export class APIError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public response?: string,
    message?: string
  ) {
    super(message || `API Error: ${status} ${statusText}`);
    this.name = 'APIError';
  }
}

/**
 * Enhanced fetch with comprehensive error handling
 */
export const apiRequest = async <T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<APIResponse<T>> => {
  const url = getApiUrl(endpoint);
  const headers = getAuthHeaders();
  
  console.log(`🔗 API Request: ${options.method || 'GET'} ${url}`);
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
        ...options.headers,
      },
    });
    
    console.log(`📡 API Response: ${response.status} ${response.statusText}`);
    
    // Get response text first to handle both JSON and HTML responses
    const responseText = await response.text();
    
    // Check if response is HTML (indicates server error)
    if (responseText.includes('<!DOCTYPE') || responseText.includes('<html>')) {
      console.error('❌ Received HTML instead of JSON:', responseText.substring(0, 200));
      throw new APIError(
        response.status,
        response.statusText,
        responseText,
        'Server returned HTML instead of JSON. This indicates a server-side error or incorrect routing.'
      );
    }
    
    // Try to parse as JSON
    let data: any = null;
    if (responseText) {
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ JSON parse error:', parseError);
        console.error('Raw response:', responseText);
        throw new APIError(
          response.status,
          response.statusText,
          responseText,
          'Invalid JSON response from server'
        );
      }
    }
    
    if (!response.ok) {
      console.error('❌ API request failed:', data);
      throw new APIError(
        response.status,
        response.statusText,
        responseText,
        data?.message || data?.error || 'API request failed'
      );
    }
    
    console.log('✅ API request successful:', data);
    
    return {
      success: true,
      data: data?.data || data,
      status: response.status,
      message: data?.message
    };
    
  } catch (error) {
    console.error('❌ API request error:', error);
    
    if (error instanceof APIError) {
      return {
        success: false,
        error: error.message,
        status: error.status
      };
    }
    
    // Network or other errors
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      status: 0
    };
  }
};

/**
 * GET request
 */
export const apiGet = async <T = any>(endpoint: string): Promise<APIResponse<T>> => {
  return apiRequest<T>(endpoint, { method: 'GET' });
};

/**
 * POST request
 */
export const apiPost = async <T = any>(
  endpoint: string,
  data?: any
): Promise<APIResponse<T>> => {
  return apiRequest<T>(endpoint, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });
};

/**
 * PUT request
 */
export const apiPut = async <T = any>(
  endpoint: string,
  data?: any
): Promise<APIResponse<T>> => {
  return apiRequest<T>(endpoint, {
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  });
};

/**
 * DELETE request
 */
export const apiDelete = async <T = any>(endpoint: string): Promise<APIResponse<T>> => {
  return apiRequest<T>(endpoint, { method: 'DELETE' });
};

/**
 * Specialized services for each domain
 */

// Posts Service
export const postsService = {
  getAll: () => apiGet('/api/posts'),
  create: (postData: any) => apiPost('/api/posts', postData),
  getById: (id: string) => apiGet(`/api/posts/${id}`),
  update: (id: string, data: any) => apiPut(`/api/posts/${id}`, data),
  delete: (id: string) => apiDelete(`/api/posts/${id}`)
};

// Breakout Rooms Service
export const breakoutRoomsService = {
  getAll: (sessionId: string) => apiGet(`/api/flagship-sanctuary/${sessionId}/breakout-rooms`),
  create: (sessionId: string, roomData: any) => 
    apiPost(`/api/flagship-sanctuary/${sessionId}/breakout-rooms`, roomData),
  join: (sessionId: string, roomId: string) => 
    apiPost(`/api/flagship-sanctuary/${sessionId}/breakout-rooms/${roomId}/join`),
  leave: (sessionId: string, roomId: string) => 
    apiPost(`/api/flagship-sanctuary/${sessionId}/breakout-rooms/${roomId}/leave`)
};

// Session Service
export const sessionService = {
  get: (sessionId: string) => apiGet(`/api/flagship-sanctuary/${sessionId}`),
  getParticipants: (sessionId: string) => apiGet(`/api/flagship-sanctuary/${sessionId}/participants`)
};

// Admin Service
export const adminService = {
  login: (credentials: any) => apiPost('/api/auth/admin/login', credentials),
  getDashboard: () => apiGet('/api/admin/dashboard'),
  getUsers: () => apiGet('/api/admin/users'),
  getExperts: () => apiGet('/api/admin/experts')
};

export default {
  request: apiRequest,
  get: apiGet,
  post: apiPost,
  put: apiPut,
  delete: apiDelete,
  posts: postsService,
  breakoutRooms: breakoutRoomsService,
  session: sessionService,
  admin: adminService
};