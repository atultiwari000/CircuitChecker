'use client';
import { useState, useRef, useEffect, useCallback, type MouseEvent } from 'react';
import type { Circuit, LogCategory } from '@/lib/types';

interface UseComponentDragProps {
  circuit: Circuit;
  toWorldSpace: (coords: { x: number; y: number; }) => { x: number; y: number; };
  onUpdateComponentPosition: (id: string, position: { x: number; y: number; }) => void;
  moveMode: boolean;
  wiringMode: boolean;
  log: (message: string, category?: LogCategory) => void;
}

export function useComponentDrag({
  circuit,
  toWorldSpace,
  onUpdateComponentPosition,
  moveMode,
  wiringMode,
  log,
}: UseComponentDragProps) {
  const [dragging, setDragging] = useState<{ id: string, offset: { x: number, y: number } } | null>(null);
  const dragPositions = useRef<{ [key: string]: { x: number, y: number } }>({});
  
  const isDragging = () => !!dragging;

  const handleComponentMouseDown = (e: MouseEvent, componentId: string) => {
    log(`ComponentMouseDown: id=${componentId}, button=${e.button}, moveMode=${moveMode}, wiringMode=${wiringMode}`, 'drag');
    if (!moveMode || wiringMode) {
      log(`ComponentMouseDown: Aborting, not in move mode or wiring is active.`, 'drag');
      return;
    }
    if (e.button !== 0 || (e.ctrlKey || e.metaKey)) {
      log('ComponentMouseDown: Aborting, not a primary mouse button click.', 'drag');
      return;
    }
    
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
    log(`ComponentMouseDown: Start dragging component ${componentId} with offset {x:${offset.x.toFixed(2)}, y:${offset.y.toFixed(2)}}`, 'drag');
    
    setDragging({ id: componentId, offset });
  };
  
  useEffect(() => {
    if (!dragging) return;

    const handleMouseMove = (moveEvent: globalThis.MouseEvent) => {
        const newWorldPos = toWorldSpace({ x: moveEvent.clientX, y: moveEvent.clientY });
        const newX = newWorldPos.x - dragging.offset.x;
        const newY = newWorldPos.y - dragging.offset.y;
        dragPositions.current[dragging.id] = { x: newX, y: newY };
        log(`DragMove: New live position for ${dragging.id}: {x:${newX.toFixed(2)}, y:${newY.toFixed(2)}}`, 'drag');
        
        // This is a bit of a trick to force a re-render in the parent component
        // by making it seem like the state is changing, even though the reference is the same.
        // It's needed because we are updating a ref (dragPositions) but need the canvas to know.
        setDragging(d => ({ ...d! }));
    };

    const handleMouseUp = () => {
      log(`ComponentMouseUp: Drag ended for component.`, 'drag');
      if (dragPositions.current[dragging.id]) {
        const finalPosition = dragPositions.current[dragging.id];
        log(`ComponentMouseUp: Calling onUpdateComponentPosition for ${dragging.id} with final position {x:${finalPosition.x.toFixed(2)}, y:${finalPosition.y.toFixed(2)}}`, 'drag');
        onUpdateComponentPosition(dragging.id, finalPosition);
      } else {
        log(`ComponentMouseUp: Drag ended but no component was being tracked.`, 'drag');
      }
      dragPositions.current = {};
      setDragging(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      log('Cleanup: Removing drag listeners.', 'drag');
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, onUpdateComponentPosition, toWorldSpace, log]);


  return {
    dragging,
    dragPositions,
    handleComponentMouseDown,
    isDragging,
  };
}
