import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  linkWithPopup,
  unlink,
  updateProfile,
  signOut,
  reload,
  type User,
  type UserCredential,
} from "firebase/auth";
import { firebaseAuth, googleProvider, githubProvider } from "./firebase";
import { apiRequest } from "../api/apiClient";

export interface BackendUser {
  _id?: string;
  id?: string;
  name?: string;
  displayName?: string;
  email?: string;
  emailVerified?: boolean;
  authProviders?: string[];
  photoURL?: string;
  avatar?: string;
  targetRole?: string;
  githubUrl?: string;
  linkedInUrl?: string;
  phone?: string;
  about?: string;
  customDomain?: string;
  notificationsEnabled?: boolean;
  education?: string[];
  educationEntries?: any[];
  skillSections?: any[];
  skillLanguages?: string[];
  skillFrameworks?: string[];
  skillTools?: string[];
  skillLibraries?: string[];
  experience?: any[];
  achievements?: any[];
  onboardingCompletedAt?: string | null;
}

export interface AuthContextValue {
  firebaseUser: User | null;
  backendUser: BackendUser | null;
  idToken: string | null;
  loading: boolean;
  authInitialized: boolean;
  signInWithGoogle: () => Promise<UserCredential>;
  signInWithGithub: () => Promise<UserCredential>;
  signInWithEmail: (email: string, password: string) => Promise<UserCredential>;
  registerWithEmail: (email: string, password: string, displayName: string) => Promise<UserCredential>;
  resendVerificationEmail: () => Promise<void>;
  reloadUser: () => Promise<User | null>;
  syncVerifiedUser: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  linkProvider: (providerType: "google" | "github") => Promise<UserCredential>;
  unlinkProvider: (providerId: string) => Promise<User>;
  signOutUser: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  getFriendlyErrorMessage: (error: unknown) => string;
}

export const getFriendlyAuthErrorMessage = (error: unknown): string => {
  if (!error) return "An unexpected error occurred. Please try again.";

  const code = typeof error === "object" && error !== null && "code" in error
    ? String((error as { code: unknown }).code)
    : "";

  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Incorrect email or password.";
    case "auth/email-already-in-use":
      return "An account already exists with this email.";
    case "auth/weak-password":
      return "Choose a stronger password (at least 8 characters).";
    case "auth/account-exists-with-different-credential":
      return "An account already exists with this email using another provider. Sign in with your existing provider first, then connect this provider in Settings.";
    case "auth/popup-closed-by-user":
      return "Sign-in popup was closed before completing authentication.";
    case "auth/popup-blocked":
      return "Your browser blocked the sign-in popup. Please enable popups and try again.";
    case "auth/network-request-failed":
      return "Network error. Please check your internet connection and try again.";
    case "auth/too-many-requests":
      return "Too many requests. Please wait a moment before trying again.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/provider-already-linked":
      return "This provider is already connected to your account.";
    case "auth/credential-already-in-use":
      return "This account is already linked to another user.";
    case "auth/requires-recent-login":
      return "This action requires recent authentication. Please sign out and log in again.";
    default:
      if (error instanceof Error && error.message) {
        return error.message;
      }
      return "Authentication failed. Please try again.";
  }
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [backendUser, setBackendUser] = useState<BackendUser | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [authInitialized, setAuthInitialized] = useState(false);

  const syncBackendUser = async (user: User) => {
    // Only synchronize verified users or social provider users to MongoDB
    const isPasswordProvider = user.providerData.some((p) => p.providerId === "password");
    if (isPasswordProvider && !user.emailVerified) {
      // Do not sync unverified email accounts to MongoDB
      return;
    }

    try {
      const token = await user.getIdToken();
      setIdToken(token);

      const response = await apiRequest<{ user: BackendUser }>("/auth/firebase/sign-in", {
        method: "POST",
        token,
      });
      setBackendUser(response.data.user);
    } catch (error) {
      console.error("[Auth] Backend sign-in synchronization failed", error);
    }
  };

  const refreshProfile = async () => {
    try {
      const response = await apiRequest<{ user: BackendUser }>("/auth/me");
      setBackendUser(response.data.user);
    } catch (error) {
      console.error("[Auth] refreshProfile failed", error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (nextUser) => {
      setFirebaseUser(nextUser);

      if (!nextUser) {
        setIdToken(null);
        setBackendUser(null);
        setLoading(false);
        setAuthInitialized(true);
        return;
      }

      await syncBackendUser(nextUser);
      setLoading(false);
      setAuthInitialized(true);
    });

    return unsubscribe;
  }, []);

  const signInWithGoogle = async (): Promise<UserCredential> => {
    const cred = await signInWithPopup(firebaseAuth, googleProvider);
    await syncBackendUser(cred.user);
    return cred;
  };

  const signInWithGithub = async (): Promise<UserCredential> => {
    const cred = await signInWithPopup(firebaseAuth, githubProvider);
    await syncBackendUser(cred.user);
    return cred;
  };

  const signInWithEmail = async (email: string, password: string): Promise<UserCredential> => {
    const cred = await signInWithEmailAndPassword(firebaseAuth, email.trim(), password);
    if (cred.user.emailVerified) {
      await syncBackendUser(cred.user);
    }
    return cred;
  };

  const registerWithEmail = async (
    email: string,
    password: string,
    displayName: string
  ): Promise<UserCredential> => {
    const cred = await createUserWithEmailAndPassword(firebaseAuth, email.trim(), password);
    if (displayName.trim()) {
      await updateProfile(cred.user, { displayName: displayName.trim() });
    }
    // Automatically dispatch email verification
    await sendEmailVerification(cred.user);
    // Note: Do NOT sync to MongoDB here; user must verify email first.
    return cred;
  };

  const resendVerificationEmail = async (): Promise<void> => {
    if (!firebaseAuth.currentUser) {
      throw new Error("No authenticated user to send verification email to.");
    }
    await sendEmailVerification(firebaseAuth.currentUser);
  };

  const reloadUser = async (): Promise<User | null> => {
    if (!firebaseAuth.currentUser) return null;
    await reload(firebaseAuth.currentUser);
    const updated = firebaseAuth.currentUser;
    setFirebaseUser({ ...updated } as User);
    return updated;
  };

  const syncVerifiedUser = async (): Promise<void> => {
    if (!firebaseAuth.currentUser) return;
    const token = await firebaseAuth.currentUser.getIdToken(true);
    setIdToken(token);
    const response = await apiRequest<{ user: BackendUser }>("/auth/firebase/sign-in", {
      method: "POST",
      token,
    });
    setBackendUser(response.data.user);
  };

  const sendPasswordReset = async (email: string): Promise<void> => {
    await sendPasswordResetEmail(firebaseAuth, email.trim());
  };

  const linkProvider = async (providerType: "google" | "github"): Promise<UserCredential> => {
    if (!firebaseAuth.currentUser) {
      throw new Error("No authenticated user to link provider with.");
    }
    const provider = providerType === "google" ? googleProvider : githubProvider;
    const cred = await linkWithPopup(firebaseAuth.currentUser, provider);
    await syncBackendUser(cred.user);
    return cred;
  };

  const unlinkProvider = async (providerId: string): Promise<User> => {
    if (!firebaseAuth.currentUser) {
      throw new Error("No authenticated user to unlink provider from.");
    }
    const updatedUser = await unlink(firebaseAuth.currentUser, providerId);
    await syncBackendUser(updatedUser);
    return updatedUser;
  };

  const signOutUser = async () => {
    await signOut(firebaseAuth);
    setFirebaseUser(null);
    setBackendUser(null);
    setIdToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        backendUser,
        idToken,
        loading,
        authInitialized,
        signInWithGoogle,
        signInWithGithub,
        signInWithEmail,
        registerWithEmail,
        resendVerificationEmail,
        reloadUser,
        syncVerifiedUser,
        sendPasswordReset,
        linkProvider,
        unlinkProvider,
        signOutUser,
        refreshProfile,
        getFriendlyErrorMessage: getFriendlyAuthErrorMessage,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
