'use client';

import { useEffect, useRef } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";

interface DebuggerPanelProps {
  logs: string[];
}

export default function DebuggerPanel({ logs }: DebuggerPanelProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // This is a bit of a hack to scroll to the bottom.
    // The underlying Radix component doesn't expose a clean API for this.
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('div');
      if (viewport) {
        viewport.scrollTop = 0;
      }
    }
  }, [logs]);

  return (
    <div className="fixed bottom-0 left-0 w-full h-48 bg-black/80 text-white font-mono text-xs z-[100] p-2 border-t border-gray-700">
      <div className="flex justify-between items-center mb-1">
        <h3 className="font-bold">Wiring Debugger</h3>
        <span className="text-gray-400">Latest messages are at the top</span>
      </div>
      <ScrollArea className="h-full w-full" ref={scrollAreaRef}>
        <div className="flex flex-col-reverse p-2">
          {logs.map((log, index) => (
            <div key={index} className="whitespace-pre-wrap py-0.5 border-b border-gray-800">
              {log}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
