export {
  AuthProvider,
  useAuth,
  AuthContext,
  getFriendlyAuthErrorMessage,
} from "./AuthContext";
export type { BackendUser, AuthContextValue } from "./AuthContext";
export { firebaseAuth, googleProvider, githubProvider, EmailAuthProvider, getAuthToken, waitForAuthReady } from "./firebase";
