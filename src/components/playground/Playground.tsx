"use client";

import { useRef, useState, useEffect } from "react";
import { usePlayground } from "@/hooks/usePlayground";
import HardwareModule from "./HardwareModule";
import ConnectionLines from "./ConnectionLines";
import RecommendationDialog from "./RecommendationDialog";
import type { Module } from "@/lib/types";
import { Button } from "../ui/button";
import {
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
} from "lucide-react";
import {
  Tooltip,
  TooltipProvider,
  TooltipContent,
  TooltipTrigger,
} from "../ui/tooltip";

interface PlaygroundProps {
  isLibraryOpen: boolean;
  isInspectorOpen: boolean;
  toggleLibrary: () => void;
  toggleInspector: () => void;
}

export default function Playground({
  isLibraryOpen,
  isInspectorOpen,
  toggleLibrary,
  toggleInspector,
}: PlaygroundProps) {
  const playgroundRef = useRef<HTMLDivElement>(null);
  const { modules, addModule } = usePlayground();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [recommendationData, setRecommendationData] = useState<{
    module: Module;
    reason: string;
  } | null>(null);

  useEffect(() => {
    const handleOpenDialog = (event: Event) => {
      const customEvent = event as CustomEvent;
      setRecommendationData(customEvent.detail);
      setDialogOpen(true);
    };

    window.addEventListener("open-recommendations", handleOpenDialog);
    return () => {
      window.removeEventListener("open-recommendations", handleOpenDialog);
    };
  }, []);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const moduleId = e.dataTransfer.getData("text/plain");
    if (moduleId && playgroundRef.current) {
      const rect = playgroundRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left - 90; // center the module
      const y = e.clientY - rect.top - 35;
      addModule(moduleId, { x, y });
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  return (
    <main
      ref={playgroundRef}
      className="relative flex-1 overflow-hidden bg-grid"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      style={{
        backgroundImage:
          "radial-gradient(circle, hsl(var(--border) / 0.3) 1px, transparent 1px)",
        backgroundSize: "20px 20px",
      }}
    >
      <div className="absolute top-4 left-4 z-20">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={toggleLibrary}
                className="bg-card/80 backdrop-blur-sm"
              >
                {isLibraryOpen ? (
                  <PanelLeftClose className="h-5 w-5" />
                ) : (
                  <PanelLeftOpen className="h-5 w-5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isLibraryOpen ? "Close" : "Open"} Component Library</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <div className="absolute top-4 right-4 z-20">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={toggleInspector}
                className="bg-card/80 backdrop-blur-sm"
              >
                {isInspectorOpen ? (
                  <PanelRightClose className="h-5 w-5" />
                ) : (
                  <PanelRightOpen className="h-5 w-5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isInspectorOpen ? "Close" : "Open"} Inspector</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <ConnectionLines />
      {modules.map((module) => (
        <HardwareModule key={module.instanceId} module={module} />
      ))}
      <RecommendationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        module={recommendationData?.module}
        reason={recommendationData?.reason}
      />
    </main>
  );
}
