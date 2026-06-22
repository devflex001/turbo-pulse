import { scrypt } from "@noble/hashes/scrypt.js";

/**
 * Hash a password using scrypt algorithm (pure JS, Convex-compatible)
 * This function can be called from mutations or actions
 * @param password - Plain text password
 * @returns Hashed password string (format: salt$hash)
 */
export function hashPassword(password: string): string {
  // Generate a random salt (16 bytes)
  const salt = crypto.randomUUID().replace(/-/g, "").substring(0, 32);

  // Hash the password with scrypt
  // N=32768, r=8, p=1 are secure defaults similar to Argon2
  const hash = scrypt(password, salt, {
    N: 32768, // CPU/memory cost factor
    r: 8,     // Block size
    p: 1,     // Parallelization factor
    dkLen: 32 // Output length
  });

  // Convert hash to hex string
  const hashHex = Array.from(hash)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  // Return salt$hash format for verification
  return `${salt}$${hashHex}`;
}

/**
 * Verify a password against a hash
 * This function can be called from mutations or actions
 * @param storedHash - The stored password hash (format: salt$hash)
 * @param password - Plain text password to verify
 * @returns True if password matches, false otherwise
 */
export function verifyPassword(
  storedHash: string,
  password: string
): boolean {
  try {
    // Split the stored hash into salt and hash
    const [salt, hash] = storedHash.split("$");

    if (!salt || !hash) {
      return false;
    }

    // Hash the provided password with the same salt
    const testHash = scrypt(password, salt, {
      N: 32768,
      r: 8,
      p: 1,
      dkLen: 32
    });

    const testHashHex = Array.from(testHash)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Compare the hashes (constant-time comparison)
    return timingSafeEqual(hash, testHashHex);
  } catch (error) {
    // If hash is invalid format, return false instead of throwing
    return false;
  }
}

/**
 * Timing-safe string comparison to prevent timing attacks
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Normalize phone number to E.164 format
 * Supports Kenyan phone numbers (254) by default
 * @param phone - Phone number in various formats
 * @returns Normalized phone number
 */
export function normalizePhoneNumber(phone: string): string {
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, "");

  // Handle Kenyan numbers
  if (cleaned.startsWith("0") && cleaned.length === 10) {
    // Convert 0712345678 to 254712345678
    cleaned = "254" + cleaned.substring(1);
  } else if (cleaned.startsWith("254") && cleaned.length === 12) {
    // Already in correct format
    return cleaned;
  } else if (cleaned.startsWith("7") && cleaned.length === 9) {
    // Convert 712345678 to 254712345678
    cleaned = "254" + cleaned;
  }

  // Add more country codes here if needed
  // For now, assume it's a Kenyan number if no country code

  return cleaned;
}

/**
 * Validate phone number format
 * @param phone - Phone number to validate
 * @returns True if valid format
 */
export function isValidPhoneNumber(phone: string): boolean {
  const normalized = normalizePhoneNumber(phone);

  // Check if it's a valid Kenyan number (12 digits starting with 254)
  if (/^254[17]\d{8}$/.test(normalized)) {
    return true;
  }

  // Add more validation rules for other countries if needed

  return false;
}

/**
 * Validate password strength
 * @param password - Password to validate
 * @returns Error message if invalid, null if valid
 */
export function validatePassword(password: string): string | null {
  if (password.length < 8) {
    return "Password must be at least 8 characters long";
  }

  if (password.length > 128) {
    return "Password must not exceed 128 characters";
  }

  // Optional: Add more strength requirements
  // if (!/[A-Z]/.test(password)) {
  //   return "Password must contain at least one uppercase letter";
  // }

  // if (!/[a-z]/.test(password)) {
  //   return "Password must contain at least one lowercase letter";
  //}

  // if (!/[0-9]/.test(password)) {
  //   return "Password must contain at least one number";
  // }

  return null;
}
