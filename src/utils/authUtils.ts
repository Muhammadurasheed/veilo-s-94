/**
 * 🔐 AUTHENTICATION UTILITIES
 * Helper functions for managing authentication tokens and user context
 */

/**
 * Get the current authentication token from various storage locations
 */
export const getCurrentAuthToken = (): string | null => {
  // Try multiple token storage locations in order of preference
  const tokenSources = [
    'veilo-auth-token',
    'admin_token', 
    'token',
    'authToken',
    'jwt_token'
  ];

  for (const source of tokenSources) {
    try {
      const token = localStorage.getItem(source);
      if (token && token.trim()) {
        console.log(`🔐 Found auth token in: ${source}`);
        return token.trim();
      }
    } catch (error) {
      console.warn(`Failed to read token from ${source}:`, error);
    }
  }

  // Try sessionStorage as fallback
  for (const source of tokenSources) {
    try {
      const token = sessionStorage.getItem(source);
      if (token && token.trim()) {
        console.log(`🔐 Found auth token in sessionStorage: ${source}`);
        return token.trim();
      }
    } catch (error) {
      console.warn(`Failed to read token from sessionStorage ${source}:`, error);
    }
  }

  console.warn('❌ No authentication token found in any storage location');
  return null;
};

/**
 * Get enhanced authentication headers for API requests
 */
export const getAuthHeaders = (): Record<string, string> => {
  const token = getCurrentAuthToken();
  
  if (!token) {
    console.warn('❌ No token available for auth headers');
    return {};
  }

  return {
    'Authorization': `Bearer ${token}`,
    'x-auth-token': token,
    'auth-token': token
  };
};

/**
 * Validate if a token exists and appears to be valid format
 */
export const isTokenValid = (token?: string): boolean => {
  const authToken = token || getCurrentAuthToken();
  
  if (!authToken) {
    return false;
  }

  // Basic JWT format validation (should have 3 parts separated by dots)
  const parts = authToken.split('.');
  if (parts.length !== 3) {
    console.warn('❌ Token does not appear to be valid JWT format');
    return false;
  }

  try {
    // Try to decode the payload (middle part)
    const payload = JSON.parse(atob(parts[1]));
    
    // Check if token is expired
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      console.warn('❌ Token appears to be expired');
      return false;
    }

    return true;
  } catch (error) {
    console.warn('❌ Failed to decode token payload:', error);
    return false;
  }
};

/**
 * Get user information from the current token
 */
export const getUserFromToken = (): any | null => {
  const token = getCurrentAuthToken();
  
  if (!token || !isTokenValid(token)) {
    return null;
  }

  try {
    const parts = token.split('.');
    const payload = JSON.parse(atob(parts[1]));
    
    console.log('🔍 Token payload structure:', {
      hasUser: !!payload.user,
      hasUserData: !!payload.userData,
      hasId: !!payload.id,
      hasUserId: !!payload.userId,
      keys: Object.keys(payload)
    });
    
    // Extract user info (support multiple formats)
    let user = payload.user || payload.userData || payload;
    
    // Ensure we have an ID field in a consistent format
    if (user && !user.id) {
      user.id = user.userId || user._id || payload.id || payload.userId || payload._id;
    }
    
    console.log('🔍 Extracted user from token:', {
      id: user?.id,
      userId: user?.userId,
      _id: user?._id,
      alias: user?.alias
    });
    
    return user;
  } catch (error) {
    console.error('❌ Failed to extract user from token:', error);
    return null;
  }
};

/**
 * Clear all authentication tokens
 */
export const clearAuthTokens = (): void => {
  const tokenSources = [
    'veilo-auth-token',
    'admin_token', 
    'token',
    'authToken',
    'jwt_token'
  ];

  // Clear from localStorage
  tokenSources.forEach(source => {
    try {
      localStorage.removeItem(source);
    } catch (error) {
      console.warn(`Failed to clear ${source} from localStorage:`, error);
    }
  });

  // Clear from sessionStorage
  tokenSources.forEach(source => {
    try {
      sessionStorage.removeItem(source);
    } catch (error) {
      console.warn(`Failed to clear ${source} from sessionStorage:`, error);
    }
  });

  console.log('🔐 All authentication tokens cleared');
};

/**
 * Debug authentication state
 */
export const debugAuthState = (): void => {
  console.log('🔍 Authentication Debug State:');
  
  const token = getCurrentAuthToken();
  console.log('Current Token:', token ? `${token.substring(0, 20)}...` : 'None');
  
  const isValid = isTokenValid(token || '');
  console.log('Token Valid:', isValid);
  
  const user = getUserFromToken();
  console.log('User from Token:', user);
  
  // Check all storage locations
  const tokenSources = ['veilo-auth-token', 'admin_token', 'token'];
  tokenSources.forEach(source => {
    const localToken = localStorage.getItem(source);
    const sessionToken = sessionStorage.getItem(source);
    console.log(`${source}:`, {
      localStorage: localToken ? `${localToken.substring(0, 10)}...` : 'None',
      sessionStorage: sessionToken ? `${sessionToken.substring(0, 10)}...` : 'None'
    });
  });
};