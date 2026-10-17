import React, { useState, useEffect, useMemo, useRef } from 'react';
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
import { QuickCaptureBar } from './components/QuickCaptureBar';
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
import { Sparkles, Plus, Shuffle } from 'lucide-react';
import { triggerBackgroundPush, pullCloudSync, clearStoredSession } from './services/cloudSync';

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
  const [preloadedFiles, setPreloadedFiles] = useState<string[]>([]);
  const [createInitialMode, setCreateInitialMode] = useState<'media' | 'note'>('media');
  const directFileInputRef = useRef<HTMLInputElement>(null);

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

  // Natural gesture navigation between main tabs (Instagram / TikTok style)
  useEffect(() => {
    let startX = 0;
    let startY = 0;
    let startTime = 0;
    let isSwipingCandidate = false;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;

      // Ignorer si un modal ou viewer est déjà actif
      if (isCreateOpen || isCmdOpen || editingPost || viewerMedia || randomMemory || selectedHighlight) {
        return;
      }

      // Ignorer si le geste débute sur un carrousel horizontal interne ou un champ interactif
      const target = e.target as HTMLElement | null;
      if (
        target?.closest(
          '.stories-tray-scroll, .feed-category-pills, .carousel-track, input, textarea, button, .reels-feed-container'
        )
      ) {
        return;
      }

      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      startTime = Date.now();
      isSwipingCandidate = true;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!isSwipingCandidate) return;
      isSwipingCandidate = false;

      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const deltaX = endX - startX;
      const deltaY = endY - startY;
      const elapsed = Date.now() - startTime;

      // Doit être un swipe horizontal vif (< 500ms, distance > 55px, angle très horizontal)
      if (elapsed < 500 && Math.abs(deltaX) > 55 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
        const TABS: NavTab[] = ['home', 'reels', 'search', 'profile'];
        const currentIndex = TABS.indexOf(activeTab);

        if (currentIndex !== -1) {
          if (deltaX < 0 && currentIndex < TABS.length - 1) {
            // Glissé vers la gauche -> onglet suivant
            sound.playTap();
            setActiveTab(TABS[currentIndex + 1]);
            window.scrollTo({ top: 0, behavior: 'instant' });
          } else if (deltaX > 0 && currentIndex > 0) {
            // Glissé vers la droite -> onglet précédent
            sound.playTap();
            setActiveTab(TABS[currentIndex - 1]);
            window.scrollTo({ top: 0, behavior: 'instant' });
          }
        }
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [activeTab, isCreateOpen, isCmdOpen, editingPost, viewerMedia, randomMemory, selectedHighlight]);

  // Pull-to-refresh to reshuffle random feed
  const [pullDistance, setPullDistance] = useState(0);
  const [isPullRefreshing, setIsPullRefreshing] = useState(false);

  useEffect(() => {
    if (activeTab !== 'home') return;

    let startY = 0;
    let isPullCandidate = false;

    const onTouchStart = (e: TouchEvent) => {
      if (window.scrollY <= 2 && e.touches.length === 1) {
        startY = e.touches[0].clientY;
        isPullCandidate = true;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isPullCandidate) return;
      if (window.scrollY > 2) {
        isPullCandidate = false;
        setPullDistance(0);
        return;
      }

      const currentY = e.touches[0].clientY;
      const dy = currentY - startY;

      if (dy > 0) {
        // Elastic pull resistance
        const dist = Math.min(80, dy * 0.45);
        setPullDistance(dist);
      } else {
        setPullDistance(0);
      }
    };

    const onTouchEnd = () => {
      if (!isPullCandidate) return;
      isPullCandidate = false;

      if (pullDistance >= 48) {
        setIsPullRefreshing(true);
        sound.playPop();
        if ('vibrate' in navigator) {
          try { navigator.vibrate(15); } catch {}
        }
        setShuffleSeed((s) => s + 1);

        setTimeout(() => {
          setIsPullRefreshing(false);
          setPullDistance(0);
        }, 550);
      } else {
        setPullDistance(0);
      }
    };

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [activeTab, pullDistance]);

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

      // Multi-device sync: fetch latest cloud vault if account has email
      if (storedProfile?.email) {
        pullCloudSync(storedProfile.email).then((cloudData) => {
          if (cloudData && Array.isArray(cloudData.posts)) {
            setPosts(cloudData.posts);
            if (cloudData.profile) {
              setProfile(cloudData.profile);
            }
          }
        });
      }
    }
    loadData();
  }, []);

  // Sync theme attribute
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Continuous background sync push when posts or profile change
  useEffect(() => {
    if (isLoaded && isAuthenticated && profile.email) {
      triggerBackgroundPush(posts, profile);
    }
  }, [posts, profile, isLoaded, isAuthenticated]);

  // Auth Handlers
  const handleRegister = async (newProfile: UserProfile) => {
    sound.playPop();
    await saveProfileToDb(newProfile);
    setProfile(newProfile);
    setExistingAccount(newProfile);
    setSessionAuthenticated(true);
    setIsAuthenticated(true);
    setPosts([]);
    triggerBackgroundPush([], newProfile);
  };

  const handleLogin = (userProfile: UserProfile, cloudPosts?: PostItem[]) => {
    sound.playChime();
    setProfile(userProfile);
    if (cloudPosts && Array.isArray(cloudPosts)) {
      setPosts(cloudPosts);
    }
    setExistingAccount(userProfile);
    setSessionAuthenticated(true);
    setIsAuthenticated(true);
    if (userProfile.theme) {
      setTheme(userProfile.theme);
      document.documentElement.setAttribute('data-theme', userProfile.theme);
    }
  };

  const handleLogout = () => {
    sound.playTap();
    clearStoredSession();
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

  // Zero-friction capture handlers
  const handleDirectMediaClick = () => {
    if (directFileInputRef.current) {
      directFileInputRef.current.click();
    }
  };

  const handleDirectMediaSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const urls: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('video/')) {
        urls.push(URL.createObjectURL(file));
      } else {
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (ev) => resolve(ev.target?.result as string);
          reader.readAsDataURL(file);
        });
        urls.push(base64);
      }
    }

    setPreloadedFiles(urls);
    setCreateInitialMode('media');
    setIsCreateOpen(true);
    e.target.value = '';
  };

  const handleQuickSaveNote = async (text: string) => {
    const newPost: PostItem = {
      id: `post_${Date.now()}`,
      type: 'note',
      createdAt: new Date().toISOString(),
      caption: '',
      noteBody: text,
      noteStyle: { bgTheme: 'dark-monochrome', fontSize: 'large' },
      tags: [],
      isFavorite: false,
    };
    await handleSaveNewPost(newPost);
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

  // Shuffle seed for 100% random memories feed
  const [shuffleSeed, setShuffleSeed] = useState(0);

  // 100% Random & Surprising Feed (Fisher-Yates Shuffle)
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

    if (result.length <= 1) return result;

    // Pinned posts stay at the very top, while all other memories are randomly shuffled
    const pinned = result.filter((p) => p.isPinned);
    const unpinned = result.filter((p) => !p.isPinned);

    const shuffled = [...unpinned];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return [...pinned, ...shuffled];
  }, [posts, feedFilter, shuffleSeed]);

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
        onOpenCreate={handleDirectMediaClick}
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
              onReshuffleFeed={() => setShuffleSeed((s) => s + 1)}
              totalPostsCount={feedPosts.length}
              onOpenCmd={() => setIsCmdOpen(true)}
            />

            {/* Pull to refresh floating indicator */}
            {(pullDistance > 0 || isPullRefreshing) && (
              <div 
                className="pull-refresh-indicator-wrap" 
                style={{
                  height: isPullRefreshing ? '46px' : `${pullDistance}px`,
                  opacity: Math.min(1, (isPullRefreshing ? 50 : pullDistance) / 30),
                }}
              >
                <div className={`pull-refresh-badge ${pullDistance >= 48 ? 'ready' : ''} ${isPullRefreshing ? 'refreshing' : ''}`}>
                  <Shuffle 
                    size={16} 
                    className={`pull-refresh-icon ${isPullRefreshing ? 'spinning' : ''}`}
                    style={{
                      transform: isPullRefreshing ? undefined : `rotate(${pullDistance * 5}deg)`,
                    }}
                  />
                  <span className="pull-refresh-label">
                    {isPullRefreshing ? 'Mélange des souvenirs...' : pullDistance >= 48 ? 'Relâcher pour mélanger' : 'Tirer pour mélanger'}
                  </span>
                </div>
              </div>
            )}

            {/* Stories Tray & Category Pills (Instagram / Threads style) */}
            <HighlightsBar
              currentFilter={feedFilter}
              onSelectFilter={setFeedFilter}
              onOpenCreate={handleDirectMediaClick}
              onOpenRandomMemory={handleOpenRandomMemory}
              hasFavorites={hasFavorites}
              profile={profile}
              highlights={profile.highlights || []}
              onOpenStory={(hl) => setSelectedHighlight(hl)}
            />

            {/* Instant Quick Capture Bar (Zero friction: inline thought or direct media) */}
            <QuickCaptureBar
              profile={profile}
              onSubmitText={handleQuickSaveNote}
              onDirectMediaClick={handleDirectMediaClick}
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
                  onClick={handleDirectMediaClick}
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
          onClose={() => {
            setIsCreateOpen(false);
            setPreloadedFiles([]);
          }}
          onSavePost={handleSaveNewPost}
          initialFiles={preloadedFiles}
          initialMode={createInitialMode}
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

      {/* Hidden File Input for Instant Zero-Friction Media Capture */}
      <input
        ref={directFileInputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        style={{ display: 'none' }}
        onChange={handleDirectMediaSelected}
      />
    </div>
  );
};

export default App;
