import React, { useState, useEffect, useMemo } from 'react';
import './App.css';
import type { PostItem, UserProfile, NavTab, FeedFilter, StoryHighlight } from './types';
import { 
  getStoredPosts, 
  savePost, 
  deletePostFromDb, 
  getStoredProfile, 
  saveProfileToDb, 
  exportAllData, 
  importData, 
  clearAllUserData,
  isSessionAuthenticated,
  setSessionAuthenticated
} from './services/storage';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { HighlightsBar } from './components/HighlightsBar';
import { PostCard } from './components/PostCard';
import { ReelsFeed } from './components/ReelsFeed';
import { StoryViewerModal } from './components/StoryViewerModal';
import { CreateModal } from './components/CreateModal';
import { MediaViewerModal } from './components/MediaViewerModal';
import { SearchScreen } from './components/SearchScreen';
import { ArchiveScreen } from './components/ArchiveScreen';
import { ProfileScreen } from './components/ProfileScreen';
import { EditPostModal } from './components/EditPostModal';
import { CommandPalette } from './components/CommandPalette';
import { AuthSoulScreen } from './components/AuthSoulScreen';
import { sound } from './services/sound';
import { Sparkles, Plus } from 'lucide-react';

const CLEAN_V3_KEY = 'scroller_v3_clean_slate';

const DEFAULT_EMPTY_PROFILE: UserProfile = {
  username: 'moi',
  displayName: 'Moi',
  bio: 'Sanctuaire personnel.',
  avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
  theme: 'dark',
  joinedAt: new Date().toISOString(),
  highlights: [],
};

export const App: React.FC = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [existingAccount, setExistingAccount] = useState<UserProfile | null>(null);

  const [posts, setPosts] = useState<PostItem[]>([]);
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_EMPTY_PROFILE);
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [feedFilter, setFeedFilter] = useState<FeedFilter>('all');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCmdOpen, setIsCmdOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<PostItem | null>(null);
  const [viewerMedia, setViewerMedia] = useState<{ urls: string[]; initialIndex: number } | null>(null);
  const [randomMemory, setRandomMemory] = useState<PostItem | null>(null);
  const [selectedHighlight, setSelectedHighlight] = useState<StoryHighlight | null>(null);

  // Global keyboard shortcuts (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCmdOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Initial load: ensure fake demo data is cleared once so user creates/connects real account
  useEffect(() => {
    async function loadData() {
      if (!localStorage.getItem(CLEAN_V3_KEY)) {
        await clearAllUserData();
        localStorage.setItem(CLEAN_V3_KEY, 'true');
      }

      const storedProfile = await getStoredProfile();
      setExistingAccount(storedProfile);

      const authed = isSessionAuthenticated() && storedProfile !== null;
      setIsAuthenticated(authed);

      if (storedProfile) {
        setProfile(storedProfile);
        setTheme(storedProfile.theme || 'dark');
        document.documentElement.setAttribute('data-theme', storedProfile.theme || 'dark');
      } else {
        document.documentElement.setAttribute('data-theme', 'dark');
      }

      const storedPosts = await getStoredPosts();
      setPosts(storedPosts);
      setIsLoaded(true);
    }
    loadData();
  }, []);

  // Sync theme attribute
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Auth Handlers
  const handleRegister = async (newProfile: UserProfile) => {
    sound.playPop();
    await saveProfileToDb(newProfile);
    setProfile(newProfile);
    setExistingAccount(newProfile);
    setSessionAuthenticated(true);
    setIsAuthenticated(true);
    setPosts([]);
  };

  const handleLogin = (userProfile: UserProfile) => {
    sound.playChime();
    setProfile(userProfile);
    setSessionAuthenticated(true);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    sound.playTap();
    setSessionAuthenticated(false);
    setIsAuthenticated(false);
  };

  const handleClearAllData = async () => {
    sound.playTap();
    await clearAllUserData();
    setPosts([]);
    setProfile(DEFAULT_EMPTY_PROFILE);
    setExistingAccount(null);
    setIsAuthenticated(false);
  };

  // Handlers for posts
  const handleToggleFavorite = async (id: string) => {
    const updated = posts.map((p) => {
      if (p.id === id) {
        const next = { ...p, isFavorite: !p.isFavorite };
        savePost(next);
        return next;
      }
      return p;
    });
    setPosts(updated);
  };

  const handleTogglePin = async (id: string) => {
    const updated = posts.map((p) => {
      if (p.id === id) {
        const next = { ...p, isPinned: !p.isPinned };
        savePost(next);
        return next;
      }
      return p;
    });
    setPosts(updated);
  };

  const handleArchivePost = async (id: string) => {
    const updated = posts.map((p) => {
      if (p.id === id) {
        const next = { ...p, isArchived: true };
        savePost(next);
        return next;
      }
      return p;
    });
    setPosts(updated);
  };

  const handleRestorePost = async (id: string) => {
    const updated = posts.map((p) => {
      if (p.id === id) {
        const next = { ...p, isArchived: false };
        savePost(next);
        return next;
      }
      return p;
    });
    setPosts(updated);
  };

  const handleDeletePost = async (id: string) => {
    sound.playTap();
    await deletePostFromDb(id);
    setPosts((prev) => prev.filter((p) => p.id !== id));
  };

  const handleSaveNewPost = async (newPost: PostItem) => {
    sound.playPop();
    await savePost(newPost);
    setPosts((prev) => [newPost, ...prev]);
    setActiveTab('home');
  };

  const handleSaveEditedPost = async (updatedPost: PostItem) => {
    sound.playTap();
    await savePost(updatedPost);
    setPosts((prev) => prev.map((p) => (p.id === updatedPost.id ? updatedPost : p)));
  };

  const handleToggleTheme = () => {
    sound.playSwitch();
    const nextTheme: 'dark' | 'light' = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    const updated: UserProfile = { ...profile, theme: nextTheme };
    setProfile(updated);
    saveProfileToDb(updated);
  };

  const handleUpdateProfile = async (updated: UserProfile) => {
    sound.playTap();
    setProfile(updated);
    setExistingAccount(updated);
    await saveProfileToDb(updated);
  };

  const handleExportBackup = async () => {
    sound.playPop();
    const jsonStr = await exportAllData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `antisocial_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleImportBackup = async (jsonContent: string) => {
    sound.playPop();
    const success = await importData(jsonContent);
    if (success) {
      const refreshedPosts = await getStoredPosts();
      const refreshedProfile = await getStoredProfile();
      setPosts(refreshedPosts);
      if (refreshedProfile) {
        setProfile(refreshedProfile);
        setExistingAccount(refreshedProfile);
        setTheme(refreshedProfile.theme);
        setIsAuthenticated(true);
      }
      alert('Sauvegarde restaurée avec succès !');
    } else {
      alert('Impossible de restaurer ce fichier. Format non reconnu.');
    }
  };

  // Random Memory Resurfacing
  const handleOpenRandomMemory = () => {
    sound.playChime();
    const activePosts = posts.filter((p) => !p.isArchived);
    if (activePosts.length === 0) return;
    const randomIndex = Math.floor(Math.random() * activePosts.length);
    setRandomMemory(activePosts[randomIndex]);
  };

  // Filtered and sorted feed posts
  const feedPosts = useMemo(() => {
    let result = posts.filter((p) => !p.isArchived);

    if (feedFilter === 'favorites') {
      result = result.filter((p) => p.isFavorite);
    } else if (feedFilter === 'reels') {
      result = result.filter((p) => p.type === 'reel' || p.type === 'video');
    } else if (feedFilter === 'photos') {
      result = result.filter((p) => p.type === 'photo' || p.type === 'carousel');
    } else if (feedFilter === 'videos') {
      result = result.filter((p) => p.type === 'video');
    } else if (feedFilter === 'notes') {
      result = result.filter((p) => p.type === 'note');
    } else if (feedFilter === 'quotes') {
      result = result.filter((p) => p.type === 'quote');
    } else if (feedFilter === 'links') {
      result = result.filter((p) => p.type === 'link');
    }

    // Sort: Pinned first, then reverse chronological
    return result.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [posts, feedFilter]);

  const archivedCount = useMemo(() => posts.filter((p) => p.isArchived).length, [posts]);
  const hasFavorites = useMemo(() => posts.some((p) => p.isFavorite && !p.isArchived), [posts]);

  // Loading state
  if (!isLoaded) {
    return (
      <div className="auth-loading-screen">
        <img src="/logo.png" alt="ANTISOCIAL" className="loading-logo" />
        <span className="loading-wordmark">ANTISOCIAL</span>
      </div>
    );
  }

  // Not authenticated: Show Landing / Soul / Auth Page
  if (!isAuthenticated) {
    return (
      <AuthSoulScreen
        existingAccount={existingAccount}
        onLogin={handleLogin}
        onRegister={handleRegister}
        onImportBackup={handleImportBackup}
      />
    );
  }

  return (
    <div className="app-layout">
      {/* Navigation (Sidebar Desktop + Bottom Bar Mobile) */}
      <Navigation
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenCreate={() => setIsCreateOpen(true)}
        profile={profile}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        archivedCount={archivedCount}
      />

      {/* Main Content Area */}
      <main className="app-main-viewport">
        {activeTab === 'home' && (
          <div className="feed-column-container">
            {/* Header */}
            <Header
              theme={theme}
              onToggleTheme={handleToggleTheme}
              onOpenRandomMemory={handleOpenRandomMemory}
              totalPostsCount={feedPosts.length}
              onOpenCmd={() => setIsCmdOpen(true)}
            />

            {/* Stories Tray & Category Pills (Instagram / Threads style) */}
            <HighlightsBar
              currentFilter={feedFilter}
              onSelectFilter={setFeedFilter}
              onOpenCreate={() => setIsCreateOpen(true)}
              onOpenRandomMemory={handleOpenRandomMemory}
              hasFavorites={hasFavorites}
              profile={profile}
              highlights={profile.highlights || []}
              onOpenStory={(hl) => setSelectedHighlight(hl)}
            />

            {/* Posts Feed */}
            {feedPosts.length === 0 ? (
              <div className="feed-empty-container">
                <div className="empty-feed-badge">
                  <Sparkles size={28} className="text-crimson" />
                </div>
                <h3>Votre sanctuaire est prêt, @{profile.username}</h3>
                <p>
                  {feedFilter !== 'all'
                    ? 'Aucun souvenir ne correspond à ce filtre.'
                    : 'Cet espace est vierge et 100% privé. Capturez votre premier souvenir, une réflexion ou une vidéo sans aucun regard extérieur.'}
                </p>
                <button
                  className="btn-create-first"
                  onClick={() => setIsCreateOpen(true)}
                >
                  <Plus size={18} /> <span>Capturer mon premier souvenir</span>
                </button>
              </div>
            ) : (
              feedPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  profile={profile}
                  onToggleFavorite={handleToggleFavorite}
                  onTogglePin={handleTogglePin}
                  onArchive={handleArchivePost}
                  onDelete={handleDeletePost}
                  onEdit={(p) => setEditingPost(p)}
                  onOpenMediaViewer={(urls, idx) => setViewerMedia({ urls, initialIndex: idx })}
                  onTagClick={() => setActiveTab('search')}
                />
              ))
            )}
          </div>
        )}

        {/* Reels Tab */}
        {activeTab === 'reels' && (
          <ReelsFeed
            posts={posts}
            profile={profile}
            onToggleFavorite={handleToggleFavorite}
            onArchive={handleArchivePost}
            onEdit={(p) => setEditingPost(p)}
            onOpenCreate={() => setIsCreateOpen(true)}
          />
        )}

        {/* Search & Explore Tab */}
        {activeTab === 'search' && (
          <SearchScreen
            posts={posts}
            profile={profile}
            onToggleFavorite={handleToggleFavorite}
            onTogglePin={handleTogglePin}
            onArchive={handleArchivePost}
            onDelete={handleDeletePost}
            onEdit={(p) => setEditingPost(p)}
            onOpenMediaViewer={(urls, idx) => setViewerMedia({ urls, initialIndex: idx })}
          />
        )}

        {/* Archive Tab */}
        {activeTab === 'archive' && (
          <ArchiveScreen
            posts={posts}
            onRestore={handleRestorePost}
            onDelete={handleDeletePost}
            onOpenMediaViewer={(urls, idx) => setViewerMedia({ urls, initialIndex: idx })}
          />
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <ProfileScreen
            profile={profile}
            posts={posts}
            theme={theme}
            onToggleTheme={handleToggleTheme}
            onUpdateProfile={handleUpdateProfile}
            onExportBackup={handleExportBackup}
            onImportBackup={handleImportBackup}
            onClearAllData={handleClearAllData}
            onLogout={handleLogout}
            onOpenStory={(hl) => setSelectedHighlight(hl)}
            onOpenMediaViewer={(urls, idx) => setViewerMedia({ urls, initialIndex: idx })}
          />
        )}
      </main>

      {/* Create / Capture Modal */}
      {isCreateOpen && (
        <CreateModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          onSavePost={handleSaveNewPost}
        />
      )}

      {/* Edit Post Modal */}
      {editingPost && (
        <EditPostModal
          isOpen={Boolean(editingPost)}
          post={editingPost}
          onClose={() => setEditingPost(null)}
          onSave={handleSaveEditedPost}
        />
      )}

      {/* Fullscreen Media Viewer */}
      {viewerMedia && (
        <MediaViewerModal
          isOpen={Boolean(viewerMedia)}
          mediaUrls={viewerMedia.urls}
          initialIndex={viewerMedia.initialIndex}
          onClose={() => setViewerMedia(null)}
        />
      )}

      {/* Story Viewer Modal */}
      {selectedHighlight && (
        <StoryViewerModal
          isOpen={Boolean(selectedHighlight)}
          highlight={selectedHighlight}
          profile={profile}
          onClose={() => setSelectedHighlight(null)}
        />
      )}

      {/* Random Flashback Modal */}
      {randomMemory && (
        <div className="modal-backdrop" onClick={() => setRandomMemory(null)}>
          <div className="flashback-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="flashback-header">
              <Sparkles size={20} className="flashback-icon" />
              <span>Souvenir réapparu</span>
            </div>
            <PostCard
              post={randomMemory}
              profile={profile}
              onToggleFavorite={handleToggleFavorite}
              onTogglePin={handleTogglePin}
              onArchive={handleArchivePost}
              onDelete={handleDeletePost}
              onEdit={(p) => setEditingPost(p)}
              onOpenMediaViewer={(urls, idx) => setViewerMedia({ urls, initialIndex: idx })}
              onTagClick={() => {
                setRandomMemory(null);
                setActiveTab('search');
              }}
            />
            <button className="flashback-close-btn" onClick={() => setRandomMemory(null)}>
              Refermer ce souvenir
            </button>
          </div>
        </div>
      )}

      {/* Command Palette (⌘K) */}
      <CommandPalette
        isOpen={isCmdOpen}
        onClose={() => setIsCmdOpen(false)}
        posts={posts}
        onNavigate={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onSelectFilter={setFeedFilter}
        onOpenCreate={() => setIsCreateOpen(true)}
        onToggleTheme={handleToggleTheme}
        onOpenRandomMemory={handleOpenRandomMemory}
        theme={theme}
        onExport={handleExportBackup}
      />
    </div>
  );
};

export default App;
