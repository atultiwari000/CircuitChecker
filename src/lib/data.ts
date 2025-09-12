
import type { Module } from './types';

export const MODULES: Module[] = [
  {
    id: 'esp32-wroom-32',
    type: 'IC',
    name: 'ESP32-WROOM-32',
    imageUrl: 'https://picsum.photos/seed/esp32/200/150',
    imageHint: 'microcontroller board',
    operatingVoltage: [3.0, 3.6],
    pins: [
      { id: 'p1', name: '3V3', type: 'power_out', voltage: 3.3, position: 'left' },
      { id: 'p2', name: 'GND', type: 'gnd', position: 'left' },
      { id: 'p3', name: 'VIN', type: 'power_in', position: 'left' },
      { id: 'p4', name: 'GPIO21 (SDA)', type: 'data_io', position: 'right' },
      { id: 'p5', name: 'GPIO22 (SCL)', type: 'data_io', position: 'right' },
      { id: 'p6', name: 'GPIO16 (TX2)', type: 'data_io', position: 'right' },
      { id: 'p7', name: 'GPIO17 (RX2)', type: 'data_io', position: 'right' },
    ],
  },
  {
    id: 'res-1k',
    type: 'Resistor',
    name: '1kΩ Resistor',
    imageUrl: 'https://picsum.photos/seed/res1k/200/150',
    imageHint: 'resistor electronic',
    pins: [
      { id: 'p1', name: '1', type: 'data_io', position: 'left' },
      { id: 'p2', name: '2', type: 'data_io', position: 'right' },
    ],
    properties: {
        'Resistance': '1kΩ',
        'Tolerance': '5%',
    }
  },
  {
    id: 'cap-100nf',
    type: 'Capacitor',
    name: '100nF Capacitor',
    imageUrl: 'https://picsum.photos/seed/cap100/200/150',
    imageHint: 'capacitor electronic',
    pins: [
      { id: 'p1', name: '1', type: 'data_io', position: 'left' },
      { id: 'p2', name: '2', type: 'data_io', position: 'right' },
    ],
    properties: {
        'Capacitance': '100nF',
        'Voltage': '50V',
    }
  },
  {
    id: 'led-red',
    type: 'IC',
    name: 'Red LED',
    imageUrl: 'https://picsum.photos/seed/ledred/200/150',
    imageHint: 'LED light',
    pins: [
        { id: 'p1', name: 'A', type: 'power_in', position: 'left' },
        { id: 'p2', name: 'C', type: 'gnd', position: 'right' },
    ]
  }
];

// Helper to get a module by its ID
export const getModuleById = (id: string) => {
  return MODULES.find(m => m.id === id);
}
