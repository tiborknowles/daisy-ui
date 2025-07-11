/**
 * Root Layout Component
 * Following Firebase Studio template patterns
 */

import { ReactNode } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        {children}
      </div>
    </AuthProvider>
  );
}