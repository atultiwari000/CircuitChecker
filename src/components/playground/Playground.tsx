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
  ZoomIn,
  ZoomOut,
  RotateCcw,
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
  const {
    modules,
    addModule,
    setTransformControls,
    toggleConnectionMode,
    addWaypoint,
    setConnectingPort,
    toggleCutMode,
  } = usePlayground();

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
      if (e.key === "i" && !e.metaKey && !e.ctrlKey) {
        transformRef.current?.zoomIn();
      }
      if (e.key === "o" && !e.metaKey && !e.ctrlKey) {
        transformRef.current?.zoomOut();
      }
      if (e.key === "w" && !e.metaKey && !e.ctrlKey) {
        toggleConnectionMode();
      }
      if (e.key === "x" && !e.metaKey && !e.ctrlKey) {
        toggleCutMode();
      }
      if (e.key === "Escape") {
        setConnectingPort(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    toggleConnectionMode,
    setConnectingPort,
    setTransformControls,
    toggleCutMode,
  ]);

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

  const handlePlaygroundClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // If target is not a port or a module, add a waypoint
    const target = e.target as HTMLElement;
    if (
      !target.closest('[class*="port-component"]') &&
      !target.closest('[class*="hardware-module-card"]')
    ) {
      if (playgroundRef.current && transformRef.current) {
        const { scale, positionX, positionY } =
          transformRef.current.instance.transformState;
        const rect = playgroundRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left - positionX) / scale;
        const y = (e.clientY - rect.top - positionY) / scale;
        addWaypoint({ x, y });
      }
    }
  };

  return (
    <main
      ref={playgroundRef}
      className="relative flex-1 overflow-hidden bg-grid"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onClick={handlePlaygroundClick}
      style={{
        backgroundImage:
          "radial-gradient(circle, hsl(var(--border) / 0.3) 1px, transparent 1px)",
        backgroundSize: "20px 20px",
      }}
    >
      <div className="absolute top-4 left-4 z-30">
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
      <div className="absolute top-4 right-4 z-30">
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
        panning={{
          activationKeys: ["Space"],
          excluded: ["input", "button", "a"],
        }}
      >
        <TransformComponent
          wrapperStyle={{ width: "100%", height: "100%" }}
          contentStyle={{ width: "100%", height: "100%" }}
        >
          <div style={{ zIndex: 10, position: "relative" }}>
            {modules.map((module) => (
              <HardwareModule key={module.instanceId} module={module} />
            ))}
          </div>
          <ConnectionLines />
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
