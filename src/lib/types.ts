export type PortType = 'power_in' | 'power_out' | 'data_io' | 'gnd';

export interface Port {
  id: string;
  name: string;
  type: PortType;
  voltage?: number;
  position: 'left' | 'right' | 'top' | 'bottom';
}

export interface Point {
  x: number;
  y: number;
}

export interface Module {
  id: string;
  name: string;
  description: string;
  partNumber: string;
  manufacturer: string;
  external: boolean;
  interfaces: string[];
  tags: string[];
  documentation: {
    datasheet: string;
    diagram: string;
  },
  operatingVoltage: [number, number]; // [min, max]
  ports: Port[];
}

export interface ModuleInstance extends Module {
  instanceId: string;
  position: Point;
}

export type ConnectionMode = 'curved' | 'orthogonal';

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
  waypoints: Point[];
  mode: ConnectionMode;
}
