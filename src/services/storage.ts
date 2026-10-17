import type { PostItem, UserProfile } from '../types';
import { DEFAULT_PROFILE, STARTER_POSTS } from './starterData';

const DB_NAME = 'scroller_db';
const DB_VERSION = 1;
const STORE_POSTS = 'posts';
const STORE_SETTINGS = 'settings';

const LOCAL_STORAGE_KEY_POSTS = 'scroller_posts_backup';
const LOCAL_STORAGE_KEY_PROFILE = 'scroller_profile_backup';

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

const SCHEMA_VERSION_KEY = 'scroller_schema_v2_minimalist';

export async function getStoredPosts(): Promise<PostItem[]> {
  try {
    if (!localStorage.getItem(SCHEMA_VERSION_KEY)) {
      await resetDatabaseToDemo();
      localStorage.setItem(SCHEMA_VERSION_KEY, 'true');
    }

    const db = await openDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_POSTS, 'readonly');
      const store = tx.objectStore(STORE_POSTS);
      const req = store.getAll();

      req.onsuccess = () => {
        let posts: PostItem[] = req.result || [];
        if (posts.length === 0) {
          initStarterPosts().then(resolve);
        } else {
          posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          resolve(posts);
        }
      };

      req.onerror = () => {
        resolve(getFallbackPosts());
      };
    });
  } catch {
    return getFallbackPosts();
  }
}

async function initStarterPosts(): Promise<PostItem[]> {
  try {
    const db = await openDatabase();
    const tx = db.transaction(STORE_POSTS, 'readwrite');
    const store = tx.objectStore(STORE_POSTS);
    for (const post of STARTER_POSTS) {
      store.put(post);
    }
    await new Promise<void>((res) => {
      tx.oncomplete = () => res();
    });
  } catch {
    // fallback
    localStorage.setItem(LOCAL_STORAGE_KEY_POSTS, JSON.stringify(STARTER_POSTS));
  }
  return [...STARTER_POSTS];
}

function getFallbackPosts(): PostItem[] {
  const local = localStorage.getItem(LOCAL_STORAGE_KEY_POSTS);
  if (local) {
    try {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch {
      // ignore
    }
  }
  localStorage.setItem(LOCAL_STORAGE_KEY_POSTS, JSON.stringify(STARTER_POSTS));
  return [...STARTER_POSTS];
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
    // Fallback LocalStorage
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

export async function getStoredProfile(): Promise<UserProfile> {
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

function getFallbackProfile(): UserProfile {
  const local = localStorage.getItem(LOCAL_STORAGE_KEY_PROFILE);
  if (local) {
    try {
      return JSON.parse(local);
    } catch {
      // ignore
    }
  }
  return { ...DEFAULT_PROFILE };
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
    version: 1,
    appName: 'SCROLLER',
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
    return true;
  } catch (err) {
    console.error('Erreur import:', err);
    return false;
  }
}

export async function resetDatabaseToDemo(): Promise<void> {
  try {
    const db = await openDatabase();
    const tx = db.transaction([STORE_POSTS, STORE_SETTINGS], 'readwrite');
    tx.objectStore(STORE_POSTS).clear();
    for (const post of STARTER_POSTS) {
      tx.objectStore(STORE_POSTS).put(post);
    }
    tx.objectStore(STORE_SETTINGS).put({ key: 'user_profile', value: DEFAULT_PROFILE });
    await new Promise<void>((res) => {
      tx.oncomplete = () => res();
    });
  } catch {
    localStorage.setItem(LOCAL_STORAGE_KEY_POSTS, JSON.stringify(STARTER_POSTS));
    localStorage.setItem(LOCAL_STORAGE_KEY_PROFILE, JSON.stringify(DEFAULT_PROFILE));
  }
}
