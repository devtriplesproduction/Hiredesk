/**
 * Normalizes an arbitrary phone number format into a clean E.164-like string
 * suitable for WhatsApp deep linking.
 * 
 * Rules:
 * 1. Remove all spaces, dashes, parentheses, brackets, and non-numeric/plus characters.
 * 2. If it starts with '00', convert to '+'.
 * 3. If it starts with '0' and is 11 digits long (e.g. 09876543210), strip the leading '0'.
 * 4. If it does not start with '+', apply smart country codes:
 *    - If length is exactly 10, default prefix to '+91' (India) as specified.
 *    - If starts with '91' and length is exactly 12, prepend '+'.
 *    - If it matches common country codes without '+' (like UK starting with '44' or US with '1'), prepend '+'.
 *    - Otherwise, default to prepending '+91'.
 */
export function normalizePhoneNumber(phone: string): string {
  if (!phone) return "";
  
  // 1. Remove all spaces, dashes, brackets, parentheses, and any characters other than digits and '+'
  let cleaned = phone.replace(/[^0-9+]/g, "");
  
  // 2. Handle double zero prefixes
  if (cleaned.startsWith("00")) {
    cleaned = "+" + cleaned.slice(2);
  }
  
  // 3. Handle leading zero for 10-digit mobile numbers (e.g., 09876543210 -> 9876543210)
  if (cleaned.startsWith("0") && cleaned.length === 11 && !cleaned.startsWith("+")) {
    cleaned = cleaned.slice(1);
  }
  
  // 4. Handle missing country code
  if (!cleaned.startsWith("+")) {
    if (cleaned.length === 10) {
      // 10 digits -> default to India (+91)
      cleaned = "+91" + cleaned;
    } else if (cleaned.startsWith("91") && cleaned.length === 12) {
      // 12 digits starting with 91 -> prepend +
      cleaned = "+" + cleaned;
    } else if (cleaned.startsWith("1") && cleaned.length === 11) {
      // US (+1)
      cleaned = "+" + cleaned;
    } else if (cleaned.startsWith("44") && (cleaned.length === 11 || cleaned.length === 12)) {
      // UK (+44)
      cleaned = "+" + cleaned;
    } else {
      // Default fallback prefix +91
      cleaned = "+91" + cleaned;
    }
  }
  
  return cleaned;
}

/**
 * Validates whether a normalized phone number has a valid structure for WhatsApp.
 * A valid WhatsApp number should start with a '+' followed by 7 to 15 digits.
 */
export function validatePhoneNumber(phone: string): boolean {
  if (!phone) return false;
  const normalized = normalizePhoneNumber(phone);
  // E.164 standard: plus sign followed by 7 to 15 digits
  return /^\+[1-9]\d{6,14}$/.test(normalized);
}
