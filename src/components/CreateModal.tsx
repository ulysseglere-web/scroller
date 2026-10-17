import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Camera, 
  Video, 
  Image as ImageIcon, 
  PenTool, 
  BookOpen, 
  Link2, 
  MapPin, 
  Tag, 
  Heart, 
  RefreshCw,
  StopCircle,
  Film,
  Music
} from 'lucide-react';
import type { PostItem, PostType, NoteStyle } from '../types';

interface CreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSavePost: (post: PostItem) => void;
}

type CaptureMode = 'photo' | 'reel' | 'video' | 'note' | 'quote' | 'link';

export const CreateModal: React.FC<CreateModalProps> = ({ isOpen, onClose, onSavePost }) => {
  const [mode, setMode] = useState<CaptureMode>('photo');

  // Common fields
  const [caption, setCaption] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [location, setLocation] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [privateAnnotation, setPrivateAnnotation] = useState('');
  const [audioTrack, setAudioTrack] = useState('');

  // Photo & Video state
  const [selectedMediaFiles, setSelectedMediaFiles] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState<string>('');
  
  // Note state
  const [noteBody, setNoteBody] = useState('');
  const [noteBg, setNoteBg] = useState<NoteStyle['bgTheme']>('midnight-violet');
  const [noteFontSize, setNoteFontSize] = useState<NoteStyle['fontSize']>('large');

  // Quote state
  const [quoteText, setQuoteText] = useState('');
  const [quoteAuthor, setQuoteAuthor] = useState('');
  const [quoteSource, setQuoteSource] = useState('');
  const [quotePage, setQuotePage] = useState('');
  const [quoteReflection, setQuoteReflection] = useState('');

  // Link state
  const [linkUrl, setLinkUrl] = useState('');
  const [linkTitle, setLinkTitle] = useState('');
  const [linkDomain, setLinkDomain] = useState('');
  const [linkDesc, setLinkDesc] = useState('');
  const [linkImg, setLinkImg] = useState('');

  // Camera & Video recording state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isRecordingVideo, setIsRecordingVideo] = useState(false);
  const [recordTimer, setRecordTimer] = useState(0);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // Stop camera when unmounting or switching modes
  const stopLiveCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
    setIsRecordingVideo(false);
  };

  useEffect(() => {
    if (!isOpen) {
      stopLiveCamera();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // File upload handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (mode === 'video' || mode === 'reel') {
      const file = files[0];
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
    } else {
      const urls: string[] = [];
      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            urls.push(event.target.result as string);
            if (urls.length === files.length) {
              setSelectedMediaFiles((prev) => [...prev, ...urls]);
            }
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  // Live Camera Activation
  const startLiveCamera = async (recordVideo = false) => {
    stopLiveCamera();
    try {
      const constraints: MediaStreamConstraints = {
        video: { facingMode: 'environment' },
        audio: recordVideo,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
        videoPreviewRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err) {
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
    }
    stopLiveCamera();
  };

  // Video recording
  const startVideoRecording = async () => {
    await startLiveCamera(true);
    if (!streamRef.current) return;

    recordedChunksRef.current = [];
    try {
      const recorder = new MediaRecorder(streamRef.current);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/mp4' });
        const url = URL.createObjectURL(blob);
        setVideoUrl(url);
        stopLiveCamera();
      };

      recorder.start();
      setIsRecordingVideo(true);
      setRecordTimer(0);
      const interval = setInterval(() => {
        setRecordTimer((t) => t + 1);
      }, 1000);
      recorder.onstart = () => {
        // tracking
      };
      // auto stop after 60s
      setTimeout(() => {
        if (recorder.state === 'recording') {
          recorder.stop();
          clearInterval(interval);
        }
      }, 60000);
    } catch (err) {
      console.error(err);
    }
  };

  const stopVideoRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  // Auto extract domain and default title for link
  const handleLinkUrlBlur = () => {
    if (!linkUrl) return;
    try {
      let validUrl = linkUrl;
      if (!/^https?:\/\//i.test(validUrl)) {
        validUrl = 'https://' + validUrl;
        setLinkUrl(validUrl);
      }
      const parsed = new URL(validUrl);
      setLinkDomain(parsed.hostname.replace('www.', ''));
      if (!linkTitle) {
        setLinkTitle(parsed.hostname.replace('www.', '') + ' — Découverte');
      }
    } catch {
      // not a full url yet
    }
  };

  // Save the new post
  const handleSave = () => {
    const tags = tagsInput
      .split(/[\s,#]+/)
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    let finalType: PostType = mode;
    if (mode === 'photo' && selectedMediaFiles.length > 1) {
      finalType = 'carousel';
    }

    const newPost: PostItem = {
      id: 'scroller-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6),
      type: finalType,
      createdAt: new Date().toISOString(),
      caption: caption.trim(),
      tags,
      location: location.trim() || undefined,
      isFavorite,
      privateAnnotation: privateAnnotation.trim() || undefined,
    };

    if (finalType === 'photo' || finalType === 'carousel') {
      if (selectedMediaFiles.length === 0) {
        alert('Veuillez ajouter au moins une photo ou capturer un cliché.');
        return;
      }
      newPost.mediaUrls = selectedMediaFiles;
    } else if (finalType === 'video' || finalType === 'reel') {
      if (!videoUrl) {
        alert('Veuillez sélectionner ou enregistrer une vidéo.');
        return;
      }
      newPost.videoUrl = videoUrl;
      if (finalType === 'reel') {
        newPost.audioTrack = audioTrack.trim() || '♫ Son original — ' + (location || 'Moi');
      }
    } else if (finalType === 'note') {
      if (!noteBody.trim()) {
        alert('Veuillez écrire votre pensée ou réflexion.');
        return;
      }
      newPost.noteBody = noteBody.trim();
      newPost.noteStyle = { bgTheme: noteBg, fontSize: noteFontSize };
    } else if (finalType === 'quote') {
      if (!quoteText.trim() || !quoteAuthor.trim()) {
        alert('Veuillez renseigner la citation et son auteur.');
        return;
      }
      newPost.quoteData = {
        quote: quoteText.trim(),
        author: quoteAuthor.trim(),
        source: quoteSource.trim() || undefined,
        page: quotePage.trim() || undefined,
        reflection: quoteReflection.trim() || undefined,
      };
    } else if (finalType === 'link') {
      if (!linkUrl.trim()) {
        alert('Veuillez renseigner une URL valide.');
        return;
      }
      newPost.linkData = {
        url: linkUrl.trim(),
        title: linkTitle.trim() || linkDomain || linkUrl,
        domain: linkDomain || 'web',
        description: linkDesc.trim() || undefined,
        image: linkImg.trim() || undefined,
      };
    }

    onSavePost(newPost);
    stopLiveCamera();
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="create-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="create-modal-header">
          <button className="btn-close-modal" onClick={onClose} aria-label="Fermer">
            <X size={22} />
          </button>
          <h2 className="create-modal-title">Nouveau souvenir</h2>
          <button className="btn-publish-action" onClick={handleSave}>
            Enregistrer
          </button>
        </div>

        {/* Content Type Selector Tabs */}
        <div className="create-type-tabs">
          <button
            className={`type-tab-btn ${mode === 'photo' ? 'active' : ''}`}
            onClick={() => { stopLiveCamera(); setMode('photo'); }}
          >
            <ImageIcon size={18} />
            <span>Photo</span>
          </button>
          <button
            className={`type-tab-btn ${mode === 'reel' ? 'active' : ''}`}
            onClick={() => { stopLiveCamera(); setMode('reel'); }}
          >
            <Film size={18} />
            <span>Reel</span>
          </button>
          <button
            className={`type-tab-btn ${mode === 'video' ? 'active' : ''}`}
            onClick={() => { stopLiveCamera(); setMode('video'); }}
          >
            <Video size={18} />
            <span>Vidéo</span>
          </button>
          <button
            className={`type-tab-btn ${mode === 'note' ? 'active' : ''}`}
            onClick={() => { stopLiveCamera(); setMode('note'); }}
          >
            <PenTool size={18} />
            <span>Pensée</span>
          </button>
          <button
            className={`type-tab-btn ${mode === 'quote' ? 'active' : ''}`}
            onClick={() => { stopLiveCamera(); setMode('quote'); }}
          >
            <BookOpen size={18} />
            <span>Citation</span>
          </button>
          <button
            className={`type-tab-btn ${mode === 'link' ? 'active' : ''}`}
            onClick={() => { stopLiveCamera(); setMode('link'); }}
          >
            <Link2 size={18} />
            <span>Lien</span>
          </button>
        </div>

        {/* Main Capture Workspace */}
        <div className="create-modal-body">
          {/* 1. PHOTO MODE */}
          {mode === 'photo' && (
            <div className="capture-workspace">
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
              ) : selectedMediaFiles.length > 0 ? (
                <div className="selected-photos-preview">
                  <div className="photos-grid-preview">
                    {selectedMediaFiles.map((src, i) => (
                      <div key={i} className="photo-thumb-wrap">
                        <img src={src} alt="Preview" />
                        <button
                          className="btn-remove-thumb"
                          onClick={() => setSelectedMediaFiles((prev) => prev.filter((_, idx) => idx !== i))}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="add-more-photos-row">
                    <label className="btn-add-more">
                      <span>+ Ajouter d'autres photos</span>
                      <input type="file" accept="image/*" multiple onChange={handleFileChange} hidden />
                    </label>
                    <button className="btn-add-more" onClick={() => startLiveCamera(false)}>
                      <Camera size={16} /> <span>Caméra</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="empty-capture-box">
                  <div className="capture-choice-buttons">
                    <label className="capture-big-button upload-btn">
                      <ImageIcon size={32} />
                      <span className="lead">Importer depuis vos fichiers</span>
                      <span className="sub">Sélectionnez une ou plusieurs images</span>
                      <input type="file" accept="image/*" multiple onChange={handleFileChange} hidden />
                    </label>
                    <button className="capture-big-button camera-btn" onClick={() => startLiveCamera(false)}>
                      <Camera size={32} />
                      <span className="lead">Prendre une photo</span>
                      <span className="sub">Utiliser la caméra de votre appareil</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* REEL MODE (Short Vertical Video) */}
          {mode === 'reel' && (
            <div className="capture-workspace">
              {isRecordingVideo ? (
                <div className="live-camera-view reel-camera-view">
                  <video ref={videoPreviewRef} className="live-camera-stream reel-stream" autoPlay playsInline muted />
                  <div className="recording-indicator">
                    <div className="recording-dot blink" />
                    <span>00:{recordTimer < 10 ? `0${recordTimer}` : recordTimer} (Reel 9:16)</span>
                  </div>
                  <div className="live-camera-controls">
                    <button className="camera-snap-btn stop-rec" onClick={stopVideoRecording} title="Arrêter l'enregistrement">
                      <StopCircle size={36} fill="#ef4444" color="#ffffff" />
                    </button>
                  </div>
                </div>
              ) : videoUrl ? (
                <div className="video-ready-preview">
                  <video src={videoUrl} controls className="preview-video-player" playsInline />
                  <div className="reel-audio-name-field">
                    <Music size={16} />
                    <input
                      type="text"
                      placeholder="Nom de la bande-son (ex: ♫ Jazz Lo-Fi, ♫ Son original)"
                      value={audioTrack}
                      onChange={(e) => setAudioTrack(e.target.value)}
                    />
                  </div>
                  <button className="btn-retake" onClick={() => setVideoUrl('')}>
                    <RefreshCw size={16} /> <span>Changer de Reel</span>
                  </button>
                </div>
              ) : (
                <div className="empty-capture-box">
                  <div className="capture-choice-buttons">
                    <label className="capture-big-button upload-btn">
                      <Film size={34} />
                      <span className="lead">Importer un Reel vertical</span>
                      <span className="sub">Vidéo 9:16 pour votre flux de Reels</span>
                      <input type="file" accept="video/*" onChange={handleFileChange} hidden />
                    </label>
                    <button className="capture-big-button camera-btn" onClick={startVideoRecording}>
                      <Camera size={34} />
                      <span className="lead">Enregistrer un Reel en direct</span>
                      <span className="sub">Format vertical court avec micro</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 2. VIDEO MODE */}
          {mode === 'video' && (
            <div className="capture-workspace">
              {isRecordingVideo ? (
                <div className="live-camera-view">
                  <video ref={videoPreviewRef} className="live-camera-stream" autoPlay playsInline muted />
                  <div className="recording-indicator">
                    <div className="recording-dot blink" />
                    <span>00:{recordTimer < 10 ? `0${recordTimer}` : recordTimer}</span>
                  </div>
                  <div className="live-camera-controls">
                    <button className="camera-snap-btn stop-rec" onClick={stopVideoRecording} title="Arrêter l'enregistrement">
                      <StopCircle size={36} fill="#ef4444" color="#ffffff" />
                    </button>
                  </div>
                </div>
              ) : videoUrl ? (
                <div className="video-ready-preview">
                  <video src={videoUrl} controls className="preview-video-player" playsInline />
                  <button className="btn-retake" onClick={() => setVideoUrl('')}>
                    <RefreshCw size={16} /> <span>Choisir une autre vidéo</span>
                  </button>
                </div>
              ) : (
                <div className="empty-capture-box">
                  <div className="capture-choice-buttons">
                    <label className="capture-big-button upload-btn">
                      <Video size={32} />
                      <span className="lead">Importer une vidéo</span>
                      <span className="sub">Fichier MP4, WebM ou MOV</span>
                      <input type="file" accept="video/*" onChange={handleFileChange} hidden />
                    </label>
                    <button className="capture-big-button camera-btn" onClick={startVideoRecording}>
                      <Camera size={32} />
                      <span className="lead">Enregistrer une vidéo</span>
                      <span className="sub">Capture spontanée avec le micro</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 3. NOTE MODE */}
          {mode === 'note' && (
            <div className="note-editor-workspace">
              <div className={`note-preview-canvas theme-${noteBg}`}>
                <textarea
                  className={`note-input-area ${noteFontSize === 'huge' ? 'font-huge' : 'font-large'}`}
                  placeholder="Écrivez une pensée, un fragment d'idée, une étincelle..."
                  value={noteBody}
                  onChange={(e) => setNoteBody(e.target.value)}
                  rows={5}
                />
              </div>

              <div className="note-style-toolbar">
                <span className="style-label">Ambiance :</span>
                <div className="theme-circles-row">
                  {[
                    { id: 'midnight-violet', bg: '#2e1065' },
                    { id: 'dark-monochrome', bg: '#171717' },
                    { id: 'warm-amber', bg: '#78350f' },
                    { id: 'deep-ocean', bg: '#0c4a6e' },
                    { id: 'emerald', bg: '#064e3b' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      className={`color-picker-dot ${noteBg === t.id ? 'active' : ''}`}
                      style={{ backgroundColor: t.bg }}
                      onClick={() => setNoteBg(t.id as NoteStyle['bgTheme'])}
                    />
                  ))}
                </div>

                <div className="font-size-toggle">
                  <button
                    className={`size-btn ${noteFontSize === 'large' ? 'active' : ''}`}
                    onClick={() => setNoteFontSize('large')}
                  >
                    Normal
                  </button>
                  <button
                    className={`size-btn ${noteFontSize === 'huge' ? 'active' : ''}`}
                    onClick={() => setNoteFontSize('huge')}
                  >
                    Grand
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 4. QUOTE MODE */}
          {mode === 'quote' && (
            <div className="quote-editor-workspace">
              <div className="quote-styled-box">
                <textarea
                  className="quote-text-input"
                  placeholder="« Inscrivez ici la citation ou le passage de lecture qui vous a marqué... »"
                  value={quoteText}
                  onChange={(e) => setQuoteText(e.target.value)}
                  rows={4}
                />
                <div className="quote-inputs-grid">
                  <input
                    type="text"
                    className="quote-meta-input"
                    placeholder="Auteur (ex: Sénèque, Albert Camus...)"
                    value={quoteAuthor}
                    onChange={(e) => setQuoteAuthor(e.target.value)}
                  />
                  <input
                    type="text"
                    className="quote-meta-input"
                    placeholder="Livre ou source (ex: L'Étranger)"
                    value={quoteSource}
                    onChange={(e) => setQuoteSource(e.target.value)}
                  />
                  <input
                    type="text"
                    className="quote-meta-input page-input"
                    placeholder="Page (ex: p. 42)"
                    value={quotePage}
                    onChange={(e) => setQuotePage(e.target.value)}
                  />
                </div>
              </div>
              <div className="quote-reflection-input-wrap">
                <label>Pourquoi cette phrase résonne-t-elle pour vous ? (Optionnel)</label>
                <input
                  type="text"
                  placeholder="Mon ancrage personnel..."
                  value={quoteReflection}
                  onChange={(e) => setQuoteReflection(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* 5. LINK MODE */}
          {mode === 'link' && (
            <div className="link-editor-workspace">
              <div className="link-input-group">
                <label>URL du lien web ou de l'article :</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  onBlur={handleLinkUrlBlur}
                />
              </div>
              <div className="link-input-group">
                <label>Titre personnalisé :</label>
                <input
                  type="text"
                  placeholder="Titre de la ressource"
                  value={linkTitle}
                  onChange={(e) => setLinkTitle(e.target.value)}
                />
              </div>
              <div className="link-input-group">
                <label>Description ou extrait marquant :</label>
                <textarea
                  placeholder="Ce que j'ai retenu de cette lecture..."
                  value={linkDesc}
                  onChange={(e) => setLinkDesc(e.target.value)}
                  rows={2}
                />
              </div>
              <div className="link-input-group">
                <label>Image d'illustration (URL optionnelle) :</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={linkImg}
                  onChange={(e) => setLinkImg(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Meta Information Accordion (Caption, Tags, Location, Favorite) */}
          <div className="create-metadata-section">
            <div className="meta-field caption-field">
              <textarea
                placeholder="Ajouter une légende ou un souvenir..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={2}
              />
              <input
                type="text"
                placeholder="Note intime personnelle (visible uniquement par vous)..."
                value={privateAnnotation}
                onChange={(e) => setPrivateAnnotation(e.target.value)}
                style={{
                  marginTop: '6px',
                  width: '100%',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '7px 10px',
                  fontSize: '12.5px',
                  outline: 'none'
                }}
              />
            </div>

            <div className="meta-row">
              <div className="meta-icon-input">
                <Tag size={17} className="meta-icon" />
                <input
                  type="text"
                  placeholder="Mots-clés (ex: lecture, voyage, rituel)"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                />
              </div>

              <div className="meta-icon-input">
                <MapPin size={17} className="meta-icon" />
                <input
                  type="text"
                  placeholder="Lieu (ex: Paris, Chez moi)"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
            </div>

            <div className="meta-toggle-row">
              <button
                type="button"
                className={`favorite-toggle-btn ${isFavorite ? 'active' : ''}`}
                onClick={() => setIsFavorite(!isFavorite)}
              >
                <Heart size={18} fill={isFavorite ? '#ff1e27' : 'none'} color={isFavorite ? '#ff1e27' : 'currentColor'} />
                <span>Marquer comme favori</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
