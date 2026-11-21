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

export async function signInOwnerWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function ensureAdminFirebaseSession(adminToken?: string | null): Promise<{
  ready: boolean;
  needsAnonymousProvider?: boolean;
}> {
  if (adminToken) {
    const check = await fetch('/api/admin/session', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (!check.ok) {
      throw new Error('Сессия администратора истекла. Введите пароль снова.');
    }
  }

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
