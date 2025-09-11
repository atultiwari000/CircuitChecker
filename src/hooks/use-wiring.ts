
'use client';
import { useState, useCallback, type MouseEvent } from 'react';
import type { Circuit } from '@/lib/types';
import { getPinAbsolutePosition } from '@/lib/canvas-utils';

interface UseWiringProps {
  circuit: Circuit;
  toWorldSpace: (coords: { x: number; y: number }) => { x: number; y: number };
  wiringMode: boolean;
  onAddConnection: (from: { componentId: string; pinId: string }, to: { componentId: string; pinId: string }, path: {x: number, y: number}[]) => void;
}

export function useWiring({
  circuit,
  toWorldSpace,
  wiringMode,
  onAddConnection,
}: UseWiringProps) {
  const [wireStart, setWireStart] = useState<{ componentId: string, pinId: string } | null>(null);
  const [wirePath, setWirePath] = useState<{ x: number, y: number }[]>([]);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });

  const resetWiring = useCallback(() => {
    setWireStart(null);
    setWirePath([]);
  }, []);
  
  const handlePinClick = useCallback((e: MouseEvent, componentId: string, pinId: string) => {
    if (!wiringMode) {
      return;
    }
    e.stopPropagation();

    const component = circuit.components.find(c => c.id === componentId);
    if (!component) {
      return;
    }
    const pinPos = getPinAbsolutePosition(component, pinId);

    if (!wireStart) {
      setWireStart({ componentId, pinId });
      setWirePath([pinPos]);
      setCursorPos(pinPos);
    } else {
      if (wireStart.componentId !== componentId || wireStart.pinId !== pinId) {
        
        const finalPath = [...wirePath];
        const lastPoint = finalPath[finalPath.length - 1];

        const lastSegmentIsHorizontal = Math.abs(cursorPos.x - lastPoint.x) > Math.abs(cursorPos.y - lastPoint.y);

        if (lastSegmentIsHorizontal) {
            if(lastPoint.y !== pinPos.y) finalPath.push({ x: pinPos.x, y: lastPoint.y });
        } else {
            if(lastPoint.x !== pinPos.x) finalPath.push({ x: lastPoint.x, y: pinPos.y });
        }

        finalPath.push(pinPos);

        const cleanedPath = finalPath.filter((p, i, arr) => {
          if (i === 0 || i === arr.length -1) return true;
          const prev = arr[i-1];
          const next = arr[i+1];
          // Remove redundant points that are in a straight line
          const isRedundant = (p.x === prev.x && p.x === next.x) || (p.y === prev.y && p.y === next.y);
          return !isRedundant;
        });
        
        onAddConnection(wireStart, { componentId, pinId }, cleanedPath);
      }
      resetWiring();
    }
  }, [wiringMode, wireStart, wirePath, circuit.components, onAddConnection, resetWiring, cursorPos]);

  const handleCanvasClick = (e: MouseEvent) => {
    if (!wiringMode || !wireStart) {
        return;
    }

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
