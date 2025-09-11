
'use client';

import { useState, useRef, type MouseEvent, memo, useCallback, useEffect } from 'react';
import type { Circuit, ValidationResult, CircuitComponent, Pin } from '@/lib/types';
import { ResistorIcon, CapacitorIcon, IcIcon } from '@/components/icons';
import { cn } from '@/lib/utils';
import { Waves } from 'lucide-react';


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
}

const componentIcons = {
  Resistor: ResistorIcon,
  Capacitor: CapacitorIcon,
  IC: IcIcon,
};

const componentDimensions = {
  Resistor: { width: 80, height: 40 },
  Capacitor: { width: 80, height: 40 },
  IC: { width: 120, height: 90 },
};

function getPinAbsolutePosition(component: CircuitComponent, pinId: string): { x: number; y: number } {
  const pin = component.pins.find(p => p.id === pinId);
  if (!pin) return { x: 0, y: 0 };
  return {
    x: component.position.x + pin.x,
    y: component.position.y + pin.y,
  };
}

const CircuitComponentView = memo(({ component, isSelected, validationStatus, onSelect, onPinClick, onComponentMouseDown }: { component: CircuitComponent, isSelected: boolean, validationStatus: 'pass' | 'fail' | 'unchecked', onSelect: (id: string) => void, onPinClick: (e: MouseEvent, componentId: string, pinId: string) => void, onComponentMouseDown: (e: MouseEvent, componentId: string) => void }) => {
  const CompIcon = componentIcons[component.type];
  const dims = componentDimensions[component.type];

  return (
    <div
      style={{
        left: component.position.x,
        top: component.position.y,
        width: dims.width,
        height: dims.height,
      }}
      className={cn(
        "absolute group",
        isSelected && "z-10",
        onComponentMouseDown && 'cursor-pointer'
      )}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(component.id)
      }}
      onMouseDown={(e) => onComponentMouseDown?.(e, component.id)}
    >
      <div
        className={cn(
          "relative w-full h-full select-none",
          validationStatus === 'fail' && "animate-pulse"
        )}
      >
        <CompIcon 
          className={cn(
            "w-full h-full text-foreground/80",
            isSelected ? "stroke-primary" : "stroke-current",
            validationStatus === 'fail' && "stroke-destructive",
            validationStatus === 'pass' && "stroke-green-500",
          )}
        />
        <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-xs font-semibold select-none">{component.name}</span>
        
        {component.pins.map(pin => (
            <div 
                key={pin.id} 
                style={{ left: pin.x, top: pin.y }} 
                className="absolute -translate-x-1/2 -translate-y-1/2 p-2 cursor-crosshair"
                onClick={(e) => onPinClick(e, component.id, pin.id)}
            >
                <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground group-hover:bg-primary transition-colors" />
            </div>
        ))}
      </div>
    </div>
  );
});
CircuitComponentView.displayName = 'CircuitComponentView';

export default function Canvas({ circuit, validationResults, selectedComponentId, onSelectComponent, onAddComponent, onAddConnection, onUpdateComponentPosition, wiringMode, setWiringMode }: CanvasProps) {
  const [viewTransform, setViewTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  const [wireStart, setWireStart] = useState<{ componentId: string, pinId: string } | null>(null);
  const [wirePath, setWirePath] = useState<{x: number, y: number}[]>([]);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });

  const [dragging, setDragging] = useState<{ id: string, offset: { x: number, y: number } } | null>(null);
  
  const dragPositions = useRef<{[key:string]: {x: number, y: number}}>({});


  const getValidationStatus = (id: string) => {
    const result = validationResults.find(r => r.targetId === id);
    return result ? result.status : 'unchecked';
  };

  const toWorldSpace = useCallback(({ x, y }: { x: number, y: number }) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: (x - rect.left - viewTransform.x) / viewTransform.scale,
      y: (y - rect.top - viewTransform.y) / viewTransform.scale,
    };
  }, [viewTransform]);

  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target !== canvasRef.current && e.target !== e.currentTarget.firstChild) return;

    if (wiringMode && wireStart && e.button === 0) {
        const worldPos = toWorldSpace({ x: e.clientX, y: e.clientY });
        const lastPoint = wirePath[wirePath.length - 1];
        
        const dx = Math.abs(worldPos.x - lastPoint.x);
        const dy = Math.abs(worldPos.y - lastPoint.y);
  
        let nextPoint: {x: number, y: number};
        // This logic determines which segment to add (horizontal or vertical)
        if (dx > dy) {
            nextPoint = { x: worldPos.x, y: lastPoint.y };
        } else {
            nextPoint = { x: lastPoint.x, y: worldPos.y };
        }
        setWirePath(p => [...p, nextPoint]);
  
    } else if (!wiringMode && (e.button === 1 || (e.button === 0 && (e.ctrlKey || e.metaKey)))) {
      setIsPanning(true);
      panStart.current = { x: e.clientX - viewTransform.x, y: e.clientY - viewTransform.y };
      e.currentTarget.style.cursor = 'grabbing';
    } else if (e.button === 0) {
      onSelectComponent(null);
    }
  };

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const worldPos = toWorldSpace({ x: e.clientX, y: e.clientY });
    setCursorPos(worldPos);

    if (isPanning) {
      const x = e.clientX - panStart.current.x;
      const y = e.clientY - panStart.current.y;
      setViewTransform(v => ({...v, x, y}));
    }

    if (!wiringMode && dragging && canvasRef.current) {
      const componentBeingDragged = circuit.components.find(c => c.id === dragging.id);
      if (!componentBeingDragged) return;

      const compDims = componentDimensions[componentBeingDragged.type];
      const canvasRect = canvasRef.current.getBoundingClientRect();

      const canvasLeft = -viewTransform.x / viewTransform.scale;
      const canvasTop = -viewTransform.y / viewTransform.scale;
      const canvasRight = (canvasRect.width - viewTransform.x) / viewTransform.scale;
      const canvasBottom = (canvasRect.height - viewTransform.y) / viewTransform.scale;

      let newX = worldPos.x - dragging.offset.x;
      let newY = worldPos.y - dragging.offset.y;

      newX = Math.max(canvasLeft, Math.min(newX, canvasRight - compDims.width));
      newY = Math.max(canvasTop, Math.min(newY, canvasBottom - compDims.height));

      dragPositions.current[dragging.id] = { x: newX, y: newY };
      setDragging(d => d ? { ...d } : null);
    }
  };

  const handleMouseUp = (e: MouseEvent<HTMLDivElement>) => {
    if (isPanning) {
        setIsPanning(false);
        e.currentTarget.style.cursor = 'default';
    }
    if (dragging) {
      if (dragPositions.current[dragging.id]) {
        onUpdateComponentPosition(dragging.id, dragPositions.current[dragging.id]);
      }
      setDragging(null);
      dragPositions.current = {};
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!canvasRef.current) return;
    const { clientX, clientY, deltaY } = e;
    const rect = canvasRef.current.getBoundingClientRect();
    
    const mouseX = clientX - rect.left;
    const mouseY = clientY - rect.top;

    const scaleFactor = 1.1;
    const newScale = deltaY < 0 ? viewTransform.scale * scaleFactor : viewTransform.scale / scaleFactor;
    const clampedScale = Math.max(0.2, Math.min(newScale, 3));

    const worldX = (mouseX - viewTransform.x) / viewTransform.scale;
    const worldY = (mouseY - viewTransform.y) / viewTransform.scale;

    const newX = mouseX - worldX * clampedScale;
    const newY = mouseY - worldY * clampedScale;

    setViewTransform({
        x: newX,
        y: newY,
        scale: clampedScale,
    });
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const data = e.dataTransfer.getData('application/json');
    if (!data) return;
    const { type, name } = JSON.parse(data);
    if (type === 'component') {
      const position = toWorldSpace({ x: e.clientX, y: e.clientY });
      const dims = componentDimensions[name as keyof typeof componentDimensions];
      position.x -= dims.width / 2;
      position.y -= dims.height / 2;
      onAddComponent(name, position);
    }
  };

  const handleComponentMouseDown = (e: MouseEvent, componentId: string) => {
    if(wiringMode || e.button !== 0 || (e.ctrlKey || e.metaKey)) return;
    e.stopPropagation();

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
  };

  const handlePinClick = useCallback((e: MouseEvent, componentId: string, pinId: string) => {
    if (!wiringMode) return;
    e.stopPropagation();

    if (!wireStart) {
      // Start a new wire
      const component = circuit.components.find(c => c.id === componentId);
      if (!component) return;
      const startPos = getPinAbsolutePosition(component, pinId);
      setWireStart({ componentId, pinId });
      setWirePath([startPos]);
    } else {
      // End a wire
      if (wireStart.componentId !== componentId) {
        
        const endComponent = circuit.components.find(c => c.id === componentId);
        if(!endComponent) return;
        const endPinPos = getPinAbsolutePosition(endComponent, pinId);

        // Add the last segment snapping to the end pin
        const finalPath = [...wirePath];
        const lastPoint = finalPath[finalPath.length - 1];
        const dx = Math.abs(endPinPos.x - lastPoint.x);
        const dy = Math.abs(endPinPos.y - lastPoint.y);

        let pathSegment = {};
        if (dx > dy) {
            pathSegment = { x: endPinPos.x, y: lastPoint.y };
        } else {
            pathSegment = { x: lastPoint.x, y: endPinPos.y };
        }
        
        // Add the segment only if it's different from the last point
        if (JSON.stringify(pathSegment) !== JSON.stringify(lastPoint)) {
          finalPath.push(pathSegment as {x: number, y: number});
        }
        finalPath.push(endPinPos);

        onAddConnection(wireStart, { componentId, pinId }, finalPath);
      }
      // Reset for next wire
      setWireStart(null);
      setWirePath([]);
    }
  }, [wiringMode, wireStart, wirePath, circuit.components, onAddConnection]);

  const getComponentPosition = (id: string) => {
    if (dragging?.id === id && dragPositions.current[id]) {
      return dragPositions.current[id];
    }
    const component = circuit.components.find(c => c.id === id);
    return component ? component.position : { x: 0, y: 0 };
  }

  const cancelWiring = useCallback(() => {
    setWireStart(null);
    setWirePath([]);
    setWiringMode(false);
  }, [setWiringMode]);


  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            if (wireStart) {
                setWireStart(null);
                setWirePath([]);
            } else if (wiringMode) {
                setWiringMode(false);
            }
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [wireStart, wiringMode, setWiringMode]);


  return (
    <div 
      ref={canvasRef}
      className="w-full h-full overflow-hidden relative bg-grid-slate-100 dark:bg-grid-slate-900"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
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
                 // Adjust saved relative path to current component positions.
                 // This is a simplified adjustment and might not be perfect for complex path deformations.
                const pathStartOriginal = conn.path[0];
                const pathEndOriginal = conn.path[conn.path.length - 1];
                const dxStart = p1.x - pathStartOriginal.x;
                const dyStart = p1.y - pathStartOriginal.y;
                const dxEnd = p2.x - pathEndOriginal.x;
                const dyEnd = p2.y - pathEndOriginal.y;
                
                // We'll interpolate the translation difference along the path.
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
                 // Fallback for old connections without a path or if something goes wrong.
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

                // Draw live segment to cursor
                const lastPoint = wirePath[wirePath.length - 1];
                const dx = Math.abs(cursorPos.x - lastPoint.x);
                const dy = Math.abs(cursorPos.y - lastPoint.y);
                if (dx > dy) {
                    pathString += ` L ${cursorPos.x} ${lastPoint.y}`;
                } else {
                    pathString += ` L ${lastPoint.x} ${cursorPos.y}`;
                }
                
                return (
                    <path
                        d={pathString}
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

    