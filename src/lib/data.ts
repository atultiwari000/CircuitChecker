import type { CircuitComponent, Connection, ComponentType, CheckerType, Circuit } from './types';
import { ResistorIcon, CapacitorIcon, IcIcon as GenericIcIcon } from '@/components/icons';
import { Zap, Waves, Binary, Timer, Link, PencilRuler } from 'lucide-react';

export const libraryComponents: { name: ComponentType; icon: React.FC<any> }[] = [
  { name: 'Resistor', icon: ResistorIcon },
  { name: 'Capacitor', icon: CapacitorIcon },
  { name: 'IC', icon: GenericIcIcon },
];

export const checkerComponents: { name: CheckerType; icon: React.FC<any> }[] = [
  { name: 'Voltage', icon: Zap },
  { name: 'Current', icon: Waves },
  { name: 'Logic', icon: Binary },
  { name: 'Timing', icon: Timer },
  { name: 'Connectivity', icon: Link },
  { name: 'Custom', icon: PencilRuler },
];

const components: CircuitComponent[] = [
  {
    id: 'ic-1',
    type: 'IC',
    name: '555 Timer',
    position: { x: 400, y: 250 },
    properties: {
      'Logic Type': 'TTL',
      'Voltage Min (V)': 4.5,
      'Voltage Max (V)': 16,
    },
    pins: [
      { id: 'ic-1-p1', name: 'GND', x: 0, y: 15 },
      { id: 'ic-1-p2', name: 'TRG', x: 0, y: 35 },
      { id: 'ic-1-p3', name: 'THR', x: 0, y: 55 },
      { id: 'ic-1-p4', name: 'RST', x: 0, y: 75 },
      { id: 'ic-1-p5', name: 'VCC', x: 120, y: 15 },
      { id: 'ic-1-p6', name: 'DIS', x: 120, y: 35 },
      { id: 'ic-1-p7', name: 'OUT', x: 120, y: 55 },
      { id: 'ic-1-p8', name: 'CV', x: 120, y: 75 },
    ],
    dataset: {
      'Part Number': 'NE555P',
      'Manufacturer': 'Texas Instruments',
      'Package': 'PDIP-8',
      'Operating Temp': '0°C ~ 70°C',
    }
  },
];

const connections: Connection[] = [];


export const initialCircuit: Circuit = {
    components,
    connections,
}
