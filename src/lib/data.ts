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

export const componentDefaults = {
  Resistor: {
    name: 'Resistor',
    type: 'Resistor',
    properties: { 'Resistance (Ω)': 1000, 'Power (W)': 0.25 },
    pins: [
      { id: 'p1', name: '1', x: 0, y: 20 },
      { id: 'p2', name: '2', x: 80, y: 20 },
    ],
    dataset: {
      'Part Number': 'Generic',
      'Manufacturer': 'Unknown',
      'Tolerance': '5%',
    },
  },
  Capacitor: {
    name: 'Capacitor',
    type: 'Capacitor',
    properties: { 'Capacitance (uF)': 1, 'Voltage Rating (V)': 16 },
    pins: [
      { id: 'p1', name: '1', x: 0, y: 20 },
      { id: 'p2', name: '2', x: 80, y: 20 },
    ],
    dataset: {
      'Part Number': 'Generic',
      'Manufacturer': 'Unknown',
      'Dielectric': 'Ceramic',
    },
  },
  IC: {
    name: 'IC',
    type: 'IC',
    properties: { 'Logic Type': 'Generic', 'Voltage (V)': 5 },
    pins: [
      { id: 'p1', name: '1', x: 0, y: 15 },
      { id: 'p2', name: '2', x: 0, y: 45 },
      { id: 'p3', name: '3', x: 0, y: 75 },
      { id: 'p4', name: '4', x: 120, y: 15 },
      { id: 'p5', name: '5', x: 120, y: 45 },
      { id: 'p6', name: '6', x: 120, y: 75 },
    ],
    dataset: {
      'Part Number': 'Generic',
      'Manufacturer': 'Unknown',
      'Package': 'DIP',
    },
  },
};


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
