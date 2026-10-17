import React from 'react';
import { Home, Compass, Plus, Archive, Moon, Sun, Film, Sparkles } from 'lucide-react';
import type { NavTab, UserProfile } from '../types';
import { sound } from '../services/sound';

interface NavigationProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onOpenCreate: () => void;
  profile: UserProfile;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  archivedCount: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
  onOpenCreate,
  profile,
  theme,
  onToggleTheme,
  archivedCount,
}) => {
  const handleTabClick = (tab: NavTab) => {
    sound.playTap();
    onTabChange(tab);
  };

  const handleCreateClick = () => {
    sound.playPop();
    onOpenCreate();
  };

  return (
    <>
      {/* Desktop Sidebar (>= 768px) */}
      <aside className="desktop-sidebar">
        <div className="sidebar-top">
          <div className="sidebar-brand" onClick={() => handleTabClick('home')}>
            <div className="sidebar-logo-row">
              <img src="/logo.png" alt="SCROLLER" className="sidebar-brand-logo" />
              <span className="brand-wordmark">SCROLLER</span>
              <span className="status-indicator-dot" />
            </div>
            <span className="sidebar-sub">The social media where you're alone.</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`sidebar-nav-item ${activeTab === 'home' ? 'active' : ''}`}
            onClick={() => handleTabClick('home')}
            aria-label="Fil d'actualité"
          >
            <Home size={19} strokeWidth={activeTab === 'home' ? 2.2 : 1.6} />
            <span className="nav-label">Flux</span>
          </button>

          <button
            className={`sidebar-nav-item ${activeTab === 'reels' ? 'active' : ''}`}
            onClick={() => handleTabClick('reels')}
            aria-label="Reels & Vidéos courtes"
          >
            <Film size={19} strokeWidth={activeTab === 'reels' ? 2.2 : 1.6} />
            <span className="nav-label">Reels</span>
            <span className="reels-live-pill">9:16</span>
          </button>

          <button
            className={`sidebar-nav-item ${activeTab === 'search' ? 'active' : ''}`}
            onClick={() => handleTabClick('search')}
            aria-label="Explorer"
          >
            <Compass size={19} strokeWidth={activeTab === 'search' ? 2.2 : 1.6} />
            <span className="nav-label">Explorer</span>
          </button>

          <button
            className="sidebar-nav-item create-action-item"
            onClick={handleCreateClick}
            aria-label="Capturer"
          >
            <Plus size={19} strokeWidth={2.2} />
            <span className="nav-label">Capturer</span>
          </button>

          <button
            className={`sidebar-nav-item ${activeTab === 'archive' ? 'active' : ''}`}
            onClick={() => handleTabClick('archive')}
            aria-label="Archives"
          >
            <Archive size={19} strokeWidth={activeTab === 'archive' ? 2.2 : 1.6} />
            <span className="nav-label">Archives</span>
            {archivedCount > 0 && (
              <span className="sidebar-badge">{archivedCount}</span>
            )}
          </button>

          <button
            className={`sidebar-nav-item ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => handleTabClick('profile')}
            aria-label="Profil"
          >
            <div className={`nav-avatar-ring ${activeTab === 'profile' ? 'ring-active' : ''}`}>
              <img
                src={profile.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100'}
                alt={profile.displayName}
                className="nav-avatar-img"
              />
            </div>
            <span className="nav-label">Profil</span>
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-alone-card">
            <Sparkles size={14} className="alone-sparkle" />
            <div className="alone-text">
              <span className="alone-title">Réseau privé</span>
              <span className="alone-sub">Zéro follower. Zéro pression.</span>
            </div>
          </div>

          <button className="sidebar-theme-toggle" onClick={() => { sound.playTap(); onToggleTheme(); }}>
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            <span>{theme === 'dark' ? 'Mode clair' : 'Mode sombre'}</span>
          </button>

          <button className="desktop-create-btn" onClick={handleCreateClick}>
            <Plus size={16} strokeWidth={2.5} />
            <span>Nouveau souvenir</span>
          </button>
        </div>
      </aside>

      {/* Floating Island Navigation Dock for Mobile (< 768px) */}
      <div className="mobile-floating-dock-container">
        <nav className="mobile-floating-dock">
          <button
            className={`dock-item ${activeTab === 'home' ? 'active' : ''}`}
            onClick={() => handleTabClick('home')}
            aria-label="Flux"
          >
            <Home size={22} strokeWidth={activeTab === 'home' ? 2.4 : 1.6} />
            {activeTab === 'home' && <span className="dock-active-glow" />}
          </button>

          <button
            className={`dock-item ${activeTab === 'reels' ? 'active' : ''}`}
            onClick={() => handleTabClick('reels')}
            aria-label="Reels"
          >
            <Film size={22} strokeWidth={activeTab === 'reels' ? 2.4 : 1.6} />
            {activeTab === 'reels' && <span className="dock-active-glow" />}
          </button>

          {/* Central Capture Button */}
          <button
            className="dock-item dock-create-btn"
            onClick={handleCreateClick}
            aria-label="Créer"
          >
            <div className="dock-create-inner">
              <Plus size={22} strokeWidth={2.5} />
            </div>
          </button>

          <button
            className={`dock-item ${activeTab === 'search' ? 'active' : ''}`}
            onClick={() => handleTabClick('search')}
            aria-label="Explorer"
          >
            <Compass size={22} strokeWidth={activeTab === 'search' ? 2.4 : 1.6} />
            {activeTab === 'search' && <span className="dock-active-glow" />}
          </button>

          <button
            className={`dock-item ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => handleTabClick('profile')}
            aria-label="Profil"
          >
            <div className={`dock-avatar-wrap ${activeTab === 'profile' ? 'ring-active' : ''}`}>
              <img
                src={profile.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100'}
                alt={profile.displayName}
              />
            </div>
          </button>
        </nav>
      </div>
    </>
  );
};
