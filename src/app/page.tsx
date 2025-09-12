"use client";

import { useState } from "react";
import ComponentLibrary from "@/components/layout/component-library";
import Header from "@/components/layout/header";
import Inspector from "@/components/layout/inspector";
import Playground from "@/components/playground/Playground";
import { PlaygroundProvider } from "@/hooks/usePlayground";

export default function Home() {
  const [isLibraryOpen, setIsLibraryOpen] = useState(true);
  const [isInspectorOpen, setIsInspectorOpen] = useState(true);

  return (
    <PlaygroundProvider>
      <div className="flex h-screen w-full flex-col bg-background text-foreground">
        <Header />
        <div className="flex flex-1 overflow-hidden">
          {isLibraryOpen && <ComponentLibrary />}
          <Playground
            isLibraryOpen={isLibraryOpen}
            isInspectorOpen={isInspectorOpen}
            toggleLibrary={() => setIsLibraryOpen(!isLibraryOpen)}
            toggleInspector={() => setIsInspectorOpen(!isInspectorOpen)}
          />
          {isInspectorOpen && <Inspector />}
        </div>
      </div>
    </PlaygroundProvider>
  );
}
