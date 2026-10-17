import React from 'react';
import { Plus, Sparkles } from 'lucide-react';
import type { FeedFilter, UserProfile, StoryHighlight } from '../types';
import { sound } from '../services/sound';

interface HighlightsBarProps {
  currentFilter: FeedFilter;
  onSelectFilter: (filter: FeedFilter) => void;
  onOpenCreate: () => void;
  onOpenRandomMemory: () => void;
  hasFavorites: boolean;
  profile: UserProfile;
  highlights: StoryHighlight[];
  onOpenStory: (highlight: StoryHighlight) => void;
}

export const HighlightsBar: React.FC<HighlightsBarProps> = ({
  onOpenCreate,
  onOpenRandomMemory,
  profile,
  highlights,
  onOpenStory,
}) => {
  return (
    <div className="stories-and-filters-container insta-stories-only">
      {/* Instagram Stories Tray */}
      <div className="stories-tray-scroll">
        {/* Your Story (+) */}
        <div 
          className="story-circle-item" 
          onClick={() => {
            sound.playPop();
            onOpenCreate();
          }}
          role="button"
          tabIndex={0}
          title="Ajouter à ma story"
        >
          <div className="story-avatar-wrapper add-story">
            <img 
              src={profile.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120'} 
              alt={profile.displayName} 
              className="story-avatar-img"
            />
            <div className="story-plus-badge">
              <Plus size={12} strokeWidth={3} />
            </div>
          </div>
          <span className="story-label">Votre story</span>
        </div>

        {/* Story Highlights (Stories à la une) */}
        {highlights.map((hl) => (
          <div
            key={hl.id}
            className="story-circle-item"
            onClick={() => {
              sound.playTap();
              onOpenStory(hl);
            }}
            role="button"
            tabIndex={0}
            title={hl.title}
          >
            <div className="story-avatar-wrapper has-story">
              <img src={hl.coverUrl} alt={hl.title} className="story-avatar-img" />
            </div>
            <span className="story-label">{hl.title}</span>
          </div>
        ))}

        {/* Resurface Flashback Story */}
        <div 
          className="story-circle-item" 
          onClick={() => {
            sound.playChime();
            onOpenRandomMemory();
          }}
          role="button"
          tabIndex={0}
          title="Faire resurgir un souvenir"
        >
          <div className="story-avatar-wrapper echo-story">
            <div className="story-echo-icon">
              <Sparkles size={20} strokeWidth={2} />
            </div>
          </div>
          <span className="story-label">Écho</span>
        </div>
      </div>
    </div>
  );
};
