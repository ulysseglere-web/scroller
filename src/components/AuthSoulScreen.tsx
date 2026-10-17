import React, { useState, useId } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  User, 
  ArrowRight, 
  Upload, 
  KeyRound, 
  Camera, 
  Trash2,
  Play,
  Heart
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

  // Interactive showcase state
  const [activeShowcaseTab, setActiveShowcaseTab] = useState<'feed' | 'reel' | 'vault'>('feed');
  const [showHeartAnim, setShowHeartAnim] = useState(false);

  // Register form state
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('Archives personnelles sans public.');
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
    <div className="landing-clean-wrapper">
      {/* Top Navbar */}
      <header className="clean-navbar">
        <div className="clean-nav-brand">
          <img src="/logo.png" alt="SCROLLER" className="clean-brand-logo" />
          <span className="clean-brand-title">SCROLLER</span>
          <span className="clean-status-pill">ESPACE PRIVÉ</span>
        </div>

        <div className="clean-nav-actions">
          {existingAccount ? (
            <button 
              className="clean-nav-cta"
              onClick={() => {
                sound.playTap();
                setMode('login');
                document.getElementById('auth-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <span>Accéder à mon espace (@{existingAccount.username})</span>
              <ArrowRight size={14} />
            </button>
          ) : (
            <button 
              className="clean-nav-cta"
              onClick={() => {
                sound.playTap();
                setMode('register');
                document.getElementById('auth-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <span>Commencer</span>
              <ArrowRight size={14} />
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="clean-main-container">
        {/* 1. HERO HEADLINE */}
        <section className="clean-hero">
          <div className="clean-kicker">
            <span className="kicker-dot" />
            <span>ESPACE PERSONNEL FERMÉ</span>
          </div>

          <h1 className="clean-headline">
            THE SOCIAL MEDIA
            <span className="clean-headline-highlight">WHERE YOU'RE ALONE.</span>
          </h1>

          <p className="clean-lead">
            Un espace visuel dédié à vos clichés, vos séquences vidéo et vos pensées.
            La fluidité et l'immersion des formats modernes, libérées du bruit et du regard d'autrui.
          </p>

          {/* INTERACTIVE FLAGSHIP DEVICE SHOWCASE */}
          <div className="flagship-showcase-container">
            {/* Ambient Red Glow */}
            <div className="showcase-ambient-glow" />

            {/* Selector tabs */}
            <div className="showcase-device-tabs">
              <button
                type="button"
                className={`device-tab-btn ${activeShowcaseTab === 'feed' ? 'active' : ''}`}
                onClick={() => {
                  sound.playTap();
                  setActiveShowcaseTab('feed');
                }}
              >
                <span>01 / CLICHÉ 4:5</span>
              </button>
              <button
                type="button"
                className={`device-tab-btn ${activeShowcaseTab === 'reel' ? 'active' : ''}`}
                onClick={() => {
                  sound.playTap();
                  setActiveShowcaseTab('reel');
                }}
              >
                <span>02 / SÉQUENCE 9:16</span>
              </button>
              <button
                type="button"
                className={`device-tab-btn ${activeShowcaseTab === 'vault' ? 'active' : ''}`}
                onClick={() => {
                  sound.playTap();
                  setActiveShowcaseTab('vault');
                }}
              >
                <span>03 / COFFRE PRIVÉ</span>
              </button>
            </div>

            {/* Central Phone Mockup */}
            <div className="flagship-phone-frame">
              {/* Dynamic Island / Speaker */}
              <div className="phone-island">
                <span className="island-camera" />
              </div>

              {/* Status Bar */}
              <div className="phone-status-bar">
                <span className="status-clock">02:41</span>
                <span className="status-badge">100% HORS-LIGNE</span>
                <span className="status-battery">5G 100%</span>
              </div>

              {/* Screen Content based on activeShowcaseTab */}
              <div className="phone-screen-content">
                {activeShowcaseTab === 'feed' && (
                  <div className="mock-feed-post">
                    <div className="mock-post-header">
                      <div className="mock-user-row">
                        <div className="mock-avatar-pill">
                          <img src="/logo.png" alt="Moi" />
                        </div>
                        <div className="mock-user-meta">
                          <span className="mock-handle">@vous</span>
                          <span className="mock-loc">Paris, 02:41 · 35mm</span>
                        </div>
                      </div>
                      <span className="mock-privacy-tag">PRIVÉ</span>
                    </div>

                    <div 
                      className="mock-image-container"
                      onClick={() => {
                        sound.playHeart();
                        setShowHeartAnim(true);
                        setTimeout(() => setShowHeartAnim(false), 900);
                      }}
                      title="Tapez pour aimer"
                    >
                      <img 
                        src="https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1080&q=85" 
                        alt="Cliché 4:5" 
                        className="mock-photo-img"
                      />
                      <div className="mock-photo-vignette" />
                      <div className="mock-photo-ratio-badge">4:5 · 1080×1350</div>
                      
                      {showHeartAnim && (
                        <div className="mock-heart-explosion">
                          <Heart size={54} fill="#ff1e27" color="#ff1e27" />
                        </div>
                      )}
                    </div>

                    <div className="mock-post-actions">
                      <div className="actions-left">
                        <button 
                          type="button" 
                          className="mock-action-btn loved"
                          onClick={() => {
                            sound.playHeart();
                            setShowHeartAnim(true);
                            setTimeout(() => setShowHeartAnim(false), 900);
                          }}
                        >
                          <Heart size={16} fill="#ff1e27" color="#ff1e27" />
                          <span>1</span>
                        </button>
                        <span className="mock-sub-info">Archives personnelles</span>
                      </div>
                      <span className="mock-hud-badge">ISO 400 · f/1.4</span>
                    </div>
                  </div>
                )}

                {activeShowcaseTab === 'reel' && (
                  <div className="mock-reel-view">
                    <img 
                      src="https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1080&q=85" 
                      alt="Séquence 9:16" 
                      className="mock-reel-img"
                    />
                    <div className="mock-reel-gradient" />

                    <div className="mock-reel-header">
                      <span className="reel-tag">SÉQUENCE IMMERSIVE</span>
                      <span className="reel-timecode">00:18 / 00:30</span>
                    </div>

                    <div className="mock-reel-center">
                      <div className="mock-reel-play-btn">
                        <Play size={22} fill="#ffffff" />
                      </div>
                    </div>

                    <div className="mock-reel-footer">
                      <div className="reel-track-row">
                        <div className="reel-sound-wave">
                          <span className="wave-bar w1" />
                          <span className="wave-bar w2" />
                          <span className="wave-bar w3" />
                          <span className="wave-bar w4" />
                        </div>
                        <span className="reel-track-title">Audio local · 48kHz</span>
                      </div>
                      <p className="reel-caption">Capture nocturne sans compression.</p>
                    </div>
                  </div>
                )}

                {activeShowcaseTab === 'vault' && (
                  <div className="mock-vault-view">
                    <div className="mock-vault-header">
                      <ShieldCheck size={18} color="#ff1e27" />
                      <span>COFFRE-FORT INDEXEDDB</span>
                    </div>

                    <div className="mock-vault-grid">
                      <div className="v-grid-cell">
                        <img src="https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=85" alt="Architecture" />
                        <span className="cell-tag">#01</span>
                      </div>
                      <div className="v-grid-cell">
                        <img src="https://images.unsplash.com/photo-1495707902641-75cac588d2e9?auto=format&fit=crop&w=600&q=85" alt="35mm Camera" />
                        <span className="cell-tag">#02</span>
                      </div>
                      <div className="v-grid-cell">
                        <img src="https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=600&q=85" alt="Tunnel noir" />
                        <span className="cell-tag">#03</span>
                      </div>
                      <div className="v-grid-cell">
                        <img src="https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=600&q=85" alt="Neon Red" />
                        <span className="cell-tag">#04</span>
                      </div>
                    </div>

                    <div className="mock-vault-footer">
                      <span className="vault-stat">4 médias chiffrés</span>
                      <span className="vault-zero">0 octet transmis en ligne</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Floating Glass Badges */}
            <div className="floating-badge badge-left-top">
              <span className="dot-red" />
              <span>0 spectateur · 100% privé</span>
            </div>

            <div className="floating-badge badge-right-mid">
              <span className="badge-icon">🔒</span>
              <span>Stockage navigateur chiffré</span>
            </div>

            <div className="floating-badge badge-left-bot">
              <span className="badge-icon">🖤</span>
              <span>Vos likes restent les vôtres</span>
            </div>
          </div>
        </section>

        {/* 2. VISUAL SHOWCASE CARDS — HIGH-IMPACT AUTHENTIC IMAGERY */}
        <section className="clean-wireframe-grid">
          {/* Card 1: Ratio 4:5 Cliché */}
          <div className="clean-card">
            <div className="card-top-tag">01 / IMMERSION</div>
            <div className="visual-stage aspect-4-5">
              <img 
                src="https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1080&q=85" 
                alt="Format 4:5" 
                className="stage-bg-image"
              />
              <div className="stage-overlay-scrim" />
              <div className="stage-top-meta">
                <span className="meta-badge-dark">RATIO 4:5</span>
                <span className="meta-badge-red">1080 × 1350</span>
              </div>
              <div className="stage-bot-meta">
                <span className="bot-caption">Plein écran vertical · Zéro bordure noire</span>
              </div>
            </div>
            <div className="card-info">
              <h3>Format Portrait 4:5</h3>
              <p>Chaque cliché occupe la hauteur optimale de l'écran. Contraste brut, grain argentique, sans compression dégradante.</p>
            </div>
          </div>

          {/* Card 2: Séquences Vidéo 9:16 */}
          <div className="clean-card">
            <div className="card-top-tag">02 / SÉQUENCES</div>
            <div className="visual-stage aspect-9-16">
              <img 
                src="https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1080&q=85" 
                alt="Séquences 9:16" 
                className="stage-bg-image"
              />
              <div className="stage-overlay-scrim" />
              <div className="stage-top-meta">
                <span className="meta-badge-dark">9:16 VERTICAL</span>
                <span className="meta-badge-red">4K / 60 FPS</span>
              </div>
              <div className="stage-center-play">
                <div className="play-circle-glow">
                  <Play size={20} fill="#ffffff" />
                </div>
              </div>
              <div className="stage-bot-meta">
                <span className="bot-caption">Défilement continu · Audio haute fidélité</span>
              </div>
            </div>
            <div className="card-info">
              <h3>Séquences Vidéo Plein Écran</h3>
              <p>Capturez ou importez vos séquences verticales. Fluidité totale, lecture continue et gestes natifs, sans algorithmes intrusifs.</p>
            </div>
          </div>

          {/* Card 3: Local Storage Sanctuary */}
          <div className="clean-card">
            <div className="card-top-tag">03 / SOUVERAINETÉ</div>
            <div className="visual-stage aspect-vault">
              <img 
                src="https://images.unsplash.com/photo-1495707902641-75cac588d2e9?auto=format&fit=crop&w=1080&q=85" 
                alt="Archives argentiques" 
                className="stage-bg-image desaturated"
              />
              <div className="stage-overlay-scrim heavy" />
              <div className="stage-center-shield">
                <div className="shield-ring-glow">
                  <ShieldCheck size={36} color="#ff1e27" />
                </div>
                <span className="shield-label">STOCKAGE HORS-LIGNE</span>
                <span className="shield-sub">Base locale IndexedDB</span>
              </div>
              <div className="stage-bot-meta">
                <span className="bot-caption">Zéro tracking · Export JSON en 1 clic</span>
              </div>
            </div>
            <div className="card-info">
              <h3>Sanctuaire Privé</h3>
              <p>Vos contenus ne quittent jamais votre terminal. Aucune donnée n'est hébergée sur des serveurs distants ou analysée.</p>
            </div>
          </div>
        </section>

        {/* 3. MANIFESTE ÉPURÉ EN 3 POINTS */}
        <section className="clean-principles">
          <div className="principle-item">
            <span className="principle-num">01</span>
            <h4>Zéro audience</h4>
            <p>
              Aucun abonné, aucun compteur de vues, aucun algorithme de recommandation. 
              Vous n'avez rien à prouver.
            </p>
          </div>

          <div className="principle-item">
            <span className="principle-num">02</span>
            <h4>Format sans compromis</h4>
            <p>
              Toute l'ergonomie visuelle que vous appréciez sur vos écrans, au service de vos souvenirs réels.
            </p>
          </div>

          <div className="principle-item">
            <span className="principle-num">03</span>
            <h4>Données indépendantes</h4>
            <p>
              Votre espace fonctionne hors-ligne. Vous pouvez exporter l'intégralité de votre mémoire en un clic.
            </p>
          </div>
        </section>

        {/* 4. FORMULAIRE D'ACCÈS / CRÉATION (SANS CHOIX D'AVATARS PRÉ-FAITS) */}
        <section className="clean-auth-section" id="auth-section">
          <div className="clean-auth-card">
            {/* Mode Switcher */}
            <div className="clean-tabs-row">
              <button
                type="button"
                className={`clean-tab ${mode === 'register' ? 'active' : ''}`}
                onClick={() => {
                  sound.playTap();
                  setMode('register');
                  setLoginError('');
                }}
              >
                <span>Créer un espace</span>
              </button>
              <button
                type="button"
                className={`clean-tab ${mode === 'login' ? 'active' : ''}`}
                onClick={() => {
                  sound.playTap();
                  setMode('login');
                  setLoginError('');
                }}
              >
                <span>Se connecter</span>
              </button>
            </div>

            {/* Inscription */}
            {mode === 'register' ? (
              <form className="clean-form" onSubmit={handleRegisterSubmit}>
                {/* Uploader de photo personnelle ou initiale (AUCUN avatar pré-fait) */}
                <div className="photo-drop-zone">
                  <div className="avatar-preview-slot">
                    {customAvatar ? (
                      <div className="custom-photo-circle">
                        <img src={customAvatar} alt="Votre photo" />
                        <button
                          type="button"
                          className="btn-trash-photo"
                          onClick={handleRemovePhoto}
                          title="Supprimer la photo"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ) : (
                      <div className="initial-monogram-circle">
                        <span>{getMonogram()}</span>
                      </div>
                    )}
                  </div>

                  <div className="avatar-text-slot">
                    <span className="avatar-label">Photo de profil personnelle</span>
                    <span className="avatar-hint">
                      {customAvatar 
                        ? 'Votre cliché personnel est prêt.' 
                        : 'Importez votre photo ou conservez votre initiale typographique.'}
                    </span>

                    <label htmlFor={fileInputId} className="btn-upload-file">
                      <Camera size={14} />
                      <span>{customAvatar ? 'Modifier la photo' : 'Choisir une photo'}</span>
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

                {/* Form fields */}
                <div className="fields-row">
                  <div className="field-block">
                    <label htmlFor="reg-pseudo">Pseudo</label>
                    <div className="clean-input-box">
                      <span className="at-prefix">@</span>
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

                  <div className="field-block">
                    <label htmlFor="reg-name">Nom complet ou prénom</label>
                    <div className="clean-input-box">
                      <User size={15} className="box-icon" />
                      <input
                        id="reg-name"
                        type="text"
                        placeholder="Ex: Alexandre"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="field-block">
                  <label htmlFor="reg-bio">Devise ou description personnelle</label>
                  <textarea
                    id="reg-bio"
                    rows={2}
                    placeholder="Archives personnelles..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                  />
                </div>

                <div className="field-block">
                  <label htmlFor="reg-pass">Code d'accès / mot de passe (optionnel)</label>
                  <div className="clean-input-box">
                    <KeyRound size={15} className="box-icon" />
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

                <button type="submit" className="clean-submit-btn">
                  <span>ENTRER DANS MON ESPACE</span>
                  <ArrowRight size={17} />
                </button>
              </form>
            ) : (
              /* Connexion */
              <form className="clean-form" onSubmit={handleLoginSubmit}>
                {existingAccount ? (
                  <div className="existing-profile-chip">
                    <div className="chip-avatar">
                      <img src={existingAccount.avatarUrl} alt={existingAccount.displayName} />
                    </div>
                    <div className="chip-info">
                      <span className="chip-name">{existingAccount.displayName}</span>
                      <span className="chip-user">@{existingAccount.username}</span>
                    </div>
                  </div>
                ) : (
                  <div className="empty-account-box">
                    <p>Aucun compte n'a encore été créé sur ce navigateur.</p>
                    <button 
                      type="button" 
                      className="btn-link-tab"
                      onClick={() => setMode('register')}
                    >
                      Créer un espace maintenant →
                    </button>
                  </div>
                )}

                <div className="field-block">
                  <label htmlFor="log-pseudo">Pseudo</label>
                  <div className="clean-input-box">
                    <span className="at-prefix">@</span>
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
                  <div className="field-block">
                    <label htmlFor="log-pass">Code d'accès</label>
                    <div className="clean-input-box">
                      <Lock size={15} className="box-icon" />
                      <input
                        id="log-pass"
                        type="password"
                        placeholder="Tapez votre code"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        autoComplete="current-password"
                        required
                      />
                    </div>
                  </div>
                )}

                {loginError && (
                  <div className="clean-error-strip">
                    <span>{loginError}</span>
                  </div>
                )}

                <button type="submit" className="clean-submit-btn">
                  <span>DÉVERROUILLER MON ESPACE</span>
                  <ArrowRight size={17} />
                </button>
              </form>
            )}

            {/* Backup Link */}
            <div className="clean-footer-row">
              <label className="btn-restore-link">
                <Upload size={13} />
                <span>Restaurer une sauvegarde JSON</span>
                <input type="file" accept=".json" onChange={handleImportFile} hidden />
              </label>
            </div>
          </div>
        </section>
      </main>

      {/* Minimal Footer */}
      <footer className="clean-site-footer">
        <div className="footer-meta">
          <span>SCROLLER</span>
          <span className="sep">·</span>
          <span>The social media where you're alone</span>
        </div>
        <div className="footer-spec">
          <span>100% Hors-ligne · Chiffrement local</span>
        </div>
      </footer>
    </div>
  );
};
