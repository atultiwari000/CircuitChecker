
'use client';
import { useState, useCallback, type MouseEvent } from 'react';
import type { Circuit, LogCategory } from '@/lib/types';
import { getPinAbsolutePosition } from '@/lib/canvas-utils';

interface UseWiringProps {
  circuit: Circuit;
  toWorldSpace: (coords: { x: number; y: number }) => { x: number; y: number };
  wiringMode: boolean;
  onAddConnection: (from: { componentId: string; pinId: string }, to: { componentId: string; pinId: string }, path: {x: number, y: number}[]) => void;
  log: (message: string, category?: LogCategory) => void;
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
    log('Wiring state reset.', 'wiring');
    setWireStart(null);
    setWirePath([]);
  }, [log]);
  
  const handlePinClick = useCallback((e: MouseEvent, componentId: string, pinId: string) => {
    log(`PinClick: compId=${componentId}, pinId=${pinId}, button=${e.button}`, 'wiring');
    if (!wiringMode) {
      log('PinClick: Not in wiring mode, ignoring.', 'wiring');
      return;
    }
    e.stopPropagation();

    const component = circuit.components.find(c => c.id === componentId);
    if (!component) {
      log(`PinClick: Component ${componentId} not found.`, 'wiring');
      return;
    }
    const pinPos = getPinAbsolutePosition(component, pinId);
    log(`PinClick: Pin absolute position: {x: ${pinPos.x.toFixed(0)}, y: ${pinPos.y.toFixed(0)}}`, 'wiring');

    if (!wireStart) {
      log('PinClick: Starting a new wire.', 'wiring');
      setWireStart({ componentId, pinId });
      setWirePath([pinPos]);
      setCursorPos(pinPos);
      log(`PinClick: wireStart set to { comp: ${componentId}, pin: ${pinId} }, path: ${JSON.stringify([pinPos])}`, 'wiring');
    } else {
      log('PinClick: Ending a wire.', 'wiring');
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
        log(`PinClick: Proposed final path: ${JSON.stringify(finalPath)}`, 'wiring');

        const cleanedPath = finalPath.filter((p, i, arr) => {
          if (i === 0 || i === arr.length -1) return true;
          const prev = arr[i-1];
          const next = arr[i+1];
          // Remove redundant points that are in a straight line
          const isRedundant = (p.x === prev.x && p.x === next.x) || (p.y === prev.y && p.y === next.y);
          if (isRedundant) log(`PinClick: Removing redundant point at index ${i}: ${JSON.stringify(p)}`, 'wiring');
          return !isRedundant;
        });
        
        log(`PinClick: Calling onAddConnection with cleaned path: ${JSON.stringify(cleanedPath)}`, 'wiring');
        onAddConnection(wireStart, { componentId, pinId }, cleanedPath);
      } else {
        log('PinClick: Clicked on the same start pin. Cancelling wire.', 'wiring');
      }
      resetWiring();
    }
  }, [wiringMode, wireStart, wirePath, circuit.components, onAddConnection, resetWiring, log, cursorPos]);

  const handleCanvasClick = (e: MouseEvent) => {
    log(`CanvasClick: Received click event at screen {x: ${e.clientX}, y: ${e.clientY}}`, 'wiring');
    if (!wiringMode || !wireStart) {
        log(`CanvasClick: Ignoring. WiringMode: ${wiringMode}, WireStart: ${!!wireStart}`, 'wiring');
        return;
    }
    log('CanvasClick: Adding point to wire path.', 'wiring');

    const worldPos = toWorldSpace({ x: e.clientX, y: e.clientY });
    const lastPoint = wirePath[wirePath.length - 1];
    log(`CanvasClick: World pos: {x:${worldPos.x.toFixed(0)}, y:${worldPos.y.toFixed(0)}}. Last path point: {x:${lastPoint.x.toFixed(0)}, y:${lastPoint.y.toFixed(0)}}`, 'wiring');
    
    let newPoint: {x: number, y: number};
    // Determine if the next segment should be horizontal or vertical based on cursor position
    if (Math.abs(worldPos.x - lastPoint.x) > Math.abs(worldPos.y - lastPoint.y)) {
        newPoint = { x: worldPos.x, y: lastPoint.y };
    } else {
        newPoint = { x: lastPoint.x, y: worldPos.y };
    }
    setWirePath(p => [...p, newPoint]);
    log(`CanvasClick: New wire point added: { x: ${newPoint.x.toFixed(0)}, y: ${newPoint.y.toFixed(0)} }`, 'wiring');
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
