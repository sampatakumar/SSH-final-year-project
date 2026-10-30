import crypto from "crypto";

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

// In-memory rate limiting map for password attempts: `${userId}:${groupId}` -> { count, lockedUntil }
const failedAttemptsMap = new Map();

/**
 * Securely hashes a private community group password using scrypt with random salt.
 * @param {string} plainPassword 
 * @returns {string} Salted hash in format `${salt}:${derivedKey}`
 */
export const hashGroupPassword = (plainPassword) => {
  if (!plainPassword || typeof plainPassword !== "string") {
    throw new Error("Password must be a non-empty string");
  }
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto.scryptSync(plainPassword, salt, 64).toString("hex");
  return `${salt}:${derivedKey}`;
};

/**
 * Constant-time verification of a group password against stored scrypt hash.
 * @param {string} plainPassword 
 * @param {string} storedHash 
 * @returns {boolean} True if password matches, false otherwise
 */
export const verifyGroupPassword = (plainPassword, storedHash) => {
  if (!plainPassword || !storedHash || typeof storedHash !== "string") {
    return false;
  }
  const parts = storedHash.split(":");
  if (parts.length !== 2) return false;
  const [salt, key] = parts;
  if (!salt || !key) return false;

  try {
    const derivedKey = crypto.scryptSync(plainPassword, salt, 64);
    const keyBuffer = Buffer.from(key, "hex");
    if (derivedKey.length !== keyBuffer.length) return false;
    return crypto.timingSafeEqual(derivedKey, keyBuffer);
  } catch {
    return false;
  }
};

/**
 * Checks if the user has exceeded allowed failed password attempts for a group.
 * @param {string} userId 
 * @param {string} groupId 
 * @returns {{ allowed: boolean, reason?: string }}
 */
export const checkGroupPasswordRateLimit = (userId, groupId) => {
  const key = `${userId}:${groupId}`;
  const entry = failedAttemptsMap.get(key);
  if (!entry) return { allowed: true };

  if (entry.lockedUntil && Date.now() < entry.lockedUntil) {
    const remainingSec = Math.ceil((entry.lockedUntil - Date.now()) / 1000);
    return {
      allowed: false,
      reason: `Too many failed password attempts. Access locked for ${remainingSec} seconds.`,
    };
  }

  if (entry.lockedUntil && Date.now() >= entry.lockedUntil) {
    failedAttemptsMap.delete(key);
    return { allowed: true };
  }

  return { allowed: true };
};

/**
 * Records a failed password attempt and locks if threshold is reached.
 * @param {string} userId 
 * @param {string} groupId 
 * @returns {{ remainingAttempts: number, isLocked: boolean }}
 */
export const recordFailedGroupPasswordAttempt = (userId, groupId) => {
  const key = `${userId}:${groupId}`;
  const now = Date.now();
  const entry = failedAttemptsMap.get(key) || { count: 0, firstAttemptAt: now };
  entry.count += 1;

  if (entry.count >= MAX_FAILED_ATTEMPTS) {
    entry.lockedUntil = now + LOCKOUT_WINDOW_MS;
  }

  failedAttemptsMap.set(key, entry);
  return {
    remainingAttempts: Math.max(0, MAX_FAILED_ATTEMPTS - entry.count),
    isLocked: Boolean(entry.lockedUntil),
  };
};

/**
 * Clears failed attempts upon successful password entry.
 * @param {string} userId 
 * @param {string} groupId 
 */
export const clearGroupPasswordFailedAttempts = (userId, groupId) => {
  failedAttemptsMap.delete(`${userId}:${groupId}`);
};

/**
 * Clears all rate limit history (primarily for tests)
 */
export const resetAllPasswordRateLimits = () => {
  failedAttemptsMap.clear();
};
