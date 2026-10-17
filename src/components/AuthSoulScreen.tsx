import React, { useState, useId } from 'react';
import { 
  Lock, 
  User, 
  ArrowRight, 
  Upload, 
  KeyRound, 
  Camera, 
  Trash2,
  Heart,
  Bookmark,
  Share2,
  Compass,
  PlusSquare,
  Home
} from 'lucide-react';
import type { UserProfile } from '../types';
import { sound } from '../services/sound';

interface AuthSoulScreenProps {
  existingAccount: UserProfile | null;
  onLogin: (profile: UserProfile) => void;
  onRegister: (profile: UserProfile) => void;
  onImportBackup: (jsonContent: string) => void;
}

export const AuthSoulScreen: React.FC<AuthSoulScreenProps> = ({
  existingAccount,
  onLogin,
  onRegister,
  onImportBackup,
}) => {
  const [mode, setMode] = useState<'register' | 'login'>(existingAccount ? 'login' : 'register');

  // Interactive phone preview state
  const [isLikedInPhone, setIsLikedInPhone] = useState(true);
  const [phoneLikes, setPhoneLikes] = useState(1);
  const [showHeartBurst, setShowHeartBurst] = useState(false);

  // Register form state
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const bio = 'Archives personnelles sans public.';
  const [customAvatar, setCustomAvatar] = useState<string>('');
  const [registerPassword, setRegisterPassword] = useState('');

  // Login form state
  const [loginUsername, setLoginUsername] = useState(existingAccount ? existingAccount.username : '');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const fileInputId = useId();

  const getMonogram = () => {
    const source = displayName.trim() || username.trim() || 'S';
    return source.charAt(0).toUpperCase();
  };

  const handlePhoneLike = () => {
    if (!isLikedInPhone) {
      sound.playHeart();
      setShowHeartBurst(true);
      setIsLikedInPhone(true);
      setPhoneLikes(1);
      setTimeout(() => setShowHeartBurst(false), 800);
    } else {
      sound.playTap();
      setIsLikedInPhone(false);
      setPhoneLikes(0);
    }
  };

  const handlePhoneDoubleTap = () => {
    sound.playHeart();
    setShowHeartBurst(true);
    setIsLikedInPhone(true);
    setPhoneLikes(1);
    setTimeout(() => setShowHeartBurst(false), 800);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner un fichier image valide (JPG, PNG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        sound.playPop();
        setCustomAvatar(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    sound.playTap();
    setCustomAvatar('');
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_.]/g, '');
    const cleanDisplayName = displayName.trim() || cleanUsername || 'Moi';

    if (!cleanUsername) {
      alert('Veuillez renseigner un pseudo (ex: @solitaire).');
      return;
    }

    sound.playPop();

    let finalAvatar = customAvatar;
    if (!finalAvatar) {
      const letter = cleanDisplayName.charAt(0).toUpperCase();
      const svgMonogram = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="#000000"/><text x="50%" y="54%" font-family="Space Grotesk, sans-serif" font-size="96" font-weight="800" fill="#ffffff" text-anchor="middle" dominant-baseline="middle">${letter}</text></svg>`;
      finalAvatar = `data:image/svg+xml;utf8,${encodeURIComponent(svgMonogram)}`;
    }

    const newProfile: UserProfile = {
      username: cleanUsername,
      displayName: cleanDisplayName,
      bio: bio.trim(),
      avatarUrl: finalAvatar,
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
      setLoginError('Aucun compte enregistré sur cet appareil.');
      return;
    }

    if (loginUsername.trim().toLowerCase() !== existingAccount.username.toLowerCase()) {
      setLoginError('Pseudo introuvable sur cet appareil.');
      return;
    }

    if (existingAccount.password && existingAccount.password.trim() !== '') {
      if (loginPassword.trim() !== existingAccount.password.trim()) {
        setLoginError('Code secret ou mot de passe incorrect.');
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
    <div className="classe-page-wrapper">
      {/* 1. Header Minimaliste & Prestigieux */}
      <header className="classe-navbar">
        <div className="classe-brand">
          <img src="/logo.png" alt="SCROLLER" className="classe-logo-img" />
          <span className="classe-brand-name">SCROLLER</span>
        </div>

        <div className="classe-nav-meta">
          {existingAccount ? (
            <button 
              className="classe-nav-btn"
              onClick={() => {
                sound.playTap();
                setMode('login');
                document.getElementById('portal-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <span>Accéder à mon espace (@{existingAccount.username})</span>
              <ArrowRight size={14} />
            </button>
          ) : (
            <button 
              className="classe-nav-btn"
              onClick={() => {
                sound.playTap();
                setMode('register');
                document.getElementById('portal-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <span>Commencer</span>
              <ArrowRight size={14} />
            </button>
          )}
        </div>
      </header>

      {/* 2. Hero & Showcase iPhone (Deux colonnes d'élégance) */}
      <main className="classe-main-content">
        <section className="classe-split-hero">
          {/* Colonne Gauche : Présentation claire & Accès */}
          <div className="classe-col-intro" id="portal-section">
            <div className="classe-eyebrow">
              <span className="classe-dot" />
              <span>ESPACE PERSONNEL PRIVÉ</span>
            </div>

            <h1 className="classe-headline">
              THE SOCIAL MEDIA
              <span className="classe-headline-accent">WHERE YOU'RE ALONE.</span>
            </h1>

            <p className="classe-manifesto">
              SCROLLER réinvente l'élégance des plateformes visuelles pour un usage strictement intime.
              Vos clichés, vos carrousels et vos séquences vidéo s'expriment en plein cadre, sans compression dégradante.
              Aucun algorithme, aucune publicité, aucun regard extérieur.
            </p>

            {/* Carte d'accès / Inscription épurée */}
            <div className="classe-portal-card">
              <div className="classe-portal-tabs">
                <button
                  type="button"
                  className={`portal-tab ${mode === 'register' ? 'active' : ''}`}
                  onClick={() => {
                    sound.playTap();
                    setMode('register');
                    setLoginError('');
                  }}
                >
                  <span>Créer mon espace</span>
                </button>
                <button
                  type="button"
                  className={`portal-tab ${mode === 'login' ? 'active' : ''}`}
                  onClick={() => {
                    sound.playTap();
                    setMode('login');
                    setLoginError('');
                  }}
                >
                  <span>Connexion</span>
                </button>
              </div>

              {mode === 'register' ? (
                <form className="classe-form" onSubmit={handleRegisterSubmit}>
                  {/* Photo de profil personnalisée */}
                  <div className="classe-avatar-picker">
                    <div className="avatar-disc">
                      {customAvatar ? (
                        <div className="custom-photo-wrap">
                          <img src={customAvatar} alt="Votre photo" />
                          <button
                            type="button"
                            className="btn-trash-avatar"
                            onClick={handleRemovePhoto}
                            title="Supprimer"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ) : (
                        <div className="monogram-disc">
                          <span>{getMonogram()}</span>
                        </div>
                      )}
                    </div>

                    <div className="avatar-meta-info">
                      <span className="avatar-title">Photo personnelle</span>
                      <span className="avatar-sub">Importez votre cliché ou conservez votre initiale.</span>
                      <label htmlFor={fileInputId} className="btn-choose-file">
                        <Camera size={13} />
                        <span>{customAvatar ? 'Changer de photo' : 'Importer une photo'}</span>
                        <input 
                          id={fileInputId} 
                          type="file" 
                          accept="image/*" 
                          onChange={handlePhotoUpload} 
                          hidden 
                        />
                      </label>
                    </div>
                  </div>

                  {/* Champs de formulaire */}
                  <div className="classe-input-group">
                    <label htmlFor="reg-pseudo">Pseudo</label>
                    <div className="classe-field-box">
                      <span className="prefix">@</span>
                      <input
                        id="reg-pseudo"
                        type="text"
                        placeholder="votre_pseudo"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        autoComplete="username"
                        required
                      />
                    </div>
                  </div>

                  <div className="classe-input-group">
                    <label htmlFor="reg-name">Nom complet ou prénom</label>
                    <div className="classe-field-box">
                      <User size={15} className="field-icon" />
                      <input
                        id="reg-name"
                        type="text"
                        placeholder="Ex: Alexandre"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="classe-input-group">
                    <label htmlFor="reg-pass">Code d'accès secret (optionnel)</label>
                    <div className="classe-field-box">
                      <KeyRound size={15} className="field-icon" />
                      <input
                        id="reg-pass"
                        type="password"
                        placeholder="Laissez vide ou tapez un code"
                        value={registerPassword}
                        onChange={(e) => setRegisterPassword(e.target.value)}
                        autoComplete="new-password"
                      />
                    </div>
                  </div>

                  <button type="submit" className="btn-classe-submit">
                    <span>ENTRER DANS MON ESPACE</span>
                    <ArrowRight size={16} />
                  </button>
                </form>
              ) : (
                <form className="classe-form" onSubmit={handleLoginSubmit}>
                  {existingAccount ? (
                    <div className="classe-account-pill">
                      <img src={existingAccount.avatarUrl} alt={existingAccount.displayName} className="pill-img" />
                      <div className="pill-texts">
                        <span className="pill-name">{existingAccount.displayName}</span>
                        <span className="pill-handle">@{existingAccount.username}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="classe-empty-login">
                      <p>Aucun compte détecté sur ce navigateur.</p>
                      <button 
                        type="button" 
                        className="btn-switch-tab"
                        onClick={() => setMode('register')}
                      >
                        Créer mon espace maintenant →
                      </button>
                    </div>
                  )}

                  <div className="classe-input-group">
                    <label htmlFor="log-pseudo">Pseudo</label>
                    <div className="classe-field-box">
                      <span className="prefix">@</span>
                      <input
                        id="log-pseudo"
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
                    <div className="classe-input-group">
                      <label htmlFor="log-pass">Code d'accès</label>
                      <div className="classe-field-box">
                        <Lock size={15} className="field-icon" />
                        <input
                          id="log-pass"
                          type="password"
                          placeholder="Code secret"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          autoComplete="current-password"
                          required
                        />
                      </div>
                    </div>
                  )}

                  {loginError && (
                    <div className="classe-error-notice">
                      <span>{loginError}</span>
                    </div>
                  )}

                  <button type="submit" className="btn-classe-submit">
                    <span>DÉVERROUILLER</span>
                    <ArrowRight size={16} />
                  </button>
                </form>
              )}

              <div className="classe-portal-footer">
                <label className="btn-restore-json">
                  <Upload size={13} />
                  <span>Restaurer une sauvegarde JSON</span>
                  <input type="file" accept=".json" onChange={handleImportFile} hidden />
                </label>
              </div>
            </div>
          </div>

          {/* Colonne Droite : L'Appli Réelle sur iPhone Authentique */}
          <div className="classe-col-iphone">
            <div className="iphone-ambient-halo" />

            <div className="iphone-device">
              {/* Châssis Titanium & Boutons */}
              <div className="iphone-button volume-up" />
              <div className="iphone-button volume-down" />
              <div className="iphone-button power" />

              {/* Cadre écran & bordure fine */}
              <div className="iphone-screen">
                {/* Dynamic Island */}
                <div className="iphone-dynamic-island">
                  <span className="island-lens" />
                </div>

                {/* Status Bar iOS */}
                <div className="iphone-status-bar">
                  <span className="ios-time">02:41</span>
                  <div className="ios-icons">
                    <span className="ios-signal">••••</span>
                    <span className="ios-wifi">5G</span>
                    <div className="ios-battery"><span className="ios-charge" /></div>
                  </div>
                </div>

                {/* Interface Scroller dans l'iPhone */}
                <div className="iphone-app-ui">
                  {/* Top Bar de l'application */}
                  <div className="app-top-bar">
                    <div className="app-brand-lockup">
                      <img src="/logo.png" alt="SCROLLER" className="app-logo-mini" />
                      <span className="app-title-text">SCROLLER</span>
                    </div>
                    <span className="app-vault-badge">LOCAL</span>
                  </div>

                  {/* Post 4:5 Cliché dans le flux */}
                  <div className="app-feed-scroll">
                    <div className="app-post-card">
                      {/* Header du post */}
                      <div className="app-post-header">
                        <div className="post-author-row">
                          <div className="post-author-avatar">
                            <img src="/logo.png" alt="Avatar" />
                          </div>
                          <div className="post-author-texts">
                            <span className="post-author-name">@vous</span>
                            <span className="post-author-location">Paris, 02:41 · 35mm</span>
                          </div>
                        </div>
                        <span className="post-status-dot" title="Privé" />
                      </div>

                      {/* Photo Plein Cadre 4:5 */}
                      <div 
                        className="app-post-media"
                        onDoubleClick={handlePhoneDoubleTap}
                        title="Double-cliquez pour aimer"
                      >
                        <img 
                          src="https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1080&q=85" 
                          alt="Cliché Scroller" 
                          className="app-post-img"
                        />
                        <div className="app-post-scrim" />
                        
                        {showHeartBurst && (
                          <div className="post-heart-burst">
                            <Heart size={64} fill="#ff1e27" color="#ff1e27" />
                          </div>
                        )}
                      </div>

                      {/* Actions du post */}
                      <div className="app-post-actions">
                        <div className="actions-left">
                          <button 
                            type="button" 
                            className={`post-action-btn ${isLikedInPhone ? 'liked' : ''}`}
                            onClick={handlePhoneLike}
                          >
                            <Heart size={18} fill={isLikedInPhone ? "#ff1e27" : "none"} color={isLikedInPhone ? "#ff1e27" : "#ffffff"} />
                            <span>{phoneLikes}</span>
                          </button>
                          <span className="post-privacy-label">Archives personnelles</span>
                        </div>
                        <div className="actions-right">
                          <Bookmark size={16} className="btn-icon-subtle" />
                          <Share2 size={16} className="btn-icon-subtle" />
                        </div>
                      </div>

                      {/* Légende épurée */}
                      <div className="app-post-caption">
                        <span className="caption-bold">@vous</span>
                        <span className="caption-body">Silence nocturne sur les quais. Tout est stocké ici, nulle part ailleurs.</span>
                      </div>
                    </div>
                  </div>

                  {/* Barre de navigation basse iOS */}
                  <div className="app-bottom-dock">
                    <Home size={19} className="dock-icon active" />
                    <Compass size={19} className="dock-icon" />
                    <PlusSquare size={19} className="dock-icon red-accent" />
                    <div className="dock-profile-avatar">
                      <span className="dock-monogram">V</span>
                    </div>
                  </div>

                  {/* iOS Home Indicator Bar */}
                  <div className="ios-home-bar" />
                </div>
              </div>
            </div>

            <span className="iphone-caption-meta">Rendu natif 4:5 sur écran OLED Retina</span>
          </div>
        </section>

        {/* 3. Les 3 Principes Fondateurs de Scroller (Sobre et Classe) */}
        <section className="classe-triad-section">
          <div className="triad-item">
            <span className="triad-num">01</span>
            <h3>Plein Écran Vertical</h3>
            <p>Le format immersif 4:5 et les séquences 9:16 sans bordures inutiles, calibrés au pixel près pour votre smartphone.</p>
          </div>

          <div className="triad-item">
            <span className="triad-num">02</span>
            <h3>Sanctuaire 100% Local</h3>
            <p>Vos contenus ne quittent jamais votre terminal. Stockage flash interne chiffré, sans transmission cloud.</p>
          </div>

          <div className="triad-item">
            <span className="triad-num">03</span>
            <h3>Zéro Regard Extérieur</h3>
            <p>Pas d'abonnés, pas de course aux vues, pas d'algorithme. Vous êtes le seul créateur et le seul spectateur.</p>
          </div>
        </section>
      </main>

      {/* 4. Footer discret & noble */}
      <footer className="classe-site-footer">
        <div className="footer-left-wrap">
          <img src="/logo.png" alt="Scroller" className="footer-logo-tiny" />
          <span className="footer-tagline">SCROLLER — The social media where you're alone.</span>
        </div>
        <span className="footer-right-tech">Souveraineté des données · Hors-ligne</span>
      </footer>
    </div>
  );
};
