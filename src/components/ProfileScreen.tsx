import React, { useState, useMemo } from 'react';
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
  Trash2,
  Search,
  X,
  ArrowDownWideNarrow,
  ArrowUpWideNarrow,
  Calendar,
  List,
  Layers,
  Volume2,
  VolumeX
} from 'lucide-react';
import type { PostItem, UserProfile, StoryHighlight } from '../types';
import { sound } from '../services/sound';

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

type ProfileTab = 'all' | 'grid' | 'reels' | 'notes' | 'saved';
type SortOrder = 'desc' | 'asc';

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
  const [activeTab, setActiveTab] = useState<ProfileTab>('all');
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [username, setUsername] = useState(profile.username);
  const [bio, setBio] = useState(profile.bio);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl);
  const [soundEnabled, setSoundEnabled] = useState(sound.getEnabled());

  // Search & Chronological retrieval controls
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // New highlight modal
  const [isAddingHighlight, setIsAddingHighlight] = useState(false);
  const [newHlTitle, setNewHlTitle] = useState('');
  const [newHlCover, setNewHlCover] = useState('');

  const activePosts = useMemo(() => posts.filter((p) => !p.isArchived), [posts]);

  // Available years dynamically computed
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    activePosts.forEach((p) => {
      if (p.createdAt) {
        years.add(new Date(p.createdAt).getFullYear().toString());
      }
    });
    return Array.from(years).sort((a, b) => Number(b) - Number(a));
  }, [activePosts]);

  // Filtered & Chronologically sorted memories
  const filteredProfilePosts = useMemo(() => {
    let list = [...activePosts];

    // 1. Filter by category tab
    if (activeTab === 'grid') {
      list = list.filter((p) => p.type === 'photo' || p.type === 'carousel');
    } else if (activeTab === 'reels') {
      list = list.filter((p) => p.type === 'reel' || p.type === 'video');
    } else if (activeTab === 'notes') {
      list = list.filter((p) => p.type === 'note' || p.type === 'quote');
    } else if (activeTab === 'saved') {
      list = list.filter((p) => p.isFavorite);
    }

    // 2. Filter by Year
    if (selectedYear !== 'all') {
      list = list.filter((p) => new Date(p.createdAt).getFullYear().toString() === selectedYear);
    }

    // 3. Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((p) => {
        const matchCaption = p.caption?.toLowerCase().includes(q);
        const matchNote = p.noteBody?.toLowerCase().includes(q);
        const matchQuote = p.quoteData?.quote.toLowerCase().includes(q) || p.quoteData?.author.toLowerCase().includes(q);
        const matchLoc = p.location?.toLowerCase().includes(q);
        const matchTags = p.tags?.some((t) => t.toLowerCase().includes(q));
        const matchAudio = p.audioTrack?.toLowerCase().includes(q) || p.audioArtist?.toLowerCase().includes(q);
        return Boolean(matchCaption || matchNote || matchQuote || matchLoc || matchTags || matchAudio);
      });
    }

    // 4. Chronological Sort (desc: newest first, asc: oldest first)
    return list.sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
    });
  }, [activePosts, activeTab, selectedYear, searchQuery, sortOrder]);

  const photoPosts = useMemo(() => activePosts.filter((p) => p.type === 'photo' || p.type === 'carousel'), [activePosts]);
  const reelPosts = useMemo(() => activePosts.filter((p) => p.type === 'reel' || p.type === 'video'), [activePosts]);
  const savedPosts = useMemo(() => activePosts.filter((p) => p.isFavorite), [activePosts]);
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

      {/* 3. Sanctuary Retrieval Hub (Search & Chronological Filters) */}
      <div className="profile-retrieval-hub">
        <div className="profile-search-bar-wrap">
          <Search size={16} className="profile-search-icon" />
          <input
            type="text"
            className="profile-search-input"
            placeholder="Retrouver une pensée, un mot, un lieu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Recherche dans les archives"
          />
          {searchQuery && (
            <button 
              className="btn-clear-search" 
              onClick={() => setSearchQuery('')}
              aria-label="Effacer la recherche"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Chronological Controls & View Toggle */}
        <div className="profile-retrieval-controls">
          <div className="controls-left">
            {/* Sort Order Toggle */}
            <button
              className="retrieval-btn sort-btn"
              onClick={() => setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
              title={sortOrder === 'desc' ? 'Classé du plus récent au plus ancien' : 'Classé du plus ancien au plus récent'}
            >
              {sortOrder === 'desc' ? <ArrowDownWideNarrow size={15} /> : <ArrowUpWideNarrow size={15} />}
              <span>{sortOrder === 'desc' ? 'Plus récents' : 'Plus anciens'}</span>
            </button>

            {/* Year Selector (if memories span across years) */}
            {availableYears.length > 1 && (
              <div className="year-selector-wrap">
                <Calendar size={14} className="year-icon" />
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="year-dropdown"
                >
                  <option value="all">Toutes les années</option>
                  {availableYears.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="controls-right">
            <span className="results-count-badge">
              {filteredProfilePosts.length} souvenir{filteredProfilePosts.length > 1 ? 's' : ''}
            </span>

            {/* View Mode Toggle (Grid vs Chrono List) */}
            <div className="view-mode-toggle">
              <button
                className={`view-mode-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
                title="Vue Grille"
              >
                <Grid size={15} />
              </button>
              <button
                className={`view-mode-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
                title="Vue Chronologique Détaillée"
              >
                <List size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Instagram Profile Tabs Navigation (5 Pure Categories) */}
      <div className="profile-content-tabs">
        <button
          className={`profile-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
          title="Tous les souvenirs"
        >
          <Layers size={16} />
          <span className="tab-text">TOUT</span>
        </button>

        <button
          className={`profile-tab-btn ${activeTab === 'grid' ? 'active' : ''}`}
          onClick={() => setActiveTab('grid')}
          title="Photos & Galeries"
        >
          <Grid size={16} />
          <span className="tab-text">PHOTOS</span>
        </button>

        <button
          className={`profile-tab-btn ${activeTab === 'reels' ? 'active' : ''}`}
          onClick={() => setActiveTab('reels')}
          title="Reels & Vidéos"
        >
          <Film size={16} />
          <span className="tab-text">REELS</span>
        </button>

        <button
          className={`profile-tab-btn ${activeTab === 'notes' ? 'active' : ''}`}
          onClick={() => setActiveTab('notes')}
          title="Écrits & Pensées"
        >
          <BookOpen size={16} />
          <span className="tab-text">ÉCRITS</span>
        </button>

        <button
          className={`profile-tab-btn ${activeTab === 'saved' ? 'active' : ''}`}
          onClick={() => setActiveTab('saved')}
          title="Favoris & Pépites"
        >
          <Bookmark size={16} />
          <span className="tab-text">FAVORIS</span>
        </button>
      </div>

      {/* 5. Chronological Display (Grid or Detailed List) */}
      <div className="profile-grid-display">
        {filteredProfilePosts.length === 0 ? (
          <div className="profile-empty-tab">
            <Search size={36} className="text-secondary" />
            <h4>Aucun souvenir ne correspond</h4>
            <p>Essayez de modifier votre recherche ou vos filtres temporels.</p>
            {(searchQuery || selectedYear !== 'all') && (
              <button 
                className="btn-reset-filters"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedYear('all');
                }}
              >
                Réinitialiser les filtres
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid View (Instagram 3 columns + visual cells) */
          <div className="profile-3col-grid">
            {filteredProfilePosts.map((post) => (
              <div
                key={post.id}
                className="profile-grid-item"
                onClick={() => {
                  if (post.mediaUrls && post.mediaUrls.length > 0) {
                    onOpenMediaViewer(post.mediaUrls, 0);
                  }
                }}
              >
                {post.mediaUrls && post.mediaUrls.length > 0 ? (
                  <img src={post.mediaUrls[0]} alt={post.caption || 'Souvenir'} />
                ) : post.videoUrl ? (
                  <div className="profile-reel-cell-compact">
                    <Film size={22} />
                  </div>
                ) : (
                  <div className={`saved-text-thumb theme-${post.noteStyle?.bgTheme || 'dark-monochrome'}`}>
                    <p>{post.noteBody || post.quoteData?.quote || post.caption}</p>
                  </div>
                )}

                {post.type === 'carousel' && (
                  <span className="profile-item-badge">❐</span>
                )}
                {post.type === 'video' && (
                  <span className="profile-item-badge"><Play size={11} fill="#ffffff" /></span>
                )}

                <div className="profile-grid-hover">
                  <span className="grid-hover-date">
                    {new Date(post.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                  </span>
                  {post.isFavorite && <Heart size={16} fill="#ff1e27" color="#ff1e27" />}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Detailed Chronological List View */
          <div className="profile-chrono-list">
            {filteredProfilePosts.map((post) => (
              <div 
                key={post.id} 
                className="chrono-list-card"
                onClick={() => {
                  if (post.mediaUrls && post.mediaUrls.length > 0) {
                    onOpenMediaViewer(post.mediaUrls, 0);
                  }
                }}
              >
                <div className="chrono-card-left">
                  <span className="chrono-date-badge">
                    {new Date(post.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                  {post.mediaUrls && post.mediaUrls.length > 0 && (
                    <div className="chrono-thumb-wrap">
                      <img src={post.mediaUrls[0]} alt={post.caption} className="chrono-thumb-img" />
                    </div>
                  )}
                </div>

                <div className="chrono-card-main">
                  {post.noteBody ? (
                    <p className="chrono-note-text">{post.noteBody}</p>
                  ) : post.quoteData ? (
                    <blockquote className="chrono-quote-text">« {post.quoteData.quote} » — {post.quoteData.author}</blockquote>
                  ) : (
                    <p className="chrono-caption-text">{post.caption || 'Sans légende'}</p>
                  )}

                  {post.location && (
                    <span className="chrono-location-tag">📍 {post.location}</span>
                  )}
                </div>

                {post.isFavorite && (
                  <div className="chrono-card-fav">
                    <Heart size={15} fill="#ff1e27" color="#ff1e27" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

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

        <div className="setting-row" onClick={() => {
          const next = sound.toggle();
          setSoundEnabled(next);
        }}>
          <div className="setting-info">
            {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
            <div>
              <div className="setting-name">Effets sonores</div>
              <div className="setting-desc">{soundEnabled ? 'Sons d\'ambiance et haptiques activés' : 'Sons muets'}</div>
            </div>
          </div>
          <button className="setting-action-btn">{soundEnabled ? 'Désactiver' : 'Activer'}</button>
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
              <div className="setting-desc">Importer un fichier antisocial_backup.json</div>
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
