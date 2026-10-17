import React, { useState } from 'react';
import { X, Tag, MapPin, MessageSquare } from 'lucide-react';
import type { PostItem } from '../types';

interface EditPostModalProps {
  post: PostItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedPost: PostItem) => void;
}

export const EditPostModal: React.FC<EditPostModalProps> = ({
  post,
  isOpen,
  onClose,
  onSave,
}) => {
  if (!isOpen || !post) return null;

  const [caption, setCaption] = useState(post.caption || '');
  const [tagsInput, setTagsInput] = useState(post.tags ? post.tags.join(', ') : '');
  const [location, setLocation] = useState(post.location || '');
  const [privateAnnotation, setPrivateAnnotation] = useState(post.privateAnnotation || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tags = tagsInput
      .split(/[\s,#]+/)
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    onSave({
      ...post,
      caption: caption.trim(),
      tags,
      location: location.trim() || undefined,
      privateAnnotation: privateAnnotation.trim() || undefined,
    });
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="edit-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="create-modal-header">
          <button className="btn-close-modal" onClick={onClose}>
            <X size={20} />
          </button>
          <h2 className="create-modal-title">Modifier le souvenir</h2>
          <button className="btn-publish-action" onClick={handleSubmit}>
            Enregistrer
          </button>
        </div>

        <form className="edit-modal-form" onSubmit={handleSubmit}>
          <div className="form-field">
            <label>Légende</label>
            <textarea
              rows={4}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Écrivez votre légende..."
            />
          </div>

          <div className="form-field">
            <label>
              <Tag size={15} /> Tags
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="nature, voyage, lecture..."
            />
          </div>

          <div className="form-field">
            <label>
              <MapPin size={15} /> Lieu
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Lieu (optionnel)"
            />
          </div>

          <div className="form-field">
            <label>
              <MessageSquare size={15} /> Commentaires
            </label>
            <textarea
              rows={3}
              value={privateAnnotation}
              onChange={(e) => setPrivateAnnotation(e.target.value)}
              placeholder="Ajouter un commentaire..."
            />
          </div>
        </form>
      </div>
    </div>
  );
};
