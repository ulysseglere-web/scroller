import React, { useState } from 'react';
import { Archive, RotateCcw, Trash2, Calendar, Heart } from 'lucide-react';
import type { PostItem } from '../types';

interface ArchiveScreenProps {
  posts: PostItem[];
  onRestore: (id: string) => void;
  onDelete: (id: string) => void;
  onOpenMediaViewer: (mediaUrls: string[], initialIndex: number) => void;
}

export const ArchiveScreen: React.FC<ArchiveScreenProps> = ({
  posts,
  onRestore,
  onDelete,
  onOpenMediaViewer,
}) => {
  const archivedPosts = posts.filter((p) => p.isArchived);
  const [filterType, setFilterType] = useState<string>('all');

  const filtered = archivedPosts.filter((p) => {
    if (filterType === 'all') return true;
    if (filterType === 'photos') return p.type === 'photo' || p.type === 'carousel';
    if (filterType === 'videos') return p.type === 'video';
    if (filterType === 'notes') return p.type === 'note';
    if (filterType === 'quotes') return p.type === 'quote';
    if (filterType === 'links') return p.type === 'link';
    return true;
  });

  return (
    <div className="archive-screen-container">
      <div className="archive-header-banner">
        <div className="archive-banner-icon">
          <Archive size={28} />
        </div>
        <div className="archive-banner-text">
          <h2>Coffre des Archives</h2>
          <p>
            Ces souvenirs sont conservés hors de votre fil principal. Vous pouvez les réintégrer à tout moment.
          </p>
        </div>
      </div>

      {archivedPosts.length > 0 && (
        <div className="archive-filter-row">
          {['all', 'photos', 'videos', 'notes', 'quotes', 'links'].map((t) => (
            <button
              key={t}
              className={`archive-filter-btn ${filterType === t ? 'active' : ''}`}
              onClick={() => setFilterType(t)}
            >
              {t === 'all' && 'Tous les archivés'}
              {t === 'photos' && 'Photos'}
              {t === 'videos' && 'Vidéos'}
              {t === 'notes' && 'Pensées'}
              {t === 'quotes' && 'Citations'}
              {t === 'links' && 'Liens'}
            </button>
          ))}
        </div>
      )}

      {archivedPosts.length === 0 ? (
        <div className="archive-empty-state">
          <div className="empty-archive-icon">📦</div>
          <h3>Aucun souvenir archivé</h3>
          <p>
            Lorsque vous souhaitez nettoyer votre fil sans perdre de précieux moments, utilisez le bouton d'archivage sur n'importe quel post.
          </p>
        </div>
      ) : (
        <div className="archive-items-list">
          {filtered.map((post) => {
            const formattedDate = new Intl.DateTimeFormat('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            }).format(new Date(post.createdAt));

            return (
              <div key={post.id} className="archived-item-card">
                {/* Media thumbnail */}
                {post.mediaUrls && post.mediaUrls[0] && (
                  <div
                    className="archived-thumb"
                    onClick={() => onOpenMediaViewer(post.mediaUrls || [], 0)}
                  >
                    <img src={post.mediaUrls[0]} alt="Miniature" />
                  </div>
                )}

                {/* Content preview */}
                <div className="archived-content-info">
                  <div className="archived-meta-top">
                    <span className="archived-type-badge">{post.type.toUpperCase()}</span>
                    <span className="archived-date">
                      <Calendar size={12} /> {formattedDate}
                    </span>
                    {post.isFavorite && <Heart size={14} fill="#ff1e27" color="#ff1e27" />}
                  </div>

                  <p className="archived-snippet">
                    {post.quoteData
                      ? `« ${post.quoteData.quote} » — ${post.quoteData.author}`
                      : post.noteBody || post.caption || 'Sans légende'}
                  </p>

                  {post.tags && post.tags.length > 0 && (
                    <div className="archived-tags">
                      {post.tags.map((t) => (
                        <span key={t}>#{t}</span>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="archived-actions-row">
                    <button
                      className="btn-restore-post"
                      onClick={() => onRestore(post.id)}
                      title="Restaurer ce souvenir dans mon fil principal"
                    >
                      <RotateCcw size={15} />
                      <span>Restaurer dans le fil</span>
                    </button>

                    <button
                      className="btn-delete-archived"
                      onClick={() => {
                        if (confirm('Supprimer définitivement ce souvenir archivé ?')) {
                          onDelete(post.id);
                        }
                      }}
                      title="Supprimer définitivement"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
