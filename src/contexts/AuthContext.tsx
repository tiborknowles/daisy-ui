/**
 * Authentication Context for DaisyAI Chat UI
 * Following Firebase Studio template patterns
 */

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  signInWithPopup, 
  GoogleAuthProvider,
  signInAnonymously,
  onAuthStateChanged,
  signOut as firebaseSignOut,
  User
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

// Create Auth Context with proper typing
interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInAnonymous: () => Promise<void>;
  signOut: () => Promise<void>;
  getIdToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    
    return unsubscribe;
  }, []);
  
  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    // Request access to the cloud platform scope for Agent Engine
    provider.addScope('https://www.googleapis.com/auth/cloud-platform');
    
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  };
  
  const signInAnonymous = async () => {
    try {
      await signInAnonymously(auth);
    } catch (error) {
      console.error('Error signing in anonymously:', error);
      throw error;
    }
  };
  
  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };
  
  const getIdToken = async (): Promise<string | null> => {
    if (!user) return null;
    try {
      return await user.getIdToken();
    } catch (error) {
      console.error('Error getting ID token:', error);
      return null;
    }
  };
  
  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signInWithGoogle,
      signInAnonymous,
      signOut,
      getIdToken
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};