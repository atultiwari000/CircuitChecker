'use client';

import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { libraryComponents, checkerComponents } from "@/lib/data";

export default function ComponentLibrary() {
  return (
    <aside className="w-64 flex flex-col border-r bg-card">
      <div className="p-4">
        <h2 className="text-lg font-semibold tracking-tight">Library</h2>
      </div>
      <ScrollArea className="flex-1">
        <div className="px-4">
          <h3 className="mb-2 text-sm font-medium text-muted-foreground">Components</h3>
          <div className="grid grid-cols-2 gap-4">
            {libraryComponents.map((item) => (
              <div
                key={item.name}
                className="flex flex-col items-center justify-center gap-2 p-3 rounded-lg border bg-background hover:bg-accent hover:text-accent-foreground cursor-grab transition-colors"
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('application/json', JSON.stringify({ type: 'component', name: item.name }));
                }}
              >
                <item.icon className="h-8 w-8" />
                <span className="text-xs font-medium">{item.name}</span>
              </div>
            ))}
          </div>
        </div>

        <Separator className="my-4" />

        <div className="px-4">
          <h3 className="mb-2 text-sm font-medium text-muted-foreground">Checkers</h3>
          <div className="grid grid-cols-2 gap-4">
            {checkerComponents.map((item) => (
              <div
                key={
                  item.name
                }
                className="flex flex-col items-center justify-center gap-2 p-3 rounded-lg border bg-background hover:bg-accent hover:text-accent-foreground cursor-grab transition-colors"
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('application/json', JSON.stringify({ type: 'checker', name: item.name }));
                }}
              >
                <item.icon className="h-8 w-8" />
                <span className="text-xs font-medium">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </ScrollArea>
    </aside>
  );
}
