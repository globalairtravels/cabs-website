import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyDBlcScgmBN0fHugwPJhL5ycYg3bI5ITL0',
  authDomain: 'globalairtravels-9651f.firebaseapp.com',
  projectId: 'globalairtravels-9651f',
  storageBucket: 'globalairtravels-9651f.firebasestorage.app',
  messagingSenderId: '518478472224',
  appId: '1:518478472224:web:baccc6770fbf6921488845',
  measurementId: 'G-87PV86VH02',
};

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const db = getFirestore(firebaseApp);

export async function getAnalyticsClient() {
  if (typeof window === 'undefined') return null;
  const { getAnalytics, isSupported } = await import('firebase/analytics');
  if (!(await isSupported())) return null;
  return getAnalytics(firebaseApp);
}
