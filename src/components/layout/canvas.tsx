'use client';

import { useState, useRef, type MouseEvent, memo, useCallback } from 'react';
import type { Circuit, ValidationResult, CircuitComponent, Pin } from '@/lib/types';
import { ResistorIcon, CapacitorIcon, IcIcon } from '@/components/icons';
import { cn } from '@/lib/utils';


interface CanvasProps {
  circuit: Circuit;
  validationResults: ValidationResult[];
  selectedComponentId: string | null;
  onSelectComponent: (id: string | null) => void;
  onAddComponent: (type: 'Resistor' | 'Capacitor' | 'IC', position: { x: number; y: number }) => void;
  onAddConnection: (from: { componentId: string; pinId: string }, to: { componentId: string; pinId: string }) => void;
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

const CircuitComponentView = memo(({ component, isSelected, validationStatus, onSelect, onPinMouseDown, onPinMouseUp, onComponentMouseDown }: { component: CircuitComponent, isSelected: boolean, validationStatus: 'pass' | 'fail' | 'unchecked', onSelect: (id: string) => void, onPinMouseDown: (e: MouseEvent, componentId: string, pinId: string) => void, onPinMouseUp: (e: MouseEvent, componentId: string, pinId: string) => void, onComponentMouseDown: (e: MouseEvent, componentId: string) => void }) => {
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
        "absolute cursor-pointer transition-all duration-200 group",
        isSelected && "z-10"
      )}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(component.id)
      }}
      onMouseDown={(e) => onComponentMouseDown(e, component.id)}
    >
      <div
        className={cn(
          "relative w-full h-full select-none",
          validationStatus === 'fail' && "animate-pulse"
        )}
      >
        <CompIcon 
          className={cn(
            "w-full h-full text-foreground/80 transition-all",
            isSelected ? "stroke-primary" : "stroke-current",
            validationStatus === 'fail' && "stroke-destructive",
            validationStatus === 'pass' && "stroke-green-500",
          )}
        />
        <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-xs font-semibold">{component.name}</span>
        
        {component.pins.map(pin => (
            <div 
                key={pin.id} 
                style={{ left: pin.x, top: pin.y }} 
                className="absolute -translate-x-1/2 -translate-y-1/2 p-2"
                onMouseDown={(e) => onPinMouseDown(e, component.id, pin.id)}
                onMouseUp={(e) => onPinMouseUp(e, component.id, pin.id)}
            >
                <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground group-hover:bg-primary transition-colors" />
            </div>
        ))}
      </div>
    </div>
  );
});
CircuitComponentView.displayName = 'CircuitComponentView';

export default function Canvas({ circuit, validationResults, selectedComponentId, onSelectComponent, onAddComponent, onAddConnection, onUpdateComponentPosition }: CanvasProps) {
  const [viewTransform, setViewTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  const [linking, setLinking] = useState<{ from: { componentId: string, pinId: string }, to: { x: number, y: number } } | null>(null);
  const [dragging, setDragging] = useState<{ id: string, offset: { x: number, y: number }, currentPos: {x: number, y: number} } | null>(null);


  const getValidationStatus = (id: string) => {
    return validationResults.find(r => r.targetId === id)?.status || 'unchecked';
  };

  const toWorldSpace = ({ x, y }: { x: number, y: number }) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: (x - rect.left - viewTransform.x) / viewTransform.scale,
      y: (y - rect.top - viewTransform.y) / viewTransform.scale,
    };
  };

  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target === canvasRef.current || e.target === e.currentTarget.firstChild) {
      if (e.button === 1 || (e.button === 0 && e.ctrlKey)) { // Middle mouse button or Ctrl+Click
        setIsPanning(true);
        panStart.current = { x: e.clientX - viewTransform.x, y: e.clientY - viewTransform.y };
        e.currentTarget.style.cursor = 'grabbing';
      } else if (e.button === 0) {
        onSelectComponent(null);
      }
    }
  };

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (isPanning) {
      const x = e.clientX - panStart.current.x;
      const y = e.clientY - panStart.current.y;
      setViewTransform(v => ({...v, x, y}));
    }
    const worldPos = toWorldSpace({ x: e.clientX, y: e.clientY });
    if (linking) {
      setLinking(l => l && { ...l, to: { x: worldPos.x, y: worldPos.y } });
    }
    if (dragging) {
      setDragging(d => d && ({
        ...d,
        currentPos: {
          x: worldPos.x - d.offset.x,
          y: worldPos.y - d.offset.y,
        }
      }));
    }
  };

  const handleMouseUp = (e: MouseEvent<HTMLDivElement>) => {
    if (isPanning) {
        setIsPanning(false);
        e.currentTarget.style.cursor = 'default';
    }
    if (dragging) {
      onUpdateComponentPosition(dragging.id, dragging.currentPos);
      setDragging(null);
    }
    if (linking) {
      setLinking(null);
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
    e.stopPropagation();
    if(e.button !== 0) return;

    onSelectComponent(componentId);
    const component = circuit.components.find(c => c.id === componentId);
    if (!component) return;

    const worldPos = toWorldSpace({ x: e.clientX, y: e.clientY });
    setDragging({
      id: componentId,
      offset: {
        x: worldPos.x - component.position.x,
        y: worldPos.y - component.position.y,
      },
      currentPos: component.position,
    });
  };

  const handlePinMouseDown = useCallback((e: MouseEvent, componentId: string, pinId: string) => {
    e.stopPropagation();
    if (e.button !== 0) return;
    const worldPos = toWorldSpace({ x: e.clientX, y: e.clientY });
    setLinking({ from: { componentId, pinId }, to: worldPos });
  }, [viewTransform]);

  const handlePinMouseUp = useCallback((e: MouseEvent, componentId: string, pinId: string) => {
    e.stopPropagation();
    if (linking && linking.from.componentId !== componentId) {
      onAddConnection(linking.from, { componentId, pinId });
    }
    setLinking(null);
  }, [linking, onAddConnection]);

  const getComponentPosition = (id: string) => {
    if (dragging?.id === id) {
      return dragging.currentPos;
    }
    return circuit.components.find(c => c.id === id)?.position || { x: 0, y: 0 };
  }


  return (
    <div 
      ref={canvasRef}
      className="w-full h-full overflow-hidden relative select-none bg-grid-slate-100 dark:bg-grid-slate-900"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      style={{ cursor: isPanning ? 'grabbing' : 'default' }}
    >
      <div 
        className="relative w-full h-full"
        style={{ transform: `translate(${viewTransform.x}px, ${viewTransform.y}px) scale(${viewTransform.scale})`, transformOrigin: 'top left' }}
      >
        {circuit.components.map((comp) => {
          const position = getComponentPosition(comp.id);
          const componentWithDragPos = {...comp, position };

          return (
            <CircuitComponentView
                key={comp.id}
                component={componentWithDragPos}
                isSelected={selectedComponentId === comp.id}
                validationStatus={getValidationStatus(comp.id)}
                onSelect={onSelectComponent}
                onPinMouseDown={handlePinMouseDown}
                onPinMouseUp={handlePinMouseUp}
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

              const midX = (p1.x + p2.x) / 2;
              const pathData = `M ${p1.x} ${p1.y} C ${midX} ${p1.y}, ${midX} ${p2.y}, ${p2.x} ${p2.y}`;

              return (
                <g key={conn.id}>
                  <path
                    d={pathData}
                    className={cn(
                      "fill-none stroke-2 transition-all",
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
            {linking && (() => {
                const fromComponent = circuit.components.find(c => c.id === linking.from.componentId);
                if (!fromComponent) return null;
                
                const fromPosition = getComponentPosition(fromComponent.id);

                const p1 = getPinAbsolutePosition({...fromComponent, position: fromPosition}, linking.from.pinId);
                const p2 = linking.to;
                const midX = (p1.x + p2.x) / 2;
                const pathData = `M ${p1.x} ${p1.y} C ${midX} ${p1.y}, ${midX} ${p2.y}, ${p2.x} ${p2.y}`;
                return (
                    <path
                        d={pathData}
                        className="fill-none stroke-2 stroke-primary/70 stroke-dasharray-4"
                        style={{strokeDasharray: '4 4'}}
                        markerEnd="url(#marker-circle)"
                    />
                )
            })()}
          </g>
        </svg>
      </div>
    </div>
  );
}
