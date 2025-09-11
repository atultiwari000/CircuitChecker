import type { CircuitComponent, ComponentType } from './types';

export const componentDimensions = {
    Resistor: { width: 80, height: 40 },
    Capacitor: { width: 80, height: 40 },
    IC: { width: 120, height: 90 },
};

export function getComponentDimensions(type: ComponentType) {
    return componentDimensions[type];
}

export function getPinAbsolutePosition(component: CircuitComponent, pinId: string): { x: number; y: number } {
  const pin = component.pins.find(p => p.id === pinId);
  if (!pin) {
    console.error(`Pin ${pinId} not found on component ${component.id}`);
    return { x: component.position.x, y: component.position.y };
  }
  return {
    x: component.position.x + pin.x,
    y: component.position.y + pin.y,
  };
}
