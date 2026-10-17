import React, { useState, useMemo } from 'react';
import { Search as SearchIcon, X, Grid, List, Heart, BookOpen, PenTool, Link2, Video } from 'lucide-react';
import type { PostItem, UserProfile } from '../types';
import { PostCard } from './PostCard';

interface SearchScreenProps {
  posts: PostItem[];
  profile: UserProfile;
  onToggleFavorite: (id: string) => void;
  onTogglePin: (id: string) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (post: PostItem) => void;
  onOpenMediaViewer: (mediaUrls: string[], initialIndex: number) => void;
  onUpdatePost?: (post: PostItem) => void;
}

export const SearchScreen: React.FC<SearchScreenProps> = ({
  posts,
  profile,
  onToggleFavorite,
  onTogglePin,
  onArchive,
  onDelete,
  onEdit,
  onOpenMediaViewer,
  onUpdatePost,
}) => {
  const [query, setQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Filter posts
  const filteredPosts = useMemo(() => {
    return posts.filter((p) => {
      // Must not be archived
      if (p.isArchived) return false;

      // Type filter
      if (selectedType === 'favorites' && !p.isFavorite) return false;
      if (selectedType === 'photos' && p.type !== 'photo' && p.type !== 'carousel') return false;
      if (selectedType === 'videos' && p.type !== 'video') return false;
      if (selectedType === 'notes' && p.type !== 'note') return false;
      if (selectedType === 'quotes' && p.type !== 'quote') return false;
      if (selectedType === 'links' && p.type !== 'link') return false;

      if (!query.trim()) return true;

      const q = query.toLowerCase().trim();
      const matchCaption = p.caption?.toLowerCase().includes(q);
      const matchTags = p.tags?.some((t) => t.toLowerCase().includes(q));
      const matchLocation = p.location?.toLowerCase().includes(q);
      const matchAnnotation = p.privateAnnotation?.toLowerCase().includes(q);

      const matchNote = p.noteBody?.toLowerCase().includes(q);
      const matchQuote =
        p.quoteData?.quote.toLowerCase().includes(q) ||
        p.quoteData?.author.toLowerCase().includes(q) ||
        p.quoteData?.source?.toLowerCase().includes(q);
      const matchLink =
        p.linkData?.title.toLowerCase().includes(q) ||
        p.linkData?.url.toLowerCase().includes(q) ||
        p.linkData?.domain.toLowerCase().includes(q) ||
        p.linkData?.description?.toLowerCase().includes(q);

      return (
        matchCaption ||
        matchTags ||
        matchLocation ||
        matchAnnotation ||
        matchNote ||
        matchQuote ||
        matchLink
      );
    });
  }, [posts, query, selectedType]);

  return (
    <div className="search-screen-container">
      {/* Search Header Bar */}
      <div className="search-header-bar">
        <div className="search-input-wrapper">
          <SearchIcon size={18} className="search-bar-icon" />
          <input
            type="text"
            className="search-main-input"
            placeholder="Rechercher pensées, citations, tags, notes..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button className="clear-search-btn" onClick={() => setQuery('')}>
              <X size={16} />
            </button>
          )}
        </div>

        <div className="view-mode-toggle">
          <button
            className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
            title="Vue grille (Explorer)"
          >
            <Grid size={18} />
          </button>
          <button
            className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
            title="Vue liste détaillée"
          >
            <List size={18} />
          </button>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="search-filter-chips">
        {[
          { id: 'all', label: 'Tout' },
          { id: 'favorites', label: 'Favoris ❤️' },
          { id: 'photos', label: 'Photos 📸' },
          { id: 'videos', label: 'Vidéos 🎥' },
          { id: 'quotes', label: 'Citations 📖' },
          { id: 'notes', label: 'Pensées ✍️' },
          { id: 'links', label: 'Liens 🔗' },
        ].map((chip) => (
          <button
            key={chip.id}
            className={`filter-chip ${selectedType === chip.id ? 'active' : ''}`}
            onClick={() => setSelectedType(chip.id)}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Results Count */}
      <div className="search-results-meta">
        <span>{filteredPosts.length} souvenir{filteredPosts.length > 1 ? 's' : ''} trouvé{filteredPosts.length > 1 ? 's' : ''}</span>
      </div>

      {/* Results View */}
      {filteredPosts.length === 0 ? (
        <div className="search-empty-state">
          <div className="empty-search-icon">🔍</div>
          <h3>Aucun souvenir trouvé</h3>
          <p>Essayez un autre mot-clé ou modifiez les filtres de contenu.</p>
        </div>
      ) : viewMode === 'grid' ? (
        /* Instagram Explore Style 3-Column Square Grid */
        <div className="explore-photo-grid">
          {filteredPosts.map((post) => (
            <div
              key={post.id}
              className="explore-grid-cell"
              onClick={() => {
                if (post.mediaUrls && post.mediaUrls.length > 0) {
                  onOpenMediaViewer(post.mediaUrls, 0);
                } else {
                  setViewMode('list');
                }
              }}
            >
              {/* If Photo or Carousel */}
              {(post.type === 'photo' || post.type === 'carousel') && post.mediaUrls && (
                <>
                  <img src={post.mediaUrls[0]} alt={post.caption} className="grid-cell-img" />
                  {post.type === 'carousel' && <span className="grid-icon-indicator">❐</span>}
                </>
              )}

              {/* If Video */}
              {post.type === 'video' && (
                <div className="grid-cell-video-cover">
                  {post.mediaUrls && post.mediaUrls[0] ? (
                    <img src={post.mediaUrls[0]} alt="Video cover" className="grid-cell-img" />
                  ) : (
                    <div className="grid-video-placeholder">
                      <Video size={28} />
                    </div>
                  )}
                  <span className="grid-icon-indicator">▶</span>
                </div>
              )}

              {/* If Note */}
              {post.type === 'note' && (
                <div className={`grid-cell-note-preview theme-${post.noteStyle?.bgTheme || 'midnight-violet'}`}>
                  <PenTool size={18} className="grid-type-symbol" />
                  <p className="grid-note-snippet">{post.noteBody || post.caption}</p>
                </div>
              )}

              {/* If Quote */}
              {post.type === 'quote' && (
                <div className="grid-cell-quote-preview">
                  <BookOpen size={18} className="grid-type-symbol" />
                  <p className="grid-quote-snippet">« {post.quoteData?.quote} »</p>
                  <span className="grid-quote-author">— {post.quoteData?.author}</span>
                </div>
              )}

              {/* If Link */}
              {post.type === 'link' && (
                <div className="grid-cell-link-preview">
                  {post.linkData?.image ? (
                    <img src={post.linkData.image} alt="Link thumbnail" className="grid-cell-img" />
                  ) : (
                    <div className="grid-link-placeholder">
                      <Link2 size={24} />
                      <span>{post.linkData?.domain}</span>
                    </div>
                  )}
                  <span className="grid-icon-indicator">↗</span>
                </div>
              )}

              {/* Hover overlay with favorite */}
              <div className="grid-cell-overlay">
                {post.isFavorite && <Heart size={20} fill="#ffffff" color="#ffffff" />}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="feed-posts-column">
          {filteredPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              profile={profile}
              onToggleFavorite={onToggleFavorite}
              onTogglePin={onTogglePin}
              onArchive={onArchive}
              onDelete={onDelete}
              onEdit={onEdit}
              onOpenMediaViewer={onOpenMediaViewer}
              onTagClick={(tag) => setQuery(tag)}
              onUpdatePost={onUpdatePost}
            />
          ))}
        </div>
      )}
    </div>
  );
};
