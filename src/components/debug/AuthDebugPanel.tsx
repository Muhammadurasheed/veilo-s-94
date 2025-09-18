/**
 * 🔍 AUTHENTICATION DEBUG PANEL
 * Comprehensive debugging tool for authentication issues
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Key, 
  User, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw,
  Copy,
  Eye,
  EyeOff
} from 'lucide-react';
import { getCurrentAuthToken, isTokenValid, getUserFromToken, debugAuthState, clearAuthTokens } from '@/utils/authUtils';
import { useAuth } from '@/contexts/optimized/AuthContextRefactored';

interface AuthDebugPanelProps {
  isVisible?: boolean;
  onClose?: () => void;
}

export const AuthDebugPanel: React.FC<AuthDebugPanelProps> = ({
  isVisible = false,
  onClose
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [authState, setAuthState] = useState<any>(null);
  const [showToken, setShowToken] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Update auth state
  const updateAuthState = () => {
    const token = getCurrentAuthToken();
    const isValid = isTokenValid(token || '');
    const userFromToken = getUserFromToken();
    
    setAuthState({
      token,
      isValid,
      userFromToken,
      contextUser: user,
      isAuthenticated,
      isLoading,
      tokenSources: {
        localStorage: {
          'veilo-auth-token': localStorage.getItem('veilo-auth-token'),
          'admin_token': localStorage.getItem('admin_token'),
          'token': localStorage.getItem('token')
        },
        sessionStorage: {
          'veilo-auth-token': sessionStorage.getItem('veilo-auth-token'),
          'admin_token': sessionStorage.getItem('admin_token'),
          'token': sessionStorage.getItem('token')
        }
      }
    });
  };

  useEffect(() => {
    if (isVisible) {
      updateAuthState();
    }
  }, [isVisible, user, isAuthenticated, isLoading]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    debugAuthState();
    updateAuthState();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleCopyToken = () => {
    if (authState?.token) {
      navigator.clipboard.writeText(authState.token);
    }
  };

  const handleClearTokens = () => {
    clearAuthTokens();
    updateAuthState();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Authentication Debug Panel</span>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                ×
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Overall Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span className="text-sm font-medium">Auth Context</span>
                  </div>
                  <Badge variant={isAuthenticated ? 'default' : 'destructive'}>
                    {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
                  </Badge>
                </div>
                {isLoading && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    Loading...
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Key className="h-4 w-4" />
                    <span className="text-sm font-medium">Token Status</span>
                  </div>
                  <Badge variant={authState?.isValid ? 'default' : 'destructive'}>
                    {authState?.token ? (authState.isValid ? 'Valid' : 'Invalid') : 'Missing'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">System Status</span>
                  </div>
                  <Badge variant={authState?.token && authState?.isValid && isAuthenticated ? 'default' : 'secondary'}>
                    {authState?.token && authState?.isValid && isAuthenticated ? 'Healthy' : 'Issues Detected'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Token Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <Key className="h-4 w-4" />
                <span>Token Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Current Token:</span>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowToken(!showToken)}
                  >
                    {showToken ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </Button>
                  {authState?.token && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyToken}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
              
              <div className="bg-muted p-3 rounded text-xs font-mono break-all">
                {authState?.token ? (
                  showToken ? authState.token : `${authState.token.substring(0, 50)}...`
                ) : (
                  'No token found'
                )}
              </div>

              {authState?.userFromToken && (
                <div>
                  <span className="text-sm font-medium">Token Payload:</span>
                  <pre className="bg-muted p-3 rounded text-xs overflow-x-auto mt-2">
                    {JSON.stringify(authState.userFromToken, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>

          {/* User Context */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span>User Context</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
                {JSON.stringify({
                  contextUser: user,
                  isAuthenticated,
                  isLoading
                }, null, 2)}
              </pre>
            </CardContent>
          </Card>

          {/* Token Storage */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <Shield className="h-4 w-4" />
                <span>Token Storage</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">localStorage:</h4>
                <div className="space-y-1">
                  {Object.entries(authState?.tokenSources?.localStorage || {}).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between text-xs">
                      <span className="font-mono">{key}:</span>
                      <span className="text-muted-foreground">
                        {value ? `${(value as string).substring(0, 20)}...` : 'null'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">sessionStorage:</h4>
                <div className="space-y-1">
                  {Object.entries(authState?.tokenSources?.sessionStorage || {}).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between text-xs">
                      <span className="font-mono">{key}:</span>
                      <span className="text-muted-foreground">
                        {value ? `${(value as string).substring(0, 20)}...` : 'null'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end space-x-2">
            <Button
              variant="destructive"
              onClick={handleClearTokens}
            >
              Clear All Tokens
            </Button>
            <Button
              variant="outline"
              onClick={handleRefresh}
            >
              Refresh State
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};