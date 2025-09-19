"use client";

import { useState, useRef, useEffect } from "react";
import { usePlayground } from "@/hooks/usePlayground";
import type { ModuleInstance } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const MODULE_WIDTH = 180;
export const BASE_MODULE_HEIGHT = 70;
export const MIN_PORT_SPACING = 20; // Minimum spacing between ports
const PORT_PADDING = 16; // Padding from top/bottom edges of module

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

// Helper function to get port color based on type
const getPortColor = (type: string) => {
  switch (type) {
    case "power_in":
      return "border-red-500 hover:bg-red-500";
    case "power_out":
      return "border-orange-500 hover:bg-orange-500";
    case "data_in":
      return "border-blue-500 hover:bg-blue-500";
    case "data_out":
      return "border-green-500 hover:bg-green-500";
    case "data_io":
      return "border-yellow-500 hover:bg-yellow-500";
    case "gnd":
      return "border-gray-600 hover:bg-gray-600";
    case "nc":
      return "border-gray-400 hover:bg-gray-400 opacity-50";
    default:
      return "border-primary hover:bg-primary";
  }
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
    if ((e.target as HTMLElement).closest('[data-port="true"]') || isCutMode) {
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

  const onPortClick = (e: React.MouseEvent, portId: string) => {
    e.stopPropagation();
    handlePortClick(module.instanceId, portId);
  };

  // Ensure ports exist and have the correct structure
  const ports = module.ports || [];
  const leftPorts = ports.filter((p) => p.position === "left");
  const rightPorts = ports.filter((p) => p.position === "right");
  const topPorts = ports.filter((p) => p.position === "top");
  const bottomPorts = ports.filter((p) => p.position === "bottom");

  // Calculate the maximum number of ports on vertical sides for dynamic height
  const maxVerticalPorts = Math.max(leftPorts.length, rightPorts.length);

  // Calculate dynamic module height based on number of ports
  const calculateModuleHeight = () => {
    if (maxVerticalPorts <= 1) {
      return BASE_MODULE_HEIGHT;
    }

    // Calculate required height based on ports and spacing
    const requiredHeight =
      (maxVerticalPorts - 1) * MIN_PORT_SPACING + PORT_PADDING * 2;
    return Math.max(BASE_MODULE_HEIGHT, requiredHeight);
  };

  const moduleHeight = calculateModuleHeight();

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
          "border-2 bg-card/80 backdrop-blur-sm shadow-lg hover:border-primary/50 transition-colors flex items-center justify-center p-2 relative",
          isCutMode
            ? "cursor-crosshair border-destructive hover:border-destructive"
            : "cursor-grab"
        )}
        style={{ width: `${MODULE_WIDTH}px`, height: `${moduleHeight}px` }}
      >
        <div className="text-center">
          <p className="font-headline text-sm font-semibold">{module.name}</p>
          {module.partNumber && (
            <p className="text-xs text-muted-foreground font-mono">
              {module.partNumber}
            </p>
          )}
        </div>

        {/* Ports Container */}
        <div className="absolute inset-0">
          {/* Left Ports */}
          {leftPorts.map((port, index) => {
            const isConnecting =
              connectingPort?.instanceId === module.instanceId &&
              connectingPort?.portId === port.id;

            let topPosition;
            if (leftPorts.length === 1) {
              topPosition = "50%";
            } else {
              // Calculate position within the padded area
              const availableHeight = moduleHeight - PORT_PADDING * 2;
              const spacing = availableHeight / (leftPorts.length - 1);
              const pixelOffset = PORT_PADDING + spacing * index;
              topPosition = `${pixelOffset}px`;
            }

            return (
              <div
                key={port.id}
                data-port="true"
                onClick={(e) => onPortClick(e, port.id)}
                className={cn(
                  "absolute h-3 w-3 rounded-full border-2 bg-background cursor-pointer transition-colors z-10",
                  isConnecting
                    ? "bg-primary ring-2 ring-primary-foreground"
                    : getPortColor(port.type)
                )}
                style={{
                  top: topPosition,
                  left: "0%",
                  transform:
                    leftPorts.length === 1
                      ? "translate(-50%, -50%)"
                      : "translate(-50%, -50%)",
                }}
                title={`${port.name} (${port.type})`}
              />
            );
          })}

          {/* Right Ports */}
          {rightPorts.map((port, index) => {
            const isConnecting =
              connectingPort?.instanceId === module.instanceId &&
              connectingPort?.portId === port.id;

            let topPosition;
            if (rightPorts.length === 1) {
              topPosition = "50%";
            } else {
              // Calculate position within the padded area
              const availableHeight = moduleHeight - PORT_PADDING * 2;
              const spacing = availableHeight / (rightPorts.length - 1);
              const pixelOffset = PORT_PADDING + spacing * index;
              topPosition = `${pixelOffset}px`;
            }

            return (
              <div
                key={port.id}
                data-port="true"
                onClick={(e) => onPortClick(e, port.id)}
                className={cn(
                  "absolute h-3 w-3 rounded-full border-2 bg-background cursor-pointer transition-colors z-10",
                  isConnecting
                    ? "bg-primary ring-2 ring-primary-foreground"
                    : getPortColor(port.type)
                )}
                style={{
                  top: topPosition,
                  left: "100%",
                  transform:
                    rightPorts.length === 1
                      ? "translate(-50%, -50%)"
                      : "translate(-50%, -50%)",
                }}
                title={`${port.name} (${port.type})`}
              />
            );
          })}

          {/* Top Ports */}
          {topPorts.map((port, index) => {
            const isConnecting =
              connectingPort?.instanceId === module.instanceId &&
              connectingPort?.portId === port.id;

            const offset = (index + 1) / (topPorts.length + 1);

            return (
              <div
                key={port.id}
                data-port="true"
                onClick={(e) => onPortClick(e, port.id)}
                className={cn(
                  "absolute h-3 w-3 rounded-full border-2 bg-background cursor-pointer transition-colors z-10",
                  isConnecting
                    ? "bg-primary ring-2 ring-primary-foreground"
                    : getPortColor(port.type)
                )}
                style={{
                  top: "0%",
                  left: `${offset * 100}%`,
                  transform: "translate(-50%, -50%)",
                }}
                title={`${port.name} (${port.type})`}
              />
            );
          })}

          {/* Bottom Ports */}
          {bottomPorts.map((port, index) => {
            const isConnecting =
              connectingPort?.instanceId === module.instanceId &&
              connectingPort?.portId === port.id;

            const offset = (index + 1) / (bottomPorts.length + 1);

            return (
              <div
                key={port.id}
                data-port="true"
                onClick={(e) => onPortClick(e, port.id)}
                className={cn(
                  "absolute h-3 w-3 rounded-full border-2 bg-background cursor-pointer transition-colors z-10",
                  isConnecting
                    ? "bg-primary ring-2 ring-primary-foreground"
                    : getPortColor(port.type)
                )}
                style={{
                  top: "100%",
                  left: `${offset * 100}%`,
                  transform: "translate(-50%, -50%)",
                }}
                title={`${port.name} (${port.type})`}
              />
            );
          })}
        </div>
      </Card>
    </div>
  );
}
