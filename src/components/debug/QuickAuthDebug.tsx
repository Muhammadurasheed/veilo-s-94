/**
 * 🐛 QUICK AUTH DEBUG COMPONENT
 * Inline debugging for authentication issues
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { tokenManager } from '@/services/tokenManager';
import { useAuth } from '@/contexts/optimized/AuthContextRefactored';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  RefreshCw,
  Bug
} from 'lucide-react';

export const QuickAuthDebug: React.FC = () => {
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const [tokenInfo, setTokenInfo] = useState<any>(null);
  const [testResult, setTestResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const checkTokenStatus = () => {
    const token = tokenManager.getToken();
    const hasToken = tokenManager.hasToken();
    
    setTokenInfo({
      hasToken,
      tokenLength: token ? token.length : 0,
      tokenPrefix: token ? token.substring(0, 30) + '...' : 'No token',
      isAuthenticated,
      user: user ? {
        id: user.id,
        alias: user.alias,
        role: user.role
      } : null
    });
  };

  const testAuth = async () => {
    setIsLoading(true);
    setTestResult(null);

    try {
      const headers = tokenManager.getAuthHeaders();
      console.log('🔐 Testing with headers:', headers);

      const response = await fetch('/api/debug/auth-test', {
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      setTestResult({
        success: response.ok,
        status: response.status,
        data,
        headers: Object.keys(headers)
      });

      if (response.ok) {
        toast({
          title: "✅ Auth Test Passed",
          description: "Authentication is working correctly",
          duration: 3000
        });
      } else {
        toast({
          title: "❌ Auth Test Failed",
          description: data.error || 'Authentication failed',
          variant: "destructive",
          duration: 5000
        });
      }

    } catch (error) {
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      toast({
        title: "❌ Network Error",
        description: "Could not connect to server",
        variant: "destructive",
        duration: 5000
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkTokenStatus();
  }, [user, isAuthenticated]);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-background border rounded-lg shadow-lg p-4 max-w-sm">
        <div className="flex items-center space-x-2 mb-3">
          <Bug className="h-4 w-4 text-orange-500" />
          <span className="font-semibold text-sm">Auth Debug</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={checkTokenStatus}
            className="h-6 w-6 p-0"
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span>Authenticated:</span>
            {isAuthenticated ? (
              <Badge variant="default" className="text-xs">
                <CheckCircle className="h-3 w-3 mr-1" />
                Yes
              </Badge>
            ) : (
              <Badge variant="destructive" className="text-xs">
                <XCircle className="h-3 w-3 mr-1" />
                No
              </Badge>
            )}
          </div>

          <div className="flex items-center justify-between">
            <span>Token:</span>
            {tokenInfo?.hasToken ? (
              <Badge variant="secondary" className="text-xs">
                {tokenInfo.tokenLength} chars
              </Badge>
            ) : (
              <Badge variant="destructive" className="text-xs">
                Missing
              </Badge>
            )}
          </div>

          {user && (
            <div className="flex items-center justify-between">
              <span>User:</span>
              <Badge variant="outline" className="text-xs">
                {user.alias}
              </Badge>
            </div>
          )}

          <Button
            onClick={testAuth}
            disabled={isLoading}
            size="sm"
            className="w-full text-xs"
          >
            <Shield className="h-3 w-3 mr-1" />
            {isLoading ? 'Testing...' : 'Test Auth'}
          </Button>

          {testResult && (
            <div className={`p-2 rounded text-xs ${
              testResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              <div className="font-semibold">
                {testResult.success ? '✅ Success' : '❌ Failed'}
              </div>
              <div>Status: {testResult.status}</div>
              {testResult.headers && (
                <div>Headers: {testResult.headers.join(', ')}</div>
              )}
              {testResult.error && (
                <div>Error: {testResult.error}</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};