'use client';

import { useState } from 'react';
import { useCircuit } from '@/hooks/use-circuit';
import Header from '@/components/layout/header';
import ComponentLibrary from '@/components/layout/component-library';
import Canvas from '@/components/layout/canvas';
import PropertiesPanel from '@/components/layout/properties-panel';
import AiSuggestionsDialog from '@/components/ai-suggestions-dialog';
import { Button } from '@/components/ui/button';
import { Bot, PanelLeft, PanelRight } from 'lucide-react';

export default function Home() {
  const {
    circuit,
    selectedComponentId,
    setSelectedComponentId,
    validationResults,
    handleValidate,
    handleReset,
    handleAddComponent,
    handleAddConnection,
    handleUpdateComponentPosition,
    handleUpdateComponentProperties,
    handleDeleteComponent,
    handleDeleteConnection,
    wiringMode,
    setWiringMode,
    deleteMode,
    setDeleteMode,
    moveMode,
    setMoveMode,
  } = useCircuit();
  
  const [showLibrary, setShowLibrary] = useState(false);
  const [showProperties, setShowProperties] = useState(false);
  const [showAiDialog, setShowAiDialog] = useState(false);

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
        deleteMode={deleteMode}
        onToggleDeleteMode={() => setDeleteMode(prev => !prev)}
        moveMode={moveMode}
        onToggleMoveMode={() => setMoveMode(prev => !prev)}
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
            onDeleteComponent={handleDeleteComponent}
            onDeleteConnection={handleDeleteConnection}
            wiringMode={wiringMode}
            setWiringMode={setWiringMode}
            deleteMode={deleteMode}
            moveMode={moveMode}
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
    </div>
  );
}
