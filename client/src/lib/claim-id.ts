import { v4 as uuidv4 } from 'uuid';

export const generateClaimId = (email: string): string => {
  const timestamp = Date.now().toString(36);
  const hash = btoa(email + timestamp).slice(0, 12); // Base64 encode email + timestamp
  return `YUL-${hash}-${uuidv4().slice(0, 8)}`; // e.g., YUL-ZW1hbm90aW1l-12345678
};