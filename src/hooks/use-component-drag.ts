'use client';
import { useState, useRef, useEffect, useCallback, type MouseEvent, type RefObject } from 'react';
import type { Circuit, CircuitComponent, LogCategory } from '@/lib/types';
import { getComponentDimensions } from '@/lib/canvas-utils';

interface UseComponentDragProps {
  circuit: Circuit;
  viewTransform: { x: number; y: number; scale: number };
  toWorldSpace: (coords: { x: number; y: number }) => { x: number; y: number };
  onUpdateComponentPosition: (id: string, position: { x: number; y: number }) => void;
  wiringMode: boolean;
  onSelectComponent: (id: string | null) => void;
  log: (message: string, category?: LogCategory) => void;
}

export function useComponentDrag({
  circuit,
  viewTransform,
  toWorldSpace,
  onUpdateComponentPosition,
  wiringMode,
  onSelectComponent,
  log,
}: UseComponentDragProps) {
  const [dragging, setDragging] = useState<{ id: string, offset: { x: number, y: number } } | null>(null);
  const dragPositions = useRef<{ [key: string]: { x: number, y: number } }>({});
  const animationFrame = useRef<number>();

  const isDragging = () => !!dragging;

  const handleComponentMouseDown = (e: MouseEvent, componentId: string) => {
    log(`handleComponentMouseDown: id=${componentId}`, 'drag');
    if (wiringMode || e.button !== 0 || (e.ctrlKey || e.metaKey)) {
      log('handleComponentMouseDown: Ignoring due to wiring mode or mouse button.', 'drag');
      return;
    }
    
    onSelectComponent(componentId);
    const component = circuit.components.find(c => c.id === componentId);
    if (!component) return;
    
    const worldPos = toWorldSpace({ x: e.clientX, y: e.clientY });
    
    dragPositions.current[componentId] = component.position;
    
    setDragging({
      id: componentId,
      offset: {
        x: worldPos.x - component.position.x,
        y: worldPos.y - component.position.y,
      },
    });

    const handleMouseMove = (moveEvent: globalThis.MouseEvent) => {
      if (animationFrame.current) cancelAnimationFrame(animationFrame.current);
      animationFrame.current = requestAnimationFrame(() => {
        const newWorldPos = toWorldSpace({ x: moveEvent.clientX, y: moveEvent.clientY });
        
        const canvasEl = (e.target as HTMLElement).closest('.w-full.h-full.overflow-hidden');
        if (!canvasEl) return;
        
        const canvasRect = canvasEl.getBoundingClientRect();
        
        const compDims = getComponentDimensions(component.type);

        const canvasLeft = -viewTransform.x / viewTransform.scale;
        const canvasTop = -viewTransform.y / viewTransform.scale;
        const canvasRight = (canvasRect.width - viewTransform.x) / viewTransform.scale;
        const canvasBottom = (canvasRect.height - viewTransform.y) / viewTransform.scale;

        let newX = newWorldPos.x - (dragPositions.current[componentId] ? (newWorldPos.x - component.position.x - (worldPos.x - component.position.x)) : (worldPos.x - component.position.x));
        let newY = newWorldPos.y - (dragPositions.current[componentId] ? (newWorldPos.y - component.position.y - (worldPos.y - component.position.y)) : (worldPos.y - component.position.y));

        newX = newWorldPos.x - (worldPos.x - component.position.x);
        newY = newWorldPos.y - (worldPos.y - component.position.y);
        
        newX = Math.max(canvasLeft, Math.min(newX, canvasRight - compDims.width));
        newY = Math.max(canvasTop, Math.min(newY, canvasBottom - compDims.height));

        dragPositions.current[componentId] = { x: newX, y: newY };
        
        // Force a re-render by creating a new dragging object
        setDragging(d => d ? { ...d } : null);
      });
    };

    const handleMouseUp = () => {
      if (animationFrame.current) cancelAnimationFrame(animationFrame.current);
      
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      
      log(`handleComponentMouseUp: End dragging component ${componentId}`, 'drag');
      if (dragPositions.current[componentId]) {
        onUpdateComponentPosition(componentId, dragPositions.current[componentId]);
      }
      setDragging(null);
      dragPositions.current = {};
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    log(`handleComponentMouseDown: Start dragging component ${componentId}`, 'drag');
  };

  return {
    dragging,
    dragPositions,
    handleComponentMouseDown,
    isDragging,
  };
}
