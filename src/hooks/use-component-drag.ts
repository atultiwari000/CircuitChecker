'use client';
import { useState, useRef, useEffect, useCallback, type MouseEvent } from 'react';
import type { Circuit, LogCategory } from '@/lib/types';

interface UseComponentDragProps {
  circuit: Circuit;
  toWorldSpace: (coords: { x: number; y: number; }) => { x: number; y: number; };
  onUpdateComponentPosition: (id: string, position: { x: number; y: number; }) => void;
  moveMode: boolean;
  wiringMode: boolean;
  onSelectComponent: (id: string | null) => void;
  log: (message: string, category?: LogCategory) => void;
}

export function useComponentDrag({
  circuit,
  toWorldSpace,
  onUpdateComponentPosition,
  moveMode,
  wiringMode,
  onSelectComponent,
  log,
}: UseComponentDragProps) {
  const [dragging, setDragging] = useState<{ id: string, offset: { x: number, y: number } } | null>(null);
  const dragPositions = useRef<{ [key: string]: { x: number, y: number } }>({});
  
  const isDragging = () => !!dragging;

  const handleComponentMouseDown = useCallback((e: MouseEvent, componentId: string) => {
    if (!moveMode || wiringMode) {
      return;
    }
    if (e.button !== 0 || (e.ctrlKey || e.metaKey)) {
      return;
    }
    
    const component = circuit.components.find(c => c.id === componentId);
    if (!component) {
      return;
    }
    
    const worldPos = toWorldSpace({ x: e.clientX, y: e.clientY });
    
    dragPositions.current[componentId] = component.position;
    
    const offset = {
      x: worldPos.x - component.position.x,
      y: worldPos.y - component.position.y,
    };
    
    setDragging({ id: componentId, offset });
  }, [circuit.components, moveMode, wiringMode, toWorldSpace]);
  
  useEffect(() => {
    if (!dragging) return;

    const handleMouseMove = (moveEvent: globalThis.MouseEvent) => {
        const newWorldPos = toWorldSpace({ x: moveEvent.clientX, y: moveEvent.clientY });
        const newX = newWorldPos.x - dragging.offset.x;
        const newY = newWorldPos.y - dragging.offset.y;
        dragPositions.current[dragging.id] = { x: newX, y: newY };
        // Force re-render while dragging
        setDragging(d => ({ ...d! }));
    };

    const handleMouseUp = () => {
      if (dragPositions.current[dragging.id]) {
        onUpdateComponentPosition(dragging.id, dragPositions.current[dragging.id]);
      }
      dragPositions.current = {};
      setDragging(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp, { once: true });

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, onUpdateComponentPosition, toWorldSpace]);


  return {
    dragging,
    dragPositions,
    handleComponentMouseDown,
    isDragging,
  };
}
