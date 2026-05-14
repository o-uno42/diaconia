import { useState, useRef, useEffect } from 'react';
import { apiGet, apiUpload, apiDelete } from '../../lib/api';
import { isMockMode } from '../../lib/supabase';
import type { RagazzoPhoto } from '@shared/types';
import { useAppContext } from '../../store/AppContext';
import { t } from '../../i18n/translations';
import Button from '../ui/Button';
import Modal from '../ui/Modal';

interface PhotosSectionProps {
  ragazzoId: string;
  photos: RagazzoPhoto[];
  isAdmin: boolean;
}

const isPdf = (mime: string) => mime.includes('pdf');

export default function PhotosSection({ ragazzoId, photos: initialPhotos, isAdmin }: PhotosSectionProps) {
  const { state } = useAppContext();
  const lang = state.language;
  const [photos, setPhotos] = useState(initialPhotos);
  const [thumbUrls, setThumbUrls] = useState<Record<string, string>>({});
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewMime, setPreviewMime] = useState('');
  const [uploading, setUploading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isMockMode) return;
    const missing = photos.filter((p) => !isPdf(p.mimeType) && !thumbUrls[p.id]);
    if (missing.length === 0) return;

    let cancelled = false;
    (async () => {
      const entries = await Promise.all(
        missing.map(async (p) => {
          const res = await apiGet<{ url: string }>(`/api/ragazzi/${ragazzoId}/photos/${p.id}/url`);
          return [p.id, res.data?.url] as const;
        }),
      );
      if (cancelled) return;
      setThumbUrls((prev) => {
        const next = { ...prev };
        for (const [id, url] of entries) {
          if (url) next[id] = url;
        }
        return next;
      });
    })();

    return () => { cancelled = true; };
  }, [photos, ragazzoId, thumbUrls]);

  const handleUpload = async (files: FileList | null) => {
    if (!files || isMockMode) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.append('file', file);
      const res = await apiUpload<RagazzoPhoto>(`/api/ragazzi/${ragazzoId}/photos`, fd);
      if (res.data) setPhotos((prev) => [res.data!, ...prev]);
    }
    setUploading(false);
  };

  const handlePreview = async (photo: RagazzoPhoto) => {
    if (isMockMode) return;
    const res = await apiGet<{ url: string }>(`/api/ragazzi/${ragazzoId}/photos/${photo.id}/url`);
    if (res.data) { setPreviewUrl(res.data.url); setPreviewMime(photo.mimeType); }
  };

  const handleDelete = async () => {
    if (!deleteId || isMockMode) return;
    await apiDelete(`/api/ragazzi/${ragazzoId}/photos/${deleteId}`);
    setPhotos((prev) => prev.filter((p) => p.id !== deleteId));
    setDeleteId(null);
  };

  return (
    <div>
      {isMockMode && (
        <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
          📸 {t('photo_demo_warning', lang)}
        </div>
      )}

      <div className="flex items-center gap-3 mb-4">
        <Button variant="secondary" size="sm" loading={uploading} onClick={() => fileRef.current?.click()}>
          📤 {t('photo_upload', lang)}
        </Button>
        <input ref={fileRef} type="file" accept="image/*,application/pdf" multiple className="hidden"
          onChange={(e) => handleUpload(e.target.files)} />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {photos.map((photo) => (
          <div
            key={photo.id}
            className="group relative aspect-square rounded-xl overflow-hidden bg-white/5 border border-white/10 hover:border-white/20 transition-all cursor-pointer"
            onClick={() => handlePreview(photo)}
          >
            {isPdf(photo.mimeType) ? (
              <div className="flex flex-col items-center justify-center h-full text-stone-800/40">
                <svg className="w-10 h-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
                <span className="text-xs truncate px-2">{photo.fileName}</span>
              </div>
            ) : thumbUrls[photo.id] ? (
              <img
                src={thumbUrls[photo.id]}
                alt={photo.fileName}
                loading="lazy"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-stone-200 to-stone-300 animate-pulse" />
            )}
            {/* Delete overlay */}
            {(isAdmin || true) && (
              <button
                onClick={(e) => { e.stopPropagation(); setDeleteId(photo.id); }}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-500/80 text-stone-800 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs"
              >✕</button>
            )}
          </div>
        ))}
      </div>

      {/* Preview Modal */}
      <Modal isOpen={!!previewUrl} onClose={() => setPreviewUrl(null)} title={t('photo_preview', lang)} size="xl">
        {previewUrl && (
          previewMime.includes('pdf') ? (
            <iframe src={previewUrl} className="w-full h-[70vh] rounded-xl" />
          ) : (
            <img src={previewUrl} alt="Preview" className="w-full rounded-xl" />
          )
        )}
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title={t('photo_confirm_delete_title', lang)} size="sm">
        <p className="text-stone-800/70 mb-4">{t('photo_confirm_delete', lang)}</p>
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={() => setDeleteId(null)}>{t('common_cancel', lang)}</Button>
          <Button variant="danger" onClick={handleDelete}>{t('photo_delete', lang)}</Button>
        </div>
      </Modal>
    </div>
  );
}
