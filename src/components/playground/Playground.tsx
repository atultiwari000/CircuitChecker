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
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import type { ReactZoomPanPinchRef } from "react-zoom-pan-pinch";

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
  const transformRef = useRef<ReactZoomPanPinchRef | null>(null);
  const { modules, addModule, setTransformControls } = usePlayground();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [recommendationData, setRecommendationData] = useState<{
    module: Module;
    reason: string;
  } | null>(null);

  useEffect(() => {
    if (transformRef.current) {
      setTransformControls({
        zoomIn: () => transformRef.current?.zoomIn(),
        zoomOut: () => transformRef.current?.zoomOut(),
        resetTransform: () => transformRef.current?.resetTransform(),
      });
    }
  }, [setTransformControls]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "i") {
        transformRef.current?.zoomIn();
      }
      if (e.key === "o") {
        transformRef.current?.zoomOut();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

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
    if (moduleId && playgroundRef.current && transformRef.current) {
      const { scale, positionX, positionY } =
        transformRef.current.instance.transformState;
      const rect = playgroundRef.current.getBoundingClientRect();

      // Adjust for pan and zoom
      const x = (e.clientX - rect.left - positionX) / scale - 90;
      const y = (e.clientY - rect.top - positionY) / scale - 35;

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

      <TransformWrapper
        ref={transformRef}
        initialScale={1}
        initialPositionX={0}
        initialPositionY={0}
        minScale={0.2}
        limitToBounds={false}
      >
        <TransformComponent
          wrapperStyle={{ width: "100%", height: "100%" }}
          contentStyle={{ width: "100%", height: "100%" }}
        >
          <ConnectionLines />
          {modules.map((module) => (
            <HardwareModule key={module.instanceId} module={module} />
          ))}
        </TransformComponent>
      </TransformWrapper>

      <RecommendationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        module={recommendationData?.module}
        reason={recommendationData?.reason}
      />
    </main>
  );
}
