'use client';
import { useState, useCallback, type MouseEvent } from 'react';
import type { Circuit } from '@/lib/types';
import { getPinAbsolutePosition } from '@/lib/canvas-utils';

interface UseWiringProps {
  circuit: Circuit;
  toWorldSpace: (coords: { x: number; y: number }) => { x: number; y: number };
  wiringMode: boolean;
  onAddConnection: (from: { componentId: string; pinId: string }, to: { componentId: string; pinId: string }, path: {x: number, y: number}[]) => void;
  log: (message: string) => void;
}

export function useWiring({
  circuit,
  toWorldSpace,
  wiringMode,
  onAddConnection,
  log,
}: UseWiringProps) {
  const [wireStart, setWireStart] = useState<{ componentId: string, pinId: string } | null>(null);
  const [wirePath, setWirePath] = useState<{ x: number, y: number }[]>([]);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });

  const resetWiring = useCallback(() => {
    setWireStart(null);
    setWirePath([]);
    log('Wiring state reset.');
  }, [log]);
  
  const handlePinClick = useCallback((e: MouseEvent, componentId: string, pinId: string) => {
    log(`handlePinClick: compId=${componentId}, pinId=${pinId}`);
    if (!wiringMode) {
      log('handlePinClick: Not in wiring mode, ignoring.');
      return;
    }
    e.stopPropagation();

    const component = circuit.components.find(c => c.id === componentId);
    if (!component) return;
    const pinPos = getPinAbsolutePosition(component, pinId);

    if (!wireStart) {
      log('handlePinClick: Starting a new wire.');
      setWireStart({ componentId, pinId });
      setWirePath([pinPos]);
      setCursorPos(pinPos);
      log(`handlePinClick: wireStart set to { comp: ${componentId}, pin: ${pinId} }, path: ${JSON.stringify([pinPos])}`);
    } else {
      log('handlePinClick: Ending a wire.');
      if (wireStart.componentId !== componentId) {
        const finalPath = [...wirePath];
        const lastPoint = finalPath[finalPath.length - 1];

        if (Math.abs(pinPos.x - lastPoint.x) > Math.abs(pinPos.y - lastPoint.y)) {
          finalPath.push({ x: pinPos.x, y: lastPoint.y }, pinPos);
        } else {
          finalPath.push({ x: lastPoint.x, y: pinPos.y }, pinPos);
        }

        const cleanedPath = finalPath.filter((p, i, arr) => {
          if (i === 0 || i === arr.length -1) return true;
          const prev = arr[i-1];
          const next = arr[i+1];
          return !( (p.x === prev.x && p.x === next.x) || (p.y === prev.y && p.y === next.y) );
        });

        log(`handlePinClick: Final path: ${JSON.stringify(cleanedPath)}`);
        onAddConnection(wireStart, { componentId, pinId }, cleanedPath);
      } else {
        log('handlePinClick: Clicked on same component, cancelling wire.');
      }
      resetWiring();
    }
  }, [wiringMode, wireStart, wirePath, circuit.components, onAddConnection, resetWiring, log]);

  const handleCanvasClick = (e: MouseEvent) => {
    if (!wiringMode || !wireStart) return;
    log('handleCanvasClick: Adding point to wire path.');

    const worldPos = toWorldSpace({ x: e.clientX, y: e.clientY });
    const lastPoint = wirePath[wirePath.length - 1];
    
    let newPoint: {x: number, y: number};
    // Determine if the next segment should be horizontal or vertical based on cursor position
    if (Math.abs(worldPos.x - lastPoint.x) > Math.abs(worldPos.y - lastPoint.y)) {
        newPoint = { x: worldPos.x, y: lastPoint.y };
    } else {
        newPoint = { x: lastPoint.x, y: worldPos.y };
    }
    setWirePath(p => [...p, newPoint]);
    log(`handleCanvasClick: New wire point: { x: ${newPoint.x}, y: ${newPoint.y} }`);
  };

  const handleWiringMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const worldPos = toWorldSpace({ x: e.clientX, y: e.clientY });
    setCursorPos(worldPos);
  };

  return {
    wireStart,
    wirePath,
    cursorPos,
    handlePinClick,
    handleCanvasClick,
    handleWiringMouseMove,
    resetWiring
  };
}
