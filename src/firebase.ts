import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInAnonymously,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocFromServer,
  getFirestore,
  onSnapshot,
  query,
  serverTimestamp,
  where,
  writeBatch,
  type Timestamp,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export function sanitizeImageUrl(url: unknown): string {
  if (typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (/^data:image\/(jpeg|jpg|png|webp|gif);base64,[A-Za-z0-9+/=]+$/i.test(trimmed)) {
    return trimmed;
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'https:') {
      return parsed.toString();
    }
  } catch {
    // invalid URL
  }
  return '';
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
void testConnection();

export type RarityCode = 'F' | 'R' | 'N' | 'M';

export const RARITY_OPTIONS: ReadonlyArray<{
  code: RarityCode;
  label: string;
  iconSrc: string;
}> = [
  { code: 'F', label: 'Fly', iconSrc: '/assets/badges/badge-f.png' },
  { code: 'R', label: 'Ride', iconSrc: '/assets/badges/badge-r.png' },
  { code: 'N', label: 'Neon', iconSrc: '/assets/badges/badge-n.png' },
  { code: 'M', label: 'Mega Neon', iconSrc: '/assets/badges/badge-m.png' },
];

const RARITY_ORDER: ReadonlyArray<RarityCode> = ['M', 'N', 'F', 'R'];

export function normalizeRarities(raw: unknown): RarityCode[] {
  if (!Array.isArray(raw)) return [];
  const allowed = new Set<RarityCode>();
  for (const item of raw) {
    if (item === 'F' || item === 'R' || item === 'N' || item === 'M') {
      allowed.add(item);
    }
  }
  return RARITY_ORDER.filter((code) => allowed.has(code));
}

export interface StoreProduct {
  id: string;
  name: string;
  price: number;
  stock: number;
  imageUrl: string;
  isPublic: boolean;
  rarities: RarityCode[];
  createdAtMs: number;
  isPlaceholder?: boolean;
}

export const INITIAL_PLACEHOLDER_PRODUCTS: StoreProduct[] = [
  { id: 'initial-1', name: 'Название питомца', price: 250, stock: 1, imageUrl: '', isPublic: true, rarities: [], createdAtMs: 1, isPlaceholder: true },
  { id: 'initial-2', name: 'Название питомца', price: 250, stock: 1, imageUrl: '', isPublic: true, rarities: [], createdAtMs: 2, isPlaceholder: true },
  { id: 'initial-3', name: 'Название питомца', price: 250, stock: 1, imageUrl: '', isPublic: true, rarities: [], createdAtMs: 3, isPlaceholder: true },
  { id: 'initial-4', name: 'Название питомца', price: 250, stock: 1, imageUrl: '', isPublic: true, rarities: [], createdAtMs: 4, isPlaceholder: true },
  { id: 'initial-5', name: 'Название питомца', price: 250, stock: 1, imageUrl: '', isPublic: true, rarities: [], createdAtMs: 5, isPlaceholder: true },
  { id: 'initial-6', name: 'Название питомца', price: 250, stock: 1, imageUrl: '', isPublic: true, rarities: [], createdAtMs: 6, isPlaceholder: true },
];

export const PRODUCT_LIMITS = {
  NAME_MIN: 1,
  NAME_MAX: 80,
  PRICE_MAX: 1000000,
  STOCK_MAX: 100000,
  IMAGE_URL_MAX: 400000,
} as const;

export function subscribeToCatalog(
  onUpdate: (products: StoreProduct[], isSeeded: boolean) => void,
  onError: (err: unknown) => void
): () => void {
  let currentSeeded = false;
  let currentProducts: StoreProduct[] = [];
  let metaLoaded = false;
  let productsLoaded = false;

  const emit = () => {
    if (!metaLoaded || !productsLoaded) return;
    if (!currentSeeded && currentProducts.length === 0) {
      onUpdate(INITIAL_PLACEHOLDER_PRODUCTS, false);
    } else {
      const sorted = [...currentProducts].sort((a, b) => a.createdAtMs - b.createdAtMs);
      onUpdate(sorted, currentSeeded);
    }
  };

  const unsubMeta = onSnapshot(
    doc(db, 'meta', 'catalog'),
    (snap) => {
      metaLoaded = true;
      currentSeeded = snap.exists() && Boolean(snap.data()?.seeded);
      emit();
    },
    (error) => {
      metaLoaded = true;
      emit();
      console.warn('Catalog meta read notice:', error.message);
    }
  );

  const productsQuery = query(collection(db, 'products'), where('isPublic', '==', true));
  const unsubProducts = onSnapshot(
    productsQuery,
    (snapshot) => {
      productsLoaded = true;
      currentProducts = snapshot.docs.map((d) => {
        const data = d.data() as {
          name?: string;
          price?: number;
          stock?: number;
          imageUrl?: string;
          isPublic?: boolean;
          rarities?: unknown;
          createdAt?: Timestamp | null;
        };
        return {
          id: d.id,
          name: typeof data.name === 'string' ? data.name : 'Название питомца',
          price: typeof data.price === 'number' ? data.price : 250,
          stock: typeof data.stock === 'number' ? data.stock : 1,
          imageUrl: sanitizeImageUrl(data.imageUrl),
          isPublic: Boolean(data.isPublic),
          rarities: normalizeRarities(data.rarities),
          createdAtMs: data.createdAt ? data.createdAt.toMillis() : Date.now(),
        };
      });
      emit();
    },
    (error) => {
      onError(error);
    }
  );

  return () => {
    unsubMeta();
    unsubProducts();
  };
}

const DEFAULT_PASSCODE_SALT = 'viki-pets-admin-v1:';
const DEFAULT_PASSCODE_SHA256 =
  '2a0811e5b3ae777c94f3cfe997fb28b3c3ac25784290d0cd368cfcefe5757137';

function sha256FallbackHex(input: string): string {
  const bytes = new TextEncoder().encode(input);
  const k = new Uint32Array([
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ]);
  const h = new Uint32Array([
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ]);
  const bitLen = bytes.length * 8;
  const paddedLen = Math.ceil((bytes.length + 9) / 64) * 64;
  const buf = new Uint8Array(paddedLen);
  buf.set(bytes);
  buf[bytes.length] = 0x80;
  const view = new DataView(buf.buffer);
  view.setUint32(paddedLen - 8, Math.floor(bitLen / 0x100000000), false);
  view.setUint32(paddedLen - 4, bitLen >>> 0, false);

  const w = new Uint32Array(64);
  const rotr = (x: number, n: number) => (x >>> n) | (x << (32 - n));

  for (let offset = 0; offset < paddedLen; offset += 64) {
    for (let i = 0; i < 16; i++) w[i] = view.getUint32(offset + i * 4, false);
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
    }
    let [a, b, c, d, e, f, g, hh] = h;
    for (let i = 0; i < 64; i++) {
      const s1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (hh + s1 + ch + k[i] + w[i]) >>> 0;
      const s0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (s0 + maj) >>> 0;
      hh = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }
    h[0] = (h[0] + a) >>> 0;
    h[1] = (h[1] + b) >>> 0;
    h[2] = (h[2] + c) >>> 0;
    h[3] = (h[3] + d) >>> 0;
    h[4] = (h[4] + e) >>> 0;
    h[5] = (h[5] + f) >>> 0;
    h[6] = (h[6] + g) >>> 0;
    h[7] = (h[7] + hh) >>> 0;
  }
  return Array.from(h, (n) => n.toString(16).padStart(8, '0')).join('');
}

async function sha256Hex(input: string): Promise<string> {
  if (typeof window !== 'undefined' && window.crypto?.subtle) {
    const data = new TextEncoder().encode(input);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer), (b) => b.toString(16).padStart(2, '0')).join('');
  }
  return sha256FallbackHex(input);
}

function timingSafeHexEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export async function verifyAdminPasswordClient(candidate: string): Promise<boolean> {
  const configured = import.meta.env.VITE_ADMIN_PASSWORD?.trim();
  if (configured && configured.length > 0) {
    const [a, b] = await Promise.all([sha256Hex(candidate), sha256Hex(configured)]);
    return timingSafeHexEqual(a, b);
  }
  const digest = await sha256Hex(`${DEFAULT_PASSCODE_SALT}${candidate}`);
  return timingSafeHexEqual(digest, DEFAULT_PASSCODE_SHA256);
}

export async function signInOwnerWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function ensureAdminFirebaseSession(): Promise<{
  ready: boolean;
  needsAnonymousProvider?: boolean;
}> {
  if (auth.currentUser) {
    return { ready: true };
  }

  try {
    await signInAnonymously(auth);
    return { ready: true };
  } catch (error) {
    const code =
      typeof error === 'object' && error !== null && 'code' in error
        ? String((error as { code?: unknown }).code)
        : '';
    if (code === 'auth/admin-restricted-operation' || code === 'auth/operation-not-allowed') {
      return { ready: false, needsAnonymousProvider: true };
    }
    throw error;
  }
}

export async function signOutAdminFirebaseSession(): Promise<void> {
  if (auth.currentUser) {
    await signOut(auth);
  }
}

export async function ensureCatalogSeeded(): Promise<void> {
  const metaRef = doc(db, 'meta', 'catalog');
  let metaSnap;
  try {
    metaSnap = await getDoc(metaRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'meta/catalog');
  }

  if (metaSnap.exists() && metaSnap.data()?.seeded) {
    return;
  }

  const batch = writeBatch(db);
  for (const item of INITIAL_PLACEHOLDER_PRODUCTS) {
    const itemRef = doc(db, 'products', item.id);
    batch.set(itemRef, {
      name: item.name,
      price: item.price,
      stock: item.stock,
      imageUrl: item.imageUrl,
      isPublic: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
  batch.set(metaRef, {
    seeded: true,
    updatedAt: serverTimestamp(),
  });

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'meta/catalog');
  }
}

export async function publishNewProduct(input: {
  name: string;
  price: number;
  stock: number;
  imageUrl: string;
  rarities?: RarityCode[];
}): Promise<void> {
  const trimmedName = input.name.trim().slice(0, PRODUCT_LIMITS.NAME_MAX);
  const price = Math.max(0, Math.min(PRODUCT_LIMITS.PRICE_MAX, Math.round(input.price * 100) / 100));
  const stock = Math.max(0, Math.min(PRODUCT_LIMITS.STOCK_MAX, Math.floor(input.stock)));
  const imageUrl = sanitizeImageUrl(input.imageUrl);
  const rarities = normalizeRarities(input.rarities);

  if (trimmedName.length < PRODUCT_LIMITS.NAME_MIN) {
    throw new Error('Укажите название товара');
  }
  if (!imageUrl || imageUrl.length > PRODUCT_LIMITS.IMAGE_URL_MAX) {
    throw new Error('Добавьте фотографию товара (допустимый размер до 380 КБ)');
  }

  await ensureCatalogSeeded();

  try {
    await addDoc(collection(db, 'products'), {
      name: trimmedName,
      price,
      stock,
      imageUrl,
      isPublic: true,
      ...(rarities.length > 0 ? { rarities } : {}),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'products');
  }
}

export async function deleteCatalogProduct(productId: string): Promise<void> {
  await ensureCatalogSeeded();

  const path = `products/${productId}`;
  try {
    await deleteDoc(doc(db, 'products', productId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
