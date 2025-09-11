export type ComponentType = 'Resistor' | 'Capacitor' | 'IC';

export type CheckerType = 'Voltage' | 'Current' | 'Logic' | 'Timing' | 'Connectivity' | 'Custom';

export type LogCategory = 'general' | 'wiring' | 'pan' | 'drag';

export interface LogEntry {
  timestamp: string;
  message: string;
  category: LogCategory;
}

export interface Pin {
  id: string;
  name: string;
  x: number;
  y: number;
}

export interface CircuitComponent {
  id:string;
  type: ComponentType;
  name: string;
  position: { x: number; y: number };
  properties: { [key: string]: string | number };
  pins: Pin[];
  dataset: { [key: string]: string | number };
}

export interface Connection {
  id: string;
  from: { componentId: string; pinId: string };
  to: { componentId: string; pinId: string };
  path: { x: number, y: number }[];
}

export type ValidationStatus = 'pass' | 'fail' | 'unchecked';

export interface ValidationResult {
  targetId: string; // component ID or connection ID
  status: ValidationStatus;
  message?: string;
}

export interface Circuit {
    components: CircuitComponent[];
    connections: Connection[];
}
