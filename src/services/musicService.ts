// Service universel de recherche musicale et streaming d'extraits officiels (30s)
// Compatible Cloudflare Workers API avec fallback direct iTunes/Apple Music

export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  coverUrl: string;
  previewUrl: string;
  spotifyUrl: string;
}

// Musiques populaires par défaut pour une sélection immédiate sans saisie
export const TRENDING_TRACKS: MusicTrack[] = [
  {
    id: 'itunes_697194953',
    title: 'Get Lucky (feat. Pharrell Williams)',
    artist: 'Daft Punk',
    album: 'Random Access Memories',
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/a2/47/ec/a247ecae-aa17-a068-18e4-733d3ab2cb92/886443927087.jpg/600x600bb.jpg',
    previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/91/9f/c6/919fc6b9-9a8d-2947-f370-dfd35b91b8a5/mzaf_16480111166645329712.plus.aac.p.m4a',
    spotifyUrl: 'https://open.spotify.com/search/Daft%20Punk%20Get%20Lucky',
  },
  {
    id: 'itunes_1440833933',
    title: 'Blinding Lights',
    artist: 'The Weeknd',
    album: 'After Hours',
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/28/6c/eb/286ceb13-8eb0-b6ab-1d1d-c01df227221e/20UMGIM08436.rgb.jpg/600x600bb.jpg',
    previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/e5/22/e1/e522e171-ec3f-2980-df8d-71b31a316ebc/mzaf_10444319859571999245.plus.aac.p.m4a',
    spotifyUrl: 'https://open.spotify.com/search/The%20Weeknd%20Blinding%20Lights',
  },
  {
    id: 'itunes_1440841364',
    title: 'bad guy',
    artist: 'Billie Eilish',
    album: 'WHEN WE ALL FALL ASLEEP, WHERE DO WE GO?',
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/74/48/48/7448483f-4e94-c15c-6b30-c3d386927d2c/19UMGIM22201.rgb.jpg/600x600bb.jpg',
    previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/44/78/3f/44783f9d-16f5-06d2-f472-7634f1ecb20b/mzaf_11304918512140502120.plus.aac.p.m4a',
    spotifyUrl: 'https://open.spotify.com/search/Billie%20Eilish%20bad%20guy',
  },
  {
    id: 'itunes_1440833989',
    title: 'Levitating',
    artist: 'Dua Lipa',
    album: 'Future Nostalgia',
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/6b/ba/e3/6bbae3ba-06f1-ebdb-1606-d748805f15c7/0190295286101.jpg/600x600bb.jpg',
    previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/91/9f/c6/919fc6b9-9a8d-2947-f370-dfd35b91b8a5/mzaf_16480111166645329712.plus.aac.p.m4a',
    spotifyUrl: 'https://open.spotify.com/search/Dua%20Lipa%20Levitating',
  },
  {
    id: 'itunes_1440833990',
    title: 'Midnight City',
    artist: 'M83',
    album: 'Hurry Up, We\'re Dreaming',
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/1f/26/50/1f2650ee-dc5a-a38f-a9cb-b0ecfa329b39/0724596951253.jpg/600x600bb.jpg',
    previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/0c/b5/46/0cb546c1-dbf6-590f-d4ad-863a92548cb4/mzaf_9956402484646738914.plus.aac.p.m4a',
    spotifyUrl: 'https://open.spotify.com/search/M83%20Midnight%20City',
  },
];

export async function searchMusic(query: string): Promise<MusicTrack[]> {
  const clean = query.trim();
  if (!clean) return TRENDING_TRACKS;

  // 1. Essai via l'API Edge Cloudflare du Worker
  try {
    const res = await fetch(`/api/music/search?q=${encodeURIComponent(clean)}`);
    if (res.ok) {
      const data = await res.json() as { results: MusicTrack[] };
      if (Array.isArray(data.results) && data.results.length > 0) {
        return data.results;
      }
    }
  } catch {
    // Fallback direct ci-dessous
  }

  // 2. Fallback direct iTunes Search API (supporte CORS nativement)
  try {
    const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(clean)}&entity=song&limit=20`;
    const res = await fetch(itunesUrl);
    if (!res.ok) return [];

    const data = await res.json() as {
      results: Array<{
        trackId: number;
        trackName: string;
        artistName: string;
        collectionName?: string;
        artworkUrl100?: string;
        previewUrl?: string;
      }>;
    };

    return (data.results || [])
      .filter((item) => Boolean(item.previewUrl))
      .map((item) => ({
        id: String(item.trackId),
        title: item.trackName,
        artist: item.artistName,
        album: item.collectionName || '',
        coverUrl: item.artworkUrl100 ? item.artworkUrl100.replace('100x100bb', '600x600bb') : '',
        previewUrl: item.previewUrl!,
        spotifyUrl: `https://open.spotify.com/search/${encodeURIComponent(`${item.artistName} ${item.trackName}`)}`,
      }));
  } catch (err) {
    console.warn('Erreur recherche musicale fallback iTunes:', err);
    return [];
  }
}
