// Firebase Web SDK client init for the static-exported site.
//
// The app is statically exported, so there is no Next.js server at runtime —
// every helper here is browser-only. We initialise lazily (never at module
// load on the server) and keep a singleton across HMR re-imports.
//
// Config comes from public NEXT_PUBLIC_FIREBASE_* identifiers; these are safe
// to ship in client bundles. If they are absent (e.g. a build without secrets),
// `isFirebaseConfigured` is false and callers should degrade gracefully rather
// than crash the build.
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDBlcScgmBN0fHugwPJhL5ycYg3bI5ITL0",
  authDomain: "globalairtravels-9651f.firebaseapp.com",
  projectId: "globalairtravels-9651f",
  storageBucket: "globalairtravels-9651f.firebasestorage.app",
  messagingSenderId: "518478472224",
  appId: "1:518478472224:web:baccc6770fbf6921488845",
  measurementId: "G-87PV86VH02"
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId
);

let cachedAuth = null;
let cachedDb = null;

function getFirebaseApp() {
  if (!isFirebaseConfigured) return null;
  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}

// Browser-only: Auth touches browser APIs (IndexedDB, reCAPTCHA), so we never
// return an instance during server prerender of client components.
export function getFirebaseAuth() {
  if (typeof window === "undefined" || !isFirebaseConfigured) return null;
  if (!cachedAuth) cachedAuth = getAuth(getFirebaseApp());
  return cachedAuth;
}

export function getDb() {
  if (!isFirebaseConfigured) return null;
  if (!cachedDb) cachedDb = getFirestore(getFirebaseApp());
  return cachedDb;
}
