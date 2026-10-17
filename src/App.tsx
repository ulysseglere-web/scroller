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
  resetDatabaseToDemo 
} from './services/storage';
import { DEFAULT_PROFILE } from './services/starterData';
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
import { DynamicIsland } from './components/DynamicIsland';
import { sound } from './services/sound';
import { Sparkles, Plus } from 'lucide-react';

export const App: React.FC = () => {
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
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

  // Initial load
  useEffect(() => {
    async function loadData() {
      const storedPosts = await getStoredPosts();
      setPosts(storedPosts);
      const storedProfile = await getStoredProfile();
      setProfile(storedProfile);
      setTheme(storedProfile.theme || 'dark');
      document.documentElement.setAttribute('data-theme', storedProfile.theme || 'dark');
    }
    loadData();
  }, []);

  // Sync theme attribute
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

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
    await saveProfileToDb(updated);
  };

  const handleExportBackup = async () => {
    sound.playPop();
    const jsonStr = await exportAllData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scroller_backup_${new Date().toISOString().split('T')[0]}.json`;
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
      setProfile(refreshedProfile);
      setTheme(refreshedProfile.theme);
      alert('Sauvegarde restaurée avec succès !');
    } else {
      alert('Impossible de restaurer ce fichier. Format non reconnu.');
    }
  };

  const handleResetDemo = async () => {
    sound.playTap();
    await resetDatabaseToDemo();
    const refreshedPosts = await getStoredPosts();
    const refreshedProfile = await getStoredProfile();
    setPosts(refreshedPosts);
    setProfile(refreshedProfile);
    alert('Base réinitialisée avec les exemples de départ.');
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
              currentFilter={feedFilter}
              onSelectFilter={setFeedFilter}
              theme={theme}
              onToggleTheme={handleToggleTheme}
              onOpenRandomMemory={handleOpenRandomMemory}
              totalPostsCount={feedPosts.length}
              onOpenCmd={() => setIsCmdOpen(true)}
            />

            {/* Dynamic Telemetry Island Bar */}
            <DynamicIsland
              onOpenCmd={() => setIsCmdOpen(true)}
              onOpenRandom={handleOpenRandomMemory}
              postCount={posts.filter((p) => !p.isArchived).length}
            />

            {/* Stories / Highlights Bar */}
            <HighlightsBar
              currentFilter={feedFilter}
              onSelectFilter={setFeedFilter}
              onOpenCreate={() => setIsCreateOpen(true)}
              onOpenRandomMemory={handleOpenRandomMemory}
              hasFavorites={hasFavorites}
            />

            {/* Posts Feed */}
            {feedPosts.length === 0 ? (
              <div className="feed-empty-container">
                <div className="empty-feed-icon">🍃</div>
                <h3>Votre fil est prêt</h3>
                <p>
                  {feedFilter !== 'all'
                    ? 'Aucun contenu ne correspond à ce filtre.'
                    : 'Capturez votre première pensée, une citation inspirante ou une belle photo.'}
                </p>
                <button
                  className="btn-create-first"
                  onClick={() => setIsCreateOpen(true)}
                >
                  <Plus size={18} /> <span>Ajouter un souvenir</span>
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
            onResetDemo={handleResetDemo}
            onOpenStory={(hl) => setSelectedHighlight(hl)}
            onOpenMediaViewer={(urls, idx) => setViewerMedia({ urls, initialIndex: idx })}
          />
        )}
      </main>

      {/* Story Viewer Modal */}
      <StoryViewerModal
        isOpen={!!selectedHighlight}
        highlight={selectedHighlight}
        profile={profile}
        onClose={() => setSelectedHighlight(null)}
      />

      {/* Create Modal */}
      <CreateModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSavePost={handleSaveNewPost}
      />

      {/* Edit Post Modal */}
      <EditPostModal
        post={editingPost}
        isOpen={!!editingPost}
        onClose={() => setEditingPost(null)}
        onSave={handleSaveEditedPost}
      />

      {/* Fullscreen Lightbox / Media Viewer */}
      {viewerMedia && (
        <MediaViewerModal
          isOpen={!!viewerMedia}
          mediaUrls={viewerMedia.urls}
          initialIndex={viewerMedia.initialIndex}
          onClose={() => setViewerMedia(null)}
        />
      )}

      {/* Random Flashback Modal */}
      {randomMemory && (
        <div className="modal-backdrop" onClick={() => setRandomMemory(null)}>
          <div className="create-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="create-modal-header">
              <div className="author-name-line">
                <Sparkles size={18} style={{ color: '#ff1e27' }} />
                <h3 className="create-modal-title">Souvenir resurgi</h3>
              </div>
              <button className="btn-close-modal" onClick={() => setRandomMemory(null)}>
                ✕
              </button>
            </div>
            <div style={{ maxHeight: '80vh', overflowY: 'auto' }}>
              <PostCard
                post={randomMemory}
                profile={profile}
                onToggleFavorite={handleToggleFavorite}
                onTogglePin={handleTogglePin}
                onArchive={handleArchivePost}
                onDelete={handleDeletePost}
                onEdit={(p) => setEditingPost(p)}
                onOpenMediaViewer={(urls, idx) => setViewerMedia({ urls, initialIndex: idx })}
              />
            </div>
          </div>
        </div>
      )}

      {/* Modern Command Palette (Cmd+K) */}
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
        onOpenRandomMemory={handleOpenRandomMemory}
        onToggleTheme={handleToggleTheme}
        theme={theme}
        onExport={handleExportBackup}
      />
    </div>
  );
};

export default App;
