/**
 * 🐛 AUTHENTICATION DEBUG PAGE
 * Dedicated page for debugging authentication issues
 */

import React from 'react';
import { AuthDebugPanel } from '@/components/debug/AuthDebugPanel';
import { SEOHead } from '@/components/seo/SEOHead';

export default function AuthDebug() {
  return (
    <>
      <SEOHead
        title="Authentication Debug - Veilo"
        description="Debug authentication issues and test token validity"
        keywords="debug, authentication, token, troubleshooting"
      />
      
      <div className="min-h-screen bg-background p-4">
        <div className="container mx-auto py-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">🔐 Authentication Debug</h1>
            <p className="text-muted-foreground">
              Diagnose and fix authentication issues
            </p>
          </div>
          
          <AuthDebugPanel />
        </div>
      </div>
    </>
  );
}