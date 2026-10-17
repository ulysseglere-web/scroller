import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Camera, 
  Image as ImageIcon, 
  PenTool, 
  MapPin, 
  Heart, 
  Trash2,
  Plus,
  Music,
  Play,
  Pause,
  Upload,
  Search,
  Disc,
  Mic,
  Sparkles
} from 'lucide-react';
import type { PostItem, NoteStyle } from '../types';
import { sound } from '../services/sound';
import { AMBIENT_PRESETS, ambientAudio, type AudioPreset } from '../services/ambientAudio';
import { searchMusic, TRENDING_TRACKS, type MusicTrack } from '../services/musicService';

interface CreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSavePost: (post: PostItem) => void;
  initialFiles?: string[];
  initialMode?: 'media' | 'note';
}

type CaptureMode = 'media' | 'note';

const NOTE_THEMES: { id: NoteStyle['bgTheme']; label: string; bg: string; color: string }[] = [
  { id: 'dark-monochrome', label: 'Noir Charbon', bg: '#09090b', color: '#ffffff' },
  { id: 'midnight-violet', label: 'Obsidienne', bg: '#13111c', color: '#f5f3ff' },
  { id: 'deep-ocean', label: 'Nuit Abyssale', bg: '#08131e', color: '#f0f9ff' },
  { id: 'warm-amber', label: 'Rubis Sombre', bg: '#1c0d0e', color: '#fff1f2' },
];

export const CreateModal: React.FC<CreateModalProps> = ({ 
  isOpen, 
  onClose, 
  onSavePost, 
  initialFiles = [],
  initialMode = 'media'
}) => {
  const [mode, setMode] = useState<CaptureMode>(initialMode);

  // Common fields
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [showLocationInput, setShowLocationInput] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  // Media state (photos / carousel / video)
  const [selectedMediaFiles, setSelectedMediaFiles] = useState<string[]>(initialFiles);
  const [videoUrl, setVideoUrl] = useState<string>('');

  // Audio & Music state
  const [audioTrack, setAudioTrack] = useState<string>('');
  const [audioArtist, setAudioArtist] = useState<string>('');
  const [audioCover, setAudioCover] = useState<string>('');
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [spotifyUrl, setSpotifyUrl] = useState<string>('');
  const [isPreviewingAudio, setIsPreviewingAudio] = useState(false);
  const [previewingTrackId, setPreviewingTrackId] = useState<string | null>(null);

  // Music Picker Drawer State
  const [isMusicDrawerOpen, setIsMusicDrawerOpen] = useState(false);
  const [musicActiveTab, setMusicActiveTab] = useState<'search' | 'upload' | 'ambient'>('search');
  const [musicSearchQuery, setMusicSearchQuery] = useState('');
  const [musicSearchResults, setMusicSearchResults] = useState<MusicTrack[]>(TRENDING_TRACKS);
  const [isSearchingMusic, setIsSearchingMusic] = useState(false);

  const audioFileInputRef = useRef<HTMLInputElement>(null);

  // Note state
  const [noteBody, setNoteBody] = useState('');
  const [noteBg, setNoteBg] = useState<NoteStyle['bgTheme']>('dark-monochrome');

  useEffect(() => {
    if (isOpen) {
      if (initialFiles && initialFiles.length > 0) {
        const isVid = initialFiles.some(f => f.startsWith('blob:') || f.startsWith('data:video/') || f.endsWith('.mp4') || f.endsWith('.mov') || f.endsWith('.webm'));
        if (isVid) {
          setVideoUrl(initialFiles[0]);
          setSelectedMediaFiles([]);
        } else {
          setSelectedMediaFiles(initialFiles);
          setVideoUrl('');
        }
        setMode('media');
      } else if (initialMode) {
        setMode(initialMode);
      }
    }
  }, [isOpen, initialFiles, initialMode]);

  // Camera state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Stop camera when unmounting or switching modes
  const stopLiveCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const stopAudio = () => {
    ambientAudio.stop();
    setIsPreviewingAudio(false);
  };

  useEffect(() => {
    if (!isOpen) {
      stopLiveCamera();
      stopAudio();
    }
  }, [isOpen]);

  const handleSelectPreset = (preset: AudioPreset) => {
    if (audioUrl === preset.id) {
      handleRemoveAudio();
    } else {
      setAudioUrl(preset.id);
      setAudioTrack(preset.name);
      setAudioArtist('Ambiance procédurale');
      setAudioCover('');
      setSpotifyUrl('');
      sound.playTap();
      ambientAudio.play(preset.id, false);
      setIsPreviewingAudio(true);
      setPreviewingTrackId(preset.id);
    }
  };

  const handleSelectMusicTrack = (track: MusicTrack) => {
    sound.playTap();
    setAudioUrl(track.previewUrl);
    setAudioTrack(track.title);
    setAudioArtist(track.artist);
    setAudioCover(track.coverUrl);
    setSpotifyUrl(track.spotifyUrl);
    stopAudio();
    setIsMusicDrawerOpen(false);
  };

  const handlePreviewTrackInList = (track: MusicTrack) => {
    if (previewingTrackId === track.id && isPreviewingAudio) {
      stopAudio();
      setPreviewingTrackId(null);
    } else {
      stopAudio();
      setPreviewingTrackId(track.id);
      ambientAudio.play(track.previewUrl, false);
      setIsPreviewingAudio(true);
    }
  };

  const handleSearchMusic = async (q: string) => {
    setMusicSearchQuery(q);
    if (!q.trim()) {
      setMusicSearchResults(TRENDING_TRACKS);
      return;
    }
    setIsSearchingMusic(true);
    try {
      const results = await searchMusic(q);
      setMusicSearchResults(results);
    } finally {
      setIsSearchingMusic(false);
    }
  };

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileNameClean = file.name.replace(/\.[^/.]+$/, '');
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) {
        const dataUrl = ev.target.result as string;
        setAudioUrl(dataUrl);
        setAudioTrack(fileNameClean);
        setAudioArtist('Piste personnelle');
        setAudioCover('');
        setSpotifyUrl('');
        sound.playPop();
        ambientAudio.play(dataUrl, false);
        setIsPreviewingAudio(true);
        setPreviewingTrackId('custom_upload');
        setIsMusicDrawerOpen(false);
      }
    };
    reader.readAsDataURL(file);
    if (audioFileInputRef.current) audioFileInputRef.current.value = '';
  };

  const handleRemoveAudio = () => {
    stopAudio();
    setAudioUrl('');
    setAudioTrack('');
    setAudioArtist('');
    setAudioCover('');
    setSpotifyUrl('');
    setPreviewingTrackId(null);
  };

  const togglePreview = () => {
    if (!audioUrl) return;
    if (isPreviewingAudio) {
      stopAudio();
    } else {
      ambientAudio.play(audioUrl, false);
      setIsPreviewingAudio(true);
    }
  };

  if (!isOpen) return null;

  // File upload handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (file.type.startsWith('video/')) {
        const url = URL.createObjectURL(file);
        setVideoUrl(url);
      } else {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setSelectedMediaFiles((prev) => [...prev, event.target!.result as string]);
          }
        };
        reader.readAsDataURL(file);
      }
    });

    // Reset input value to allow re-upload of same file if needed
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Live Camera Activation
  const startLiveCamera = async () => {
    stopLiveCamera();
    try {
      const constraints: MediaStreamConstraints = {
        video: { facingMode: 'environment' },
        audio: false,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
        videoPreviewRef.current.play();
      }
      setIsCameraActive(true);
    } catch {
      alert('Impossible d’accéder à la caméra. Vérifiez les autorisations de votre navigateur.');
    }
  };

  // Snapshot Photo from live camera
  const takeSnapshot = () => {
    if (!videoPreviewRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoPreviewRef.current.videoWidth || 640;
    canvas.height = videoPreviewRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoPreviewRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setSelectedMediaFiles((prev) => [...prev, dataUrl]);
      sound.playPop();
    }
    stopLiveCamera();
  };

  const handleSave = () => {
    if (mode === 'media') {
      if (selectedMediaFiles.length === 0 && !videoUrl && !audioUrl) {
        alert('Veuillez ajouter au moins une photo, une vidéo ou un son.');
        return;
      }

      const isVideo = Boolean(videoUrl);
      const isAudioReel = Boolean(audioUrl) && !isVideo;
      const isCarousel = selectedMediaFiles.length > 1;

      const newPost: PostItem = {
        id: `post_${Date.now()}`,
        type: (isVideo || isAudioReel) ? 'reel' : isCarousel ? 'carousel' : 'photo',
        createdAt: new Date().toISOString(),
        caption: caption.trim(),
        mediaUrls: isVideo ? undefined : (selectedMediaFiles.length > 0 ? selectedMediaFiles : (audioCover ? [audioCover] : undefined)),
        videoUrl: isVideo ? videoUrl : undefined,
        audioTrack: audioTrack.trim() || undefined,
        audioArtist: audioArtist.trim() || undefined,
        audioCover: audioCover || undefined,
        audioUrl: audioUrl || undefined,
        spotifyUrl: spotifyUrl || undefined,
        tags: [],
        location: location.trim() || undefined,
        isFavorite,
      };

      sound.playChime();
      onSavePost(newPost);
    } else {
      if (!noteBody.trim()) {
        alert('Veuillez écrire votre pensée.');
        return;
      }

      const newPost: PostItem = {
        id: `post_${Date.now()}`,
        type: 'note',
        createdAt: new Date().toISOString(),
        caption: '',
        noteBody: noteBody.trim(),
        noteStyle: { bgTheme: noteBg, fontSize: 'large' },
        tags: [],
        location: location.trim() || undefined,
        isFavorite,
      };

      sound.playChime();
      onSavePost(newPost);
    }

    stopLiveCamera();
    stopAudio();
    setIsMusicDrawerOpen(false);
    onClose();
  };

  const canPublish = mode === 'media' 
    ? (selectedMediaFiles.length > 0 || Boolean(videoUrl) || Boolean(audioUrl))
    : noteBody.trim().length > 0;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="create-modal-container simplified-creator" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="create-modal-header">
          <button className="btn-close-modal" onClick={onClose} aria-label="Fermer">
            <X size={20} />
          </button>

          {/* Segmented Switch: Média vs Pensée */}
          <div className="creator-segmented-tabs">
            <button
              type="button"
              className={`segmented-tab ${mode === 'media' ? 'active' : ''}`}
              onClick={() => {
                sound.playTap();
                stopLiveCamera();
                setMode('media');
              }}
            >
              <ImageIcon size={15} />
              <span>Média</span>
            </button>
            <button
              type="button"
              className={`segmented-tab ${mode === 'note' ? 'active' : ''}`}
              onClick={() => {
                sound.playTap();
                stopLiveCamera();
                setMode('note');
              }}
            >
              <PenTool size={15} />
              <span>Pensée</span>
            </button>
          </div>

          <button 
            type="button" 
            className="btn-publish-action" 
            onClick={handleSave}
            disabled={!canPublish}
            style={{ opacity: canPublish ? 1 : 0.4 }}
          >
            Publier
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="create-modal-body">
          {/* MODE 1: MEDIA (Photo / Carrousel / Vidéo) */}
          {mode === 'media' && (
            <div className="simple-media-creator">
              {isCameraActive ? (
                <div className="live-camera-view">
                  <video ref={videoPreviewRef} className="live-camera-stream" autoPlay playsInline />
                  <div className="live-camera-controls">
                    <button className="camera-snap-btn" onClick={takeSnapshot} title="Prendre la photo">
                      <div className="camera-snap-inner" />
                    </button>
                    <button className="camera-cancel-btn" onClick={stopLiveCamera}>
                      Annuler
                    </button>
                  </div>
                </div>
              ) : selectedMediaFiles.length === 0 && !videoUrl ? (
                <div className="media-empty-dropzone">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                  />

                  <div className="dropzone-center-content">
                    <div className="dropzone-icon-circle">
                      <ImageIcon size={32} />
                    </div>
                    <h3>Ajouter photos ou vidéo</h3>
                    <p>Vos souvenirs restent 100% privés dans votre sanctuaire.</p>

                    <div className="dropzone-actions-row">
                      <button
                        type="button"
                        className="btn-select-library"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <ImageIcon size={16} />
                        <span>Sélectionner photos / vidéo</span>
                      </button>

                      <button
                        type="button"
                        className="btn-direct-camera"
                        onClick={startLiveCamera}
                      >
                        <Camera size={16} />
                        <span>Caméra</span>
                      </button>

                      <button
                        type="button"
                        className="btn-select-audio-trigger"
                        onClick={() => {
                          sound.playTap();
                          setMusicActiveTab('upload');
                          setIsMusicDrawerOpen(true);
                        }}
                      >
                        <Mic size={16} />
                        <span>Mon son (WAV / MP3)</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="media-preview-deck">
                  {/* Vidéo sélectionnée */}
                  {videoUrl && (
                    <div className="video-preview-wrapper">
                      <video src={videoUrl} controls playsInline className="video-preview-element" />
                      <button 
                        type="button" 
                        className="btn-remove-media" 
                        onClick={() => {
                          setVideoUrl('');
                          if (!selectedMediaFiles.length) {
                            handleRemoveAudio();
                          }
                        }}
                        title="Supprimer la vidéo"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}

                  {/* Panneau Audio Universel (Vidéo OU Photos/Reel Audio) */}
                  <div className="reel-audio-config-panel">
                    {audioUrl ? (
                      <div className="selected-audio-card">
                        <div className="selected-audio-left" onClick={() => setIsMusicDrawerOpen(true)}>
                          <div className="selected-audio-cover">
                            {audioCover ? (
                              <img src={audioCover} alt="Cover" />
                            ) : (
                              <Disc size={22} className="spinning-disc-icon" />
                            )}
                          </div>
                          <div className="selected-audio-info">
                            <span className="selected-audio-title">{audioTrack || 'Morceau sélectionné'}</span>
                            <span className="selected-audio-artist">{audioArtist || 'Piste audio'}</span>
                          </div>
                        </div>

                        <div className="selected-audio-actions">
                          <button
                            type="button"
                            className={`btn-preview-audio ${isPreviewingAudio ? 'playing' : ''}`}
                            onClick={togglePreview}
                            title={isPreviewingAudio ? 'Arrêter la pré-écoute' : 'Écouter'}
                          >
                            {isPreviewingAudio ? <Pause size={13} /> : <Play size={13} fill="#ffffff" />}
                          </button>

                          <button
                            type="button"
                            className="btn-change-audio"
                            onClick={() => {
                              sound.playTap();
                              setIsMusicDrawerOpen(true);
                            }}
                            title="Changer de musique"
                          >
                            Changer
                          </button>

                          <button
                            type="button"
                            className="btn-remove-audio"
                            onClick={handleRemoveAudio}
                            title="Supprimer la bande-son"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="btn-trigger-music-picker"
                        onClick={() => {
                          sound.playTap();
                          setIsMusicDrawerOpen(true);
                        }}
                      >
                        <Music size={16} className="text-crimson" />
                        <div className="trigger-music-text">
                          <span className="trigger-music-title">Ajouter une musique ou un son</span>
                          <span className="trigger-music-sub">Recherche Spotify / Deezer ou vos fichiers WAV / MP3</span>
                        </div>
                        <Plus size={16} />
                      </button>
                    )}
                  </div>

                  {/* Photos / Carrousel */}
                  {selectedMediaFiles.length > 0 && (
                    <div className="photos-preview-strip">
                      <div className="photos-thumb-gallery">
                        {selectedMediaFiles.map((url, i) => (
                          <div key={i} className="photo-thumb-card">
                            <img src={url} alt={`Aperçu ${i + 1}`} />
                            <button
                              type="button"
                              className="btn-remove-thumb"
                              onClick={() => {
                                sound.playPop();
                                setSelectedMediaFiles((prev) => prev.filter((_, idx) => idx !== i));
                              }}
                              title="Retirer"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}

                        <button
                          type="button"
                          className="btn-add-more-thumb"
                          onClick={() => fileInputRef.current?.click()}
                          title="Ajouter d'autres photos pour créer un carrousel"
                        >
                          <Plus size={20} />
                          <span>Ajouter</span>
                        </button>
                      </div>

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        style={{ display: 'none' }}
                        onChange={handleFileChange}
                      />
                    </div>
                  )}

                  {/* Légende épurée type Instagram */}
                  <div className="caption-input-block">
                    <textarea
                      placeholder="Écrire une légende..."
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      rows={3}
                      className="clean-caption-textarea"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* MODE 2: NOTE (Pensée libre) */}
          {mode === 'note' && (
            <div className="simple-note-creator">
              <div 
                className="note-freeform-canvas"
                style={{ 
                  backgroundColor: NOTE_THEMES.find(t => t.id === noteBg)?.bg || '#09090b',
                  color: NOTE_THEMES.find(t => t.id === noteBg)?.color || '#ffffff'
                }}
              >
                <textarea
                  className="note-freeform-textarea"
                  placeholder="Une pensée, une idée, un fragment..."
                  value={noteBody}
                  onChange={(e) => setNoteBody(e.target.value)}
                  rows={6}
                  autoFocus
                />
              </div>

              {/* Sélecteur de nuance de fond discret */}
              <div className="note-palette-selector">
                <span className="palette-label">Ambiance</span>
                <div className="palette-dots-row">
                  {NOTE_THEMES.map((theme) => (
                    <button
                      key={theme.id}
                      type="button"
                      className={`palette-dot ${noteBg === theme.id ? 'active' : ''}`}
                      style={{ backgroundColor: theme.bg }}
                      onClick={() => setNoteBg(theme.id)}
                      title={theme.label}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Barre d'options légères (Lieu + Favori) */}
          <div className="creator-sub-toolbar">
            <div className="sub-tools-left">
              {showLocationInput ? (
                <div className="location-inline-input">
                  <MapPin size={14} className="location-pin-icon" />
                  <input
                    type="text"
                    placeholder="Lieu (ex: Paris, Chez moi...)"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    autoFocus
                  />
                  <button 
                    type="button" 
                    className="btn-clear-loc"
                    onClick={() => {
                      setLocation('');
                      setShowLocationInput(false);
                    }}
                  >
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className={`sub-tool-btn ${location ? 'has-val' : ''}`}
                  onClick={() => setShowLocationInput(true)}
                >
                  <MapPin size={15} />
                  <span>{location || 'Ajouter un lieu'}</span>
                </button>
              )}
            </div>

            <button
              type="button"
              className={`btn-toggle-favorite-sub ${isFavorite ? 'favorited' : ''}`}
              onClick={() => {
                sound.playHeart();
                setIsFavorite(!isFavorite);
              }}
              title={isFavorite ? 'Retirer des favoris' : 'Marquer comme favori'}
            >
              <Heart size={16} fill={isFavorite ? '#ff1e27' : 'none'} color={isFavorite ? '#ff1e27' : '#94a3b8'} />
              <span>Favori</span>
            </button>
          </div>
        </div>
      </div>

      {/* Drawer / Tiroir de Recherche Musicale et Import Audio */}
      {isMusicDrawerOpen && (
        <div className="modal-backdrop sub-drawer-backdrop" onClick={() => setIsMusicDrawerOpen(false)}>
          <div className="music-picker-drawer-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <div className="music-drawer-title-row">
                <Music size={18} className="text-crimson" />
                <h3>Choisir un son</h3>
              </div>
              <button 
                type="button" 
                className="btn-close-modal" 
                onClick={() => {
                  stopAudio();
                  setIsMusicDrawerOpen(false);
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Onglets sélecteur de son */}
            <div className="music-drawer-tabs">
              <button
                type="button"
                className={`music-tab-btn ${musicActiveTab === 'search' ? 'active' : ''}`}
                onClick={() => {
                  sound.playTap();
                  setMusicActiveTab('search');
                }}
              >
                <Search size={14} />
                <span>Tendances & Recherche</span>
              </button>

              <button
                type="button"
                className={`music-tab-btn ${musicActiveTab === 'upload' ? 'active' : ''}`}
                onClick={() => {
                  sound.playTap();
                  setMusicActiveTab('upload');
                }}
              >
                <Mic size={14} />
                <span>Studio Musicien (WAV/MP3)</span>
              </button>

              <button
                type="button"
                className={`music-tab-btn ${musicActiveTab === 'ambient' ? 'active' : ''}`}
                onClick={() => {
                  sound.playTap();
                  setMusicActiveTab('ambient');
                }}
              >
                <Sparkles size={14} />
                <span>Ambiances Chill</span>
              </button>
            </div>

            {/* ONGLET 1: RECHERCHE ITUNES / SPOTIFY */}
            {musicActiveTab === 'search' && (
              <div className="music-tab-content search-tab">
                <div className="music-search-bar-wrap">
                  <Search size={16} className="search-input-icon" />
                  <input
                    type="text"
                    className="music-search-field"
                    placeholder="Rechercher Daft Punk, The Weeknd, Drake, Jul..."
                    value={musicSearchQuery}
                    onChange={(e) => handleSearchMusic(e.target.value)}
                    autoFocus
                  />
                  {musicSearchQuery && (
                    <button
                      type="button"
                      className="btn-clear-music-search"
                      onClick={() => handleSearchMusic('')}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                <div className="music-results-scroll-list">
                  {isSearchingMusic ? (
                    <div className="music-loading-state">
                      <div className="loading-spinner-circle" />
                      <span>Recherche dans le catalogue mondial...</span>
                    </div>
                  ) : musicSearchResults.length === 0 ? (
                    <div className="music-empty-results">
                      <p>Aucun morceau trouvé pour "{musicSearchQuery}".</p>
                      <span className="empty-sub">Essayez avec un nom d'artiste ou titre simplifié.</span>
                    </div>
                  ) : (
                    musicSearchResults.map((track) => {
                      const isThisPreviewing = previewingTrackId === track.id && isPreviewingAudio;
                      return (
                        <div key={track.id} className="music-track-row-item">
                          <div className="track-cover-square" onClick={() => handlePreviewTrackInList(track)}>
                            <img src={track.coverUrl} alt={track.title} />
                            <div className={`track-cover-play-overlay ${isThisPreviewing ? 'active' : ''}`}>
                              {isThisPreviewing ? <Pause size={16} fill="#ffffff" /> : <Play size={16} fill="#ffffff" />}
                            </div>
                          </div>

                          <div className="track-info-col" onClick={() => handlePreviewTrackInList(track)}>
                            <span className="track-name-bold">{track.title}</span>
                            <span className="track-artist-sub">{track.artist}</span>
                          </div>

                          <div className="track-actions-col">
                            <button
                              type="button"
                              className="btn-select-track"
                              onClick={() => handleSelectMusicTrack(track)}
                            >
                              Choisir
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* ONGLET 2: STUDIO MUSICIEN (IMPORT FICHIER AUDIO WAV/MP3) */}
            {musicActiveTab === 'upload' && (
              <div className="music-tab-content upload-tab">
                <div className="musician-upload-banner">
                  <div className="musician-icon-badge">
                    <Disc size={28} />
                  </div>
                  <h4>Espace Créateur & Musicien</h4>
                  <p>
                    Importez votre propre composition, voix, démo ou production en haute qualité (WAV, MP3, AAC, FLAC).
                  </p>

                  <button
                    type="button"
                    className="btn-musician-upload-file"
                    onClick={() => audioFileInputRef.current?.click()}
                  >
                    <Upload size={18} />
                    <span>Sélectionner un fichier WAV ou MP3</span>
                  </button>

                  <input
                    ref={audioFileInputRef}
                    type="file"
                    accept="audio/*,.wav,.mp3,.m4a,.aac,.flac,.ogg"
                    style={{ display: 'none' }}
                    onChange={handleAudioUpload}
                  />
                </div>

                <div className="musician-tips-box">
                  <h5>💡 Bon à savoir :</h5>
                  <ul>
                    <li>Si vous avez filmé une vidéo en train de chanter, laissez le son original du clip sans musique pour que votre voix résonne purement.</li>
                    <li>Si vous n'avez qu'un fichier audio sans vidéo, vous pouvez ajouter une photo ou pochette : votre son deviendra un Reel avec vinyle tournant !</li>
                  </ul>
                </div>
              </div>
            )}

            {/* ONGLET 3: AMBIANCES WEB AUDIO PROCEDURALES */}
            {musicActiveTab === 'ambient' && (
              <div className="music-tab-content ambient-tab">
                <p className="ambient-tab-desc">
                  Générateurs sonores procéduraux 100% hors-ligne créés par synthèse en temps réel.
                </p>
                <div className="ambient-presets-grid">
                  {AMBIENT_PRESETS.map((preset) => {
                    const isSelected = audioUrl === preset.id;
                    const isThisPreviewing = previewingTrackId === preset.id && isPreviewingAudio;
                    return (
                      <div 
                        key={preset.id} 
                        className={`ambient-preset-card ${isSelected ? 'active' : ''}`}
                        onClick={() => handleSelectPreset(preset)}
                      >
                        <div className="ambient-card-left">
                          <span className="preset-card-name">{preset.name}</span>
                          <span className="preset-card-desc">{preset.description}</span>
                        </div>
                        <div className="ambient-card-right">
                          <button
                            type="button"
                            className={`btn-ambient-play ${isThisPreviewing ? 'playing' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectPreset(preset);
                            }}
                          >
                            {isThisPreviewing ? <Pause size={14} /> : <Play size={14} fill="#ffffff" />}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
