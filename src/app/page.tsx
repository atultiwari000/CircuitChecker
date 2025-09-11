'use client';

import { useState } from 'react';
import type { CircuitComponent, ValidationResult } from '@/lib/types';
import { initialCircuit } from '@/lib/data';
import Header from '@/components/layout/header';
import ComponentLibrary from '@/components/layout/component-library';
import Canvas from '@/components/layout/canvas';
import PropertiesPanel from '@/components/layout/properties-panel';
import AiSuggestionsDialog from '@/components/ai-suggestions-dialog';
import { Button } from '@/components/ui/button';
import { Bot } from 'lucide-react';

export default function Home() {
  const [circuit, setCircuit] = useState(initialCircuit);
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(initialCircuit.components[0]?.id || null);
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [showAiDialog, setShowAiDialog] = useState(false);

  const handleValidate = () => {
    // This is a mock validation process.
    const newValidationResults: ValidationResult[] = [
      { targetId: 'conn-1', status: 'fail', message: 'Voltage mismatch: Expected 5V, got 3.3V on IC Pin 1.' },
      { targetId: 'conn-2', status: 'pass' },
      { targetId: 'conn-3', status: 'pass' },
      { targetId: 'conn-4', status: 'fail', message: 'Incorrect logic family connection between IC and Resistor.' },
      { targetId: 'ic-1', status: 'fail' },
      { targetId: 'r-1', status: 'fail' },
      { targetId: 'c-1', status: 'pass' },
    ];
    setValidationResults(newValidationResults);
  };
  
  const handleReset = () => {
    setValidationResults([]);
  }

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
        <ComponentLibrary />
        <main className="flex-1 relative bg-grid-slate-100 dark:bg-grid-slate-900">
          <Canvas
            circuit={circuit}
            validationResults={validationResults}
            onSelectComponent={setSelectedComponentId}
            selectedComponentId={selectedComponentId}
          />
        </main>
        <PropertiesPanel component={selectedComponent} />
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
    </div>
  );
}

