"use client";

import { useState, useRef, useEffect } from "react";
import { usePlayground } from "@/hooks/usePlayground";
import type { ModuleInstance, Port } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface HardwareModuleProps {
  module: ModuleInstance;
}

const PortComponent = ({
  port,
  instanceId,
  side,
}: {
  port: Port;
  instanceId: string;
  side: "left" | "right";
}) => {
  const { handlePortClick, connectingPort } = usePlayground();
  const isConnecting =
    connectingPort?.instanceId === instanceId &&
    connectingPort?.portId === port.id;

  return (
    <div
      className={cn(
        "group absolute",
        side === "left" ? "-left-1.5" : "-right-1.5" // Adjusted for larger size
      )}
      style={{ top: "50%", transform: "translateY(-50%)" }}
    >
      <div
        onClick={(e) => {
          e.stopPropagation();
          handlePortClick(instanceId, port.id);
        }}
        className={cn(
          "h-3 w-3 rounded-full border-2 bg-background cursor-pointer hover:bg-primary transition-colors",
          isConnecting
            ? "bg-primary ring-2 ring-primary-foreground"
            : "border-primary"
        )}
        title={`${port.name} (${port.type})`}
      />
    </div>
  );
};

export default function HardwareModule({ module }: HardwareModuleProps) {
  const { updateModulePosition, setSelectedModule } = usePlayground();
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('[class*="rounded-full"]')) {
      return;
    }
    setSelectedModule(module);
    setIsDragging(true);
    dragOffset.current = {
      x: e.clientX - module.position.x,
      y: e.clientY - module.position.y,
    };
    e.currentTarget.style.cursor = "grabbing";
    e.currentTarget.style.zIndex = "1000";
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      const newX = e.clientX - dragOffset.current.x;
      const newY = e.clientY - dragOffset.current.y;
      updateModulePosition(module.instanceId, { x: newX, y: newY });
    }
  };

  const handleMouseUp = (e: MouseEvent) => {
    setIsDragging(false);
    const target = document.getElementById(module.instanceId);
    if (target) {
      target.style.cursor = "grab";
      target.style.zIndex = "10";
    }
  };

  const handleClick = () => {
    setSelectedModule(module);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    } else {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  const leftPorts = module.ports.filter((p) => p.position === "left");
  const rightPorts = module.ports.filter((p) => p.position === "right");

  return (
    <div
      id={module.instanceId}
      className="absolute"
      style={{
        left: module.position.x,
        top: module.position.y,
        cursor: "grab",
        zIndex: 10,
      }}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
    >
      <Card className="w-[180px] h-[70px] border-2 bg-card/80 backdrop-blur-sm shadow-lg hover:border-primary/50 transition-colors flex items-center justify-center p-2 relative">
        <p className="font-headline text-center text-sm">{module.name}</p>
        {leftPorts.map((port) => (
          <PortComponent
            key={port.id}
            port={port}
            instanceId={module.instanceId}
            side="left"
          />
        ))}
        {rightPorts.map((port) => (
          <PortComponent
            key={port.id}
            port={port}
            instanceId={module.instanceId}
            side="right"
          />
        ))}
      </Card>
    </div>
  );
}
