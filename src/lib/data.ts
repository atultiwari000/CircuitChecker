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
    position: { x: 300, y: 200 },
    properties: {
      'Logic Type': 'TTL',
      'Voltage Min (V)': 4.5,
      'Voltage Max (V)': 16,
    },
    pins: [
      { id: 'ic-1-p1', name: 'GND', x: 0, y: 30 },
      { id: 'ic-1-p2', name: 'TRG', x: 0, y: 60 },
      { id: 'ic-1-p3', name: 'OUT', x: 120, y: 45 },
      { id: 'ic-1-p4', name: 'VCC', x: 120, y: 75 },
    ],
    dataset: {
      'Part Number': 'NE555P',
      'Manufacturer': 'Texas Instruments',
      'Package': 'PDIP-8',
      'Operating Temp': '0°C ~ 70°C',
    }
  },
  {
    id: 'r-1',
    type: 'Resistor',
    name: 'R1',
    position: { x: 500, y: 250 },
    properties: {
      'Resistance (Ω)': 10000,
      'Power (W)': 0.25,
    },
    pins: [
      { id: 'r-1-p1', name: '1', x: 0, y: 20 },
      { id: 'r-1-p2', name: '2', x: 80, y: 20 },
    ],
    dataset: {
      'Part Number': 'CRCW080510K0FKEA',
      'Manufacturer': 'Vishay',
      'Tolerance': '1%',
    }
  },
  {
    id: 'c-1',
    type: 'Capacitor',
    name: 'C1',
    position: { x: 100, y: 150 },
    properties: {
      'Capacitance (uF)': 10,
      'Voltage Rating (V)': 25,
    },
    pins: [
        { id: 'c-1-p1', name: '1', x: 0, y: 20 },
        { id: 'c-1-p2', name: '2', x: 80, y: 20 },
    ],
    dataset: {
        'Part Number': 'C0805C106K4RACTU',
        'Manufacturer': 'KEMET',
        'Dielectric': 'X7R',
    }
  },
];

const connections: Connection[] = [
  { id: 'conn-1', from: { componentId: 'c-1', pinId: 'c-1-p2' }, to: { componentId: 'ic-1', pinId: 'ic-1-p2' } },
  { id: 'conn-2', from: { componentId: 'ic-1', pinId: 'ic-1-p3' }, to: { componentId: 'r-1', pinId: 'r-1-p1' } },
  { id: 'conn-3', from: { componentId: 'c-1', pinId: 'c-1-p1' }, to: { componentId: 'ic-1', pinId: 'ic-1-p1' } },
  { id: 'conn-4', from: { componentId: 'r-1', pinId: 'r-1-p2' }, to: { componentId: 'ic-1', pinId: 'ic-1-p4' } },
];


export const initialCircuit: Circuit = {
    components,
    connections,
}
