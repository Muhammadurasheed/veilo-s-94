/**
 * 🔄 BACKEND CONNECTION MANAGER
 * Intelligent connection management with automatic failover and recovery
 */

import { API_CONFIG, getApiUrl } from '@/config/api';
import { toast } from '@/hooks/use-toast';
import backendHealthService from './backendHealthService';

interface ConnectionAttempt {
  url: string;
  timestamp: number;
  success: boolean;
  latency?: number;
  error?: string;
}

class BackendConnectionManager {
  private attempts: ConnectionAttempt[] = [];
  private currentBackendUrl: string = API_CONFIG.BASE_URL;
  private fallbackUrls: string[] = [
    'https://veilos-backend.onrender.com',
    'http://localhost:3001',
    'http://localhost:3000'
  ];

  constructor() {
    this.initialize();
  }

  private async initialize() {
    console.log('🔄 Initializing Backend Connection Manager...');
    console.log('🎯 Primary Backend URL:', this.currentBackendUrl);
    console.log('🔄 Fallback URLs:', this.fallbackUrls);
    
    // Start with health check
    await this.findHealthyBackend();
  }

  /**
   * Find a healthy backend from available options
   */
  async findHealthyBackend(): Promise<string> {
    const urlsToTry = [this.currentBackendUrl, ...this.fallbackUrls];
    
    for (const url of urlsToTry) {
      console.log(`🔍 Testing backend: ${url}`);
      
      const attempt = await this.testBackendConnection(url);
      this.attempts.push(attempt);
      
      if (attempt.success) {
        console.log(`✅ Found healthy backend: ${url} (${attempt.latency}ms)`);
        this.currentBackendUrl = url;
        
        // Update API config to use healthy backend
        (API_CONFIG as any).BASE_URL = url;
        (API_CONFIG as any).BACKEND_URL = url;
        (API_CONFIG as any).API_URL = url;
        
        return url;
      }
    }
    
    console.error('❌ No healthy backend found!');
    toast({
      title: "All Backends Offline",
      description: "Unable to connect to any backend server. Please check your connection.",
      variant: "destructive"
    });
    
    return this.currentBackendUrl; // Return original as fallback
  }

  /**
   * Test connection to a specific backend URL
   */
  private async testBackendConnection(url: string): Promise<ConnectionAttempt> {
    const startTime = Date.now();
    
    try {
      const healthUrl = url.endsWith('/') ? `${url}api/health` : `${url}/api/health`;
      
      const response = await fetch(healthUrl, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      
      const latency = Date.now() - startTime;
      const responseText = await response.text();
      
      // Check if backend is returning HTML instead of JSON
      if (responseText.includes('<!DOCTYPE') || responseText.includes('<html>')) {
        return {
          url,
          timestamp: Date.now(),
          success: false,
          latency,
          error: 'Backend returning HTML instead of JSON'
        };
      }
      
      // Try to parse JSON
      try {
        JSON.parse(responseText);
        
        return {
          url,
          timestamp: Date.now(),
          success: response.ok,
          latency,
          error: response.ok ? undefined : `HTTP ${response.status}`
        };
      } catch (parseError) {
        return {
          url,
          timestamp: Date.now(),
          success: false,
          latency,
          error: 'Invalid JSON response'
        };
      }
      
    } catch (error) {
      const latency = Date.now() - startTime;
      
      return {
        url,
        timestamp: Date.now(),
        success: false,
        latency,
        error: error instanceof Error ? error.message : 'Connection failed'
      };
    }
  }

  /**
   * Get the current healthy backend URL
   */
  getCurrentBackendUrl(): string {
    return this.currentBackendUrl;
  }

  /**
   * Force re-evaluation of backend health
   */
  async refreshBackendConnection(): Promise<string> {
    console.log('🔄 Refreshing backend connection...');
    return await this.findHealthyBackend();
  }

  /**
   * Get connection attempt history
   */
  getConnectionHistory(): ConnectionAttempt[] {
    return [...this.attempts];
  }

  /**
   * Get connection statistics
   */
  getConnectionStats() {
    const successful = this.attempts.filter(a => a.success).length;
    const failed = this.attempts.filter(a => !a.success).length;
    const avgLatency = this.attempts
      .filter(a => a.success && a.latency)
      .reduce((sum, a) => sum + (a.latency || 0), 0) / successful || 0;
    
    return {
      totalAttempts: this.attempts.length,
      successful,
      failed,
      successRate: successful / this.attempts.length,
      averageLatency: Math.round(avgLatency),
      currentBackend: this.currentBackendUrl
    };
  }
}

// Create singleton instance
export const backendConnectionManager = new BackendConnectionManager();

// Export for debugging
if (typeof window !== 'undefined') {
  (window as any).backendConnection = {
    refresh: () => backendConnectionManager.refreshBackendConnection(),
    current: () => backendConnectionManager.getCurrentBackendUrl(),
    stats: () => backendConnectionManager.getConnectionStats(),
    history: () => backendConnectionManager.getConnectionHistory()
  };
  
  console.log('🔄 Backend connection management tools available:');
  console.log('- backendConnection.refresh() - Find healthy backend');
  console.log('- backendConnection.current() - Get current backend URL');
  console.log('- backendConnection.stats() - Get connection statistics');
  console.log('- backendConnection.history() - Get connection history');
}

export default backendConnectionManager;