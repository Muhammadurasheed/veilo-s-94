/**
 * 🔐 ENHANCED ADMIN LOGIN FLOW
 * Fixes admin login redirection issues
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { adminService } from '@/services/apiService';
import { getCurrentAuthToken } from '@/utils/authUtils';
import { Shield, Eye, EyeOff, Loader2 } from 'lucide-react';

export const AdminLoginFlow: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Missing Information",
        description: "Please enter both email and password",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    console.log('🔐 Starting admin login process...');

    try {
      const result = await adminService.login({ email, password });
      
      if (result.success && result.data) {
        console.log('✅ Admin login successful:', result.data);
        
        // Extract token and user data
        const { token, admin, user } = result.data;
        
        if (!token) {
          throw new Error('No token received from server');
        }
        
        // Store authentication token
        localStorage.setItem('veilo-auth-token', token);
        console.log('✅ Token stored successfully');
        
        // Store admin user data
        localStorage.setItem('admin-user', JSON.stringify(admin || user));
        console.log('✅ Admin user data stored');
        
        // Show success message
        toast({
          title: "Login Successful",
          description: `Welcome back, ${(admin || user)?.alias || 'Admin'}!`,
          variant: "default"
        });
        
        // Navigate to admin panel with a small delay to ensure state updates
        console.log('🔄 Redirecting to admin panel...');
        setTimeout(() => {
          navigate('/admin', { replace: true });
          console.log('✅ Navigation completed');
        }, 100);
        
      } else {
        throw new Error(result.error || 'Login failed');
      }
    } catch (error) {
      console.error('❌ Admin login failed:', error);
      toast({
        title: "Login Failed", 
        description: error instanceof Error ? error.message : 'Please check your credentials and try again',
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Admin Login</CardTitle>
          <p className="text-muted-foreground">
            Access the Veilo admin dashboard
          </p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@veilo.com"
                required
                disabled={isLoading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                'Login'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLoginFlow;