'use client';
import { memo, type MouseEvent } from 'react';
import type { CircuitComponent } from '@/lib/types';
import { ResistorIcon, CapacitorIcon, IcIcon } from '@/components/icons';
import { cn } from '@/lib/utils';
import { getComponentDimensions } from '@/lib/canvas-utils';

const componentIcons = {
    Resistor: ResistorIcon,
    Capacitor: CapacitorIcon,
    IC: IcIcon,
};

interface CircuitComponentViewProps {
    component: CircuitComponent;
    isSelected: boolean;
    validationStatus: 'pass' | 'fail' | 'unchecked';
    deleteMode: boolean;
    moveMode: boolean;
    onSelect: (id: string) => void;
    onPinClick: (e: MouseEvent, componentId: string, pinId: string) => void;
    onComponentMouseDown: (e: MouseEvent, componentId: string) => void;
}

const CircuitComponentView = memo(({ component, isSelected, validationStatus, deleteMode, moveMode, onSelect, onPinClick, onComponentMouseDown }: CircuitComponentViewProps) => {
  const CompIcon = componentIcons[component.type];
  const dims = getComponentDimensions(component.type);

  const getCursor = () => {
    if (deleteMode) return 'pointer';
    if (moveMode) return 'grab';
    return 'pointer';
  }

  return (
    <div
      style={{
        left: component.position.x,
        top: component.position.y,
        width: dims.width,
        height: dims.height,
        cursor: getCursor()
      }}
      className={cn(
        "absolute group",
        isSelected && "z-10",
        deleteMode && "hover:opacity-70 transition-opacity",
      )}
      onMouseDown={(e) => {
        // Stop propagation to prevent canvas-level events like deselection or panning
        e.stopPropagation();
        onSelect(component.id);
        if (deleteMode) return;
        onComponentMouseDown?.(e, component.id);
      }}
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
            deleteMode && "group-hover:stroke-destructive"
          )}
        />
        <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-xs font-semibold select-none">{component.name}</span>
        
        {component.pins.map(pin => (
            <div 
                key={pin.id} 
                style={{ left: pin.x, top: pin.y }} 
                className="absolute -translate-x-1/2 -translate-y-1/2 p-2 cursor-crosshair"
                onMouseDown={(e) => { e.stopPropagation(); onPinClick(e, component.id, pin.id); }}
            >
                <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground group-hover:bg-primary transition-colors" />
            </div>
        ))}
      </div>
    </div>
  );
});

CircuitComponentView.displayName = 'CircuitComponentView';

export default CircuitComponentView;
