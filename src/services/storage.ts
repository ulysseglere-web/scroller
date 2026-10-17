import type { PostItem, UserProfile } from '../types';

const DB_NAME = 'scroller_db';
const DB_VERSION = 1;
const STORE_POSTS = 'posts';
const STORE_SETTINGS = 'settings';

const LOCAL_STORAGE_KEY_POSTS = 'scroller_posts_backup';
const LOCAL_STORAGE_KEY_PROFILE = 'scroller_profile_backup';
const SESSION_AUTH_KEY = 'scroller_auth_session';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_POSTS)) {
        db.createObjectStore(STORE_POSTS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
        db.createObjectStore(STORE_SETTINGS, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Session authentication status
export function isSessionAuthenticated(): boolean {
  return localStorage.getItem(SESSION_AUTH_KEY) === 'true';
}

export function setSessionAuthenticated(authenticated: boolean): void {
  if (authenticated) {
    localStorage.setItem(SESSION_AUTH_KEY, 'true');
  } else {
    localStorage.removeItem(SESSION_AUTH_KEY);
  }
}

// Retrieve stored posts without any fake demo seed
export async function getStoredPosts(): Promise<PostItem[]> {
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_POSTS, 'readonly');
      const store = tx.objectStore(STORE_POSTS);
      const req = store.getAll();

      req.onsuccess = () => {
        const posts: PostItem[] = req.result || [];
        posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        resolve(posts);
      };

      req.onerror = () => {
        resolve(getFallbackPosts());
      };
    });
  } catch {
    return getFallbackPosts();
  }
}

function getFallbackPosts(): PostItem[] {
  const local = localStorage.getItem(LOCAL_STORAGE_KEY_POSTS);
  if (local) {
    try {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
      // ignore
    }
  }
  return [];
}

export async function savePost(post: PostItem): Promise<void> {
  try {
    const db = await openDatabase();
    const tx = db.transaction(STORE_POSTS, 'readwrite');
    tx.objectStore(STORE_POSTS).put(post);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    const posts = getFallbackPosts();
    const index = posts.findIndex((p) => p.id === post.id);
    if (index >= 0) {
      posts[index] = post;
    } else {
      posts.unshift(post);
    }
    localStorage.setItem(LOCAL_STORAGE_KEY_POSTS, JSON.stringify(posts));
  }
}

export async function deletePostFromDb(id: string): Promise<void> {
  try {
    const db = await openDatabase();
    const tx = db.transaction(STORE_POSTS, 'readwrite');
    tx.objectStore(STORE_POSTS).delete(id);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    const posts = getFallbackPosts().filter((p) => p.id !== id);
    localStorage.setItem(LOCAL_STORAGE_KEY_POSTS, JSON.stringify(posts));
  }
}

// User Profile & Account (null if no account created yet)
export async function getStoredProfile(): Promise<UserProfile | null> {
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_SETTINGS, 'readonly');
      const store = tx.objectStore(STORE_SETTINGS);
      const req = store.get('user_profile');

      req.onsuccess = () => {
        if (req.result && req.result.value) {
          resolve(req.result.value);
        } else {
          resolve(getFallbackProfile());
        }
      };
      req.onerror = () => resolve(getFallbackProfile());
    });
  } catch {
    return getFallbackProfile();
  }
}

function getFallbackProfile(): UserProfile | null {
  const local = localStorage.getItem(LOCAL_STORAGE_KEY_PROFILE);
  if (local) {
    try {
      return JSON.parse(local);
    } catch {
      // ignore
    }
  }
  return null;
}

export async function saveProfileToDb(profile: UserProfile): Promise<void> {
  try {
    const db = await openDatabase();
    const tx = db.transaction(STORE_SETTINGS, 'readwrite');
    tx.objectStore(STORE_SETTINGS).put({ key: 'user_profile', value: profile });
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    localStorage.setItem(LOCAL_STORAGE_KEY_PROFILE, JSON.stringify(profile));
  }
}

export async function exportAllData(): Promise<string> {
  const posts = await getStoredPosts();
  const profile = await getStoredProfile();
  const payload = {
    version: 2,
    appName: 'ANTISOCIAL',
    exportedAt: new Date().toISOString(),
    profile,
    posts,
  };
  return JSON.stringify(payload, null, 2);
}

export async function importData(jsonContent: string): Promise<boolean> {
  try {
    const data = JSON.parse(jsonContent);
    if (!data || !Array.isArray(data.posts)) {
      throw new Error('Fichier d’archive invalide');
    }
    const db = await openDatabase();
    const tx = db.transaction([STORE_POSTS, STORE_SETTINGS], 'readwrite');
    const postsStore = tx.objectStore(STORE_POSTS);
    await new Promise<void>((res) => {
      const clearReq = postsStore.clear();
      clearReq.onsuccess = () => res();
    });
    for (const p of data.posts) {
      postsStore.put(p);
    }
    if (data.profile) {
      tx.objectStore(STORE_SETTINGS).put({ key: 'user_profile', value: data.profile });
    }
    await new Promise<void>((res, rej) => {
      tx.oncomplete = () => res();
      tx.onerror = () => rej(tx.error);
    });
    setSessionAuthenticated(true);
    return true;
  } catch (err) {
    console.error('Erreur import:', err);
    return false;
  }
}

// Complete data reset (Remise à zéro)
export async function clearAllUserData(): Promise<void> {
  try {
    const db = await openDatabase();
    const tx = db.transaction([STORE_POSTS, STORE_SETTINGS], 'readwrite');
    tx.objectStore(STORE_POSTS).clear();
    tx.objectStore(STORE_SETTINGS).clear();
    await new Promise<void>((res) => {
      tx.oncomplete = () => res();
    });
  } catch {
    // fallback
  }
  localStorage.removeItem(LOCAL_STORAGE_KEY_POSTS);
  localStorage.removeItem(LOCAL_STORAGE_KEY_PROFILE);
  localStorage.removeItem(SESSION_AUTH_KEY);
  localStorage.removeItem('scroller_schema_v2_minimalist');
}
