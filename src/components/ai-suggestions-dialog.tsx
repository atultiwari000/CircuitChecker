'use client';

import { useEffect, useState } from 'react';
import { getAiSuggestions } from '@/app/actions';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Bot, Lightbulb, Loader2, AlertTriangle } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';

interface AiSuggestionsDialogProps {
  circuitDescription: string;
  validationFailures: string[];
  onClose: () => void;
}

export default function AiSuggestionsDialog({
  circuitDescription,
  validationFailures,
  onClose,
}: AiSuggestionsDialogProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await getAiSuggestions({ circuitDescription, validationFailures });
        if (result.suggestedSolutions) {
          setSuggestions(result.suggestedSolutions);
        } else {
            setError('The AI could not provide any suggestions.');
        }
      } catch (e) {
        console.error(e);
        setError('An error occurred while fetching AI suggestions. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, [circuitDescription, validationFailures]);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Bot className="text-primary" />
            AI-Assisted Issue Resolution
          </DialogTitle>
          <DialogDescription>
            Here are some potential solutions suggested by our AI based on the validation failures.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 min-h-[20rem]">
          <ScrollArea className="h-[20rem] pr-6">
            {loading && (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground">
                <Loader2 className="h-10 w-10 animate-spin" />
                <p className="text-lg font-medium">Analyzing circuit...</p>
                <p className="text-sm">Our AI is reasoning about the failures.</p>
              </div>
            )}
            {error && (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-destructive">
                <AlertTriangle className="h-10 w-10" />
                <p className="text-lg font-medium">Error</p>
                <p className="text-sm text-center">{error}</p>
              </div>
            )}
            {!loading && !error && (
              <ul className="space-y-4">
                {suggestions.map((suggestion, index) => (
                  <li key={index} className="flex gap-4">
                    <div className="flex-shrink-0">
                      <Lightbulb className="h-5 w-5 text-accent-foreground mt-1" />
                    </div>
                    <p className="text-sm">{suggestion}</p>
                  </li>
                ))}
              </ul>
            )}
          </ScrollArea>
        </div>
        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
