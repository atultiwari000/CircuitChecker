'use client';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { CircuitBoard, Sparkles, RotateCcw, Scissors } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HeaderProps {
  onValidate: () => void;
  onReset: () => void;
  hasValidationResults: boolean;
  deleteMode: boolean;
  onToggleDeleteMode: () => void;
}

export default function Header({ onValidate, onReset, hasValidationResults, deleteMode, onToggleDeleteMode }: HeaderProps) {
  return (
    <header className="flex items-center h-16 px-4 shrink-0 border-b bg-card">
      <div className="flex items-center gap-2">
        <CircuitBoard className="h-7 w-7 text-primary" />
        <h1 className="text-xl font-bold tracking-tighter">CircuitCheck</h1>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <Button 
          variant={deleteMode ? "secondary" : "outline"} 
          size="icon" 
          onClick={onToggleDeleteMode}
          aria-pressed={deleteMode}
          className={cn(deleteMode && "ring-2 ring-destructive")}
        >
            <Scissors className="h-4 w-4" />
            <span className="sr-only">Toggle Delete Mode</span>
        </Button>
        <Separator orientation="vertical" className="h-8 mx-2" />
        {hasValidationResults ? (
          <Button variant="outline" onClick={onReset}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset
          </Button>
        ) : (
          <Button onClick={onValidate}>
            <Sparkles className="mr-2 h-4 w-4" />
            Validate Circuit
          </Button>
        )}
      </div>
    </header>
  );
}
