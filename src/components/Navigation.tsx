import React from 'react';
import { Home, Compass, PlusSquare, Archive, Moon, Sun, Film } from 'lucide-react';
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
      {/* Desktop Sidebar (>= 768px) - Épurée style Instagram */}
      <aside className="desktop-sidebar insta-sidebar">
        <div className="sidebar-top">
          <div className="sidebar-brand" onClick={() => handleTabClick('home')}>
            <div className="sidebar-logo-row">
              <img src="/logo.png" alt="ANTISOCIAL" className="sidebar-brand-logo" />
              <span className="brand-wordmark">ANTISOCIAL</span>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`sidebar-nav-item ${activeTab === 'home' ? 'active' : ''}`}
            onClick={() => handleTabClick('home')}
            aria-label="Fil d'actualité"
          >
            <Home size={22} strokeWidth={activeTab === 'home' ? 2.4 : 1.8} />
            <span className="nav-label">Accueil</span>
          </button>

          <button
            className={`sidebar-nav-item ${activeTab === 'reels' ? 'active' : ''}`}
            onClick={() => handleTabClick('reels')}
            aria-label="Reels"
          >
            <Film size={22} strokeWidth={activeTab === 'reels' ? 2.4 : 1.8} />
            <span className="nav-label">Reels</span>
          </button>

          <button
            className={`sidebar-nav-item ${activeTab === 'search' ? 'active' : ''}`}
            onClick={() => handleTabClick('search')}
            aria-label="Explorer"
          >
            <Compass size={22} strokeWidth={activeTab === 'search' ? 2.4 : 1.8} />
            <span className="nav-label">Explorer</span>
          </button>

          <button
            className="sidebar-nav-item create-action-item"
            onClick={handleCreateClick}
            aria-label="Créer"
          >
            <PlusSquare size={22} strokeWidth={1.8} />
            <span className="nav-label">Créer</span>
          </button>

          <button
            className={`sidebar-nav-item ${activeTab === 'archive' ? 'active' : ''}`}
            onClick={() => handleTabClick('archive')}
            aria-label="Archives"
          >
            <Archive size={22} strokeWidth={activeTab === 'archive' ? 2.4 : 1.8} />
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
          <button className="sidebar-theme-toggle" onClick={() => { sound.playTap(); onToggleTheme(); }}>
            {theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
            <span>{theme === 'dark' ? 'Mode clair' : 'Mode sombre'}</span>
          </button>
        </div>
      </aside>

      {/* Barre de navigation basse Mobile (< 768px) - 5 icônes pures comme Instagram */}
      <div className="mobile-floating-dock-container insta-bottom-bar-wrap">
        <nav className="mobile-floating-dock insta-bottom-bar">
          <button
            className={`dock-item ${activeTab === 'home' ? 'active' : ''}`}
            onClick={() => handleTabClick('home')}
            aria-label="Accueil"
          >
            <Home size={24} strokeWidth={activeTab === 'home' ? 2.4 : 1.7} />
          </button>

          <button
            className={`dock-item ${activeTab === 'search' ? 'active' : ''}`}
            onClick={() => handleTabClick('search')}
            aria-label="Explorer"
          >
            <Compass size={24} strokeWidth={activeTab === 'search' ? 2.4 : 1.7} />
          </button>

          <button
            className="dock-item dock-create-btn"
            onClick={handleCreateClick}
            aria-label="Créer"
          >
            <PlusSquare size={26} strokeWidth={1.8} />
          </button>

          <button
            className={`dock-item ${activeTab === 'reels' ? 'active' : ''}`}
            onClick={() => handleTabClick('reels')}
            aria-label="Reels"
          >
            <Film size={24} strokeWidth={activeTab === 'reels' ? 2.4 : 1.7} />
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
