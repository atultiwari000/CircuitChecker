"use client";

import { useState } from "react";
import { usePlayground } from "@/hooks/usePlayground";
import ComponentLibrary from "@/components/layout/component-library";
import Playground from "@/components/playground/Playground";
import Inspector from "@/components/layout/inspector";
import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { PanelLeft, PanelRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Module } from "@/lib/types";

export default function AppContent({ modules }: { modules: Module[] }) {
  const { selectedModule } = usePlayground();
  const [showLeftSidebar, setShowLeftSidebar] = useState(true);
  const [showRightSidebar, setShowRightSidebar] = useState(true);

  return (
    <div className="flex h-screen w-full flex-col bg-background font-body">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <div
          className={cn(
            "transition-all duration-300 ease-in-out",
            showLeftSidebar ? "w-[420px]" : "w-0"
          )}
        >
          {showLeftSidebar && <ComponentLibrary allModules={modules} />}
        </div>
        <main className="flex-1 relative">
          <div className="absolute top-1/2 -translate-y-1/2 left-0 z-20">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowLeftSidebar(!showLeftSidebar)}
              className="rounded-l-none rounded-r-md bg-card hover:bg-secondary"
            >
              <PanelLeft
                className={cn(
                  "transition-transform duration-300",
                  showLeftSidebar && "rotate-180"
                )}
              />
            </Button>
          </div>
          <Playground
            isLibraryOpen={false}
            isInspectorOpen={false}
            toggleLibrary={function (): void {
              throw new Error("Function not implemented.");
            }}
            toggleInspector={function (): void {
              throw new Error("Function not implemented.");
            }}
          />
          <div className="absolute top-1/2 -translate-y-1/2 right-0 z-20">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowRightSidebar(!showRightSidebar)}
              className="rounded-r-none rounded-l-md bg-card hover:bg-secondary"
            >
              <PanelRight
                className={cn(
                  "transition-transform duration-300",
                  !showRightSidebar && "rotate-180"
                )}
              />
            </Button>
          </div>
        </main>
        <div
          className={cn(
            "transition-all duration-300 ease-in-out",
            showRightSidebar ? "w-96" : "w-0"
          )}
        >
          {showRightSidebar && <Inspector module={selectedModule} />}
        </div>
      </div>
    </div>
  );
}
