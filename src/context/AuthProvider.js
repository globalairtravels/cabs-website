"use client";

// App-wide authentication context for Firebase Phone (OTP) auth.
//
// Responsibilities:
//   - Track the signed-in Firebase user via onAuthStateChanged.
//   - Fetch (and lazily create) the user's /users/{uid} profile.
//   - Expose phone-OTP helpers: sendOtp(phone) -> confirmOtp(code).
//   - Expose signOut() and updateProfile() for the account page.
//
// Phone OTP must run client-side (reCAPTCHA + SMS), which suits the static
// export — there is no server here. When Firebase is not configured the
// provider still mounts but every action throws a friendly error.

import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import {
  onAuthStateChanged,
  signOut as firebaseSignOut,
  signInWithPhoneNumber,
  RecaptchaVerifier,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { getFirebaseAuth, getDb, isFirebaseConfigured } from "@/lib/firebase";

const AuthContext = createContext(null);

const EMPTY_ADDRESS = { line1: "", line2: "", city: "", state: "", pincode: "" };

// Default shape for a freshly created profile. Phone + uid are the immutable
// identity (enforced by security rules); everything else is user-editable.
function defaultProfile(user) {
  return {
    uid: user.uid,
    phone: user.phoneNumber || "",
    name: "",
    email: "",
    address: { ...EMPTY_ADDRESS },
  };
}

const AUTH_CACHE_KEY = "gat_auth";

function readCache() {
  try { return JSON.parse(localStorage.getItem(AUTH_CACHE_KEY)); } catch { return null; }
}
function writeCache(value) {
  try { localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(value)); } catch {}
}
function clearCache() {
  try { localStorage.removeItem(AUTH_CACHE_KEY); } catch {}
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  // False until the first onAuthStateChanged. Cached user is only for the
  // header — Firestore queries must wait for a real Auth token.
  const [authReady, setAuthReady] = useState(false);

  // reCAPTCHA verifier + the pending confirmationResult live across the two
  // OTP steps, so they are kept in refs rather than state.
  const recaptchaRef = useRef(null);
  const confirmationRef = useRef(null);

  // ----- Profile load / create -----
  const loadProfile = useCallback(async (currentUser) => {
    const db = getDb();
    if (!db || !currentUser) return null;
    const ref = doc(db, "users", currentUser.uid);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() };
    }
    // First sign-in: create the profile with defaults. Rules require the stored
    // phone to match the auth token's phone_number.
    const base = defaultProfile(currentUser);
    await setDoc(ref, {
      ...base,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return base;
  }, []);

  // ----- Auth state subscription -----
  useEffect(() => {
    // Restore cached snapshot instantly so the header doesn't flash
    // "Log in" while Firebase validates the token in the background.
    const cached = readCache();
    const cacheTimer = cached
      ? setTimeout(() => {
          setUser({ uid: cached.uid, phoneNumber: cached.phoneNumber });
          setProfile(cached);
          setLoading(false);
        }, 0)
      : null;

    const auth = getFirebaseAuth();
    if (!auth) {
      const t = setTimeout(() => {
        setLoading(false);
        setAuthReady(true);
      }, 0);
      return () => {
        if (cacheTimer) clearTimeout(cacheTimer);
        clearTimeout(t);
      };
    }
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const p = await loadProfile(currentUser);
          setProfile(p);
          writeCache({ uid: currentUser.uid, phoneNumber: currentUser.phoneNumber, ...p });
        } catch (err) {
          console.error("Failed to load profile:", err);
          setProfile(null);
        }
      } else {
        setProfile(null);
        clearCache();
      }
      setLoading(false);
      setAuthReady(true);
    });
    return () => {
      if (cacheTimer) clearTimeout(cacheTimer);
      unsub();
    };
  }, [loadProfile]);

  // ----- reCAPTCHA -----
  // Lazily build an invisible verifier bound to a container element id. Cleared
  // on error / sign-out so a fresh challenge can be issued on the next attempt.
  const ensureRecaptcha = useCallback((containerId) => {
    const auth = getFirebaseAuth();
    if (!auth) throw new Error("Login is not available right now.");
    if (!recaptchaRef.current) {
      recaptchaRef.current = new RecaptchaVerifier(auth, containerId, {
        size: "invisible",
      });
    }
    return recaptchaRef.current;
  }, []);

  const clearRecaptcha = useCallback(() => {
    if (recaptchaRef.current) {
      try {
        recaptchaRef.current.clear();
      } catch {
        // ignore — verifier may already be torn down
      }
      recaptchaRef.current = null;
    }
  }, []);

  // ----- OTP step 1: send code -----
  const sendOtp = useCallback(
    async (phoneE164, containerId = "recaptcha-container") => {
      const auth = getFirebaseAuth();
      if (!auth) throw new Error("Login is not available right now.");
      const verifier = ensureRecaptcha(containerId);
      try {
        confirmationRef.current = await signInWithPhoneNumber(auth, phoneE164, verifier);
      } catch (err) {
        // A failed challenge can leave a stale widget; reset so retry works.
        clearRecaptcha();
        throw err;
      }
    },
    [ensureRecaptcha, clearRecaptcha]
  );

  // ----- OTP step 2: confirm code -----
  const confirmOtp = useCallback(async (code) => {
    if (!confirmationRef.current) {
      throw new Error("Please request a new OTP.");
    }
    const result = await confirmationRef.current.confirm(code);
    confirmationRef.current = null;
    clearRecaptcha();
    return result.user;
  }, [clearRecaptcha]);

  const signOut = useCallback(async () => {
    const auth = getFirebaseAuth();
    if (!auth) return;
    clearRecaptcha();
    confirmationRef.current = null;
    await firebaseSignOut(auth);
  }, [clearRecaptcha]);

  // ----- Profile update (account page) -----
  // Identity fields (uid, phone) are immutable per rules, so we only write the
  // editable subset plus a fresh updatedAt.
  const updateProfile = useCallback(async (fields) => {
    const db = getDb();
    if (!db || !user) throw new Error("You must be signed in.");
    const ref = doc(db, "users", user.uid);
    const payload = { ...fields, updatedAt: serverTimestamp() };
    await updateDoc(ref, payload);
    setProfile((prev) => {
      const updated = { ...(prev || {}), ...fields };
      writeCache({ uid: user.uid, phoneNumber: user.phoneNumber, ...updated });
      return updated;
    });
  }, [user]);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    const p = await loadProfile(user);
    setProfile(p);
    writeCache({ uid: user.uid, phoneNumber: user.phoneNumber, ...p });
  }, [user, loadProfile]);

  const value = {
    user,
    profile,
    loading,
    authReady,
    isConfigured: isFirebaseConfigured,
    sendOtp,
    confirmOtp,
    signOut,
    updateProfile,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    // Allows components to be used outside the provider during isolated renders.
    return {
      user: null,
      profile: null,
      loading: false,
      authReady: true,
      isConfigured: false,
      sendOtp: async () => { throw new Error("Auth unavailable"); },
      confirmOtp: async () => { throw new Error("Auth unavailable"); },
      signOut: async () => {},
      updateProfile: async () => { throw new Error("Auth unavailable"); },
      refreshProfile: async () => {},
    };
  }
  return ctx;
}
