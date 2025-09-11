
'use client';

import { useRef, type MouseEvent, useCallback, useEffect, useState } from 'react';
import type { Circuit, ValidationResult, LogCategory } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Waves, Scissors, Move } from 'lucide-react';
import CircuitComponentView from '@/components/canvas/circuit-component-view';
import { usePanAndZoom } from '@/hooks/use-pan-and-zoom';
import { useComponentDrag } from '@/hooks/use-component-drag';
import { useWiring } from '@/hooks/use-wiring';
import { getPinAbsolutePosition, getComponentDimensions } from '@/lib/canvas-utils';
import WiringRuler from '../canvas/wiring-ruler';

interface CanvasProps {
  circuit: Circuit;
  validationResults: ValidationResult[];
  selectedComponentId: string | null;
  wiringMode: boolean;
  setWiringMode: (mode: boolean) => void;
  deleteMode: boolean;
  moveMode: boolean;
  onSelectComponent: (id: string | null) => void;
  onAddComponent: (type: 'Resistor' | 'Capacitor' | 'IC', position: { x: number; y: number }) => void;
  onAddConnection: (from: { componentId: string; pinId: string }, to: { componentId: string; pinId: string }, path: {x:number, y:number}[]) => void;
  onUpdateComponentPosition: (id: string, position: { x: number; y: number }) => void;
  onDeleteComponent: (id: string) => void;
  onDeleteConnection: (id: string) => void;
  log: (message: string, category?: LogCategory) => void;
}

export default function Canvas({ 
  circuit, 
  validationResults, 
  selectedComponentId, 
  onSelectComponent, 
  onAddComponent, 
  onAddConnection, 
  onUpdateComponentPosition,
  onDeleteComponent,
  onDeleteConnection,
  wiringMode, 
  setWiringMode,
  deleteMode,
  moveMode,
  log 
}: CanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [hoveredConnection, setHoveredConnection] = useState<string | null>(null);

  const { viewTransform, isPanning, toWorldSpace, handlePanStart, handlePanMove, handlePanEnd, handleWheel } = usePanAndZoom(canvasRef, log, wiringMode || deleteMode || moveMode);
  
  const { dragging, dragPositions, handleComponentMouseDown, isDragging } = useComponentDrag({
    circuit,
    viewTransform,
    toWorldSpace,
    onUpdateComponentPosition,
    moveMode,
    wiringMode,
    onSelectComponent,
    log
  });

  const { wireStart, wirePath, cursorPos, handlePinClick, handleCanvasClick, handleWiringMouseMove, resetWiring } = useWiring({
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
    log(`CanvasMouseDown: button=${e.button}`, 'general');
    
    // This is the key change: if we are in wiring mode and a wire has been started,
    // any click on the canvas should be treated as adding a new point to the wire.
    if (wiringMode && wireStart) {
      log(`CanvasMouseDown: In wiring mode with wire started. Calling handleCanvasClick.`, 'wiring');
      handleCanvasClick(e);
      return;
    }

    const targetIsCanvas = e.target === canvasRef.current || e.target === e.currentTarget.firstElementChild;
    log(`CanvasMouseDown: Target is canvas or child: ${targetIsCanvas}`);
    if (!targetIsCanvas) {
        log(`CanvasMouseDown: Click was not on canvas background. Ignoring.`, 'general');
        return;
    }
    
    if (!isDragging() && (e.button === 1 || (e.button === 0 && (e.ctrlKey || e.metaKey)))) {
      log(`CanvasMouseDown: Starting pan.`, 'pan');
      handlePanStart(e);
    } else if (e.button === 0 && !moveMode && !deleteMode && !wiringMode) { 
      log('CanvasMouseDown: Deselecting component.', 'general');
      onSelectComponent(null);
    }
  };
  
  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (isPanning) {
      handlePanMove(e);
    } else {
      handleWiringMouseMove(e);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    log(`CanvasDragOver: Item being dragged over canvas.`, 'general');
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const data = e.dataTransfer.getData('application/json');
    if (!data) return;
    const { type, name } = JSON.parse(data);
    log(`CanvasDrop: Dropped item of type '${type}' with name '${name}'`, 'general');
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
      const livePos = dragPositions.current[id];
      log(`getComponentPosition: Using live drag position for ${id}: {x:${livePos.x.toFixed(0)}, y:${livePos.y.toFixed(0)}}`, 'drag');
      return livePos;
    }
    const component = circuit.components.find(c => c.id === id);
    const staticPos = component ? component.position : { x: 0, y: 0 };
    // log(`getComponentPosition: Using static circuit position for ${id}: {x:${staticPos.x.toFixed(0)}, y:${staticPos.y.toFixed(0)}}`, 'drag');
    return staticPos;
  }
  
  const handleComponentClick = (id: string) => {
    if (deleteMode) {
      onDeleteComponent(id);
    } else {
      onSelectComponent(id);
    }
  }

  const handleConnectionClick = (id: string) => {
    if (deleteMode) {
      onDeleteConnection(id);
    }
  }

  const getCursor = () => {
    if (isPanning) return 'grabbing';
    if (wiringMode) return 'crosshair';
    if (deleteMode) return 'url(/scissors.svg) 12 12, auto';
    if (moveMode) return 'grab';
    return 'default';
  }
  
  const getModeInfo = () => {
    if (wiringMode) return { icon: Waves, text: 'WIRING MODE' };
    if (deleteMode) return { icon: Scissors, text: 'DELETE MODE' };
    if (moveMode) return { icon: Move, text: 'MOVE MODE' };
    return null;
  }

  const modeInfo = getModeInfo();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            log('Keydown: Escape pressed', 'general');
            if (wireStart) {
                log('Keydown: Cancelling current wire.', 'wiring');
                resetWiring();
            } else if (wiringMode) {
                log('Keydown: Exiting wiring mode.', 'wiring');
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
      style={{ cursor: getCursor(), userSelect: 'none' }}
    >
      {modeInfo && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 bg-primary/80 text-primary-foreground text-xs font-bold px-3 py-1 rounded-full flex items-center gap-2">
            <modeInfo.icon className="h-4 w-4" />
            {modeInfo.text}
            <span className="text-primary-foreground/70 font-mono">(ESC to exit)</span>
          </div>
      )}
      {wiringMode && <WiringRuler worldCursorPos={cursorPos} viewTransform={viewTransform} />}
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
                onSelect={handleComponentClick}
                onPinClick={handlePinClick}
                onComponentMouseDown={handleComponentMouseDown}
                deleteMode={deleteMode}
                moveMode={moveMode}
            />
          )
        })}
        <svg className="absolute top-0 left-0 pointer-events-none" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
          <defs>
              <marker id="marker-circle" markerWidth="4" markerHeight="4" refX="2" refY="2">
                  <circle cx="2" cy="2" r="1.5" className="fill-muted-foreground" />
              </marker>
          </defs>
          <g onMouseLeave={() => setHoveredConnection(null)}>
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

              const isHovered = deleteMode && hoveredConnection === conn.id;

              return (
                <g 
                  key={conn.id} 
                  onMouseEnter={() => deleteMode && setHoveredConnection(conn.id)}
                  onClick={() => handleConnectionClick(conn.id)}
                  className={cn(deleteMode && "pointer-events-auto cursor-pointer")}
                >
                  <path
                    d={pathData}
                    className={cn(
                      "fill-none stroke-2",
                      status === 'unchecked' && "stroke-muted-foreground/60",
                      status === 'pass' && "stroke-green-500",
                      status === 'fail' && "stroke-destructive",
                      isHovered && "stroke-destructive stroke-[4px]"
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
                if (cursorPos.x !== lastPoint.x || cursorPos.y !== lastPoint.y) {
                    if (Math.abs(cursorPos.x - lastPoint.x) > Math.abs(cursorPos.y - lastPoint.y)) {
                        liveSegment = `L ${cursorPos.x} ${lastPoint.y}`;
                    } else {
                        liveSegment = `L ${lastPoint.x} ${cursorPos.y}`;
                    }
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
