import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyD2L2yqqlRlF5JVpRPb11rz1zxadXGCFfU',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'rapidtasker-8ef1d.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'rapidtasker-8ef1d',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'rapidtasker-8ef1d.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '273360646497',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:273360646497:web:rapidtaskar_admin',
};

export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
