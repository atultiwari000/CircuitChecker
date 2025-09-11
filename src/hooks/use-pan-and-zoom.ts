
'use client';

import { useState, useRef, useCallback, type RefObject } from 'react';
import { LogCategory } from '@/lib/types';

interface ViewTransform {
  x: number;
  y: number;
  scale: number;
}

export function usePanAndZoom(canvasRef: RefObject<HTMLDivElement>, log: (message: string, category?: LogCategory) => void, disabled = false) {
  const [viewTransform, setViewTransform] = useState<ViewTransform>({ x: 0, y: 0, scale: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0 });

  const toWorldSpace = useCallback(({ x, y }: { x: number, y: number }) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: (x - rect.left - viewTransform.x) / viewTransform.scale,
      y: (y - rect.top - viewTransform.y) / viewTransform.scale,
    };
  }, [viewTransform, canvasRef]);

  const handlePanStart = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled) return;
    log('handlePanStart: Start panning', 'pan');
    setIsPanning(true);
    panStart.current = { x: e.clientX - viewTransform.x, y: e.clientY - viewTransform.y };
    if (e.currentTarget) {
      e.currentTarget.style.cursor = 'grabbing';
    }
  };

  const handlePanMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isPanning || disabled) return;
    const x = e.clientX - panStart.current.x;
    const y = e.clientY - panStart.current.y;
    setViewTransform(v => ({ ...v, x, y }));
  };

  const handlePanEnd = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isPanning) {
      log('handlePanEnd: End panning', 'pan');
      setIsPanning(false);
      if (e.currentTarget) {
        e.currentTarget.style.cursor = 'default';
      }
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (disabled || !canvasRef.current) return;
    const { clientX, clientY, deltaY } = e;
    const rect = canvasRef.current.getBoundingClientRect();
    
    const mouseX = clientX - rect.left;
    const mouseY = clientY - rect.top;

    const scaleFactor = 1.1;
    const newScale = deltaY < 0 ? viewTransform.scale * scaleFactor : viewTransform.scale / scaleFactor;
    const clampedScale = Math.max(0.2, Math.min(newScale, 3));

    const worldX = (mouseX - viewTransform.x) / viewTransform.scale;
    const worldY = (mouseY - viewTransform.y) / viewTransform.scale;

    const newX = mouseX - worldX * clampedScale;
    const newY = mouseY - worldY * clampedScale;

    setViewTransform({
        x: newX,
        y: newY,
        scale: clampedScale,
    });
  };

  return {
    viewTransform,
    isPanning,
    panStart,
    toWorldSpace,
    handlePanStart,
    handlePanMove,
    handlePanEnd,
    handleWheel,
  };
}
