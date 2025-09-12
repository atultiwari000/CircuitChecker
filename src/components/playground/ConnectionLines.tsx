"use client";

import { usePlayground } from "@/hooks/usePlayground";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

const MODULE_WIDTH = 180;
const MODULE_HEIGHT = 70;

export default function ConnectionLines() {
  const { connections, modules, connectingPort, removeConnection } =
    usePlayground();
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

  const getPortPosition = (instanceId: string, portId: string) => {
    const module = modules.find((m) => m.instanceId === instanceId);
    if (!module) return null;

    const port = module.ports.find((p) => p.id === portId);
    if (!port) return null;

    let x = module.position.x;
    let y = module.position.y + MODULE_HEIGHT / 2;

    if (port.position === "right") {
      x += MODULE_WIDTH;
    }

    return { x, y };
  };

  const fromPos = connectingPort
    ? getPortPosition(connectingPort.instanceId, connectingPort.portId)
    : null;

  return (
    <svg className="absolute top-0 left-0 h-full w-full pointer-events-none">
      {connections.map((conn) => {
        const p1 = getPortPosition(conn.from.instanceId, conn.from.portId);
        const p2 = getPortPosition(conn.to.instanceId, conn.to.portId);

        if (!p1 || !p2) return null;

        const isOk = conn.status === "ok";
        const isIncompatible = conn.status === "incompatible";

        const pathData = `M ${p1.x} ${p1.y} C ${p1.x + (p2.x - p1.x) / 2} ${
          p1.y
        }, ${p1.x + (p2.x - p1.x) / 2} ${p2.y}, ${p2.x} ${p2.y}`;

        return (
          <g key={conn.id}>
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
            <path
              d={pathData}
              strokeWidth="12"
              fill="none"
              stroke="transparent"
              className="pointer-events-auto cursor-pointer"
              onClick={() => removeConnection(conn.id)}
            />
          </g>
        );
      })}

      {fromPos && mousePosition && (
        <path
          d={`M ${fromPos.x} ${fromPos.y} C ${
            fromPos.x + (mousePosition.x - fromPos.x) / 2
          } ${fromPos.y}, ${fromPos.x + (mousePosition.x - fromPos.x) / 2} ${
            mousePosition.y
          }, ${mousePosition.x} ${mousePosition.y}`}
          strokeWidth="2"
          fill="none"
          className="stroke-primary"
          strokeDasharray="5,5"
        />
      )}
    </svg>
  );
}
