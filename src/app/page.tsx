"use client";

import { useState } from "react";
import ComponentLibrary from "@/components/layout/component-library";
import Header from "@/components/layout/header";
import Inspector from "@/components/layout/inspector";
import Playground from "@/components/playground/Playground";
import { PlaygroundProvider } from "@/hooks/usePlayground";
import SpiceRunner from "@/components/spice-runner";
import { Button } from "@/components/ui/button";
import {
  Bot,
  PanelLeft,
  PanelRight,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

export default function Home() {
  const [isLibraryOpen, setIsLibraryOpen] = useState(true);
  const [isInspectorOpen, setIsInspectorOpen] = useState(true);
  const [showSpiceRunner, setShowSpiceRunner] = useState(false);
  return (
    <PlaygroundProvider>
      <div className="flex h-screen w-full flex-col bg-background text-foreground">
        <Header
          isLibraryOpen={isLibraryOpen}
          isInspectorOpen={isInspectorOpen}
          toggleLibrary={() => setIsLibraryOpen(!isLibraryOpen)}
          toggleInspector={() => setIsInspectorOpen(!isInspectorOpen)}
        />
        <div className="flex flex-1 overflow-hidden">
          {isLibraryOpen && <ComponentLibrary />}
          <Playground />
          {isInspectorOpen && <Inspector />}
        </div>
      </div>
      <div className="fixed bottom-0 left-0 right-0 z-40">
        <div className="flex justify-center">
          <Button
            variant="secondary"
            size="sm"
            className="rounded-b-none rounded-t-lg"
            onClick={() => setShowSpiceRunner((p) => !p)}
          >
            {showSpiceRunner ? (
              <ChevronDown className="h-4 w-4 mr-2" />
            ) : (
              <ChevronUp className="h-4 w-4 mr-2" />
            )}
            SPICE Test Runner
          </Button>
        </div>
        {showSpiceRunner && (
          <div className="bg-card border-t p-4 h-96">
            <SpiceRunner />
          </div>
        )}
      </div>
    </PlaygroundProvider>
  );
}
