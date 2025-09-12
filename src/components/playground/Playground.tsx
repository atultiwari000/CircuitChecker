"use client";

import { useRef, useState, useEffect } from "react";
import { usePlayground } from "@/hooks/usePlayground";
import HardwareModule from "./HardwareModule";
import ConnectionLines from "./ConnectionLines";
import RecommendationDialog from "./RecommendationDialog";
import type { Module } from "@/lib/types";

export default function Playground() {
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
