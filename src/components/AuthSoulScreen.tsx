import React, { useState, useId } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  User, 
  ArrowRight, 
  Upload, 
  KeyRound, 
  Camera, 
  Sparkles, 
  Trash2 
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

  // Register state
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('Archives personnelles et fragments de vie sans spectateurs.');
  const [customAvatar, setCustomAvatar] = useState<string>('');
  const [registerPassword, setRegisterPassword] = useState('');

  // Login state
  const [loginUsername, setLoginUsername] = useState(existingAccount ? existingAccount.username : '');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const fileInputId = useId();

  // Compute monogram fallback if no custom photo uploaded
  const getMonogram = () => {
    const source = displayName.trim() || username.trim() || 'S';
    return source.charAt(0).toUpperCase();
  };

  // Handle custom photo upload (NO pre-made stock avatars)
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

    // Use custom uploaded photo or generate clean SVG monogram avatar data URL
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
      setLoginError('Aucun compte enregistré sur cet appareil. Créez votre sanctuaire ci-dessus.');
      return;
    }

    if (loginUsername.trim().toLowerCase() !== existingAccount.username.toLowerCase()) {
      setLoginError('Pseudo introuvable sur cet appareil.');
      return;
    }

    if (existingAccount.password && existingAccount.password.trim() !== '') {
      if (loginPassword.trim() !== existingAccount.password.trim()) {
        setLoginError('Code secret ou mot de passe erroné.');
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
    <div className="landing-experience-wrapper">
      {/* Top Navbar */}
      <header className="landing-navbar">
        <div className="landing-nav-brand">
          <img src="/logo.png" alt="SCROLLER" className="landing-brand-logo" />
          <span className="landing-brand-title">SCROLLER</span>
          <span className="landing-pulse-badge">
            <span className="pulse-ping" />
            <span className="pulse-text">SANCTUAIRE PRIVÉ</span>
          </span>
        </div>

        <div className="landing-nav-actions">
          {existingAccount ? (
            <button 
              className="landing-quick-login-btn"
              onClick={() => {
                sound.playTap();
                setMode('login');
                const formEl = document.getElementById('auth-form-card');
                formEl?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <span>Déverrouiller @{existingAccount.username}</span>
              <ArrowRight size={14} />
            </button>
          ) : (
            <button 
              className="landing-quick-login-btn"
              onClick={() => {
                sound.playTap();
                setMode('register');
                const formEl = document.getElementById('auth-form-card');
                formEl?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <span>Créer mon espace</span>
              <ArrowRight size={14} />
            </button>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="landing-main-content">
        {/* SECTION 1: HERO IMPACT ("LE DESIGN QUI DONNE ENVIE") */}
        <section className="landing-hero-section">
          <div className="hero-eyebrow">
            <span className="eyebrow-dot" />
            <span>L’ANTI-RÉSEAU SOCIAL DU XXIᵉ SIÈCLE</span>
          </div>

          <h1 className="hero-big-headline">
            L'ÉNERGIE D'INSTAGRAM.
            <span className="hero-crimson-gradient">LE SILENCE EN PLUS.</span>
          </h1>

          <p className="hero-lead-paragraph">
            Vous aimez la beauté visuelle des formats actuels — la force d'un feed <strong>4:5 bord-à-bord</strong>, 
            l'immersion des <strong>Reels verticaux 9:16</strong>, l'intimité des stories. 
            Mais vous refusez la tyrannie des algorithmes, la course aux likes et la surveillance publicitaire.
          </p>

          <p className="hero-sub-statement">
            <strong>SCROLLER est votre journal intime visuel nouvelle génération.</strong>
            <br />
            Personne à impressionner. Personne pour vous juger. Vos souvenirs vous appartiennent.
          </p>
        </section>

        {/* SECTION 2: SHOWCASE DES FORMATS ("VISUAL TEASER QUI DONNE ENVIE") */}
        <section className="landing-showcase-grid">
          {/* Card 1: Feed 4:5 */}
          <div className="showcase-card">
            <div className="showcase-badge">01 / IMMERSION</div>
            <div className="showcase-mock-frame aspect-4-5">
              <div className="mock-image-stage">
                <img 
                  src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80" 
                  alt="Aperçu Feed 4:5" 
                  className="mock-image-asset" 
                />
                <div className="mock-floating-pill">📍 Vallée oubliée · 07:15</div>
                <div className="mock-heart-float">❤️</div>
              </div>
            </div>
            <div className="showcase-details">
              <h3>Feed Portrait 4:5 Plein Écran</h3>
              <p>Vos photos et carrousels prennent tout l'écran comme sur Instagram, sans aucune pollution de sponsors ni algorithme imposé.</p>
            </div>
          </div>

          {/* Card 2: Reels 9:16 */}
          <div className="showcase-card">
            <div className="showcase-badge">02 / MOUVEMENT</div>
            <div className="showcase-mock-frame aspect-9-16">
              <div className="mock-image-stage">
                <img 
                  src="https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=600&auto=format&fit=crop&q=80" 
                  alt="Aperçu Reel 9:16" 
                  className="mock-image-asset" 
                />
                <div className="mock-reel-soundwave">
                  <span className="sw-bar b1" />
                  <span className="sw-bar b2" />
                  <span className="sw-bar b3" />
                  <span className="sw-bar b4" />
                  <span className="mock-sound-title">♫ Nuit & Vent Brut</span>
                </div>
              </div>
            </div>
            <div className="showcase-details">
              <h3>Reels & Vidéos 9:16 Verticaux</h3>
              <p>Capturez vos instants en direct avec caméra et microphone, et revivez vos séquences vidéo avec swipe vertical fluide.</p>
            </div>
          </div>

          {/* Card 3: Souveraineté & Zéro Serveur */}
          <div className="showcase-card">
            <div className="showcase-badge">03 / SOUVERAINETÉ</div>
            <div className="showcase-mock-frame aspect-vault">
              <div className="mock-vault-stage">
                <div className="vault-glow-icon">
                  <ShieldCheck size={52} className="vault-shield" />
                </div>
                <div className="vault-status-chip">INDEXEDDB LOCAL · 0 SERVEUR TIERS</div>
                <div className="vault-code-ticker">100% OFFLINE · CRYPTED PERSISTENCE</div>
              </div>
            </div>
            <div className="showcase-details">
              <h3>Coffre-fort 100% Privé</h3>
              <p>Toutes vos données dorment exclusivement dans la base locale de votre navigateur. Rien n'est envoyé dans le cloud.</p>
            </div>
          </div>
        </section>

        {/* SECTION 3: MANIFESTE EDITORIAL */}
        <section className="landing-manifesto-editorial">
          <div className="editorial-header">
            <span className="editorial-tag">L'ÂME DU PROJET</span>
            <h2>Pourquoi vous devriez être seul sur votre réseau</h2>
          </div>

          <div className="editorial-columns">
            <div className="editorial-col">
              <span className="col-num">01</span>
              <h4>La fin de l'anxiété de publication</h4>
              <p>
                Sur Instagram et TikTok, chaque publication est un test de popularité. Vous hésitez, vous effacez, 
                vous comparez. Sur SCROLLER, vous publiez sans filtre ce que vous aimez vraiment.
              </p>
            </div>

            <div className="editorial-col">
              <span className="col-num">02</span>
              <h4>Une mémoire authentique</h4>
              <p>
                Dans 10 ans, vous ne voudrez pas revoir une version édulcorée de vous-même créée pour des followers 
                oubliés. Vous voudrez vos vraies pensées, vos vrais clichés et vos vraies émotions.
              </p>
            </div>

            <div className="editorial-col">
              <span className="col-num">03</span>
              <h4>Zéro distraction algorithmique</h4>
              <p>
                Pas de flux infini de rage, de polémiques ou de publicités ciblées. Vous ne consommez que ce que vous 
                avez vous-même semé dans votre sanctuaire.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 4: SAS D'ENTRÉE / CRÉATION DE COMPTE (SANS FAUX AVATARS) */}
        <section className="landing-auth-gateway" id="auth-form-card">
          <div className="gateway-card">
            {/* Header */}
            <div className="gateway-header">
              <div className="gateway-tabs">
                <button
                  type="button"
                  className={`gateway-tab ${mode === 'register' ? 'active' : ''}`}
                  onClick={() => {
                    sound.playTap();
                    setMode('register');
                    setLoginError('');
                  }}
                >
                  <Sparkles size={16} />
                  <span>Créer mon sanctuaire</span>
                </button>
                <button
                  type="button"
                  className={`gateway-tab ${mode === 'login' ? 'active' : ''}`}
                  onClick={() => {
                    sound.playTap();
                    setMode('login');
                    setLoginError('');
                  }}
                >
                  <Lock size={16} />
                  <span>Se connecter</span>
                </button>
              </div>
            </div>

            {/* Form Mode: Register (NO PRE-MADE AVATARS) */}
            {mode === 'register' ? (
              <form className="gateway-form" onSubmit={handleRegisterSubmit}>
                <div className="form-legend">
                  <h3>Initialisez votre sanctuaire personnel</h3>
                  <p>Aucune adresse email ni numéro de téléphone requis. Vos identifiants restent sur votre machine.</p>
                </div>

                {/* Custom Photo Uploader (Your own photo or initial monogram) */}
                <div className="custom-photo-uploader">
                  <div className="uploader-preview-wrap">
                    {customAvatar ? (
                      <div className="photo-preview-circle">
                        <img src={customAvatar} alt="Votre photo" />
                        <button
                          type="button"
                          className="btn-remove-photo"
                          onClick={handleRemovePhoto}
                          title="Supprimer la photo"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="monogram-preview-circle">
                        <span className="monogram-char">{getMonogram()}</span>
                      </div>
                    )}
                  </div>

                  <div className="uploader-info-wrap">
                    <span className="uploader-title">Photo de profil personnelle</span>
                    <span className="uploader-sub">
                      {customAvatar 
                        ? 'Photo personnalisée prête.' 
                        : 'Téléversez votre propre cliché ou conservez votre initiale stylisée.'}
                    </span>

                    <label htmlFor={fileInputId} className="btn-choose-photo">
                      <Camera size={15} />
                      <span>{customAvatar ? 'Changer de photo' : 'Importer ma photo'}</span>
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

                {/* Form Fields */}
                <div className="form-fields-grid">
                  <div className="field-group">
                    <label htmlFor="reg-pseudo">Nom d'utilisateur privé (Pseudo)</label>
                    <div className="input-wrap">
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

                  <div className="field-group">
                    <label htmlFor="reg-fullname">Nom ou prénom d'affichage</label>
                    <div className="input-wrap">
                      <User size={16} className="field-icon" />
                      <input
                        id="reg-fullname"
                        type="text"
                        placeholder="Ex: Alexandre, Ulysse..."
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="field-group">
                  <label htmlFor="reg-bio">Devise ou bio intime</label>
                  <textarea
                    id="reg-bio"
                    rows={2}
                    placeholder="Ex: Vivre sans bruit. Archiver ce qui compte vraiment."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                  />
                </div>

                <div className="field-group">
                  <label htmlFor="reg-password">Code secret d'accès (Mot de passe optionnel)</label>
                  <div className="input-wrap">
                    <KeyRound size={16} className="field-icon" />
                    <input
                      id="reg-password"
                      type="password"
                      placeholder="Laissez vide ou définissez un code secret"
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      autoComplete="new-password"
                    />
                  </div>
                  <span className="field-helper">Verrouille l'accès à vos souvenirs sur cet écran si quelqu'un ouvre votre navigateur.</span>
                </div>

                <button type="submit" className="btn-gateway-submit">
                  <span>CRÉER MON SANCTUAIRE PRIVÉ</span>
                  <ArrowRight size={18} />
                </button>
              </form>
            ) : (
              /* Form Mode: Login */
              <form className="gateway-form" onSubmit={handleLoginSubmit}>
                {existingAccount ? (
                  <div className="detected-account-card">
                    <div className="detected-avatar">
                      <img src={existingAccount.avatarUrl} alt={existingAccount.displayName} />
                    </div>
                    <div className="detected-meta">
                      <span className="detected-title">Compte local prêt</span>
                      <span className="detected-user">{existingAccount.displayName} (@{existingAccount.username})</span>
                    </div>
                  </div>
                ) : (
                  <div className="no-local-account-banner">
                    <p>Aucun compte n'a encore été créé sur ce navigateur.</p>
                    <button 
                      type="button" 
                      className="link-create-direct"
                      onClick={() => setMode('register')}
                    >
                      Créer votre compte maintenant →
                    </button>
                  </div>
                )}

                <div className="field-group">
                  <label htmlFor="log-pseudo">Pseudo</label>
                  <div className="input-wrap">
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
                  <div className="field-group">
                    <label htmlFor="log-password">Code secret d'accès</label>
                    <div className="input-wrap">
                      <Lock size={16} className="field-icon" />
                      <input
                        id="log-password"
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
                  <div className="gateway-error-box">
                    <span>{loginError}</span>
                  </div>
                )}

                <button type="submit" className="btn-gateway-submit">
                  <span>DÉVERROUILLER MON ESPACE</span>
                  <ArrowRight size={18} />
                </button>
              </form>
            )}

            {/* Bottom Restore Link */}
            <div className="gateway-footer">
              <label className="link-restore-json">
                <Upload size={14} />
                <span>Restaurer une sauvegarde JSON existante</span>
                <input type="file" accept=".json" onChange={handleImportFile} hidden />
              </label>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="landing-global-footer">
        <div className="footer-left">
          <img src="/logo.png" alt="SCROLLER" className="footer-logo" />
          <span>SCROLLER · The social media where you're alone.</span>
        </div>
        <div className="footer-right">
          <span>100% Privé · IndexedDB · Noir · Blanc · Rouge</span>
        </div>
      </footer>
    </div>
  );
};
