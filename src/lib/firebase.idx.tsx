/**
 * Firebase configuration for IDX environment
 * Following Firebase Studio template patterns
 */

import { initializeApp, getApps } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

// Firebase configuration for DaisyAI (IDX environment)
const firebaseConfig = {
  apiKey: "API_KEY",
  authDomain: "PROJECT_ID.firebaseapp.com",
  projectId: "PROJECT_ID",
  storageBucket: "PROJECT_ID.appspot.com",
  messagingSenderId: "SENDER_ID",
  appId: "APP_ID",
};

// Initialize Firebase app (singleton pattern)
const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize services
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);

// Connect to emulators in IDX environment
if (typeof window !== 'undefined' && window.location.hostname.includes('idx')) {
  connectAuthEmulator(auth, `http://${window.location.hostname}:9099`);
  connectFirestoreEmulator(db, window.location.hostname, 8080);
}

export default firebaseApp;