export type PortType = 'power_in' | 'power_out' | 'data_io' | 'gnd';

export interface Port {
  id: string;
  name: string;
  type: PortType;
  voltage?: number;
  position: 'left' | 'right' | 'top' | 'bottom';
}

export interface Module {
  id: string;
  type?: string;
  name: string;
  description?: string;
  partNumber: string;
  manufacturer?: string;
  external: boolean;
  interfaces: string[];
  tags: string[];
  documentation: {
    datasheet: string;
    diagram: string;
  },
  operatingVoltage: [number, number]; // [min, max]
  pins: Port[];
}

export interface ModuleInstance extends Module {
  instanceId: string;
  position: { x: number; y: number };
}

export interface Connection {
  id: string;
  from: {
    instanceId: string;
    portId: string;
  };
  to: {
    instanceId: string;
    portId: string;
  };
  status: 'ok' | 'incompatible' | 'pending';
}
