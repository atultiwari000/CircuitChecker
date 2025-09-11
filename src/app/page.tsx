'use client';

import { useState, useEffect, useCallback } from 'react';
import type { CircuitComponent, ValidationResult, Circuit, Connection } from '@/lib/types';
import { initialCircuit } from '@/lib/data';
import Header from '@/components/layout/header';
import ComponentLibrary from '@/components/layout/component-library';
import Canvas from '@/components/layout/canvas';
import PropertiesPanel from '@/components/layout/properties-panel';
import AiSuggestionsDialog from '@/components/ai-suggestions-dialog';
import DebuggerPanel from '@/components/layout/debugger-panel';
import { Button } from '@/components/ui/button';
import { Bot, PanelLeft, PanelRight } from 'lucide-react';

const componentDefaults = {
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


export default function Home() {
  const [circuit, setCircuit] = useState<Circuit>(initialCircuit);
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(initialCircuit.components[0]?.id || null);
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [showAiDialog, setShowAiDialog] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [showProperties, setShowProperties] = useState(false);
  const [wiringMode, setWiringMode] = useState(false);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  
  const log = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugLogs(prev => [`[${timestamp}] ${message}`, ...prev]);
  }, []);


  const handleValidate = () => {
    // This is a mock validation process.
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
  };
  
  const handleReset = () => {
    setValidationResults([]);
  }

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
  };

  const handleUpdateComponentPosition = (id: string, position: { x: number; y: number }) => {
    setCircuit(prev => ({
      ...prev,
      components: prev.components.map(c => 
        c.id === id ? { ...c, position } : c
      ),
    }));
  };

  const handleUpdateComponentProperties = (id: string, properties: {[key: string]: string | number}) => {
    setCircuit(prev => ({
      ...prev,
      components: prev.components.map(c => 
        c.id === id ? { ...c, properties: {...c.properties, ...properties} } : c
      ),
    }));
  }

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key.toLowerCase() === 'w' && !(event.target instanceof HTMLInputElement)) {
      event.preventDefault();
      setWiringMode(prev => {
        log(`Wiring mode toggled to: ${!prev}`);
        return !prev;
      });
    }
  }, [log]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  const selectedComponent = circuit.components.find(c => c.id === selectedComponentId);
  const validationFailures = validationResults
    .filter(r => r.status === 'fail' && r.message)
    .map(r => r.message!);

  return (
    <div className="flex flex-col h-screen bg-background text-foreground font-body overflow-hidden">
      <Header 
        onValidate={handleValidate} 
        onReset={handleReset}
        hasValidationResults={validationResults.length > 0}
      />
      <div className="flex flex-1 border-t overflow-hidden">
        {showLibrary && <ComponentLibrary />}
        <main className="flex-1 relative">
           <div className="absolute top-2 left-2 z-10">
              <Button variant="outline" size="icon" onClick={() => setShowLibrary(p => !p)}>
                  <PanelLeft />
              </Button>
           </div>
          <Canvas
            circuit={circuit}
            validationResults={validationResults}
            onSelectComponent={setSelectedComponentId}
            selectedComponentId={selectedComponentId}
            onAddComponent={handleAddComponent}
            onAddConnection={handleAddConnection}
            onUpdateComponentPosition={handleUpdateComponentPosition}
            wiringMode={wiringMode}
            setWiringMode={setWiringMode}
            log={log}
          />
           <div className="absolute top-2 right-2 z-10">
              <Button variant="outline" size="icon" onClick={() => setShowProperties(p => !p)}>
                  <PanelRight />
              </Button>
           </div>
        </main>
        {showProperties && <PropertiesPanel 
          key={selectedComponentId}
          component={selectedComponent}
          onUpdateProperties={handleUpdateComponentProperties}
        />}
      </div>
      {validationFailures.length > 0 && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button size="lg" className="rounded-full shadow-lg" onClick={() => setShowAiDialog(true)}>
            <Bot className="mr-2 h-5 w-5" />
            Get AI Suggestions
          </Button>
        </div>
      )}
      {showAiDialog && (
        <AiSuggestionsDialog
          circuitDescription="A simple oscillator circuit with a 555 timer, a resistor, and a capacitor."
          validationFailures={validationFailures}
          onClose={() => setShowAiDialog(false)}
        />
      )}
      <DebuggerPanel logs={debugLogs} />
    </div>
  );
}
