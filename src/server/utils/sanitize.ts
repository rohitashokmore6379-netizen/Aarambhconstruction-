import mongoose from 'mongoose';

/**
 * Safely parse and sanitize a MongoDB ObjectId from user inputs.
 * Returns valid 24-hex string or undefined if empty / invalid / placeholder.
 */
export function cleanObjectId(val: any): string | undefined {
  if (val === undefined || val === null) return undefined;
  if (typeof val === 'object' && val._id) return cleanObjectId(val._id);
  if (typeof val !== 'string') return undefined;

  const trimmed = val.trim();
  if (
    !trimmed ||
    trimmed === '' ||
    trimmed === 'null' ||
    trimmed === 'undefined' ||
    trimmed === 'ALL' ||
    trimmed === '--'
  ) {
    return undefined;
  }

  if (mongoose.Types.ObjectId.isValid(trimmed)) {
    return trimmed;
  }

  return undefined;
}

/**
 * Clean a string input with trimming and optional fallback.
 */
export function cleanString(val: any, fallback = ''): string {
  if (val === undefined || val === null) return fallback;
  const str = String(val).trim();
  return str.length > 0 ? str : fallback;
}

/**
 * Clean a numeric input with finite check and optional fallback.
 */
export function cleanNumber(val: any, fallback = 0): number {
  if (val === undefined || val === null || val === '') return fallback;
  const num = Number(val);
  return Number.isFinite(num) ? num : fallback;
}
