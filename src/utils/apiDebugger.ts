/**
 * 🔍 COMPREHENSIVE API DEBUGGER
 * Diagnoses and fixes API connectivity issues
 */

import { API_CONFIG, getApiUrl } from '@/config/api';
import { getCurrentAuthToken, getAuthHeaders } from './authUtils';

interface APIDebugResult {
  endpoint: string;
  success: boolean;
  status: number;
  statusText: string;
  responseType: 'json' | 'html' | 'text' | 'error';
  data?: any;
  error?: string;
  headers?: Record<string, string>;
}

/**
 * Test a single API endpoint with comprehensive logging
 */
export const debugAPIEndpoint = async (
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: any
): Promise<APIDebugResult> => {
  console.log(`🔍 Testing API endpoint: ${method} ${endpoint}`);
  
  const fullUrl = getApiUrl(endpoint);
  console.log(`📍 Full URL: ${fullUrl}`);
  
  const headers = getAuthHeaders();
  console.log(`📋 Headers:`, headers);
  
  try {
    const response = await fetch(fullUrl, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: body ? JSON.stringify(body) : undefined
    });
    
    console.log(`📡 Response status: ${response.status} ${response.statusText}`);
    console.log(`📋 Response headers:`, Object.fromEntries(response.headers.entries()));
    
    const contentType = response.headers.get('content-type') || '';
    let responseType: APIDebugResult['responseType'] = 'text';
    let data: any = null;
    
    const responseText = await response.text();
    console.log(`📄 Raw response (first 500 chars):`, responseText.substring(0, 500));
    
    if (contentType.includes('application/json')) {
      try {
        data = JSON.parse(responseText);
        responseType = 'json';
        console.log(`✅ Valid JSON response:`, data);
      } catch (parseError) {
        console.error(`❌ JSON parse error:`, parseError);
        responseType = 'text';
        data = responseText;
      }
    } else if (responseText.includes('<!DOCTYPE') || responseText.includes('<html>')) {
      responseType = 'html';
      console.error(`❌ Received HTML instead of JSON - this indicates a server error or wrong endpoint`);
      data = responseText;
    } else {
      responseType = 'text';
      data = responseText;
    }
    
    return {
      endpoint,
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      responseType,
      data,
      headers: Object.fromEntries(response.headers.entries())
    };
    
  } catch (error) {
    console.error(`❌ Network error testing ${endpoint}:`, error);
    return {
      endpoint,
      success: false,
      status: 0,
      statusText: 'Network Error',
      responseType: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Run comprehensive API diagnostics
 */
export const runAPIHealthCheck = async (): Promise<APIDebugResult[]> => {
  console.log('🚀 Starting comprehensive API health check...');
  console.log('🌐 Current API configuration:', API_CONFIG);
  
  const token = getCurrentAuthToken();
  console.log('🔐 Auth token status:', {
    exists: !!token,
    length: token?.length || 0,
    prefix: token?.substring(0, 20) + '...' || 'N/A'
  });
  
  const endpoints = [
    // Basic health check
    { path: '/health', name: 'Health Check' },
    { path: '/api/health', name: 'API Health Check' },
    
    // Authentication endpoints
    { path: '/api/auth/validate', name: 'Auth Validation' },
    { path: '/api/auth/refresh', name: 'Auth Refresh' },
    
    // Core functionality
    { path: '/api/posts', name: 'Posts API' },
    { path: '/api/users', name: 'Users API' },
    { path: '/api/experts', name: 'Experts API' },
    
    // Sanctuary endpoints
    { path: '/api/sanctuary', name: 'Sanctuary API' },
    { path: '/api/flagship-sanctuary', name: 'Flagship Sanctuary API' },
    
    // Admin endpoints
    { path: '/api/admin', name: 'Admin API' },
  ];
  
  const results: APIDebugResult[] = [];
  
  for (const endpoint of endpoints) {
    console.log(`\n🔍 Testing: ${endpoint.name}`);
    const result = await debugAPIEndpoint(endpoint.path);
    results.push(result);
    
    // Add a small delay to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Summary
  console.log('\n📊 API Health Check Summary:');
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const htmlResponses = results.filter(r => r.responseType === 'html').length;
  
  console.log(`✅ Successful: ${successful}/${results.length}`);
  console.log(`❌ Failed: ${failed}/${results.length}`);
  console.log(`🌐 HTML responses (problematic): ${htmlResponses}/${results.length}`);
  
  if (htmlResponses > 0) {
    console.error(`\n🚨 CRITICAL ISSUE: ${htmlResponses} endpoints returned HTML instead of JSON`);
    console.error('This indicates:');
    console.error('1. Backend server may be down');
    console.error('2. Incorrect API base URL configuration');
    console.error('3. Server is serving frontend files instead of API responses');
    console.error('4. CORS or routing issues');
  }
  
  return results;
};

/**
 * Test specific breakout room functionality
 */
export const debugBreakoutRoomAPI = async (sessionId: string): Promise<void> => {
  console.log(`🔍 Testing breakout room API for session: ${sessionId}`);
  
  const endpoints = [
    { path: `/api/flagship-sanctuary/${sessionId}`, name: 'Get Session' },
    { path: `/api/flagship-sanctuary/${sessionId}/breakout-rooms`, name: 'Get Breakout Rooms' },
    { path: `/api/flagship-sanctuary/${sessionId}/participants`, name: 'Get Participants' },
  ];
  
  for (const endpoint of endpoints) {
    await debugAPIEndpoint(endpoint.path);
  }
  
  // Test creating a breakout room
  console.log(`\n🔍 Testing breakout room creation for session: ${sessionId}`);
  await debugAPIEndpoint(
    `/api/flagship-sanctuary/${sessionId}/breakout-rooms`,
    'POST',
    {
      name: 'Debug Test Room',
      topic: 'API Debug Test',
      maxParticipants: 4,
      duration: 15
    }
  );
};

/**
 * Test post creation functionality
 */
export const debugPostCreation = async (): Promise<void> => {
  console.log('🔍 Testing post creation API...');
  
  // First test getting posts
  await debugAPIEndpoint('/api/posts');
  
  // Then test creating a post
  await debugAPIEndpoint('/api/posts', 'POST', {
    content: 'Test post from API debugger',
    authorId: 'test-user',
    anonymous: false
  });
};

/**
 * Test admin functionality
 */
export const debugAdminAPI = async (): Promise<void> => {
  console.log('🔍 Testing admin API...');
  
  const endpoints = [
    { path: '/api/admin/dashboard', name: 'Admin Dashboard' },
    { path: '/api/admin/users', name: 'Admin Users' },
    { path: '/api/admin/experts', name: 'Admin Experts' },
    { path: '/api/admin/analytics', name: 'Admin Analytics' },
  ];
  
  for (const endpoint of endpoints) {
    await debugAPIEndpoint(endpoint.path);
  }
};

/**
 * Add debugging functions to window for console access
 */
if (typeof window !== 'undefined') {
  (window as any).debugAPI = {
    healthCheck: runAPIHealthCheck,
    endpoint: debugAPIEndpoint,
    breakoutRooms: debugBreakoutRoomAPI,
    posts: debugPostCreation,
    admin: debugAdminAPI
  };
  
  console.log('🔧 API debugging tools available:');
  console.log('- debugAPI.healthCheck() - Run full API health check');
  console.log('- debugAPI.endpoint(path, method, body) - Test specific endpoint');
  console.log('- debugAPI.breakoutRooms(sessionId) - Test breakout room APIs');
  console.log('- debugAPI.posts() - Test post creation');
  console.log('- debugAPI.admin() - Test admin APIs');
}

export default {
  runAPIHealthCheck,
  debugAPIEndpoint,
  debugBreakoutRoomAPI,
  debugPostCreation,
  debugAdminAPI
};