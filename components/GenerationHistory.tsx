'use client';

import { useEffect, useState, useCallback } from 'react';

interface GeneratedImage {
  id: string;
  styleId: string;
  styleName: string | null;
  poseId: string;
  location: string | null;
  wardrobe: string | null;
  createdAt: string;
  imageUrl: string | null;
}

interface GenerationHistoryProps {
  onClose: () => void;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function toTitleCase(str: string): string {
  return str
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function getStyleLabel(styleName: string | null, styleId: string): string {
  if (styleName && styleName !== styleId) return styleName;
  return toTitleCase(styleId);
}

export default function GenerationHistory({ onClose }: GenerationHistoryProps) {
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 20;

  const fetchImages = useCallback(async (pageNum: number, replace = false) => {
    try {
      setError('');
      const res = await fetch(
        `/api/generations?limit=${PAGE_SIZE}&offset=${pageNum * PAGE_SIZE}`,
      );
      if (!res.ok) throw new Error('Failed to load history');
      const data = await res.json();
      const fetched: GeneratedImage[] = data.images ?? [];
      setImages((prev) => (replace ? fetched : [...prev, ...fetched]));
      setHasMore(fetched.length === PAGE_SIZE);
    } catch {
      setError('Could not load your generation history.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchImages(0, true);
  }, [fetchImages]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedImage) {
          setSelectedImage(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, selectedImage]);

  const handleDownload = async (img: GeneratedImage) => {
    if (!img.imageUrl) return;
    try {
      const res = await fetch(img.imageUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const style = getStyleLabel(img.styleName, img.styleId)
        .toLowerCase()
        .replace(/\s+/g, '-');
      a.download = `holiday-studio-${style}-${img.id.slice(0, 8)}.jpg`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // fallback: open in new tab
      window.open(img.imageUrl, '_blank');
    }
  };

  const handleDelete = async (img: GeneratedImage) => {
    setDeletingId(img.id);
    try {
      const res = await fetch(`/api/generations?id=${img.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Delete failed');
      setImages((prev) => prev.filter((i) => i.id !== img.id));
      if (selectedImage?.id === img.id) setSelectedImage(null);
    } catch {
      // silent — just keep the image in the list
    } finally {
      setDeletingId(null);
    }
  };

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchImages(nextPage);
  };

  return (
    <>
      {/* Main modal */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.80)', backdropFilter: 'blur(12px)' }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div
          className="relative w-full max-w-2xl rounded-4xl overflow-hidden flex flex-col animate-fade-up"
          style={{
            background: '#0e0e1a',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 24px 80px rgba(0,0,0,0.7)',
            maxHeight: '88vh',
          }}
        >
          {/* Top accent line */}
          <div
            className="absolute top-0 left-0 right-0 h-px"
            style={{
              background:
                'linear-gradient(90deg, transparent, rgba(99,102,241,0.6), transparent)',
            }}
          />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center transition-colors z-10"
            style={{
              background: 'rgba(255,255,255,0.07)',
              color: 'rgba(255,255,255,0.5)',
            }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M1.5 1.5l9 9M10.5 1.5l-9 9"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>

          {/* Header */}
          <div className="p-8 pb-0 shrink-0">
            <div className="flex items-center gap-3 mb-7">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                }}
              >
                {/* Photo grid icon */}
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <rect
                    x="1.5"
                    y="1.5"
                    width="6"
                    height="6"
                    rx="1.5"
                    stroke="white"
                    strokeWidth="1.4"
                  />
                  <rect
                    x="10.5"
                    y="1.5"
                    width="6"
                    height="6"
                    rx="1.5"
                    stroke="white"
                    strokeWidth="1.4"
                  />
                  <rect
                    x="1.5"
                    y="10.5"
                    width="6"
                    height="6"
                    rx="1.5"
                    stroke="white"
                    strokeWidth="1.4"
                  />
                  <rect
                    x="10.5"
                    y="10.5"
                    width="6"
                    height="6"
                    rx="1.5"
                    stroke="white"
                    strokeWidth="1.4"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold tracking-tight">
                  Generation History
                </h2>
                <p className="text-xs text-[#8888a0] mt-0.5">
                  {loading
                    ? 'Loading…'
                    : images.length === 0
                    ? 'No images yet'
                    : `${images.length}${hasMore ? '+' : ''} image${images.length === 1 ? '' : 's'} generated`}
                </p>
              </div>
            </div>
          </div>

          {/* Content — scrollable */}
          <div className="overflow-y-auto px-8 pb-8 flex-1">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div
                  className="w-8 h-8 rounded-full border-2 border-[rgba(255,255,255,0.1)] animate-spin"
                  style={{ borderTopColor: '#6366f1' }}
                />
              </div>
            ) : error ? (
              <div
                className="rounded-2xl p-6 text-center"
                style={{
                  background: 'rgba(239,68,68,0.05)',
                  border: '1px solid rgba(239,68,68,0.15)',
                }}
              >
                <p className="text-sm text-[#f87171]">{error}</p>
                <button
                  onClick={() => { setLoading(true); fetchImages(0, true); }}
                  className="mt-3 text-xs text-[#8888a0] hover:text-white transition-colors underline"
                >
                  Try again
                </button>
              </div>
            ) : images.length === 0 ? (
              <div
                className="rounded-3xl p-10 text-center"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div
                  className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                  style={{ background: 'rgba(99,102,241,0.1)' }}
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="text-indigo-400"
                  >
                    <rect
                      x="3"
                      y="3"
                      width="7"
                      height="7"
                      rx="1.5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    />
                    <rect
                      x="14"
                      y="3"
                      width="7"
                      height="7"
                      rx="1.5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    />
                    <rect
                      x="3"
                      y="14"
                      width="7"
                      height="7"
                      rx="1.5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    />
                    <rect
                      x="14"
                      y="14"
                      width="7"
                      height="7"
                      rx="1.5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    />
                  </svg>
                </div>
                <p className="text-sm font-medium text-white mb-1">
                  No images yet
                </p>
                <p className="text-xs text-[#8888a0]">
                  Generate your first AI photo to see it here.
                </p>
              </div>
            ) : (
              <>
                {/* Image grid */}
                <div
                  className="grid gap-3"
                  style={{
                    gridTemplateColumns:
                      'repeat(auto-fill, minmax(150px, 1fr))',
                  }}
                >
                  {images.map((img) => (
                    <div
                      key={img.id}
                      className="group relative rounded-2xl overflow-hidden cursor-pointer"
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.07)',
                        aspectRatio: '3/4',
                      }}
                      onClick={() => setSelectedImage(img)}
                    >
                      {img.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={img.imageUrl}
                          alt={getStyleLabel(img.styleName, img.styleId)}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            className="text-[#44444f]"
                          >
                            <rect
                              x="3"
                              y="3"
                              width="18"
                              height="18"
                              rx="3"
                              stroke="currentColor"
                              strokeWidth="1.5"
                            />
                            <circle
                              cx="8.5"
                              cy="8.5"
                              r="1.5"
                              fill="currentColor"
                            />
                            <path
                              d="M3 16l5-5 4 4 3-3 6 6"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>
                      )}

                      {/* Hover overlay */}
                      <div
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3"
                        style={{
                          background:
                            'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)',
                        }}
                      >
                        {/* Delete button — top-right */}
                        <div className="flex justify-end">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(img);
                            }}
                            disabled={deletingId === img.id}
                            className="w-7 h-7 rounded-full flex items-center justify-center transition-colors"
                            style={{
                              background: 'rgba(239,68,68,0.2)',
                              border: '1px solid rgba(239,68,68,0.3)',
                            }}
                            title="Delete"
                          >
                            {deletingId === img.id ? (
                              <div
                                className="w-3 h-3 rounded-full border border-[rgba(255,255,255,0.3)] animate-spin"
                                style={{ borderTopColor: '#f87171' }}
                              />
                            ) : (
                              <svg
                                width="10"
                                height="10"
                                viewBox="0 0 10 10"
                                fill="none"
                              >
                                <path
                                  d="M1.5 1.5l7 7M8.5 1.5l-7 7"
                                  stroke="#f87171"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                />
                              </svg>
                            )}
                          </button>
                        </div>

                        {/* Style + date — bottom */}
                        <div>
                          <p className="text-[11px] font-semibold text-white leading-tight truncate">
                            {getStyleLabel(img.styleName, img.styleId)}
                          </p>
                          <p className="text-[10px] text-[rgba(255,255,255,0.5)] mt-0.5">
                            {formatDate(img.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Load more */}
                {hasMore && (
                  <div className="flex justify-center mt-6">
                    <button
                      onClick={loadMore}
                      className="px-5 py-2 rounded-xl text-sm text-[#8888a0] hover:text-white transition-colors"
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.08)',
                      }}
                    >
                      Load more
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox — full-size image view */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(16px)' }}
          onClick={(e) => e.target === e.currentTarget && setSelectedImage(null)}
        >
          <div
            className="relative flex flex-col rounded-3xl overflow-hidden"
            style={{
              background: '#0e0e1a',
              border: '1px solid rgba(255,255,255,0.1)',
              maxWidth: '480px',
              width: '100%',
              maxHeight: '90vh',
            }}
          >
            {/* Close */}
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center z-10 transition-colors"
              style={{
                background: 'rgba(0,0,0,0.6)',
                color: 'rgba(255,255,255,0.7)',
              }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path
                  d="M1.5 1.5l9 9M10.5 1.5l-9 9"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </button>

            {/* Image */}
            <div className="overflow-y-auto flex-1">
              {selectedImage.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={selectedImage.imageUrl}
                  alt={getStyleLabel(selectedImage.styleName, selectedImage.styleId)}
                  className="w-full object-contain"
                  style={{ display: 'block' }}
                />
              ) : (
                <div className="flex items-center justify-center h-64">
                  <p className="text-sm text-[#8888a0]">Image unavailable</p>
                </div>
              )}
            </div>

            {/* Footer info + actions */}
            <div
              className="p-5 shrink-0"
              style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate">
                    {getStyleLabel(selectedImage.styleName, selectedImage.styleId)}
                  </p>
                  <p className="text-xs text-[#8888a0] mt-0.5">
                    {formatDate(selectedImage.createdAt)} · {formatTime(selectedImage.createdAt)}
                  </p>
                  {(selectedImage.location || selectedImage.wardrobe) && (
                    <div className="mt-2 space-y-1">
                      {selectedImage.location && (
                        <p className="text-xs text-[#8888a0]">
                          <span className="text-[#6666a0]">Location: </span>
                          {selectedImage.location}
                        </p>
                      )}
                      {selectedImage.wardrobe && (
                        <p className="text-xs text-[#8888a0]">
                          <span className="text-[#6666a0]">Wardrobe: </span>
                          {selectedImage.wardrobe}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleDownload(selectedImage)}
                  className="flex-1 h-10 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
                  style={{
                    background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                    color: 'white',
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path
                      d="M7 1v8M4 6l3 3 3-3M2 11h10"
                      stroke="white"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Download
                </button>
                <button
                  onClick={() => handleDelete(selectedImage)}
                  disabled={deletingId === selectedImage.id}
                  className="h-10 px-4 rounded-2xl text-sm font-medium flex items-center justify-center gap-1.5 transition-colors"
                  style={{
                    background: 'rgba(239,68,68,0.08)',
                    border: '1px solid rgba(239,68,68,0.2)',
                    color: '#f87171',
                  }}
                >
                  {deletingId === selectedImage.id ? (
                    <div
                      className="w-4 h-4 rounded-full border border-[rgba(248,113,113,0.3)] animate-spin"
                      style={{ borderTopColor: '#f87171' }}
                    />
                  ) : (
                    <>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path
                          d="M1.5 3h9M4.5 3V2a.5.5 0 01.5-.5h2a.5.5 0 01.5.5v1M10 3l-.5 7a1 1 0 01-1 .93H3.5A1 1 0 012.5 10L2 3"
                          stroke="currentColor"
                          strokeWidth="1.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
