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
  Maximize2,
  Play
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
            Un espace visuel dédié à vos photos, vos vidéos et vos pensées.
            La fluidité et l'immersion des formats modernes, libérées du bruit et du regard d'autrui.
          </p>
        </section>

        {/* 2. FORMAT SHOWCASE — PURE ARCHITECTURAL WIREFRAMES (PAS D'EXEMPLE IA NI DE STOCK) */}
        <section className="clean-wireframe-grid">
          {/* Wireframe 1: Ratio 4:5 */}
          <div className="clean-card">
            <div className="card-top-tag">01 / FLUX</div>
            <div className="wireframe-stage aspect-4-5">
              <div className="wireframe-inner">
                <div className="wf-header-line">
                  <span className="wf-avatar-circle" />
                  <span className="wf-text-bar short" />
                </div>
                <div className="wf-canvas-box">
                  <span className="wf-ratio-label">4:5</span>
                  <span className="wf-dimensions">1080 × 1350</span>
                  <div className="wf-grid-crosshairs" />
                </div>
                <div className="wf-footer-line">
                  <span className="wf-icon-dot" />
                  <span className="wf-icon-dot" />
                  <span className="wf-text-bar medium" />
                </div>
              </div>
            </div>
            <div className="card-info">
              <h3>Format Portrait 4:5</h3>
              <p>Vos clichés et carrousels prennent tout l'écran vertical sans bandes noires.</p>
            </div>
          </div>

          {/* Wireframe 2: Ratio 9:16 */}
          <div className="clean-card">
            <div className="card-top-tag">02 / SÉQUENCES</div>
            <div className="wireframe-stage aspect-9-16">
              <div className="wireframe-inner">
                <div className="wf-header-line">
                  <span className="wf-ratio-label small">9:16</span>
                  <Maximize2 size={13} className="wf-dim-icon" />
                </div>
                <div className="wf-canvas-box video-box">
                  <div className="wf-play-badge">
                    <Play size={18} fill="#ffffff" />
                  </div>
                  <div className="wf-audio-bars">
                    <span className="bar" />
                    <span className="bar" />
                    <span className="bar" />
                    <span className="bar" />
                    <span className="wf-track-label">Audio local</span>
                  </div>
                </div>
                <div className="wf-footer-line">
                  <span className="wf-text-bar long" />
                </div>
              </div>
            </div>
            <div className="card-info">
              <h3>Séquences Vidéo 9:16</h3>
              <p>Capture directe ou import avec lecture continue et navigation par défilement vertical.</p>
            </div>
          </div>

          {/* Wireframe 3: Local Storage */}
          <div className="clean-card">
            <div className="card-top-tag">03 / SOUVERAINETÉ</div>
            <div className="wireframe-stage aspect-vault">
              <div className="wireframe-inner center-content">
                <div className="wf-shield-wrap">
                  <ShieldCheck size={36} className="wf-shield-icon" />
                </div>
                <span className="wf-tech-title">STOCKAGE LOCAL</span>
                <span className="wf-tech-sub">IndexedDB · Zéro serveur externe</span>
                <div className="wf-status-meter">
                  <span className="meter-fill" />
                </div>
              </div>
            </div>
            <div className="card-info">
              <h3>Sanctuaire Privé</h3>
              <p>Vos contenus ne quittent jamais votre navigateur. Aucune donnée n'est transmise.</p>
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
