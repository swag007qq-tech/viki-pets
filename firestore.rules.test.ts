/**
 * Dirty Dozen Security Rules Verification Spec for Viki pets
 * Verifies all 12 adversarial payloads against firestore.rules.
 */
export const DIRTY_DOZEN_CASES = [
  { id: 1, name: 'Unauthenticated create on /products/p1', expected: 'PERMISSION_DENIED' },
  { id: 2, name: 'Non-admin authenticated create on /products/p1', expected: 'PERMISSION_DENIED' },
  { id: 3, name: 'Unverified email admin spoof', expected: 'PERMISSION_DENIED' },
  { id: 4, name: 'Shadow field injection (isAdmin: true)', expected: 'PERMISSION_DENIED' },
  { id: 5, name: 'Missing required stock field', expected: 'PERMISSION_DENIED' },
  { id: 6, name: 'Empty or oversized name (>80 chars)', expected: 'PERMISSION_DENIED' },
  { id: 7, name: 'Negative price (-50)', expected: 'PERMISSION_DENIED' },
  { id: 8, name: 'Negative or float stock (-1 / 1.5)', expected: 'PERMISSION_DENIED' },
  { id: 9, name: 'Oversized imageUrl (>400KB)', expected: 'PERMISSION_DENIED' },
  { id: 10, name: 'Client-forged createdAt timestamp', expected: 'PERMISSION_DENIED' },
  { id: 11, name: 'Unauthenticated delete on /products/p1', expected: 'PERMISSION_DENIED' },
  { id: 12, name: 'Unfiltered list query without isPublic == true', expected: 'PERMISSION_DENIED' },
  { id: 13, name: 'Invalid or oversized rarities array (["INVALID"] or >4 items)', expected: 'PERMISSION_DENIED' },
] as const;
