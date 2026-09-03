import { initializeApp, getApps } from "firebase/app";
import {
  GoogleAuthProvider,
  GithubAuthProvider,
  EmailAuthProvider,
  getAuth,
  onAuthStateChanged,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const firebaseAuth = getAuth(app);

// Provider initializations
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

export const githubProvider = new GithubAuthProvider();
githubProvider.addScope("read:user");
githubProvider.addScope("user:email");

export { EmailAuthProvider };

let initialAuthPromise: Promise<void> | null = null;

/**
 * Wait for Firebase Auth to resolve its initial state from persistence.
 */
export const waitForAuthReady = (): Promise<void> => {
  if (firebaseAuth.currentUser) {
    return Promise.resolve();
  }
  if (typeof (firebaseAuth as any).authStateReady === "function") {
    return (firebaseAuth as any).authStateReady();
  }
  if (!initialAuthPromise) {
    initialAuthPromise = new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(firebaseAuth, () => {
        unsubscribe();
        resolve();
      });
    });
  }
  return initialAuthPromise;
};

/**
 * Centralized token retrieval helper.
 * Waits for initial auth readiness and returns a valid Firebase ID token if authenticated.
 */
export const getAuthToken = async (forceRefresh = false): Promise<string | null> => {
  try {
    await waitForAuthReady();
  } catch {
    // Proceed to inspect currentUser
  }

  const user = firebaseAuth.currentUser;
  if (!user) {
    return null;
  }

  try {
    return await user.getIdToken(forceRefresh);
  } catch (err) {
    console.warn("[Auth] Failed to get Firebase ID token:", err);
    return null;
  }
};
