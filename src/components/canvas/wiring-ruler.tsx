
'use client';

interface WiringRulerProps {
  worldCursorPos: { x: number; y: number };
  viewTransform: { x: number; y: number; scale: number };
}

export default function WiringRuler({ worldCursorPos, viewTransform }: WiringRulerProps) {
  // Convert world coordinates to screen coordinates
  const screenX = worldCursorPos.x * viewTransform.scale + viewTransform.x;
  const screenY = worldCursorPos.y * viewTransform.scale + viewTransform.y;

  return (
    <>
      <div
        className="absolute top-0 left-0 w-full h-px bg-primary/30 pointer-events-none z-30"
        style={{ transform: `translateY(${screenY}px)` }}
      />
      <div
        className="absolute top-0 left-0 h-full w-px bg-primary/30 pointer-events-none z-30"
        style={{ transform: `translateX(${screenX}px)` }}
      />
    </>
  );
}
