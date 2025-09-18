/**
 * 🔐 LOGIN PROMPT COMPONENT
 * Prompts users to log in when authentication is required
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, 
  LogIn, 
  AlertTriangle,
  UserPlus
} from 'lucide-react';

interface LoginPromptProps {
  title?: string;
  message?: string;
  feature?: string;
}

export const LoginPrompt: React.FC<LoginPromptProps> = ({
  title = "Authentication Required",
  message = "You need to be logged in to access this feature.",
  feature = "this feature"
}) => {
  const navigate = useNavigate();

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
          <Shield className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="flex items-center justify-center space-x-2">
          <span>{title}</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {message} Please log in or create an account to use {feature}.
          </AlertDescription>
        </Alert>

        <div className="flex flex-col space-y-2">
          <Button 
            onClick={() => navigate('/login')}
            className="flex items-center space-x-2"
          >
            <LogIn className="h-4 w-4" />
            <span>Log In</span>
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => navigate('/register')}
            className="flex items-center space-x-2"
          >
            <UserPlus className="h-4 w-4" />
            <span>Create Account</span>
          </Button>
        </div>

        <div className="text-center text-sm text-muted-foreground">
          <p>Already have an account? <button 
            onClick={() => navigate('/login')}
            className="text-primary hover:underline"
          >
            Sign in here
          </button></p>
        </div>
      </CardContent>
    </Card>
  );
};