'use client';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { CircuitBoard, Sparkles, RotateCcw } from 'lucide-react';

interface HeaderProps {
  onValidate: () => void;
  onReset: () => void;
  hasValidationResults: boolean;
}

export default function Header({ onValidate, onReset, hasValidationResults }: HeaderProps) {
  return (
    <header className="flex items-center h-16 px-4 shrink-0 border-b bg-card">
      <div className="flex items-center gap-2">
        <CircuitBoard className="h-7 w-7 text-primary" />
        <h1 className="text-xl font-bold tracking-tighter">CircuitCheck</h1>
      </div>
      <div className="ml-auto flex items-center gap-2">
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
