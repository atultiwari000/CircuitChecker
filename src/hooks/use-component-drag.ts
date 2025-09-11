'use client';
import { useState, useRef, useEffect, useCallback, type MouseEvent, type RefObject } from 'react';
import type { Circuit, CircuitComponent, LogCategory } from '@/lib/types';
import { getComponentDimensions } from '@/lib/canvas-utils';

interface UseComponentDragProps {
  circuit: Circuit;
  viewTransform: { x: number; y: number; scale: number };
  toWorldSpace: (coords: { x: number; y: number }) => { x: number; y: number };
  onUpdateComponentPosition: (id: string, position: { x: number; y: number }) => void;
  moveMode: boolean;
  onSelectComponent: (id: string | null) => void;
  log: (message: string, category?: LogCategory) => void;
}

export function useComponentDrag({
  circuit,
  viewTransform,
  toWorldSpace,
  onUpdateComponentPosition,
  moveMode,
  onSelectComponent,
  log,
}: UseComponentDragProps) {
  const [dragging, setDragging] = useState<{ id: string, offset: { x: number, y: number } } | null>(null);
  const dragPositions = useRef<{ [key: string]: { x: number, y: number } }>({});
  const animationFrame = useRef<number>();

  const isDragging = () => !!dragging;

  const handleComponentMouseDown = (e: MouseEvent, componentId: string) => {
    log(`ComponentMouseDown: id=${componentId}, button=${e.button}, moveMode=${moveMode}`, 'drag');
    if (!moveMode || wiringMode) {
      log(`ComponentMouseDown: Aborting, moveMode=${moveMode}, wiringMode=${wiringMode}.`, 'drag');
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

    const handleMouseMove = (moveEvent: globalThis.MouseEvent) => {
        if (animationFrame.current) {
            cancelAnimationFrame(animationFrame.current);
        }
        animationFrame.current = requestAnimationFrame(() => {
            setDragging(d => {
                if (!d) return null;
                const newWorldPos = toWorldSpace({ x: moveEvent.clientX, y: moveEvent.clientY });
                const newX = newWorldPos.x - d.offset.x;
                const newY = newWorldPos.y - d.offset.y;
                dragPositions.current[d.id] = { x: newX, y: newY };
                log(`DragMove: New live position for ${d.id}: {x:${newX.toFixed(2)}, y:${newY.toFixed(2)}}`, 'drag');
                // Force re-render by creating a new object
                return { ...d };
            });
        });
    };

    const handleMouseUp = (upEvent: globalThis.MouseEvent) => {
      log(`ComponentMouseUp: Drag ended for component.`, 'drag');
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
      
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      
      setDragging(d => {
        if (d && dragPositions.current[d.id]) {
            const finalPosition = dragPositions.current[d.id];
            log(`ComponentMouseUp: Calling onUpdateComponentPosition for ${d.id} with final position {x:${finalPosition.x.toFixed(2)}, y:${finalPosition.y.toFixed(2)}}`, 'drag');
            onUpdateComponentPosition(d.id, finalPosition);
        } else {
            log(`ComponentMouseUp: Drag ended but no component was being tracked.`, 'drag');
        }
        return null;
      });

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
