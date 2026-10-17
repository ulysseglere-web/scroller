import React, { useState } from 'react';
import { 
  Download, 
  Upload, 
  Moon, 
  Sun, 
  ShieldCheck, 
  Edit3, 
  Check, 
  Grid, 
  Film, 
  Bookmark, 
  BookOpen,
  Plus, 
  Play, 
  Heart,
  Lock,
  Trash2
} from 'lucide-react';
import type { PostItem, UserProfile, StoryHighlight } from '../types';

interface ProfileScreenProps {
  profile: UserProfile;
  posts: PostItem[];
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onUpdateProfile: (updated: UserProfile) => void;
  onExportBackup: () => void;
  onImportBackup: (jsonContent: string) => void;
  onClearAllData: () => void;
  onLogout: () => void;
  onOpenStory: (highlight: StoryHighlight) => void;
  onOpenMediaViewer: (mediaUrls: string[], initialIndex: number) => void;
}

type ProfileTab = 'grid' | 'reels' | 'notes' | 'saved';

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  profile,
  posts,
  theme,
  onToggleTheme,
  onUpdateProfile,
  onExportBackup,
  onImportBackup,
  onClearAllData,
  onLogout,
  onOpenStory,
  onOpenMediaViewer,
}) => {
  const [activeTab, setActiveTab] = useState<ProfileTab>('grid');
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [username, setUsername] = useState(profile.username);
  const [bio, setBio] = useState(profile.bio);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl);

  // New highlight modal
  const [isAddingHighlight, setIsAddingHighlight] = useState(false);
  const [newHlTitle, setNewHlTitle] = useState('');
  const [newHlCover, setNewHlCover] = useState('');

  const activePosts = posts.filter((p) => !p.isArchived);
  const photoPosts = activePosts.filter((p) => p.type === 'photo' || p.type === 'carousel');
  const reelPosts = activePosts.filter((p) => p.type === 'reel' || p.type === 'video');
  const noteQuotePosts = activePosts.filter((p) => p.type === 'note' || p.type === 'quote');
  const savedPosts = activePosts.filter((p) => p.isFavorite);

  const highlights = profile.highlights || [];

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      ...profile,
      displayName: displayName.trim() || 'Moi',
      username: username.trim().toLowerCase() || 'moi',
      bio: bio.trim(),
      avatarUrl: avatarUrl.trim(),
    });
    setIsEditing(false);
  };

  const handleAddHighlight = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHlTitle.trim()) return;

    // Pick photos from user posts as default story items if not specified
    const sampleStories = photoPosts.slice(0, 3).map((p, idx) => ({
      id: `story-custom-${Date.now()}-${idx}`,
      mediaUrl: p.mediaUrls?.[0] || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800',
      type: 'image' as const,
      caption: p.caption || newHlTitle,
      createdAt: new Date().toISOString(),
    }));

    const newHighlight: StoryHighlight = {
      id: `hl-${Date.now()}`,
      title: newHlTitle.trim(),
      coverUrl: newHlCover.trim() || (photoPosts[0]?.mediaUrls?.[0] ?? 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=200'),
      stories: sampleStories.length > 0 ? sampleStories : [
        {
          id: `story-empty-${Date.now()}`,
          mediaUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800',
          type: 'image',
          caption: newHlTitle,
          createdAt: new Date().toISOString(),
        }
      ],
    };

    const updatedHighlights = [...highlights, newHighlight];
    onUpdateProfile({
      ...profile,
      highlights: updatedHighlights,
    });

    setIsAddingHighlight(false);
    setNewHlTitle('');
    setNewHlCover('');
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
    <div className="profile-screen-container">
      {/* 1. Profile Header (Instagram Style) */}
      <div className="profile-header-card">
        <div 
          className="profile-avatar-large cursor-pointer" 
          onClick={() => {
            if (highlights.length > 0) onOpenStory(highlights[0]);
          }}
          title="Regarder les stories"
        >
          <img 
            src={profile.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300'} 
            alt={profile.displayName} 
          />
        </div>

        <div className="profile-info-section">
          <div className="profile-title-row">
            <h1 className="profile-display-name">@{profile.username}</h1>
            <button
              className="btn-edit-profile"
              onClick={() => setIsEditing(!isEditing)}
            >
              <Edit3 size={14} />
              <span>{isEditing ? 'Annuler' : 'Modifier le profil'}</span>
            </button>
          </div>

          <div className="profile-stats-counters">
            <div className="profile-counter-item">
              <span className="count-num">{activePosts.length}</span>
              <span className="count-label">souvenirs</span>
            </div>
            <div className="profile-counter-item">
              <span className="count-num">{reelPosts.length}</span>
              <span className="count-label">reels</span>
            </div>
            <div className="profile-counter-item">
              <span className="count-num">{savedPosts.length}</span>
              <span className="count-label">favoris</span>
            </div>
          </div>

          <div className="profile-full-name">{profile.displayName}</div>
          <p className="profile-bio-text">{profile.bio}</p>
        </div>
      </div>

      {/* Edit Profile Form */}
      {isEditing && (
        <form className="edit-profile-form" onSubmit={handleSaveProfile}>
          <h3>Modifier votre profil</h3>
          <div className="form-field">
            <label>Nom complet</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Votre nom"
            />
          </div>
          <div className="form-field">
            <label>Nom d'utilisateur (@)</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="nom_utilisateur"
            />
          </div>
          <div className="form-field">
            <label>Bio (liens, passions, citation personnelle)</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Votre bio..."
              rows={3}
            />
          </div>
          <div className="form-field">
            <label>URL de votre photo de profil</label>
            <input
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://images.unsplash.com/..."
            />
          </div>
          <button type="submit" className="btn-save-profile">
            <Check size={16} /> Valider les changements
          </button>
        </form>
      )}

      {/* 2. Stories à la Une (Highlights) Row */}
      <div className="profile-highlights-section">
        <div className="highlights-scroll-row">
          {/* Add New Highlight Button */}
          <div 
            className="highlight-bubble-wrap" 
            onClick={() => setIsAddingHighlight(true)}
            role="button"
            tabIndex={0}
          >
            <div className="highlight-circle-add">
              <Plus size={24} />
            </div>
            <span className="highlight-title-label">Nouveau</span>
          </div>

          {/* User Highlights */}
          {highlights.map((hl) => (
            <div
              key={hl.id}
              className="highlight-bubble-wrap"
              onClick={() => onOpenStory(hl)}
              role="button"
              tabIndex={0}
            >
              <div className="highlight-circle-cover">
                <img src={hl.coverUrl} alt={hl.title} />
              </div>
              <span className="highlight-title-label">{hl.title}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Add Highlight */}
      {isAddingHighlight && (
        <div className="modal-backdrop" onClick={() => setIsAddingHighlight(false)}>
          <div className="create-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="create-modal-header">
              <h3 className="create-modal-title">Nouvelle Story à la une</h3>
              <button className="btn-close-modal" onClick={() => setIsAddingHighlight(false)}>✕</button>
            </div>
            <form onSubmit={handleAddHighlight} className="edit-modal-form">
              <div className="form-field">
                <label>Titre de la story à la une</label>
                <input
                  type="text"
                  placeholder="Ex: Voyages 🏔️, Lectures 📚, Rituels ✨"
                  value={newHlTitle}
                  onChange={(e) => setNewHlTitle(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="form-field">
                <label>Image de couverture (URL optionnelle)</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={newHlCover}
                  onChange={(e) => setNewHlCover(e.target.value)}
                />
              </div>
              <button type="submit" className="btn-save-profile">
                Créer la story à la une
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 3. Instagram Profile Tabs Navigation */}
      <div className="profile-content-tabs">
        <button
          className={`profile-tab-btn ${activeTab === 'grid' ? 'active' : ''}`}
          onClick={() => setActiveTab('grid')}
          title="Grille de photos et posts"
        >
          <Grid size={18} />
          <span className="tab-text">PUBLICATIONS</span>
        </button>

        <button
          className={`profile-tab-btn ${activeTab === 'reels' ? 'active' : ''}`}
          onClick={() => setActiveTab('reels')}
          title="Reels & Vidéos courtes"
        >
          <Film size={18} />
          <span className="tab-text">REELS</span>
        </button>

        <button
          className={`profile-tab-btn ${activeTab === 'notes' ? 'active' : ''}`}
          onClick={() => setActiveTab('notes')}
          title="Pensées & Citations"
        >
          <BookOpen size={18} />
          <span className="tab-text">ÉCRITS</span>
        </button>

        <button
          className={`profile-tab-btn ${activeTab === 'saved' ? 'active' : ''}`}
          onClick={() => setActiveTab('saved')}
          title="Favoris & Pépites"
        >
          <Bookmark size={18} />
          <span className="tab-text">ENREGISTRÉS</span>
        </button>
      </div>

      {/* 4. Tab Content Grids */}
      {/* TAB 1: Grid (Photos & Carousels) */}
      {activeTab === 'grid' && (
        <div className="profile-grid-display">
          {photoPosts.length === 0 ? (
            <div className="profile-empty-tab">
              <Grid size={36} />
              <h4>Aucune photo pour le moment</h4>
              <p>Capturez des moments pour remplir votre grille personnelle.</p>
            </div>
          ) : (
            <div className="profile-3col-grid">
              {photoPosts.map((post) => (
                <div
                  key={post.id}
                  className="profile-grid-item"
                  onClick={() => {
                    if (post.mediaUrls && post.mediaUrls.length > 0) {
                      onOpenMediaViewer(post.mediaUrls, 0);
                    }
                  }}
                >
                  <img src={post.mediaUrls?.[0]} alt={post.caption} />
                  {post.type === 'carousel' && (
                    <span className="profile-item-badge">❐</span>
                  )}
                  <div className="profile-grid-hover">
                    {post.isFavorite && <Heart size={18} fill="#ffffff" color="#ffffff" />}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Reels (9:16 Video Grid) */}
      {activeTab === 'reels' && (
        <div className="profile-grid-display">
          {reelPosts.length === 0 ? (
            <div className="profile-empty-tab">
              <Film size={36} />
              <h4>Aucun Reel publié</h4>
              <p>Créez votre première vidéo courte dans l'onglet Reels.</p>
            </div>
          ) : (
            <div className="profile-reels-grid">
              {reelPosts.map((reel) => (
                <div key={reel.id} className="profile-reel-cell">
                  {reel.mediaUrls?.[0] ? (
                    <img src={reel.mediaUrls[0]} alt={reel.caption} className="reel-poster-img" />
                  ) : (
                    <div className="reel-no-poster">
                      <Film size={28} />
                    </div>
                  )}
                  <div className="reel-cell-badge">
                    <Play size={13} fill="#ffffff" color="#ffffff" />
                    <span>Reel</span>
                  </div>
                  <div className="reel-caption-teaser">{reel.caption}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Notes & Quotes */}
      {activeTab === 'notes' && (
        <div className="profile-grid-display">
          {noteQuotePosts.length === 0 ? (
            <div className="profile-empty-tab">
              <BookOpen size={36} />
              <h4>Aucune pensée ni citation</h4>
              <p>Écrivez vos réflexions spontanées et passages de livres.</p>
            </div>
          ) : (
            <div className="profile-notes-list">
              {noteQuotePosts.map((item) => (
                <div 
                  key={item.id} 
                  className={`profile-note-snippet-card ${item.type === 'note' ? `theme-${item.noteStyle?.bgTheme || 'midnight-violet'}` : 'quote-style'}`}
                >
                  {item.type === 'quote' && item.quoteData ? (
                    <>
                      <blockquote className="quote-snippet">« {item.quoteData.quote} »</blockquote>
                      <div className="quote-meta">— {item.quoteData.author} ({item.quoteData.source})</div>
                    </>
                  ) : (
                    <p className="note-snippet">{item.noteBody || item.caption}</p>
                  )}
                  <div className="snippet-footer">
                    <span>{new Date(item.createdAt).toLocaleDateString('fr-FR')}</span>
                    {item.isFavorite && <Heart size={14} fill="#ff1e27" color="#ff1e27" />}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: Saved / Favorites */}
      {activeTab === 'saved' && (
        <div className="profile-grid-display">
          {savedPosts.length === 0 ? (
            <div className="profile-empty-tab">
              <Bookmark size={36} />
              <h4>Aucun souvenir favori</h4>
              <p>Double-cliquez sur n'importe quel post pour l'ajouter à vos favoris intimes.</p>
            </div>
          ) : (
            <div className="profile-3col-grid">
              {savedPosts.map((post) => (
                <div
                  key={post.id}
                  className="profile-grid-item"
                  onClick={() => {
                    if (post.mediaUrls && post.mediaUrls.length > 0) {
                      onOpenMediaViewer(post.mediaUrls, 0);
                    }
                  }}
                >
                  {post.mediaUrls?.[0] ? (
                    <img src={post.mediaUrls[0]} alt={post.caption} />
                  ) : (
                    <div className="saved-text-thumb">
                      <p>{post.noteBody || post.quoteData?.quote || post.caption}</p>
                    </div>
                  )}
                  <div className="profile-grid-hover">
                    <Heart size={18} fill="#ff1e27" color="#ff1e27" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 5. Privacy & Philosophy Guarantee */}
      <div className="privacy-guarantee-card">
        <div className="privacy-icon-wrap">
          <ShieldCheck size={28} className="text-emerald" />
        </div>
        <div className="privacy-text-wrap">
          <h4>Espace 100% Privé & Hors-ligne</h4>
          <p>
            Tout votre univers (feed, reels, stories et pensées) reste sur cet appareil dans la base locale IndexedDB. Pas de serveurs distants, pas de traçage, pas de followers.
          </p>
        </div>
      </div>

      {/* 6. Settings & Data Backups */}
      <div className="profile-settings-section">
        <h3 className="section-title">Réglages & Données</h3>

        <div className="setting-row" onClick={onToggleTheme}>
          <div className="setting-info">
            {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
            <div>
              <div className="setting-name">Apparence</div>
              <div className="setting-desc">Actuellement en mode {theme === 'dark' ? 'sombre' : 'clair'}</div>
            </div>
          </div>
          <button className="setting-action-btn">Basculer</button>
        </div>

        <div className="setting-row" onClick={onExportBackup}>
          <div className="setting-info">
            <Download size={20} />
            <div>
              <div className="setting-name">Exporter une sauvegarde complète</div>
              <div className="setting-desc">Télécharger le fichier JSON de tous vos posts, reels et stories</div>
            </div>
          </div>
          <button className="setting-action-btn">Exporter</button>
        </div>

        <div className="setting-row">
          <div className="setting-info">
            <Upload size={20} />
            <div>
              <div className="setting-name">Restaurer une sauvegarde</div>
              <div className="setting-desc">Importer un fichier scroller_backup.json</div>
            </div>
          </div>
          <label className="setting-action-btn upload-label-btn">
            <span>Restaurer</span>
            <input type="file" accept=".json" onChange={handleImportFile} hidden />
          </label>
        </div>

        <div className="setting-row" onClick={onLogout}>
          <div className="setting-info">
            <Lock size={20} className="text-secondary" />
            <div>
              <div className="setting-name">Verrouiller mon sanctuaire</div>
              <div className="setting-desc">Se déconnecter et retourner à la page d'accès</div>
            </div>
          </div>
          <button className="setting-action-btn">Verrouiller</button>
        </div>

        <div className="setting-row danger-row" onClick={() => {
          if (confirm('Êtes-vous sûr de vouloir effacer TOUTES vos données (posts, reels, profil) ? Cette action est irréversible.')) {
            onClearAllData();
          }
        }}>
          <div className="setting-info">
            <Trash2 size={20} className="text-crimson" />
            <div>
              <div className="setting-name text-crimson">Remise à zéro complète</div>
              <div className="setting-desc">Supprimer toutes les archives locales de ce navigateur</div>
            </div>
          </div>
          <button className="setting-action-btn btn-danger">Effacer tout</button>
        </div>
      </div>
    </div>
  );
};
