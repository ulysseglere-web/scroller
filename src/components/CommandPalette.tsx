import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Film, 
  Home, 
  Compass, 
  Archive, 
  User, 
  Plus, 
  Sparkles, 
  Moon, 
  Sun, 
  Volume2, 
  VolumeX, 
  Download, 
  CornerDownLeft, 
  X,
  FileText
} from 'lucide-react';
import type { PostItem, NavTab, FeedFilter } from '../types';
import { sound } from '../services/sound';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  posts: PostItem[];
  onNavigate: (tab: NavTab) => void;
  onSelectFilter: (filter: FeedFilter) => void;
  onOpenCreate: () => void;
  onOpenRandomMemory: () => void;
  onToggleTheme: () => void;
  theme: 'dark' | 'light';
  onExport: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  posts,
  onNavigate,
  onSelectFilter,
  onOpenCreate,
  onOpenRandomMemory,
  onToggleTheme,
  theme,
  onExport,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(sound.getEnabled());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      sound.playPop();
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const handleToggleSound = () => {
    const next = sound.toggle();
    setSoundEnabled(next);
  };

  // Compile list of actions & matching posts
  const q = query.trim().toLowerCase();

  const standardActions = [
    {
      id: 'nav-home',
      group: 'Navigation',
      title: 'Flux Principal',
      sub: 'Tous vos souvenirs et notes',
      icon: <Home size={16} />,
      action: () => { onNavigate('home'); onSelectFilter('all'); onClose(); },
    },
    {
      id: 'nav-reels',
      group: 'Navigation',
      title: 'Reels 9:16',
      sub: 'Lecteur vertical immersif',
      icon: <Film size={16} />,
      action: () => { onNavigate('reels'); onClose(); },
    },
    {
      id: 'nav-search',
      group: 'Navigation',
      title: 'Explorer & Médias',
      sub: 'Galerie visuelle 3 colonnes',
      icon: <Compass size={16} />,
      action: () => { onNavigate('search'); onClose(); },
    },
    {
      id: 'nav-profile',
      group: 'Navigation',
      title: 'Mon Profil & Stories',
      sub: 'Archives personnelles et à la une',
      icon: <User size={16} />,
      action: () => { onNavigate('profile'); onClose(); },
    },
    {
      id: 'nav-archive',
      group: 'Navigation',
      title: 'Coffre-fort des Archives',
      sub: 'Souvenirs dissimulés',
      icon: <Archive size={16} />,
      action: () => { onNavigate('archive'); onClose(); },
    },
    {
      id: 'act-create',
      group: 'Actions',
      title: 'Capturer un souvenir',
      sub: 'Photo, Reel 9:16, note ou citation',
      icon: <Plus size={16} />,
      action: () => { onOpenCreate(); onClose(); },
    },
    {
      id: 'act-random',
      group: 'Actions',
      title: 'Souvenir aléatoire',
      sub: 'Faire ressurgir un instant passé',
      icon: <Sparkles size={16} />,
      action: () => { onOpenRandomMemory(); onClose(); },
    },
    {
      id: 'act-sound',
      group: 'Système',
      title: soundEnabled ? 'Couper les sons d’interaction' : 'Activer les sons d’interaction (Web Audio)',
      sub: soundEnabled ? 'Actuellement : Actif' : 'Actuellement : Silencieux',
      icon: soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />,
      action: () => { handleToggleSound(); },
    },
    {
      id: 'act-theme',
      group: 'Système',
      title: theme === 'dark' ? 'Basculer en Mode Clair' : 'Basculer en Mode Sombre OLED',
      sub: `Actuellement : ${theme === 'dark' ? 'OLED Noir' : 'Clair'}`,
      icon: theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />,
      action: () => { onToggleTheme(); },
    },
    {
      id: 'act-export',
      group: 'Système',
      title: 'Sauvegarder mes données (JSON)',
      sub: 'Export complet de la base IndexedDB',
      icon: <Download size={16} />,
      action: () => { onExport(); onClose(); },
    },
  ];

  // Filter actions
  const filteredActions = standardActions.filter(
    (a) => a.title.toLowerCase().includes(q) || a.sub.toLowerCase().includes(q) || a.group.toLowerCase().includes(q)
  );

  // Filter posts
  const matchingPosts = q ? posts.filter((p) => {
    const text = `${p.caption || ''} ${p.noteBody || ''} ${p.quoteData?.quote || ''} ${p.tags?.join(' ') || ''}`.toLowerCase();
    return text.includes(q);
  }).slice(0, 5) : [];

  const allItems = [
    ...filteredActions.map((a) => ({ type: 'action' as const, data: a })),
    ...matchingPosts.map((p) => ({
      type: 'post' as const,
      data: {
        id: `post-${p.id}`,
        group: 'Souvenirs trouvés',
        title: p.caption || p.noteBody?.slice(0, 40) || p.quoteData?.quote.slice(0, 40) || 'Souvenir sans titre',
        sub: `${new Date(p.createdAt).toLocaleDateString('fr-FR')} · ${p.type.toUpperCase()}`,
        icon: <FileText size={16} />,
        action: () => {
          onNavigate('home');
          onClose();
        },
      },
    })),
  ];

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        sound.playTap();
        setSelectedIndex((prev) => (allItems.length ? (prev + 1) % allItems.length : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        sound.playTap();
        setSelectedIndex((prev) => (allItems.length ? (prev - 1 + allItems.length) % allItems.length : 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (allItems[selectedIndex]) {
          sound.playSwitch();
          allItems[selectedIndex].data.action();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, allItems, onClose]);

  if (!isOpen) return null;

  return (
    <div className="cmd-backdrop" onClick={onClose}>
      <div className="cmd-palette-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cmd-input-row">
          <Search size={18} className="cmd-search-icon" />
          <input
            ref={inputRef}
            type="text"
            className="cmd-input"
            placeholder="Rechercher ou commander... (⌘K / Ctrl+K)"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
          />
          <button className="cmd-close-btn" onClick={onClose} aria-label="Fermer">
            <X size={16} />
          </button>
        </div>

        <div className="cmd-results-list">
          {allItems.length === 0 ? (
            <div className="cmd-empty-state">
              <span>Aucun résultat pour "{query}"</span>
            </div>
          ) : (
            allItems.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.data.id}
                  className={`cmd-item ${isSelected ? 'selected' : ''}`}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  onClick={() => {
                    sound.playSwitch();
                    item.data.action();
                  }}
                >
                  <div className="cmd-item-icon">{item.data.icon}</div>
                  <div className="cmd-item-info">
                    <span className="cmd-item-title">{item.data.title}</span>
                    <span className="cmd-item-sub">{item.data.sub}</span>
                  </div>
                  {isSelected && (
                    <div className="cmd-item-shortcut">
                      <CornerDownLeft size={13} />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="cmd-footer">
          <div className="cmd-footer-keys">
            <span><kbd>↑</kbd> <kbd>↓</kbd> Naviguer</span>
            <span><kbd>↵</kbd> Choisir</span>
            <span><kbd>ESC</kbd> Fermer</span>
          </div>
          <span className="cmd-footer-badge">SCROLLER // SOLO MODE</span>
        </div>
      </div>
    </div>
  );
};
