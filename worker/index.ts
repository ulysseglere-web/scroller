// Cloudflare Worker API & Static Assets Handler for ANTISOCIAL
// Global edge synchronization via Cloudflare KV (300+ edge locations)

export interface Env {
  ANTISOCIAL_VAULT: KVNamespace;
  ASSETS: Fetcher;
}

interface StoredUser {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  passwordHash: string;
  createdAt: string;
}

interface StoredVault {
  userId: string;
  posts: unknown[];
  profile: unknown;
  lastSyncedAt: string;
  version: number;
}

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + '_antisocial_salt_2026');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

function generateToken(userId: string): string {
  const rand = crypto.randomUUID();
  return btoa(`${userId}:${rand}:${Date.now()}`);
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    // 1. API: Inscription Cloud par E-mail
    if (url.pathname === '/api/auth/register' && request.method === 'POST') {
      try {
        const body = (await request.json()) as {
          email?: string;
          username?: string;
          displayName?: string;
          password?: string;
          avatarUrl?: string;
        };

        const cleanEmail = (body.email || '').trim().toLowerCase();
        const cleanUsername = (body.username || '').trim().toLowerCase().replace(/[^a-z0-9_.]/g, '');
        const cleanDisplayName = (body.displayName || '').trim() || cleanUsername;
        const password = (body.password || '').trim();

        if (!cleanEmail || !cleanUsername) {
          return jsonResponse({ error: 'Email et pseudo obligatoires.' }, 400);
        }

        // Check if email already registered
        const existingEmailUser = await env.ANTISOCIAL_VAULT.get(`user:email:${cleanEmail}`);
        if (existingEmailUser) {
          return jsonResponse({ error: 'Un compte existe déjà avec cette adresse e-mail.' }, 409);
        }

        // Check if username already taken
        const existingUsername = await env.ANTISOCIAL_VAULT.get(`user:username:${cleanUsername}`);
        if (existingUsername) {
          return jsonResponse({ error: 'Ce pseudo est déjà réservé par un autre utilisateur.' }, 409);
        }

        const userId = 'user_' + crypto.randomUUID().replace(/-/g, '').slice(0, 16);
        const passwordHash = password ? await hashPassword(password) : '';

        const newUser: StoredUser = {
          id: userId,
          email: cleanEmail,
          username: cleanUsername,
          displayName: cleanDisplayName,
          avatarUrl: body.avatarUrl || '',
          passwordHash,
          createdAt: new Date().toISOString(),
        };

        // Save by email and username index
        await env.ANTISOCIAL_VAULT.put(`user:email:${cleanEmail}`, JSON.stringify(newUser));
        await env.ANTISOCIAL_VAULT.put(`user:username:${cleanUsername}`, cleanEmail);

        // Initialize user vault
        const initialVault: StoredVault = {
          userId,
          posts: [],
          profile: {
            username: cleanUsername,
            displayName: cleanDisplayName,
            email: cleanEmail,
            bio: 'Archives personnelles sans public.',
            avatarUrl: body.avatarUrl || '',
            theme: 'dark',
            joinedAt: newUser.createdAt,
            highlights: [],
          },
          lastSyncedAt: new Date().toISOString(),
          version: 1,
        };
        await env.ANTISOCIAL_VAULT.put(`vault:${userId}`, JSON.stringify(initialVault));

        const token = generateToken(userId);
        await env.ANTISOCIAL_VAULT.put(`session:${token}`, userId, { expirationTtl: 86400 * 30 }); // 30 days

        return jsonResponse({
          success: true,
          token,
          profile: initialVault.profile,
          vault: initialVault,
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Erreur interne';
        return jsonResponse({ error: message }, 500);
      }
    }

    // 2. API: Connexion Multi-Appareil (Email ou Pseudo)
    if (url.pathname === '/api/auth/login' && request.method === 'POST') {
      try {
        const body = (await request.json()) as {
          identifier?: string;
          password?: string;
        };

        const rawIdentifier = (body.identifier || '').trim().toLowerCase();
        const cleanUsername = rawIdentifier.replace(/^@/, '');
        const password = (body.password || '').trim();

        if (!rawIdentifier) {
          return jsonResponse({ error: 'Veuillez saisir votre email ou pseudo.' }, 400);
        }

        // Try lookup by email first
        let targetEmail = rawIdentifier;
        let userDataStr = await env.ANTISOCIAL_VAULT.get(`user:email:${targetEmail}`);

        // If not found, try lookup by username
        if (!userDataStr) {
          const resolvedEmail = await env.ANTISOCIAL_VAULT.get(`user:username:${cleanUsername}`);
          if (resolvedEmail) {
            targetEmail = resolvedEmail;
            userDataStr = await env.ANTISOCIAL_VAULT.get(`user:email:${targetEmail}`);
          }
        }

        if (!userDataStr) {
          return jsonResponse({ error: 'Aucun compte associé à cet e-mail ou pseudo sur le cloud.' }, 404);
        }

        const user = JSON.parse(userDataStr) as StoredUser;

        // Verify password if account has password
        if (user.passwordHash) {
          const inputHash = await hashPassword(password);
          if (inputHash !== user.passwordHash) {
            return jsonResponse({ error: 'Mot de passe incorrect.' }, 401);
          }
        }

        // Fetch user's synchronized vault
        const vaultStr = await env.ANTISOCIAL_VAULT.get(`vault:${user.id}`);
        const vault = vaultStr ? (JSON.parse(vaultStr) as StoredVault) : null;

        const token = generateToken(user.id);
        await env.ANTISOCIAL_VAULT.put(`session:${token}`, user.id, { expirationTtl: 86400 * 30 });

        return jsonResponse({
          success: true,
          token,
          profile: vault?.profile || {
            username: user.username,
            displayName: user.displayName,
            email: user.email,
            avatarUrl: user.avatarUrl,
            theme: 'dark',
            joinedAt: user.createdAt,
          },
          vault: vault || { posts: [], profile: null },
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Erreur interne';
        return jsonResponse({ error: message }, 500);
      }
    }

    // 3. API: Synchronisation Cloud Pull (Récupérer depuis n'importe quel terminal)
    if (url.pathname === '/api/sync/pull' && request.method === 'POST') {
      try {
        const body = (await request.json()) as {
          email?: string;
          token?: string;
        };

        const cleanEmail = (body.email || '').trim().toLowerCase();
        if (!cleanEmail) {
          return jsonResponse({ error: 'Email requis pour la synchronisation.' }, 400);
        }

        const userDataStr = await env.ANTISOCIAL_VAULT.get(`user:email:${cleanEmail}`);
        if (!userDataStr) {
          return jsonResponse({ error: 'Utilisateur introuvable.' }, 404);
        }

        const user = JSON.parse(userDataStr) as StoredUser;
        const vaultStr = await env.ANTISOCIAL_VAULT.get(`vault:${user.id}`);
        const vault = vaultStr ? (JSON.parse(vaultStr) as StoredVault) : { posts: [], profile: null };

        return jsonResponse({
          success: true,
          vault,
          syncedAt: new Date().toISOString(),
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Erreur interne';
        return jsonResponse({ error: message }, 500);
      }
    }

    // 4. API: Synchronisation Cloud Push (Sauvegarder les posts et le profil)
    if (url.pathname === '/api/sync/push' && request.method === 'POST') {
      try {
        const body = (await request.json()) as {
          email?: string;
          posts?: unknown[];
          profile?: unknown;
        };

        const cleanEmail = (body.email || '').trim().toLowerCase();
        if (!cleanEmail) {
          return jsonResponse({ error: 'Email requis pour la synchronisation.' }, 400);
        }

        const userDataStr = await env.ANTISOCIAL_VAULT.get(`user:email:${cleanEmail}`);
        if (!userDataStr) {
          return jsonResponse({ error: 'Utilisateur introuvable.' }, 404);
        }

        const user = JSON.parse(userDataStr) as StoredUser;
        const now = new Date().toISOString();

        const updatedVault: StoredVault = {
          userId: user.id,
          posts: Array.isArray(body.posts) ? body.posts : [],
          profile: body.profile || null,
          lastSyncedAt: now,
          version: Date.now(),
        };

        await env.ANTISOCIAL_VAULT.put(`vault:${user.id}`, JSON.stringify(updatedVault));

        return jsonResponse({
          success: true,
          syncedAt: now,
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Erreur interne';
        return jsonResponse({ error: message }, 500);
      }
    }

    // 5. Servir l'application Frontend SPA (HTML, JS, CSS, Media)
    return env.ASSETS.fetch(request);
  },
};
