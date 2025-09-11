'use client';

import { useState, useRef, type MouseEvent } from 'react';
import type { Circuit, ValidationResult, CircuitComponent, Pin } from '@/lib/types';
import { ResistorIcon, CapacitorIcon, IcIcon } from '@/components/icons';
import { cn } from '@/lib/utils';
import { memo } from 'react';

interface CanvasProps {
  circuit: Circuit;
  validationResults: ValidationResult[];
  selectedComponentId: string | null;
  onSelectComponent: (id: string | null) => void;
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

const CircuitComponentView = memo(({ component, isSelected, validationStatus, onSelect }: { component: CircuitComponent, isSelected: boolean, validationStatus: 'pass' | 'fail' | 'unchecked', onSelect: (id: string) => void }) => {
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
        isSelected && "scale-105 z-10"
      )}
      onClick={() => onSelect(component.id)}
    >
      <div
        className={cn(
          "relative w-full h-full rounded-md border-2 bg-card/80 backdrop-blur-sm shadow transition-colors select-none",
          isSelected ? "border-primary" : "border-transparent",
          validationStatus === 'fail' && "border-destructive animate-pulse",
          validationStatus === 'pass' && "border-green-500"
        )}
      >
        <CompIcon className="w-full h-full p-2 text-foreground/80" />
        <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-xs font-semibold">{component.name}</span>
        
        {component.pins.map(pin => (
            <div key={pin.id} style={{ left: pin.x, top: pin.y }} className="absolute -translate-x-1/2 -translate-y-1/2">
                <div className="w-2 h-2 rounded-full bg-muted-foreground group-hover:bg-primary" />
            </div>
        ))}
      </div>
    </div>
  );
});
CircuitComponentView.displayName = 'CircuitComponentView';

export default function Canvas({ circuit, validationResults, selectedComponentId, onSelectComponent }: CanvasProps) {
  const [viewTransform, setViewTransform] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  const getValidationStatus = (id: string) => {
    return validationResults.find(r => r.targetId === id)?.status || 'unchecked';
  };

  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target === canvasRef.current || e.target === e.currentTarget.firstChild) {
      setIsPanning(true);
      panStart.current = { x: e.clientX - viewTransform.x, y: e.clientY - viewTransform.y };
      e.currentTarget.style.cursor = 'grabbing';
      onSelectComponent(null);
    }
  };

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (isPanning) {
      const x = e.clientX - panStart.current.x;
      const y = e.clientY - panStart.current.y;
      setViewTransform({ x, y });
    }
  };

  const handleMouseUp = (e: MouseEvent<HTMLDivElement>) => {
    setIsPanning(false);
    e.currentTarget.style.cursor = 'default';
  };

  return (
    <div 
      ref={canvasRef}
      className="w-full h-full overflow-hidden relative select-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div 
        className="relative w-full h-full"
        style={{ transform: `translate(${viewTransform.x}px, ${viewTransform.y}px)` }}
      >
        {circuit.components.map((comp) => (
          <CircuitComponentView
              key={comp.id}
              component={comp}
              isSelected={selectedComponentId === comp.id}
              validationStatus={getValidationStatus(comp.id)}
              onSelect={onSelectComponent}
          />
        ))}
        <svg className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <defs>
              <marker id="marker-circle" markerWidth="4" markerHeight="4" refX="2" refY="2">
                  <circle cx="2" cy="2" r="1.5" className="fill-muted-foreground" />
              </marker>
          </defs>
          {circuit.connections.map(conn => {
            const fromComponent = circuit.components.find(c => c.id === conn.from.componentId);
            const toComponent = circuit.components.find(c => c.id === conn.to.componentId);

            if (!fromComponent || !toComponent) return null;

            const p1 = getPinAbsolutePosition(fromComponent, conn.from.pinId);
            const p2 = getPinAbsolutePosition(toComponent, conn.to.pinId);
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
        </svg>
      </div>
    </div>
  );
}
