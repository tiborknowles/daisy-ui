/**
 * Protected Route Component
 * Following Firebase Studio template patterns
 */

import { useAuth } from '@/contexts/AuthContext';
import { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // Allow access for both authenticated and anonymous users
  // Remove this check if you want to require authentication
  return <>{children}</>;
}

export default ProtectedRoute;