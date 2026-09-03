import { getApps, getApp, initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { env } from "./env.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let firebaseAdminApp = null;

export const getFirebaseAdmin = () => {
  const apps = getApps();
  if (apps.length > 0) {
    return apps[0];
  }

  // 1. Check direct environment variables (recommended for production: Render, Vercel, Railway)
  if (env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY) {
    const formattedPrivateKey = env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n");
    firebaseAdminApp = initializeApp({
      credential: cert({
        projectId: env.FIREBASE_PROJECT_ID,
        clientEmail: env.FIREBASE_CLIENT_EMAIL,
        privateKey: formattedPrivateKey,
      }),
    });
    return firebaseAdminApp;
  }

  // 2. Check explicitly configured service account file path
  if (env.FIREBASE_SERVICE_ACCOUNT_PATH && fs.existsSync(env.FIREBASE_SERVICE_ACCOUNT_PATH)) {
    const serviceAccount = JSON.parse(fs.readFileSync(env.FIREBASE_SERVICE_ACCOUNT_PATH, "utf8"));
    firebaseAdminApp = initializeApp({
      credential: cert(serviceAccount),
    });
    return firebaseAdminApp;
  }

  // 3. Check local service account JSON if present in src/ directory (local dev fallback)
  const localServiceAccountPath = path.join(__dirname, "../smart-skill-hub-firebase-adminsdk-fbsvc-3a9d47e340.json");
  if (fs.existsSync(localServiceAccountPath)) {
    try {
      const serviceAccount = JSON.parse(fs.readFileSync(localServiceAccountPath, "utf8"));
      firebaseAdminApp = initializeApp({
        credential: cert(serviceAccount),
      });
      return firebaseAdminApp;
    } catch (err) {
      console.warn("[FirebaseAdmin] Could not parse local service account JSON:", err.message);
    }
  }

  // 4. Default credential / project fallback
  firebaseAdminApp = initializeApp({
    projectId: env.FIREBASE_PROJECT_ID,
  });

  return firebaseAdminApp;
};

export const getFirebaseAuth = () => {
  const app = getFirebaseAdmin();
  return getAuth(app);
};

export const firebaseAdmin = {
  auth: () => getFirebaseAuth(),
  app: () => getFirebaseAdmin(),
};

export default firebaseAdmin;
