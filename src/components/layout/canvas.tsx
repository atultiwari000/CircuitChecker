
'use client';

import { useRef, type MouseEvent, useCallback, useEffect } from 'react';
import type { Circuit, ValidationResult } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Waves } from 'lucide-react';
import CircuitComponentView from '@/components/canvas/circuit-component-view';
import { usePanAndZoom } from '@/hooks/use-pan-and-zoom';
import { useComponentDrag } from '@/hooks/use-component-drag';
import { useWiring } from '@/hooks/use-wiring';
import { getPinAbsolutePosition, getComponentDimensions } from '@/lib/canvas-utils';

interface CanvasProps {
  circuit: Circuit;
  validationResults: ValidationResult[];
  selectedComponentId: string | null;
  wiringMode: boolean;
  setWiringMode: (mode: boolean) => void;
  onSelectComponent: (id: string | null) => void;
  onAddComponent: (type: 'Resistor' | 'Capacitor' | 'IC', position: { x: number; y: number }) => void;
  onAddConnection: (from: { componentId: string; pinId: string }, to: { componentId: string; pinId: string }, path: {x:number, y:number}[]) => void;
  onUpdateComponentPosition: (id: string, position: { x: number; y: number }) => void;
  log: (message: string) => void;
}

export default function Canvas({ 
  circuit, 
  validationResults, 
  selectedComponentId, 
  onSelectComponent, 
  onAddComponent, 
  onAddConnection, 
  onUpdateComponentPosition, 
  wiringMode, 
  setWiringMode, 
  log 
}: CanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);

  const { viewTransform, isPanning, toWorldSpace, panStart, handlePanStart, handlePanMove, handlePanEnd, handleWheel } = usePanAndZoom(canvasRef, log);
  
  const { dragging, dragPositions, handleComponentMouseDown, isDragging } = useComponentDrag({
    circuit,
    viewTransform,
    toWorldSpace,
    onUpdateComponentPosition,
    wiringMode,
    onSelectComponent,
    log
  });

  const { wireStart, wirePath, cursorPos, handlePinClick, handleWiringMouseMove, resetWiring } = useWiring({
    circuit,
    toWorldSpace,
    wiringMode,
    onAddConnection,
    log
  });

  const getValidationStatus = (id: string) => {
    const result = validationResults.find(r => r.targetId === id);
    return result ? result.status : 'unchecked';
  };

  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    log(`handleMouseDown: button=${e.button}, target=${(e.target as HTMLElement).className}`);
    if (e.target !== canvasRef.current && e.target !== e.currentTarget.firstChild) return;

    if (!isDragging() && !wiringMode && (e.button === 1 || (e.button === 0 && (e.ctrlKey || e.metaKey)))) {
      handlePanStart(e);
    } else if (e.button === 0 && !wiringMode) {
      log('handleMouseDown: Deselecting component');
      onSelectComponent(null);
    }
  };
  
  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (isPanning) {
      handlePanMove(e);
    } else if (wiringMode) {
      handleWiringMouseMove(e);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const data = e.dataTransfer.getData('application/json');
    if (!data) return;
    const { type, name } = JSON.parse(data);
    log(`handleDrop: Dropped item of type '${type}' with name '${name}'`);
    if (type === 'component') {
      const position = toWorldSpace({ x: e.clientX, y: e.clientY });
      const dims = getComponentDimensions(name as keyof typeof getComponentDimensions);
      position.x -= dims.width / 2;
      position.y -= dims.height / 2;
      onAddComponent(name, position);
    }
  };

  const getComponentPosition = (id: string) => {
    if (dragging?.id === id && dragPositions.current[id]) {
      return dragPositions.current[id];
    }
    const component = circuit.components.find(c => c.id === id);
    return component ? component.position : { x: 0, y: 0 };
  }
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            log('Keydown: Escape pressed');
            if (wireStart) {
                log('Keydown: Cancelling current wire.');
                resetWiring();
            } else if (wiringMode) {
                log('Keydown: Exiting wiring mode.');
                setWiringMode(false);
            }
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [wireStart, wiringMode, setWiringMode, log, resetWiring]);


  return (
    <div 
      ref={canvasRef}
      className="w-full h-full overflow-hidden relative bg-grid-slate-100 dark:bg-grid-slate-900"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handlePanEnd}
      onMouseLeave={handlePanEnd}
      onWheel={handleWheel}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      style={{ cursor: isPanning ? 'grabbing' : wiringMode ? 'crosshair' : 'default', userSelect: 'none' }}
    >
      {wiringMode && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 bg-primary/80 text-primary-foreground text-xs font-bold px-3 py-1 rounded-full flex items-center gap-2">
            <Waves className="h-4 w-4" />
            WIRING MODE
            <span className="text-primary-foreground/70 font-mono">(ESC to exit)</span>
          </div>
      )}
      <div 
        className="relative w-full h-full"
        style={{ transform: `translate(${viewTransform.x}px, ${viewTransform.y}px) scale(${viewTransform.scale})`, transformOrigin: 'top left' }}
      >
        {circuit.components.map((comp) => {
          const position = getComponentPosition(comp.id);
          const componentWithLivePos = { ...comp, position };

          return (
            <CircuitComponentView
                key={comp.id}
                component={componentWithLivePos}
                isSelected={selectedComponentId === comp.id}
                validationStatus={getValidationStatus(comp.id)}
                onSelect={onSelectComponent}
                onPinClick={handlePinClick}
                onComponentMouseDown={handleComponentMouseDown}
            />
          )
        })}
        <svg className="absolute top-0 left-0 pointer-events-none" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
          <defs>
              <marker id="marker-circle" markerWidth="4" markerHeight="4" refX="2" refY="2">
                  <circle cx="2" cy="2" r="1.5" className="fill-muted-foreground" />
              </marker>
          </defs>
          <g>
            {circuit.connections.map(conn => {
              const fromComponent = circuit.components.find(c => c.id === conn.from.componentId);
              const toComponent = circuit.components.find(c => c.id === conn.to.componentId);

              if (!fromComponent || !toComponent) return null;
              
              const fromPosition = getComponentPosition(fromComponent.id);
              const toPosition = getComponentPosition(toComponent.id);

              const p1 = getPinAbsolutePosition({...fromComponent, position: fromPosition}, conn.from.pinId);
              const p2 = getPinAbsolutePosition({...toComponent, position: toPosition}, conn.to.pinId);
              const status = getValidationStatus(conn.id);

              let pathData = '';
              if (conn.path && conn.path.length > 0) {
                const pathStartOriginal = conn.path[0];
                const pathEndOriginal = conn.path[conn.path.length - 1];
                const dxStart = p1.x - pathStartOriginal.x;
                const dyStart = p1.y - pathStartOriginal.y;
                const dxEnd = p2.x - pathEndOriginal.x;
                const dyEnd = p2.y - pathEndOriginal.y;
                
                const adjustedPath = conn.path.map((p, i, arr) => {
                    const progress = arr.length > 1 ? i / (arr.length - 1) : 0;
                    const dx = dxStart * (1 - progress) + dxEnd * progress;
                    const dy = dyStart * (1 - progress) + dyEnd * progress;
                    return { x: p.x + dx, y: p.y + dy };
                });

                pathData = `M ${adjustedPath[0].x} ${adjustedPath[0].y}`;
                for(let i = 1; i < adjustedPath.length; i++) {
                    pathData += ` L ${adjustedPath[i].x} ${adjustedPath[i].y}`;
                }
              } else {
                 const midX = (p1.x + p2.x) / 2;
                 pathData = `M ${p1.x} ${p1.y} C ${midX} ${p1.y}, ${midX} ${p2.y}, ${p2.x} ${p2.y}`;
              }


              return (
                <g key={conn.id}>
                  <path
                    d={pathData}
                    className={cn(
                      "fill-none stroke-2",
                      status === 'unchecked' && "stroke-muted-foreground/60",
                      status === 'pass' && "stroke-green-500",
                      status === 'fail' && "stroke-destructive",
                    )}
                    markerStart="url(#marker-circle)"
                    markerEnd="url(#marker-circle)"
                  />
                   <path
                    d={pathData}
                    className="fill-none stroke-[12] stroke-transparent"
                  />
                </g>
              );
            })}
            {wireStart && wirePath.length > 0 && (() => {
                let pathString = `M ${wirePath[0].x} ${wirePath[0].y}`;
                for (let i = 1; i < wirePath.length; i++) {
                    pathString += ` L ${wirePath[i].x} ${wirePath[i].y}`;
                }

                const lastPoint = wirePath[wirePath.length - 1];
                let liveSegment = '';
                if (Math.abs(cursorPos.x - lastPoint.x) > Math.abs(cursorPos.y - lastPoint.y)) {
                    liveSegment = `L ${cursorPos.x} ${lastPoint.y}`;
                } else {
                    liveSegment = `L ${lastPoint.x} ${cursorPos.y}`;
                }
                
                return (
                    <path
                        d={pathString + liveSegment}
                        className="fill-none stroke-2 stroke-primary/70"
                        style={{strokeDasharray: '4 4'}}
                    />
                )
            })()}
          </g>
        </svg>
      </div>
    </div>
  );
}
