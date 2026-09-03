import { User } from "../database/models/user.models.js";
import { incrementDailyCounter } from "../database/models/analytics.models.js";

/**
 * Synchronizes and deduplicates a Firebase user into MongoDB.
 * Ensures that accounts with matching verified emails or Firebase UIDs are unified
 * without overwriting custom user profile data.
 */
export const upsertUserFromFirebase = async (decodedToken) => {
  const firebaseUid = decodedToken.uid || decodedToken.sub;
  const rawEmail = decodedToken.email || null;
  const normalizedEmail = rawEmail ? rawEmail.trim().toLowerCase() : null;
  const nextName = decodedToken.name || null;
  const nextPhoto = decodedToken.picture || null;
  const isEmailVerified = Boolean(decodedToken.email_verified);
  const signInProvider = decodedToken.firebase?.sign_in_provider || decodedToken.provider_id || "firebase";

  // 1. Search by canonical Firebase UID
  let user = await User.findOne({ firebaseUid });

  // 2. If not found by UID, search by normalized email to prevent duplicate accounts
  if (!user && normalizedEmail) {
    user = await User.findOne({ email: normalizedEmail });
    if (user) {
      // Reconcile the user's primary Firebase UID with the new provider identity
      user.firebaseUid = firebaseUid;
    }
  }

  // 3. If user still does not exist, create a new User document
  if (!user) {
    user = await User.create({
      firebaseUid,
      email: normalizedEmail,
      emailVerified: isEmailVerified,
      displayName: nextName,
      photoURL: nextPhoto,
      authProviders: signInProvider ? [signInProvider] : [],
      lastLoginAt: new Date(),
    });
    incrementDailyCounter("newUsers", 1);
    return user;
  }

  // 4. Update existing user safely (conservative hydration, preserving custom edits)
  user.email = normalizedEmail || user.email || null;
  user.emailVerified = isEmailVerified || user.emailVerified || false;

  if (signInProvider) {
    if (!Array.isArray(user.authProviders)) {
      user.authProviders = [];
    }
    if (!user.authProviders.includes(signInProvider)) {
      user.authProviders.push(signInProvider);
    }
  }

  if (!user.displayName && nextName) {
    user.displayName = nextName;
  }
  if (!user.photoURL && nextPhoto) {
    user.photoURL = nextPhoto;
  }

  user.lastLoginAt = new Date();
  await user.save();

  return user;
};
