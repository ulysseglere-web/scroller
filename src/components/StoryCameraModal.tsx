import React, { useState, useRef, useEffect } from 'react';
import { X, RefreshCw, Image as ImageIcon, ArrowLeft, Check } from 'lucide-react';
import { sound } from '../services/sound';
import type { PostItem, UserProfile } from '../types';

interface StoryCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSavePost: (post: PostItem) => void;
  profile: UserProfile;
}

export const StoryCameraModal: React.FC<StoryCameraModalProps> = ({
  isOpen,
  onClose,
  onSavePost,
  profile,
}) => {
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [capturedMedia, setCapturedMedia] = useState<{
    type: 'photo' | 'video';
    dataUrl: string;
  } | null>(null);
  const [caption, setCaption] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Initialize live camera stream
  useEffect(() => {
    if (!isOpen || capturedMedia) return;

    let isMounted = true;

    async function initCamera() {
      try {
        setCameraError(null);
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
        }

        const constraints: MediaStreamConstraints = {
          video: {
            facingMode,
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: true,
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints).catch(async () => {
          // If audio permission fails, try video only
          return await navigator.mediaDevices.getUserMedia({
            video: { facingMode },
            audio: false,
          });
        });

        if (!isMounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      } catch (err: unknown) {
        console.warn('Accès caméra WebRTC non disponible:', err);
        if (isMounted) {
          setCameraError("Impossible d'accéder au flux direct de la caméra.");
          // Direct fallback to native phone camera input on devices without web camera permission
          if (/Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)) {
            nativeCameraInputRef.current?.click();
          }
        }
      }
    }

    initCamera();

    return () => {
      isMounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (recordTimerRef.current) {
        clearInterval(recordTimerRef.current);
      }
    };
  }, [isOpen, facingMode, capturedMedia]);

  if (!isOpen) return null;

  // Toggle front/back camera
  const toggleFacingMode = () => {
    sound.playSwitch();
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Instant Photo Snapshot
  const takeSnapshot = () => {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 720;
    canvas.height = video.videoHeight || 1280;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Flip horizontal if front camera
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

    sound.playHeart();
    setCapturedMedia({
      type: 'photo',
      dataUrl,
    });
  };

  // Start Video Recording
  const startRecording = () => {
    if (!streamRef.current || isRecording) return;

    sound.playPop();
    recordedChunksRef.current = [];
    setRecordingSeconds(0);

    let mimeType = 'video/webm';
    if (MediaRecorder.isTypeSupported('video/mp4;codecs=h264')) {
      mimeType = 'video/mp4;codecs=h264';
    } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
      mimeType = 'video/webm;codecs=vp9';
    }

    try {
      const recorder = new MediaRecorder(streamRef.current, { mimeType });
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: mimeType });
        const reader = new FileReader();
        reader.onload = (ev) => {
          if (ev.target?.result) {
            setCapturedMedia({
              type: 'video',
              dataUrl: ev.target.result as string,
            });
            sound.playChime();
          }
        };
        reader.readAsDataURL(blob);
      };

      recorder.start(100);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);

      recordTimerRef.current = setInterval(() => {
        setRecordingSeconds((sec) => {
          if (sec >= 30) {
            stopRecording();
            return 30;
          }
          return sec + 1;
        });
      }, 1000);
    } catch {
      alert("Enregistrement vidéo non supporté sur ce navigateur.");
    }
  };

  // Stop Video Recording
  const stopRecording = () => {
    if (!isRecording) return;
    setIsRecording(false);
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  // Native phone camera input fallback handler
  const handleNativeFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video/');
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) {
        setCapturedMedia({
          type: isVideo ? 'video' : 'photo',
          dataUrl: ev.target.result as string,
        });
        sound.playPop();
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Publish Story / Post
  const handlePublish = () => {
    if (!capturedMedia) return;

    sound.playChime();
    const newPost: PostItem = {
      id: `post_${Date.now()}`,
      type: capturedMedia.type === 'video' ? 'reel' : 'photo',
      createdAt: new Date().toISOString(),
      caption: caption.trim(),
      mediaUrls: capturedMedia.type === 'photo' ? [capturedMedia.dataUrl] : undefined,
      videoUrl: capturedMedia.type === 'video' ? capturedMedia.dataUrl : undefined,
      tags: [],
      isFavorite: false,
    };

    onSavePost(newPost);
    onClose();
  };

  return (
    <div className="story-camera-modal-root">
      {/* Hidden native input with capture="environment" to directly open camera app on smartphone */}
      <input
        ref={nativeCameraInputRef}
        type="file"
        accept="image/*,video/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={handleNativeFileSelected}
      />

      {/* Hidden gallery import input */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*,video/*"
        style={{ display: 'none' }}
        onChange={handleNativeFileSelected}
      />

      {!capturedMedia ? (
        /* LIVE VIEWFINDER SCREEN (INSTAGRAM STORY CAMERA) */
        <div className="story-viewfinder-screen">
          <video
            ref={videoRef}
            playsInline
            muted
            className={`story-live-video ${facingMode === 'user' ? 'mirrored' : ''}`}
          />

          {/* Top Bar Controls */}
          <div className="story-camera-top-bar">
            <button
              type="button"
              className="story-camera-icon-btn"
              onClick={onClose}
              title="Fermer"
              aria-label="Fermer l'appareil"
            >
              <X size={26} color="#ffffff" />
            </button>

            {isRecording && (
              <div className="story-recording-pill">
                <span className="recording-dot" />
                <span>00:{recordingSeconds.toString().padStart(2, '0')}</span>
              </div>
            )}

            <button
              type="button"
              className="story-camera-icon-btn"
              onClick={toggleFacingMode}
              title="Retourner la caméra"
              aria-label="Changer de caméra"
            >
              <RefreshCw size={24} color="#ffffff" />
            </button>
          </div>

          {/* Camera Error / Fallback Box */}
          {cameraError && (
            <div className="story-camera-fallback-card">
              <p>{cameraError}</p>
              <button
                type="button"
                className="btn-trigger-native-cam"
                onClick={() => nativeCameraInputRef.current?.click()}
              >
                Ouvrir l'appareil photo du téléphone
              </button>
            </div>
          )}

          {/* Bottom Bar Shutter & Gallery */}
          <div className="story-camera-bottom-bar">
            {/* Gallery picker */}
            <button
              type="button"
              className="story-gallery-btn"
              onClick={() => galleryInputRef.current?.click()}
              title="Choisir dans la galerie"
            >
              <ImageIcon size={22} color="#ffffff" />
            </button>

            {/* Instagram Shutter Button */}
            <div className="story-shutter-outer-ring">
              <button
                type="button"
                className={`story-shutter-inner-btn ${isRecording ? 'recording' : ''}`}
                onClick={takeSnapshot}
                onMouseDown={startRecording}
                onMouseUp={stopRecording}
                onTouchStart={startRecording}
                onTouchEnd={stopRecording}
                aria-label="Prendre une photo (appui simple) ou filmer (appui long)"
              />
            </div>

            {/* Native Camera Shortcut */}
            <button
              type="button"
              className="story-gallery-btn"
              onClick={() => nativeCameraInputRef.current?.click()}
              title="Appareil photo système"
            >
              <RefreshCw size={20} color="#ffffff" />
            </button>
          </div>

          <div className="story-shutter-hint">
            <span>Appuyez pour une photo · Maintenez pour une vidéo</span>
          </div>
        </div>
      ) : (
        /* CAPTURED PREVIEW & PUBLISH SCREEN */
        <div className="story-preview-screen">
          {capturedMedia.type === 'photo' ? (
            <img src={capturedMedia.dataUrl} alt="Captured Story" className="story-preview-media" />
          ) : (
            <video
              src={capturedMedia.dataUrl}
              autoPlay
              loop
              playsInline
              className="story-preview-media"
            />
          )}

          {/* Top Bar for Review */}
          <div className="story-camera-top-bar">
            <button
              type="button"
              className="story-camera-icon-btn"
              onClick={() => setCapturedMedia(null)}
              title="Reprendre"
            >
              <ArrowLeft size={26} color="#ffffff" />
            </button>
          </div>

          {/* Caption Input Overlay */}
          <div className="story-caption-overlay">
            <input
              type="text"
              className="story-caption-input"
              placeholder="Ajouter une légende ou pensée..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              autoFocus
            />
          </div>

          {/* Bottom Action Bar (Instagram "Votre Story" Button) */}
          <div className="story-preview-bottom-bar">
            <button
              type="button"
              className="btn-story-publish-direct"
              onClick={handlePublish}
            >
              <div className="user-story-bubble-thumb">
                <img src={profile.avatarUrl || '/logo.png'} alt={profile.displayName} />
              </div>
              <span>Partager dans mes souvenirs</span>
              <Check size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
