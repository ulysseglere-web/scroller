import React from 'react';
import { Sparkles, Heart, Camera, BookOpen, PenTool, Link2, Plus, Film } from 'lucide-react';
import type { FeedFilter } from '../types';

interface HighlightsBarProps {
  currentFilter: FeedFilter;
  onSelectFilter: (filter: FeedFilter) => void;
  onOpenCreate: () => void;
  onOpenRandomMemory: () => void;
  hasFavorites: boolean;
}

export const HighlightsBar: React.FC<HighlightsBarProps> = ({
  currentFilter,
  onSelectFilter,
  onOpenCreate,
  onOpenRandomMemory,
}) => {
  return (
    <div className="highlights-wrapper" role="region" aria-label="Filtres de flux">
      <div className="highlights-scroll">
        {/* Quick capture button */}
        <div className="highlight-item" onClick={onOpenCreate} role="button" tabIndex={0}>
          <div className="highlight-ring highlight-add">
            <Plus size={18} strokeWidth={1.5} />
          </div>
          <span className="highlight-label">Capturer</span>
        </div>

        {/* Resurface memory */}
        <div className="highlight-item" onClick={onOpenRandomMemory} role="button" tabIndex={0}>
          <div className="highlight-ring">
            <Sparkles size={16} strokeWidth={1.5} />
          </div>
          <span className="highlight-label">Écho</span>
        </div>

        {/* Filter: All */}
        <div
          className={`highlight-item ${currentFilter === 'all' ? 'active-filter' : ''}`}
          onClick={() => onSelectFilter('all')}
          role="button"
          tabIndex={0}
        >
          <div className="highlight-ring">
            <span className="highlight-text-bubble">TOUT</span>
          </div>
          <span className="highlight-label">Flux</span>
        </div>

        {/* Filter: Reels */}
        <div
          className={`highlight-item ${currentFilter === 'reels' ? 'active-filter' : ''}`}
          onClick={() => onSelectFilter('reels')}
          role="button"
          tabIndex={0}
        >
          <div className="highlight-ring">
            <Film size={16} strokeWidth={1.5} />
          </div>
          <span className="highlight-label">Reels</span>
        </div>

        {/* Filter: Photos */}
        <div
          className={`highlight-item ${currentFilter === 'photos' ? 'active-filter' : ''}`}
          onClick={() => onSelectFilter('photos')}
          role="button"
          tabIndex={0}
        >
          <div className="highlight-ring">
            <Camera size={16} strokeWidth={1.5} />
          </div>
          <span className="highlight-label">Images</span>
        </div>

        {/* Filter: Notes */}
        <div
          className={`highlight-item ${currentFilter === 'notes' ? 'active-filter' : ''}`}
          onClick={() => onSelectFilter('notes')}
          role="button"
          tabIndex={0}
        >
          <div className="highlight-ring">
            <PenTool size={16} strokeWidth={1.5} />
          </div>
          <span className="highlight-label">Pensées</span>
        </div>

        {/* Filter: Quotes */}
        <div
          className={`highlight-item ${currentFilter === 'quotes' ? 'active-filter' : ''}`}
          onClick={() => onSelectFilter('quotes')}
          role="button"
          tabIndex={0}
        >
          <div className="highlight-ring">
            <BookOpen size={16} strokeWidth={1.5} />
          </div>
          <span className="highlight-label">Citations</span>
        </div>

        {/* Filter: Links */}
        <div
          className={`highlight-item ${currentFilter === 'links' ? 'active-filter' : ''}`}
          onClick={() => onSelectFilter('links')}
          role="button"
          tabIndex={0}
        >
          <div className="highlight-ring">
            <Link2 size={16} strokeWidth={1.5} />
          </div>
          <span className="highlight-label">Liens</span>
        </div>

        {/* Filter: Favorites */}
        <div
          className={`highlight-item ${currentFilter === 'favorites' ? 'active-filter' : ''}`}
          onClick={() => onSelectFilter('favorites')}
          role="button"
          tabIndex={0}
        >
          <div className="highlight-ring">
            <Heart size={16} strokeWidth={1.5} />
          </div>
          <span className="highlight-label">Favoris</span>
        </div>
      </div>
    </div>
  );
};
