import type { PostItem, UserProfile } from '../types';

export const DEFAULT_PROFILE: UserProfile = {
  username: 'ulysse',
  displayName: 'Ulysse',
  bio: 'The social media where you’re alone.\nArchives personnelles, fragments de pensée et captures silencieuses.',
  avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
  theme: 'dark',
  joinedAt: '2026-01-01T08:00:00.000Z',
  highlights: [
    {
      id: 'hl-field',
      title: '01 / FIELD',
      coverUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=200&auto=format&fit=crop&q=80',
      stories: [
        {
          id: 'story-1',
          mediaUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1080&auto=format&fit=crop&q=85',
          type: 'image',
          caption: 'Horizon silencieux. Aucune notification.',
          createdAt: '2026-09-12T07:15:00.000Z',
        },
        {
          id: 'story-2',
          mediaUrl: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1080&auto=format&fit=crop&q=85',
          type: 'image',
          caption: 'Brume matinale sans public.',
          createdAt: '2026-09-14T11:30:00.000Z',
        }
      ]
    },
    {
      id: 'hl-notes',
      title: '02 / NOTES',
      coverUrl: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=200&auto=format&fit=crop&q=80',
      stories: [
        {
          id: 'story-3',
          mediaUrl: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=1080&auto=format&fit=crop&q=85',
          type: 'image',
          caption: 'La clarté naît du retrait du bruit.',
          createdAt: '2026-10-01T21:40:00.000Z',
        }
      ]
    },
    {
      id: 'hl-readings',
      title: '03 / TEXTS',
      coverUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=200&auto=format&fit=crop&q=80',
      stories: [
        {
          id: 'story-4',
          mediaUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1080&auto=format&fit=crop&q=85',
          type: 'image',
          caption: '« L’âme se colore de ses pensées. »',
          createdAt: '2026-10-05T17:15:00.000Z',
        }
      ]
    },
    {
      id: 'hl-clips',
      title: '04 / MOTION',
      coverUrl: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=200&auto=format&fit=crop&q=80',
      stories: [
        {
          id: 'story-5',
          mediaUrl: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=1080&auto=format&fit=crop&q=85',
          type: 'image',
          caption: 'Nuit, ville, silence.',
          createdAt: '2026-10-10T23:00:00.000Z',
        }
      ]
    }
  ]
};

export const STARTER_POSTS: PostItem[] = [
  // 1. Reel 1: Waves / Solitude
  {
    id: 'starter-reel-1',
    type: 'reel',
    createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    caption: 'La mer n’a pas besoin de spectateurs pour exister. Respirer.',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-vertical-aerial-view-of-waves-crashing-on-the-shoreline-41680-large.mp4',
    mediaUrls: [
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80'
    ],
    audioTrack: 'Océan & Vent Brut',
    tags: ['solitude', 'ocean', 'respiration'],
    location: 'Côte Ouest',
    isFavorite: true,
  },
  // 2. Photo Carousel: Architecture & Valley
  {
    id: 'starter-1',
    type: 'carousel',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    caption: 'Lumière rasante sur les lignes de crête. Rien à prouver, rien à publier pour autrui.',
    mediaUrls: [
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1000&auto=format&fit=crop&q=85',
      'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1000&auto=format&fit=crop&q=85',
      'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1000&auto=format&fit=crop&q=85'
    ],
    tags: ['lignes', 'lumiere', 'silence'],
    location: 'Vallée Haute',
    isPinned: true,
    isFavorite: true,
    privateAnnotation: 'Garder cette sensation de clarté pour les semaines intenses.',
  },
  // 3. Spontaneous Note: Stark Philosophy
  {
    id: 'starter-3',
    type: 'note',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 14).toISOString(),
    caption: 'Note de travail.',
    noteBody: 'Les choses qui ont une réelle valeur ne réclament pas d’applaudissements.\n\nCréer pour soi est le seul moyen de rester honnête.',
    noteStyle: {
      bgTheme: 'dark-monochrome',
      fontSize: 'large',
    },
    tags: ['focus', 'verite', 'discipline'],
    isFavorite: true,
    privateAnnotation: 'À relire avant chaque grand projet.',
  },
  // 4. Reel 2: Night City
  {
    id: 'starter-reel-2',
    type: 'reel',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 22).toISOString(),
    caption: '02:40 AM. La ville dort, le travail avance dans le calme.',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-vertical-view-of-a-rainy-city-at-night-41584-large.mp4',
    mediaUrls: [
      'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=800&auto=format&fit=crop&q=80'
    ],
    audioTrack: 'Pluie & Synthèse Noire',
    tags: ['nuit', 'studio', 'solitude'],
    location: 'Atelier',
    isFavorite: false,
  },
  // 5. Quote: Marcus Aurelius
  {
    id: 'starter-2',
    type: 'quote',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
    caption: 'Ancrage stoïcien.',
    quoteData: {
      quote: 'Creuse au-dedans de toi. C’est là qu’est la source du bien, et elle peut jaillir sans cesse, si tu creuses toujours.',
      author: 'Marc Aurèle',
      source: 'Pensées pour moi-même, VII, 59',
      page: 'Livre VII',
      reflection: 'Ne rien attendre de l’extérieur. La source est intérieure.',
    },
    tags: ['stoicisme', 'intériorite'],
    isFavorite: true,
  },
  // 6. Link: Finite Time
  {
    id: 'starter-6',
    type: 'link',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 60).toISOString(),
    caption: 'Rappel essentiel sur la finitude de l’attention.',
    linkData: {
      url: 'https://waitbutwhy.com/2015/12/the-tail-end.html',
      title: 'The Tail End — Tim Urban',
      domain: 'waitbutwhy.com',
      description: 'Une visualisation directe du temps restant avec les êtres essentiels.',
      image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80',
    },
    tags: ['temps', 'finitude'],
    isFavorite: true,
  }
];
