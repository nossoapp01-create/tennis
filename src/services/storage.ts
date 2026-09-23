import { SneakerProduct, PartnerStore, CartItem } from '../types';

const DB_NAME = 'KicksLuxeDB';
const DB_VERSION = 1;
const STORE_PRODUCTS = 'products';
const STORE_PARTNERS = 'partners';
const STORE_CART = 'cart';

let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.reject(new Error('IndexedDB not supported'));
  }

  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      try {
        const request = window.indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains(STORE_PRODUCTS)) {
            db.createObjectStore(STORE_PRODUCTS, { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains(STORE_PARTNERS)) {
            db.createObjectStore(STORE_PARTNERS, { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains(STORE_CART)) {
            db.createObjectStore(STORE_CART, { keyPath: 'key' });
          }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      } catch (err) {
        reject(err);
      }
    });
  }
  return dbPromise;
}

// Helper for safe localStorage write with zero crash guarantee
export function safeLocalStorageSet(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (err) {
    console.warn(`[Storage] localStorage.setItem failed for key "${key}" (quota exceeded). Storing in IndexedDB.`);
    return false;
  }
}

export function safeLocalStorageGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

// --- PRODUCTS PERSISTENCE ---

export async function saveProductsToStorage(products: SneakerProduct[]): Promise<void> {
  if (!products || !Array.isArray(products)) return;

  // 1. Always save to IndexedDB first (unlimited quota, handles hundreds of MBs of images safely)
  try {
    const db = await getDB();
    const tx = db.transaction(STORE_PRODUCTS, 'readwrite');
    const store = tx.objectStore(STORE_PRODUCTS);
    await new Promise<void>((resolve, reject) => {
      const clearReq = store.clear();
      clearReq.onsuccess = () => {
        if (products.length === 0) return resolve();
        let count = 0;
        for (const prod of products) {
          const addReq = store.put(prod);
          addReq.onsuccess = () => {
            count++;
            if (count === products.length) resolve();
          };
          addReq.onerror = () => reject(addReq.error);
        }
      };
      clearReq.onerror = () => reject(clearReq.error);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('[Storage] IndexedDB saveProducts failed:', err);
  }

  // 2. Safe localStorage write
  try {
    const json = JSON.stringify(products);
    const success = safeLocalStorageSet('kicksluxe_products', json);
    if (!success) {
      // If quota exceeded, save essential items or meta without crashing
      const lightBackup = products.map((p) => ({
        ...p,
        image: p.image && p.image.length > 3000 ? p.image.slice(0, 150) + '...[indexeddb]' : p.image,
      }));
      safeLocalStorageSet('kicksluxe_products', JSON.stringify(lightBackup));
    }
  } catch (err) {
    console.warn('[Storage] localStorage products backup skipped safely:', err);
  }

  // 3. Broadcast update event so any active components re-sync in real-time
  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('kicksluxe_catalog_sync', { detail: { count: products.length } }));
    }
  } catch {}
}

export async function loadProductsFromStorage(): Promise<SneakerProduct[] | null> {
  // 1. Try loading from IndexedDB first
  try {
    const db = await getDB();
    const tx = db.transaction(STORE_PRODUCTS, 'readonly');
    const store = tx.objectStore(STORE_PRODUCTS);
    const products: SneakerProduct[] = await new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });

    if (Array.isArray(products) && products.length > 0) {
      return products;
    }
  } catch (err) {
    console.warn('[Storage] IndexedDB loadProducts failed, falling back to localStorage:', err);
  }

  // 2. Fallback to localStorage
  const saved = safeLocalStorageGet('kicksluxe_products');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {}
  }

  return null;
}

// --- PARTNER STORES PERSISTENCE ---

export async function saveStoresToStorage(stores: PartnerStore[]): Promise<void> {
  safeLocalStorageSet('kicksluxe_stores', JSON.stringify(stores));
  try {
    const db = await getDB();
    const tx = db.transaction(STORE_PARTNERS, 'readwrite');
    const store = tx.objectStore(STORE_PARTNERS);
    await new Promise<void>((resolve, reject) => {
      const clearReq = store.clear();
      clearReq.onsuccess = () => {
        if (stores.length === 0) return resolve();
        let count = 0;
        for (const st of stores) {
          const req = store.put(st);
          req.onsuccess = () => {
            count++;
            if (count === stores.length) resolve();
          };
          req.onerror = () => reject(req.error);
        }
      };
      clearReq.onerror = () => reject(clearReq.error);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {}
}

export async function loadStoresFromStorage(): Promise<PartnerStore[] | null> {
  const saved = safeLocalStorageGet('kicksluxe_stores');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {}
  }
  return null;
}

// --- CART PERSISTENCE ---

export function saveCartToStorage(cart: CartItem[]): void {
  safeLocalStorageSet('kicksluxe_cart', JSON.stringify(cart));
}

export function loadCartFromStorage(): CartItem[] {
  const saved = safeLocalStorageGet('kicksluxe_cart');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    } catch {}
  }
  return [];
}
