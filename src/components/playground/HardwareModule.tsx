"use client";

import { useState, useRef, useEffect } from "react";
import { usePlayground } from "@/hooks/usePlayground";
import type { ModuleInstance } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// Updated Port interface to match your data structure
interface Port {
  id: string;
  name: string;
  type: string;
  voltage: number | null;
  position: string;
}

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

  // Get port color based on type
  const getPortColor = (type: string) => {
    switch (type) {
      case "power_in":
        return "border-red-500 hover:bg-red-500";
      case "data_in":
        return "border-blue-500 hover:bg-blue-500";
      case "data_out":
        return "border-green-500 hover:bg-green-500";
      case "data_io":
        return "border-yellow-500 hover:bg-yellow-500";
      case "nc":
        return "border-gray-400 hover:bg-gray-400 opacity-50";
      default:
        return "border-primary hover:bg-primary";
    }
  };

  return (
    <div
      className={cn(
        "group absolute",
        side === "left" ? "-left-1.5" : "-right-1.5"
      )}
      style={{ top: "50%", transform: "translateY(-50%)" }}
    >
      <div
        onClick={(e) => {
          e.stopPropagation();
          handlePortClick(instanceId, port.id);
        }}
        className={cn(
          "h-3 w-3 rounded-full border-2 bg-background cursor-pointer transition-colors",
          isConnecting
            ? "bg-primary ring-2 ring-primary-foreground"
            : getPortColor(port.type)
        )}
        title={`${port.name} (${port.type})`}
      />
    </div>
  );
};

export default function HardwareModule({ module }: HardwareModuleProps) {
  const {
    updateModulePosition,
    setSelectedModule,
    isCutMode,
    removeModule,
    handlePortClick,
    connectingPort,
  } = usePlayground();
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (
      (e.target as HTMLElement).closest('[class*="rounded-full"]') ||
      isCutMode
    ) {
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
    if (isCutMode) {
      removeModule(module.instanceId);
    } else {
      setSelectedModule(module);
    }
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

  // Ensure ports exist and have the correct structure
  const ports = module.ports || [];
  const leftPorts = ports.filter((p) => p.position === "left");
  const rightPorts = ports.filter((p) => p.position === "right");

  // Calculate port spacing for better visual distribution
  const getPortStyle = (
    index: number,
    total: number,
    side: "left" | "right"
  ) => {
    if (total === 1) {
      return { top: "50%", transform: "translateY(-50%)" };
    }

    const spacing = 60 / (total + 1); // Distribute ports across 60px height
    const topOffset = spacing * (index + 1);

    return {
      top: `${topOffset}px`,
      transform: "none",
    };
  };

  return (
    <div
      id={module.instanceId}
      className="absolute"
      style={{ left: module.position.x, top: module.position.y, zIndex: 10 }}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
    >
      <Card
        className={cn(
          "w-[180px] h-[70px] border-2 bg-card/80 backdrop-blur-sm shadow-lg hover:border-primary/50 transition-colors flex items-center justify-center p-2 relative",
          isCutMode
            ? "cursor-crosshair border-destructive hover:border-destructive"
            : "cursor-grab"
        )}
      >
        <div className="text-center">
          <p className="font-headline text-sm font-semibold">{module.name}</p>
          {module.partNumber && (
            <p className="text-xs text-muted-foreground font-mono">
              {module.partNumber}
            </p>
          )}
        </div>

        {/* Left ports */}
        {leftPorts.map((port, index) => {
          const isConnecting =
            connectingPort?.instanceId === module.instanceId &&
            connectingPort?.portId === port.id;

          return (
            <div
              key={port.id}
              className="absolute -left-1.5"
              style={getPortStyle(index, leftPorts.length, "left")}
            >
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  handlePortClick(module.instanceId, port.id);
                }}
                className={cn(
                  "h-3 w-3 rounded-full border-2 bg-background cursor-pointer transition-colors",
                  isConnecting
                    ? "bg-primary ring-2 ring-primary-foreground"
                    : getPortColor(port.type)
                )}
                title={`${port.name} (${port.type})`}
              />
            </div>
          );
        })}

        {/* Right ports */}
        {rightPorts.map((port, index) => {
          const isConnecting =
            connectingPort?.instanceId === module.instanceId &&
            connectingPort?.portId === port.id;

          return (
            <div
              key={port.id}
              className="absolute -right-1.5"
              style={getPortStyle(index, rightPorts.length, "right")}
            >
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  handlePortClick(module.instanceId, port.id);
                }}
                className={cn(
                  "h-3 w-3 rounded-full border-2 bg-background cursor-pointer transition-colors",
                  isConnecting
                    ? "bg-primary ring-2 ring-primary-foreground"
                    : getPortColor(port.type)
                )}
                title={`${port.name} (${port.type})`}
              />
            </div>
          );
        })}
      </Card>
    </div>
  );

  // Helper function moved inside component to access connectingPort
  function getPortColor(type: string) {
    switch (type) {
      case "power_in":
        return "border-red-500 hover:bg-red-500";
      case "data_in":
        return "border-blue-500 hover:bg-blue-500";
      case "data_out":
        return "border-green-500 hover:bg-green-500";
      case "data_io":
        return "border-yellow-500 hover:bg-yellow-500";
      case "nc":
        return "border-gray-400 hover:bg-gray-400 opacity-50";
      default:
        return "border-primary hover:bg-primary";
    }
  }
}
