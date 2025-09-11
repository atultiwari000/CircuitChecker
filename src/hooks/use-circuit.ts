'use client';

import { useState, useCallback, useEffect } from 'react';
import type { CircuitComponent, ValidationResult, Circuit, Connection, LogEntry, LogCategory } from '@/lib/types';
import { initialCircuit, componentDefaults } from '@/lib/data';

export function useCircuit() {
  const [circuit, setCircuit] = useState<Circuit>(initialCircuit);
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(initialCircuit.components[0]?.id || null);
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [wiringMode, setWiringMode] = useState(false);
  const [debugLogs, setDebugLogs] = useState<LogEntry[]>([]);

  const log = useCallback((message: string, category: LogCategory = 'general') => {
    const timestamp = new Date().toLocaleTimeString();
    const newLog: LogEntry = {
        timestamp,
        message,
        category,
    };
    setDebugLogs(prev => [newLog, ...prev].slice(0, 100)); // Keep last 100 logs
  }, []);

  const handleValidate = () => {
    const newValidationResults: ValidationResult[] = [
      { targetId: 'conn-1', status: 'fail', message: 'Voltage mismatch: Expected 5V, got 3.3V on IC Pin 1.' },
      { targetId: 'conn-2', status: 'pass' },
      { targetId: 'conn-3', status: 'pass' },
      { targetId: 'conn-4', status: 'fail', message: 'Incorrect logic family connection between IC and Resistor.' },
      { targetId: 'ic-1', status: 'fail' },
      { targetId: 'r-1', status: 'pass' },
      { targetId: 'c-1', 'status': 'pass' },
    ];
    setValidationResults(newValidationResults);
    log('Circuit validation complete.');
  };

  const handleReset = () => {
    setValidationResults([]);
    log('Validation results reset.');
  };

  const handleAddComponent = (type: 'Resistor' | 'Capacitor' | 'IC', position: { x: number, y: number }) => {
    const newId = `${type.toLowerCase()}-${Date.now()}`;
    const defaults = componentDefaults[type];
    
    const newComponent: CircuitComponent = {
      ...defaults,
      id: newId,
      name: `${defaults.name} ${circuit.components.filter(c => c.type === type).length + 1}`,
      position,
      pins: defaults.pins.map(pin => ({...pin, id: `${newId}-${pin.id}`})),
    };

    setCircuit(prev => ({
      ...prev,
      components: [...prev.components, newComponent],
    }));
    setSelectedComponentId(newId);
    log(`Added component: ${newComponent.name} at {x: ${position.x.toFixed(0)}, y: ${position.y.toFixed(0)}}`);
  };

  const handleAddConnection = (from: { componentId: string; pinId: string }, to: { componentId: string; pinId: string }, path: {x: number, y: number}[]) => {
    const newConnection: Connection = {
      id: `conn-${Date.now()}`,
      from,
      to,
      path,
    };
    setCircuit(prev => ({
      ...prev,
      connections: [...prev.connections, newConnection],
    }));
    log(`Added connection between ${from.componentId} and ${to.componentId}`, 'wiring');
  };

  const handleUpdateComponentPosition = (id: string, position: { x: number; y: number }) => {
    setCircuit(prev => ({
      ...prev,
      components: prev.components.map(c => 
        c.id === id ? { ...c, position } : c
      ),
    }));
    // Note: Logging this can be very noisy during drag, so it's omitted.
  };

  const handleUpdateComponentProperties = (id: string, properties: {[key: string]: string | number}) => {
    setCircuit(prev => ({
      ...prev,
      components: prev.components.map(c => 
        c.id === id ? { ...c, properties: {...c.properties, ...properties} } : c
      ),
    }));
    log(`Updated properties for component ${id}`);
  };

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key.toLowerCase() === 'w' && !(event.target instanceof HTMLInputElement)) {
      event.preventDefault();
      setWiringMode(prev => {
        log(`Wiring mode toggled to: ${!prev}`, 'wiring');
        return !prev;
      });
    }
  }, [log]);

  // Using useEffect in the hook to manage global listeners
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return {
    circuit,
    setCircuit,
    selectedComponentId,
    setSelectedComponentId,
    validationResults,
    setValidationResults,
    wiringMode,
    setWiringMode,
    debugLogs,
    setDebugLogs,
    log,
    handleValidate,
    handleReset,
    handleAddComponent,
    handleAddConnection,
    handleUpdateComponentPosition,
    handleUpdateComponentProperties
  };
}
