"use client";

import { usePlayground } from "@/hooks/usePlayground";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";
import type { Point, ConnectionMode, ModuleInstance } from "@/lib/types";
import {
  MODULE_WIDTH,
  BASE_MODULE_HEIGHT,
  MIN_PORT_SPACING,
} from "./HardwareModule";

const PORT_PADDING = 18;

// Function to generate an orthogonal path
const getOrthogonalPath = (points: Point[]) => {
  if (points.length < 2) return "";
  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    // Create an intermediate point to make the turn
    if (prev.x !== curr.x && prev.y !== curr.y) {
      const midX = prev.x + (curr.x - prev.x) / 2;
      path += ` L ${midX} ${prev.y}`;
      path += ` L ${midX} ${curr.y}`;
    } else {
      path += ` L ${curr.x} ${prev.y}`;
    }
    path += ` L ${curr.x} ${curr.y}`;
  }
  return path;
};

const getCurvedPath = (p1: Point, p2: Point) => {
  return `M ${p1.x} ${p1.y} C ${p1.x + (p2.x - p1.x) / 2} ${p1.y}, ${
    p1.x + (p2.x - p1.x) / 2
  } ${p2.y}, ${p2.x} ${p2.y}`;
};

// Calculate dynamic module height based on number of ports
const calculateModuleHeight = (module: ModuleInstance) => {
  const ports = module.ports || [];
  const leftPorts = ports.filter((p) => p.position === "left");
  const rightPorts = ports.filter((p) => p.position === "right");
  const maxVerticalPorts = Math.max(leftPorts.length, rightPorts.length);

  if (maxVerticalPorts <= 1) {
    return BASE_MODULE_HEIGHT;
  }

  const requiredHeight =
    (maxVerticalPorts - 1) * MIN_PORT_SPACING + PORT_PADDING * 2;
  return Math.max(BASE_MODULE_HEIGHT, requiredHeight);
};

const getPortPosition = (
  module: ModuleInstance,
  portId: string
): Point | null => {
  if (!module) return null;

  const port = module.ports.find((p) => p.id === portId);
  if (!port) return null;

  const moduleHeight = calculateModuleHeight(module);
  let x = module.position.x;
  let y = module.position.y;

  if (port.position === "left") {
    x = module.position.x; // Left edge

    const leftPorts = module.ports.filter((p) => p.position === "left");
    const portIndex = leftPorts.findIndex((p) => p.id === portId);

    if (leftPorts.length === 1) {
      y = module.position.y + moduleHeight / 2;
    } else {
      const availableHeight = moduleHeight - PORT_PADDING * 2;
      const spacing = availableHeight / (leftPorts.length - 1);
      y = module.position.y + PORT_PADDING + spacing * portIndex;
    }
  } else if (port.position === "right") {
    x = module.position.x + MODULE_WIDTH; // Right edge

    const rightPorts = module.ports.filter((p) => p.position === "right");
    const portIndex = rightPorts.findIndex((p) => p.id === portId);

    if (rightPorts.length === 1) {
      y = module.position.y + moduleHeight / 2;
    } else {
      const availableHeight = moduleHeight - PORT_PADDING * 2;
      const spacing = availableHeight / (rightPorts.length - 1);
      y = module.position.y + PORT_PADDING + spacing * portIndex;
    }
  } else if (port.position === "top") {
    y = module.position.y; // Top edge

    const topPorts = module.ports.filter((p) => p.position === "top");
    const portIndex = topPorts.findIndex((p) => p.id === portId);
    const offset = (portIndex + 1) / (topPorts.length + 1);
    x = module.position.x + MODULE_WIDTH * offset;
  } else if (port.position === "bottom") {
    y = module.position.y + moduleHeight; // Bottom edge

    const bottomPorts = module.ports.filter((p) => p.position === "bottom");
    const portIndex = bottomPorts.findIndex((p) => p.id === portId);
    const offset = (portIndex + 1) / (bottomPorts.length + 1);
    x = module.position.x + MODULE_WIDTH * offset;
  }

  return { x, y };
};

export default function ConnectionLines() {
  const {
    connections,
    modules,
    connectingPort,
    removeConnection,
    connectionMode,
    waypoints,
    isCutMode,
  } = usePlayground();
  const [mousePosition, setMousePosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const playgroundRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    // Bit of a hack to get the playground ref
    playgroundRef.current = document.querySelector('main[class*="bg-grid"]');
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (connectingPort && playgroundRef.current) {
        const rect = playgroundRef.current.getBoundingClientRect();
        setMousePosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      } else {
        setMousePosition(null);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [connectingPort]);

  const findModule = (instanceId: string) =>
    modules.find((m) => m.instanceId === instanceId);

  const fromModule = connectingPort
    ? findModule(connectingPort.instanceId)
    : null;
  const fromPos =
    fromModule && connectingPort
      ? getPortPosition(fromModule, connectingPort.portId)
      : null;

  const getPath = (
    p1: Point,
    p2: Point,
    mode: ConnectionMode,
    connWaypoints: Point[] = []
  ) => {
    if (mode === "orthogonal") {
      if (connWaypoints.length > 0) {
        return getOrthogonalPath([p1, ...connWaypoints, p2]);
      }
      const midX = p1.x + (p2.x - p1.x) / 2;
      return getOrthogonalPath([
        p1,
        { x: midX, y: p1.y },
        { x: midX, y: p2.y },
        p2,
      ]);
    }
    return getCurvedPath(p1, p2);
  };

  const handleLineClick = (connectionId: string) => {
    if (isCutMode) {
      removeConnection(connectionId);
    }
  };

  return (
    <svg className="absolute top-0 left-0 h-full w-full pointer-events-none z-20">
      {connections.map((conn) => {
        const fromModule = findModule(conn.from.instanceId);
        const toModule = findModule(conn.to.instanceId);

        if (!fromModule || !toModule) return null;

        const p1 = getPortPosition(fromModule, conn.from.portId);
        const p2 = getPortPosition(toModule, conn.to.portId);

        if (!p1 || !p2) return null;

        const isOk = conn.status === "ok";
        const isIncompatible = conn.status === "incompatible";

        const pathData = getPath(p1, p2, conn.mode || "curved", conn.waypoints);

        return (
          <g key={conn.id}>
            {/* Main connection line */}
            <path
              d={pathData}
              strokeWidth="2"
              fill="none"
              className={cn(
                "transition-all",
                isOk && "stroke-green-500",
                isIncompatible && "stroke-destructive",
                !isOk && !isIncompatible && "stroke-primary"
              )}
            />
            {/* Invisible wider path for easier clicking */}
            <path
              d={pathData}
              strokeWidth="12"
              fill="none"
              stroke="transparent"
              className={cn(
                "pointer-events-auto",
                isCutMode && "cursor-pointer"
              )}
              onClick={() => handleLineClick(conn.id)}
            />
            {/* Connection points - small circles at each end */}
            <circle
              cx={p1.x}
              cy={p1.y}
              r="4"
              className={cn(
                "fill-background stroke-2",
                isOk && "stroke-green-500",
                isIncompatible && "stroke-destructive",
                !isOk && !isIncompatible && "stroke-primary"
              )}
            />
            <circle
              cx={p2.x}
              cy={p2.y}
              r="4"
              className={cn(
                "fill-background stroke-2",
                isOk && "stroke-green-500",
                isIncompatible && "stroke-destructive",
                !isOk && !isIncompatible && "stroke-primary"
              )}
            />
          </g>
        );
      })}

      {/* Preview line when connecting */}
      {fromPos && mousePosition && (
        <g>
          <path
            d={getPath(
              fromPos,
              mousePosition,
              connectionMode || "curved",
              waypoints
            )}
            strokeWidth="2"
            fill="none"
            className="stroke-primary"
            strokeDasharray="5,5"
          />
          <circle
            cx={fromPos.x}
            cy={fromPos.y}
            r="3"
            className="fill-background stroke-2 stroke-primary"
          />
        </g>
      )}
    </svg>
  );
}
