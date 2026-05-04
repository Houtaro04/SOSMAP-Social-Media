import React, { useState, useRef, useCallback } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { ensureFullUrl } from '@/shared/services/profileService';

interface CreatePostCardProps {
  onSubmit: (text: string, files: File[]) => Promise<boolean>;
  isSubmitting: boolean;
}

export const CreatePostCard: React.FC<CreatePostCardProps> = ({ onSubmit, isSubmitting }) => {
  const { user } = useAuthStore();
  const [newPostText, setNewPostText] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = `https://ui-avatars.com/api/?name=${user?.fullName || 'User'}&background=0D8ABC&color=fff&size=200`;
  };

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const merged = [...selectedFiles, ...files].slice(0, 6); // max 6 ảnh
    setSelectedFiles(merged);
    const urls = merged.map(f => URL.createObjectURL(f));
    // Clear old previews to avoid memory leak if appending
    previewUrls.forEach(u => URL.revokeObjectURL(u));
    setPreviewUrls(urls);
    e.target.value = '';
  }, [selectedFiles, previewUrls]);

  const removePreview = (idx: number) => {
    const newFiles = [...selectedFiles];
    const newUrls = [...previewUrls];
    URL.revokeObjectURL(newUrls[idx]);
    newFiles.splice(idx, 1);
    newUrls.splice(idx, 1);
    setSelectedFiles(newFiles);
    setPreviewUrls(newUrls);
  };

  const handlePostSubmit = async () => {
    if (selectedFiles.length === 0) {
      // You can also use a toast, but alert is simple for now, or just return since the button will be disabled anyway
      return;
    }
    const success = await onSubmit(newPostText, selectedFiles);
    if (success) {
      setNewPostText('');
      previewUrls.forEach(u => URL.revokeObjectURL(u));
      setSelectedFiles([]);
      setPreviewUrls([]);
    }
  };

  return (
    <div className="create-post-card">
      <div className="create-post-header">
        <div className="user-avatar">
          <img
            src={ensureFullUrl(user?.imageUrl || undefined, user?.fullName || undefined)}
            alt="Avatar"
            onError={handleImageError}
          />
        </div>
        <div className="post-input-wrap">
          <textarea
            className="post-input"
            placeholder="Bạn đang nghĩ gì? Chia sẻ cập nhật an toàn..."
            value={newPostText}
            onChange={e => setNewPostText(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && e.ctrlKey) handlePostSubmit();
            }}
          />

          {/* Image previews */}
          {previewUrls.length > 0 && (
            <div className="post-preview-grid">
              {previewUrls.map((url, i) => (
                <div key={i} className="post-preview-item">
                  <img src={url} alt={`Preview ${i + 1}`} />
                  <button className="post-preview-remove" onClick={() => removePreview(i)}>
                    <X size={14} />
                  </button>
                </div>
              ))}
              {previewUrls.length < 6 && (
                <button className="post-preview-add" onClick={() => fileInputRef.current?.click()}>
                  <ImagePlus size={22} />
                  <span>Thêm ảnh</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Actions row */}
      <div className="create-post-actions">
        <button
          className="post-media-btn"
          onClick={() => fileInputRef.current?.click()}
          title="Thêm ảnh"
        >
          <ImagePlus size={18} />
          <span>Ảnh / Video</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={handleFileChange}
        />
        <button
          className="post-submit-btn"
          onClick={handlePostSubmit}
          disabled={isSubmitting || selectedFiles.length === 0}
        >
          {isSubmitting ? (
            <><span className="post-spinner" /> Đang đăng...</>
          ) : 'Đăng bài'}
        </button>
      </div>
    </div>
  );
};
