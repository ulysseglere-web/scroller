// Cloudflare KV Synchronization Service for ANTISOCIAL
// Enables multi-device login, real-time edge sync, and offline-first persistence

import type { UserProfile, PostItem } from '../types';
import { 
  saveProfileToDb, 
  getStoredProfile,
  setSessionAuthenticated,
  openDatabase,
  STORE_POSTS
} from './storage';

const TOKEN_KEY = 'antisocial_auth_token';
const CLOUD_EMAIL_KEY = 'antisocial_cloud_email';
const LAST_SYNC_KEY = 'antisocial_last_sync_timestamp';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredCloudEmail(): string | null {
  return localStorage.getItem(CLOUD_EMAIL_KEY);
}

export function setStoredSession(token: string, email: string) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(CLOUD_EMAIL_KEY, email);
}

export function clearStoredSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(CLOUD_EMAIL_KEY);
  localStorage.removeItem(LAST_SYNC_KEY);
}

export interface AuthResult {
  success: boolean;
  profile?: UserProfile;
  posts?: PostItem[];
  error?: string;
}

/**
 * Register a new user on the Cloudflare KV global network
 */
export async function registerOnCloud(
  profile: UserProfile,
  password?: string
): Promise<AuthResult> {
  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: profile.email,
        username: profile.username,
        displayName: profile.displayName,
        password: password || profile.password || '',
        avatarUrl: profile.avatarUrl,
      }),
    });

    const data = await response.json();
    if (!response.ok || data.error) {
      return { success: false, error: data.error || 'Erreur lors de l’inscription cloud.' };
    }

    if (data.token && profile.email) {
      setStoredSession(data.token, profile.email);
    }

    await saveProfileToDb(profile);
    setSessionAuthenticated(true);

    return {
      success: true,
      profile,
      posts: [],
    };
  } catch (err: unknown) {
    console.warn('API cloud indisponible, bascule en mode local:', err);
    // Graceful offline fallback
    await saveProfileToDb(profile);
    setSessionAuthenticated(true);
    return { success: true, profile, posts: [] };
  }
}

/**
 * Log in from ANY device (mobile, laptop, another browser) using email or pseudo
 */
export async function loginOnCloud(
  identifier: string,
  password?: string
): Promise<AuthResult> {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: identifier.trim(),
        password: password?.trim() || '',
      }),
    });

    const data = await response.json();
    if (!response.ok || data.error) {
      return { success: false, error: data.error || 'Identifiants invalides sur le réseau ANTISOCIAL.' };
    }

    const fetchedProfile: UserProfile = {
      username: data.profile.username,
      displayName: data.profile.displayName || data.profile.username,
      email: data.profile.email,
      bio: data.profile.bio || 'Archives personnelles sans public.',
      avatarUrl: data.profile.avatarUrl || '',
      theme: data.profile.theme || 'dark',
      joinedAt: data.profile.joinedAt || new Date().toISOString(),
      highlights: data.profile.highlights || [],
      password: password?.trim() || '',
    };

    const fetchedPosts: PostItem[] = Array.isArray(data.vault?.posts) ? data.vault.posts : [];

    // Store auth credentials
    if (data.token && fetchedProfile.email) {
      setStoredSession(data.token, fetchedProfile.email);
    }

    // Save fetched cloud data directly to local IndexedDB for instant offline-first experience
    await saveProfileToDb(fetchedProfile);

    const db = await openDatabase();
    const tx = db.transaction([STORE_POSTS], 'readwrite');
    const store = tx.objectStore(STORE_POSTS);
    await new Promise<void>((res) => {
      const clearReq = store.clear();
      clearReq.onsuccess = () => res();
    });

    for (const post of fetchedPosts) {
      store.put(post);
    }

    await new Promise<void>((res, rej) => {
      tx.oncomplete = () => res();
      tx.onerror = () => rej(tx.error);
    });

    setSessionAuthenticated(true);

    return {
      success: true,
      profile: fetchedProfile,
      posts: fetchedPosts,
    };
  } catch (err: unknown) {
    console.error('Erreur connexion cloud:', err);
    return { success: false, error: 'Impossible de joindre le serveur ANTISOCIAL. Vérifiez votre connexion.' };
  }
}

/**
 * Push local posts & profile to Cloudflare KV in background
 */
let pushTimeout: ReturnType<typeof setTimeout> | null = null;

export function triggerBackgroundPush(posts: PostItem[], profile: UserProfile) {
  if (pushTimeout) clearTimeout(pushTimeout);

  pushTimeout = setTimeout(async () => {
    const email = profile.email || getStoredCloudEmail();
    const token = getStoredToken();
    if (!email) return;

    try {
      await fetch('/api/sync/push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          email,
          token,
          posts,
          profile,
        }),
      });
      localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
    } catch (err) {
      console.warn('Sync push temporairement différé (hors-ligne):', err);
    }
  }, 1200); // 1.2s debounce
}

/**
 * Pull latest posts & profile from Cloudflare KV (multi-device sync check)
 */
export async function pullCloudSync(
  email: string
): Promise<{ posts: PostItem[]; profile: UserProfile } | null> {
  const token = getStoredToken();
  if (!email) return null;

  try {
    const res = await fetch('/api/sync/pull', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ email, token }),
    });

    const data = await res.json();
    if (res.ok && data.success && data.vault) {
      const cloudPosts: PostItem[] = Array.isArray(data.vault.posts) ? data.vault.posts : [];
      const cloudProfile: UserProfile | null = data.vault.profile;
      return {
        posts: cloudPosts,
        profile: cloudProfile || (await getStoredProfile())!,
      };
    }
  } catch (err) {
    console.warn('Sync pull en attente de réseau:', err);
  }
  return null;
}
