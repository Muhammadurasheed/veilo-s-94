/**
 * 🚨 EMERGENCY API HANDLER
 * Handles situations where the backend is returning HTML instead of JSON
 */

import { toast } from '@/hooks/use-toast';

export interface APIFallbackResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  isEmergencyMode?: boolean;
}

/**
 * Detect if response is HTML instead of JSON
 */
export const isHTMLResponse = (responseText: string): boolean => {
  return responseText.trim().startsWith('<!DOCTYPE') || 
         responseText.trim().startsWith('<html') ||
         responseText.includes('<title>') ||
         responseText.includes('<body>');
};

/**
 * Emergency API request handler with fallback mechanisms
 */
export const emergencyApiRequest = async <T = any>(
  url: string,
  options: RequestInit = {}
): Promise<APIFallbackResponse<T>> => {
  try {
    console.log('🚨 Emergency API request:', url);
    
    const response = await fetch(url, options);
    const responseText = await response.text();
    
    // Check if backend is returning HTML instead of JSON
    if (isHTMLResponse(responseText)) {
      console.error('🚨 CRITICAL: Backend returning HTML instead of JSON');
      console.error('Response preview:', responseText.substring(0, 200));
      
      // Show user-friendly error
      toast({
        title: 'Backend Connection Issue',
        description: 'The server is currently unavailable. Using offline mode.',
        variant: 'destructive'
      });
      
      return {
        success: false,
        error: 'Backend server is unavailable - returned HTML instead of JSON',
        isEmergencyMode: true
      };
    }
    
    // Try to parse as JSON
    let data: any = null;
    if (responseText) {
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('🚨 JSON parse error:', parseError);
        return {
          success: false,
          error: 'Invalid response format from server',
          isEmergencyMode: true
        };
      }
    }
    
    if (!response.ok) {
      return {
        success: false,
        error: data?.message || data?.error || `HTTP ${response.status}`,
        isEmergencyMode: false
      };
    }
    
    return {
      success: true,
      data: data?.data || data,
      isEmergencyMode: false
    };
    
  } catch (error) {
    console.error('🚨 Emergency API request failed:', error);
    
    // Network error - backend might be completely down
    toast({
      title: 'Network Error',
      description: 'Cannot connect to server. Check your internet connection.',
      variant: 'destructive'
    });
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
      isEmergencyMode: true
    };
  }
};

/**
 * Emergency post creation (stores locally when backend is down)
 */
export const emergencyCreatePost = async (postData: any): Promise<APIFallbackResponse> => {
  console.log('🚨 Emergency post creation - storing locally');
  
  try {
    // Get existing emergency posts
    const existingPosts = JSON.parse(localStorage.getItem('emergency_posts') || '[]');
    
    // Create new post with emergency ID
    const newPost = {
      id: `emergency_${Date.now()}`,
      ...postData,
      createdAt: new Date().toISOString(),
      isEmergencyMode: true,
      status: 'pending_sync'
    };
    
    // Store locally
    existingPosts.unshift(newPost);
    localStorage.setItem('emergency_posts', JSON.stringify(existingPosts));
    
    // Show success message
    toast({
      title: 'Post Saved Offline',
      description: 'Your post will sync when the server is back online.',
      variant: 'default'
    });
    
    return {
      success: true,
      data: newPost,
      isEmergencyMode: true
    };
  } catch (error) {
    console.error('🚨 Emergency post storage failed:', error);
    return {
      success: false,
      error: 'Failed to save post offline',
      isEmergencyMode: true
    };
  }
};

/**
 * Get emergency posts from local storage
 */
export const getEmergencyPosts = (): any[] => {
  try {
    return JSON.parse(localStorage.getItem('emergency_posts') || '[]');
  } catch (error) {
    console.error('Failed to get emergency posts:', error);
    return [];
  }
};

/**
 * Clear emergency posts (when backend is back online)
 */
export const clearEmergencyPosts = (): void => {
  localStorage.removeItem('emergency_posts');
  console.log('✅ Emergency posts cleared');
};

/**
 * Check backend health and show status
 */
export const checkBackendHealth = async (): Promise<boolean> => {
  try {
    const response = await fetch('/api/health', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    const text = await response.text();
    
    if (isHTMLResponse(text)) {
      console.error('🚨 Backend health check failed - returning HTML');
      return false;
    }
    
    return response.ok;
  } catch (error) {
    console.error('🚨 Backend health check failed:', error);
    return false;
  }
};

export default {
  emergencyApiRequest,
  emergencyCreatePost,
  getEmergencyPosts,
  clearEmergencyPosts,
  checkBackendHealth,
  isHTMLResponse
};