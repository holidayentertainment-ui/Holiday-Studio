'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface BeforeAfterSliderProps {
  beforeUrl: string;
  afterUrl: string;
}

export default function BeforeAfterSlider({ beforeUrl, afterUrl }: BeforeAfterSliderProps) {
  const [position, setPosition] = useState(50); // percentage
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  // Keep container width stable for position calculation
  const getContainerRect = () => containerRef.current?.getBoundingClientRect();

  const updatePosition = useCallback((clientX: number) => {
    const rect = getContainerRect();
    if (!rect) return;
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    setPosition((x / rect.width) * 100);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onMouseMove = useCallback(
    (e: MouseEvent) => { if (dragging.current) updatePosition(e.clientX); },
    [updatePosition],
  );
  const onTouchMove = useCallback(
    (e: TouchEvent) => { if (dragging.current) updatePosition(e.touches[0].clientX); },
    [updatePosition],
  );
  const stopDrag = useCallback(() => { dragging.current = false; }, []);

  useEffect(() => {
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', stopDrag);
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', stopDrag);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', stopDrag);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', stopDrag);
    };
  }, [onMouseMove, onTouchMove, stopDrag]);

  return (
    <div
      ref={containerRef}
      className="relative w-full select-none overflow-hidden rounded-2xl cursor-ew-resize"
      style={{ aspectRatio: '16/9', maxHeight: 480 }}
      onMouseDown={(e) => { dragging.current = true; updatePosition(e.clientX); }}
      onTouchStart={(e) => { dragging.current = true; updatePosition(e.touches[0].clientX); }}
    >
      {/* After (right / full width base) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={afterUrl}
        alt="After"
        className="absolute inset-0 w-full h-full object-cover"
        draggable={false}
      />

      {/* Before (left / clipped via clip-path) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={beforeUrl}
        alt="Before"
        className="absolute inset-0 w-full h-full object-cover"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
        draggable={false}
      />

      {/* Divider line */}
      <div
        className="absolute top-0 bottom-0 w-0.5"
        style={{ left: `${position}%`, background: 'rgba(255,255,255,0.85)', transform: 'translateX(-50%)' }}
      >
        {/* Handle */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center shadow-lg"
          style={{ background: 'rgba(14,14,22,0.92)', border: '2px solid rgba(255,255,255,0.7)' }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M5 3L2 7l3 4M9 3l3 4-3 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      {/* Labels */}
      <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg text-xs font-semibold text-white pointer-events-none" style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }}>
        Before
      </div>
      <div className="absolute top-3 right-3 px-2.5 py-1 rounded-lg text-xs font-semibold text-white pointer-events-none" style={{ background: 'rgba(99,102,241,0.65)', backdropFilter: 'blur(6px)' }}>
        After
      </div>
    </div>
  );
}
