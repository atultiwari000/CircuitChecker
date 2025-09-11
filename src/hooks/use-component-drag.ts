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
    log(`ComponentMouseDown: id=${componentId}, button=${e.button}, wiringMode=${wiringMode}`, 'drag');
    if (wiringMode) {
      log('ComponentMouseDown: Aborting, wiring mode is active.', 'drag');
      return;
    }
    if (e.button !== 0 || (e.ctrlKey || e.metaKey)) {
      log('ComponentMouseDown: Aborting, not a primary mouse button click.', 'drag');
      return;
    }
    
    onSelectComponent(componentId);
    const component = circuit.components.find(c => c.id === componentId);
    if (!component) {
      log(`ComponentMouseDown: Component with id=${componentId} not found.`, 'drag');
      return;
    }
    
    const worldPos = toWorldSpace({ x: e.clientX, y: e.clientY });
    
    dragPositions.current[componentId] = component.position;
    
    const offset = {
      x: worldPos.x - component.position.x,
      y: worldPos.y - component.position.y,
    };
    setDragging({ id: componentId, offset });
    log(`ComponentMouseDown: Start dragging component ${componentId} with offset {x:${offset.x.toFixed(2)}, y:${offset.y.toFixed(2)}}`, 'drag');

    const handleMouseMove = (moveEvent: globalThis.MouseEvent) => {
      if (animationFrame.current) cancelAnimationFrame(animationFrame.current);
      animationFrame.current = requestAnimationFrame(() => {
        const currentDragging = dragging;
        if (!currentDragging) return;

        const newWorldPos = toWorldSpace({ x: moveEvent.clientX, y: moveEvent.clientY });
        
        const newX = newWorldPos.x - currentDragging.offset.x;
        const newY = newWorldPos.y - currentDragging.offset.y;

        dragPositions.current[componentId] = { x: newX, y: newY };
        
        // Force a re-render by creating a new dragging object
        setDragging(d => d ? { ...d } : null);
      });
    };

    const handleMouseUp = (upEvent: globalThis.MouseEvent) => {
      if (animationFrame.current) cancelAnimationFrame(animationFrame.current);
      
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      
      const currentDragging = dragging;
      if (currentDragging && dragPositions.current[currentDragging.id]) {
        log(`ComponentMouseUp: End dragging component ${currentDragging.id}`, 'drag');
        onUpdateComponentPosition(currentDragging.id, dragPositions.current[currentDragging.id]);
      } else {
        log(`ComponentMouseUp: Drag ended but no component was being dragged.`, 'drag');
      }
      setDragging(null);
      dragPositions.current = {};
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  useEffect(() => {
    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
    };
  }, []);

  return {
    dragging,
    dragPositions,
    handleComponentMouseDown,
    isDragging,
  };
}
