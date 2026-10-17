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
  Upload
} from 'lucide-react';
import type { PostItem, NoteStyle } from '../types';
import { sound } from '../services/sound';
import { AMBIENT_PRESETS, ambientAudio, type AudioPreset } from '../services/ambientAudio';

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

  // Audio state for Reels / Videos
  const [audioTrack, setAudioTrack] = useState<string>('');
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [isPreviewingAudio, setIsPreviewingAudio] = useState(false);
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
      setAudioUrl('');
      setAudioTrack('');
      stopAudio();
    } else {
      setAudioUrl(preset.id);
      setAudioTrack(preset.name);
      sound.playTap();
      ambientAudio.play(preset.id, false);
      setIsPreviewingAudio(true);
    }
  };

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) {
        const dataUrl = ev.target.result as string;
        setAudioUrl(dataUrl);
        setAudioTrack(file.name.replace(/\.[^/.]+$/, ''));
        sound.playPop();
        ambientAudio.play(dataUrl, false);
        setIsPreviewingAudio(true);
      }
    };
    reader.readAsDataURL(file);
    if (audioFileInputRef.current) audioFileInputRef.current.value = '';
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
      if (selectedMediaFiles.length === 0 && !videoUrl) {
        alert('Veuillez ajouter au moins une photo ou une vidéo.');
        return;
      }

      const isVideo = Boolean(videoUrl);
      const isCarousel = selectedMediaFiles.length > 1;

      const newPost: PostItem = {
        id: `post_${Date.now()}`,
        type: isVideo ? 'reel' : isCarousel ? 'carousel' : 'photo',
        createdAt: new Date().toISOString(),
        caption: caption.trim(),
        mediaUrls: isVideo ? undefined : selectedMediaFiles,
        videoUrl: isVideo ? videoUrl : undefined,
        audioTrack: isVideo ? (audioTrack.trim() || undefined) : undefined,
        audioUrl: isVideo ? (audioUrl || undefined) : undefined,
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
    onClose();
  };

  const canPublish = mode === 'media' 
    ? (selectedMediaFiles.length > 0 || Boolean(videoUrl))
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
                        <span>Sélectionner sur l'appareil</span>
                      </button>

                      <button
                        type="button"
                        className="btn-direct-camera"
                        onClick={startLiveCamera}
                      >
                        <Camera size={16} />
                        <span>Prendre une photo</span>
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
                          setAudioUrl('');
                          setAudioTrack('');
                          stopAudio();
                        }}
                        title="Supprimer la vidéo"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}

                  {/* Panneau Audio & Bande-son pour Reel/Vidéo */}
                  {videoUrl && (
                    <div className="reel-audio-config-panel">
                      <div className="audio-config-header">
                        <div className="audio-header-title">
                          <Music size={16} className="text-crimson" />
                          <span>Bande-son du Reel</span>
                        </div>
                        {audioUrl && (
                          <button
                            type="button"
                            className={`btn-preview-audio ${isPreviewingAudio ? 'playing' : ''}`}
                            onClick={togglePreview}
                            title={isPreviewingAudio ? 'Arrêter la pré-écoute' : 'Écouter'}
                          >
                            {isPreviewingAudio ? <Pause size={13} /> : <Play size={13} fill="#ffffff" />}
                            <span>{isPreviewingAudio ? 'Arrêter' : 'Écouter'}</span>
                          </button>
                        )}
                      </div>

                      {/* Ambiances sonores intégrées */}
                      <div className="audio-presets-pills">
                        {AMBIENT_PRESETS.map((preset) => (
                          <button
                            key={preset.id}
                            type="button"
                            className={`audio-preset-pill ${audioUrl === preset.id ? 'active' : ''}`}
                            onClick={() => handleSelectPreset(preset)}
                            title={preset.description}
                          >
                            <span>{preset.name}</span>
                          </button>
                        ))}

                        {/* Import MP3 / Audio personnel */}
                        <button
                          type="button"
                          className={`audio-preset-pill upload-audio-btn ${audioUrl && !audioUrl.startsWith('preset:') ? 'active' : ''}`}
                          onClick={() => audioFileInputRef.current?.click()}
                          title="Importer un fichier audio MP3 / WAV depuis l'appareil"
                        >
                          <Upload size={12} />
                          <span>{audioUrl && !audioUrl.startsWith('preset:') ? 'Fichier importé' : 'Mon audio (MP3)'}</span>
                        </button>
                        <input
                          ref={audioFileInputRef}
                          type="file"
                          accept="audio/*"
                          style={{ display: 'none' }}
                          onChange={handleAudioUpload}
                        />
                      </div>

                      {/* Titre affiché de la piste */}
                      <div className="audio-track-name-input-wrap">
                        <input
                          type="text"
                          className="audio-track-input"
                          placeholder="Nom de la piste (ex: Lofi Sunset, Ma voix, Artiste...)"
                          value={audioTrack}
                          onChange={(e) => setAudioTrack(e.target.value)}
                        />
                      </div>
                    </div>
                  )}

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
    </div>
  );
};
