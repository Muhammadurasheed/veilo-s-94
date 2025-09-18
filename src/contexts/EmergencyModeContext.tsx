/**
 * 🚨 EMERGENCY MODE CONTEXT
 * Handles offline functionality when backend is unavailable
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { checkBackendHealth, getEmergencyPosts } from '@/utils/emergencyApiHandler';
import { toast } from '@/hooks/use-toast';

interface EmergencyModeContextValue {
  isEmergencyMode: boolean;
  isBackendOnline: boolean;
  emergencyPosts: any[];
  setEmergencyMode: (enabled: boolean) => void;
  refreshBackendStatus: () => Promise<void>;
  addEmergencyPost: (post: any) => void;
}

const EmergencyModeContext = createContext<EmergencyModeContextValue | undefined>(undefined);

interface EmergencyModeProviderProps {
  children: ReactNode;
}

export const EmergencyModeProvider: React.FC<EmergencyModeProviderProps> = ({ children }) => {
  const [isEmergencyMode, setIsEmergencyMode] = useState(false);
  const [isBackendOnline, setIsBackendOnline] = useState(true);
  const [emergencyPosts, setEmergencyPosts] = useState<any[]>([]);

  // Check backend status on mount and periodically
  useEffect(() => {
    const checkStatus = async () => {
      const isOnline = await checkBackendHealth();
      setIsBackendOnline(isOnline);
      
      if (!isOnline && !isEmergencyMode) {
        setIsEmergencyMode(true);
        toast({
          title: 'Offline Mode Enabled',
          description: 'Backend is unavailable. Using local storage.',
          variant: 'destructive'
        });
      } else if (isOnline && isEmergencyMode) {
        setIsEmergencyMode(false);
        toast({
          title: 'Back Online',
          description: 'Backend connection restored!',
          variant: 'default'
        });
      }
    };

    // Initial check
    checkStatus();

    // Check every 30 seconds
    const interval = setInterval(checkStatus, 30000);

    return () => clearInterval(interval);
  }, [isEmergencyMode]);

  // Load emergency posts on mount
  useEffect(() => {
    const posts = getEmergencyPosts();
    setEmergencyPosts(posts);
  }, []);

  const setEmergencyMode = (enabled: boolean) => {
    setIsEmergencyMode(enabled);
  };

  const refreshBackendStatus = async () => {
    const isOnline = await checkBackendHealth();
    setIsBackendOnline(isOnline);
    
    if (!isOnline) {
      setIsEmergencyMode(true);
    }
  };

  const addEmergencyPost = (post: any) => {
    setEmergencyPosts(prev => [post, ...prev]);
  };

  const value: EmergencyModeContextValue = {
    isEmergencyMode,
    isBackendOnline,
    emergencyPosts,
    setEmergencyMode,
    refreshBackendStatus,
    addEmergencyPost
  };

  return (
    <EmergencyModeContext.Provider value={value}>
      {children}
    </EmergencyModeContext.Provider>
  );
};

export const useEmergencyMode = (): EmergencyModeContextValue => {
  const context = useContext(EmergencyModeContext);
  if (context === undefined) {
    throw new Error('useEmergencyMode must be used within an EmergencyModeProvider');
  }
  return context;
};

export default EmergencyModeContext;