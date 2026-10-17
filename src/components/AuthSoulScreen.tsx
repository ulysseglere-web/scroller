import React, { useState } from 'react';
import { 
  ShieldCheck, 
  EyeOff, 
  Lock, 
  User, 
  ArrowRight, 
  Upload, 
  Check, 
  KeyRound,
  Camera,
  Layers
} from 'lucide-react';
import type { UserProfile } from '../types';
import { sound } from '../services/sound';

interface AuthSoulScreenProps {
  existingAccount: UserProfile | null;
  onLogin: (profile: UserProfile) => void;
  onRegister: (profile: UserProfile) => void;
  onImportBackup: (jsonContent: string) => void;
}

const PRESET_AVATARS = [
  {
    id: 'av-1',
    label: 'Éclipse',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'av-2',
    label: 'Silence',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'av-3',
    label: 'Brume',
    url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'av-4',
    label: 'Solitaire',
    url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80',
  },
];

export const AuthSoulScreen: React.FC<AuthSoulScreenProps> = ({
  existingAccount,
  onLogin,
  onRegister,
  onImportBackup,
}) => {
  // If an account already exists locally, default to 'login', otherwise 'register'
  const [mode, setMode] = useState<'register' | 'login'>(existingAccount ? 'login' : 'register');

  // Register form fields
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('Archives personnelles et fragments de vie sans spectateurs.');
  const [avatarUrl, setAvatarUrl] = useState(PRESET_AVATARS[0].url);
  const [registerPassword, setRegisterPassword] = useState('');

  // Login form fields
  const [loginUsername, setLoginUsername] = useState(existingAccount ? existingAccount.username : '');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Handle personal photo upload
  const handleCustomAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        sound.playPop();
        setAvatarUrl(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_.]/g, '');
    const cleanDisplayName = displayName.trim() || cleanUsername || 'Moi';

    if (!cleanUsername) {
      alert('Veuillez renseigner un pseudo (ex: @alexandre).');
      return;
    }

    sound.playPop();

    const newProfile: UserProfile = {
      username: cleanUsername,
      displayName: cleanDisplayName,
      bio: bio.trim(),
      avatarUrl: avatarUrl.trim(),
      theme: 'dark',
      joinedAt: new Date().toISOString(),
      highlights: [],
      password: registerPassword.trim(),
    };

    onRegister(newProfile);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!existingAccount) {
      setLoginError('Aucun compte enregistré sur cet appareil. Veuillez en créer un ci-dessus.');
      return;
    }

    // Verify username match if entered
    if (loginUsername.trim().toLowerCase() !== existingAccount.username.toLowerCase()) {
      setLoginError('Pseudo introuvable sur cet appareil.');
      return;
    }

    // Verify password if protected
    if (existingAccount.password && existingAccount.password.trim() !== '') {
      if (loginPassword.trim() !== existingAccount.password.trim()) {
        setLoginError('Code secret / mot de passe incorrect.');
        return;
      }
    }

    sound.playChime();
    onLogin(existingAccount);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) onImportBackup(content);
    };
    reader.readAsText(file);
  };

  return (
    <div className="auth-soul-container">
      {/* Background ambient lighting */}
      <div className="auth-ambient-glow" />

      {/* Main card */}
      <div className="auth-soul-card">
        {/* Brand Header */}
        <header className="auth-header">
          <div className="auth-logo-badge">
            <img src="/logo.png" alt="SCROLLER" className="auth-brand-logo" />
            <span className="auth-status-dot" />
          </div>
          <h1 className="auth-wordmark">SCROLLER</h1>
          <p className="auth-soul-tagline">“The social media where you’re alone.”</p>
        </header>

        {/* Soul of the Application (Explication de l'âme) */}
        <section className="auth-manifesto-block">
          <div className="manifesto-pill">
            <ShieldCheck size={13} className="text-crimson" />
            <span>MANIFESTE FONDAMENTAL</span>
          </div>
          <h2 className="manifesto-title">Pourquoi SCROLLER existe ?</h2>
          <p className="manifesto-lead">
            Les réseaux sociaux actuels transforment nos vies en spectacle, dictés par la tyrannie des likes, 
            des algorithmes voyeurs et de la comparaison permanente.
          </p>
          <p className="manifesto-body">
            <strong>SCROLLER est votre sanctuaire personnel.</strong> Vous profitez de la beauté visuelle 
            des formats actuels (Feed 4:5 bord-à-bord, Reels 9:16, Stories éphémères), mais pour 
            <strong> vous seul</strong>. Zéro followers, zéro jugement, zéro trace externe. 
            Vos souvenirs restent stockés exclusivement sur cet appareil.
          </p>

          <div className="manifesto-pillars-grid">
            <div className="pillar-item">
              <div className="pillar-icon-box">
                <EyeOff size={18} />
              </div>
              <div className="pillar-text">
                <span className="pillar-title">Zéro Regard d'Autrui</span>
                <span className="pillar-desc">Aucun like à quémander, aucune audience à impressionner. Soyez vrai.</span>
              </div>
            </div>

            <div className="pillar-item">
              <div className="pillar-icon-box">
                <Layers size={18} />
              </div>
              <div className="pillar-text">
                <span className="pillar-title">Formats Flagship 4:5 & 9:16</span>
                <span className="pillar-desc">La puissance immersive d’Instagram et TikTok, au service de votre paix intérieure.</span>
              </div>
            </div>

            <div className="pillar-item">
              <div className="pillar-icon-box">
                <Lock size={18} />
              </div>
              <div className="pillar-text">
                <span className="pillar-title">100% Souverain & Privé</span>
                <span className="pillar-desc">Stockage local dans votre navigateur. Vos données ne quittent jamais votre machine.</span>
              </div>
            </div>
          </div>
        </section>

        {/* Tab switch: Register vs Login */}
        <div className="auth-tabs-toggle">
          <button
            type="button"
            className={`auth-tab-btn ${mode === 'register' ? 'active' : ''}`}
            onClick={() => {
              sound.playTap();
              setMode('register');
              setLoginError('');
            }}
          >
            <span>Créer mon sanctuaire</span>
          </button>
          <button
            type="button"
            className={`auth-tab-btn ${mode === 'login' ? 'active' : ''}`}
            onClick={() => {
              sound.playTap();
              setMode('login');
              setLoginError('');
            }}
          >
            <span>Se connecter</span>
          </button>
        </div>

        {/* Form area */}
        {mode === 'register' ? (
          <form className="auth-form" onSubmit={handleRegisterSubmit}>
            <div className="form-group">
              <label htmlFor="reg-username">Nom d'utilisateur (Pseudo unique)</label>
              <div className="input-with-icon">
                <span className="input-prefix">@</span>
                <input
                  id="reg-username"
                  type="text"
                  placeholder="votre_pseudo"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>
              <span className="input-helper">Sera affiché en tête de votre fil privé.</span>
            </div>

            <div className="form-group">
              <label htmlFor="reg-display">Nom complet ou prénom</label>
              <div className="input-with-icon">
                <User size={16} className="input-icon" />
                <input
                  id="reg-display"
                  type="text"
                  placeholder="Ex: Ulysse, Sarah..."
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="reg-bio">Devise personnelle ou bio</label>
              <textarea
                id="reg-bio"
                rows={2}
                placeholder="Ex: Vivre sans bruit. Archiver ce qui compte vraiment."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
            </div>

            {/* Avatar Selection */}
            <div className="form-group">
              <label>Photo de profil</label>
              <div className="avatar-selection-row">
                {PRESET_AVATARS.map((av) => (
                  <div
                    key={av.id}
                    className={`avatar-choice-item ${avatarUrl === av.url ? 'active' : ''}`}
                    onClick={() => {
                      sound.playTap();
                      setAvatarUrl(av.url);
                    }}
                    role="button"
                    tabIndex={0}
                    title={av.label}
                  >
                    <img src={av.url} alt={av.label} />
                    {avatarUrl === av.url && (
                      <div className="avatar-check-badge">
                        <Check size={12} strokeWidth={3} />
                      </div>
                    )}
                  </div>
                ))}

                <label className="avatar-upload-btn" title="Téléverser ma propre photo">
                  <Camera size={18} />
                  <span>Importer</span>
                  <input type="file" accept="image/*" onChange={handleCustomAvatar} hidden />
                </label>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="reg-pass">Code secret d'accès / Mot de passe (Optionnel)</label>
              <div className="input-with-icon">
                <KeyRound size={16} className="input-icon" />
                <input
                  id="reg-pass"
                  type="password"
                  placeholder="Laissez vide ou tapez un code"
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
              <span className="input-helper">Permet de verrouiller votre sanctuaire contre les regards indiscrets.</span>
            </div>

            <button type="submit" className="auth-submit-btn">
              <span>ENTRER DANS MON ESPACE</span>
              <ArrowRight size={18} />
            </button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={handleLoginSubmit}>
            {existingAccount ? (
              <div className="existing-account-badge">
                <div className="badge-avatar">
                  <img src={existingAccount.avatarUrl} alt={existingAccount.displayName} />
                </div>
                <div className="badge-meta">
                  <span className="badge-name">{existingAccount.displayName}</span>
                  <span className="badge-username">@{existingAccount.username}</span>
                </div>
              </div>
            ) : (
              <div className="no-account-notice">
                <p>Aucun compte n'a encore été créé sur ce navigateur.</p>
                <button 
                  type="button" 
                  className="btn-switch-create"
                  onClick={() => setMode('register')}
                >
                  Créer un compte maintenant
                </button>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="login-username">Pseudo</label>
              <div className="input-with-icon">
                <span className="input-prefix">@</span>
                <input
                  id="login-username"
                  type="text"
                  placeholder="votre_pseudo"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            {existingAccount?.password && (
              <div className="form-group">
                <label htmlFor="login-pass">Code secret / Mot de passe</label>
                <div className="input-with-icon">
                  <Lock size={16} className="input-icon" />
                  <input
                    id="login-pass"
                    type="password"
                    placeholder="Tapez votre code secret"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                </div>
              </div>
            )}

            {loginError && (
              <div className="auth-error-banner">
                <span>{loginError}</span>
              </div>
            )}

            <button type="submit" className="auth-submit-btn">
              <span>DÉVERROUILLER MON ESPACE</span>
              <ArrowRight size={18} />
            </button>
          </form>
        )}

        {/* Footer actions: Backup recovery */}
        <footer className="auth-footer">
          <label className="auth-backup-link">
            <Upload size={14} />
            <span>Restaurer une sauvegarde JSON existante</span>
            <input type="file" accept=".json" onChange={handleImportFile} hidden />
          </label>
        </footer>
      </div>
    </div>
  );
};
