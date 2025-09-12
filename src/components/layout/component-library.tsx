"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MODULES } from "@/data/modules";
import { Badge } from "@/components/ui/badge";
import { Search, RefreshCw, Filter } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "../ui/button";
import { usePlayground } from "@/hooks/usePlayground";
import type { Module } from "@/lib/types";

const ModuleCard = ({
  module,
  draggable = false,
}: {
  module: Module;
  draggable?: boolean;
}) => {
  const handleDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    moduleId: string
  ) => {
    if (draggable) {
      e.dataTransfer.setData("text/plain", moduleId);
    }
  };
  return (
    <div
      draggable={draggable}
      onDragStart={(e) => handleDragStart(e, module.id)}
      className="group flex flex-col cursor-grab gap-2 rounded-lg border bg-card p-3 transition-colors hover:bg-sidebar-accent"
    >
      <div className="flex justify-between items-start">
        <p className="font-headline text-sm font-bold">{module.name}</p>
        {module.external && (
          <Badge variant="outline" className="text-xs">
            External
          </Badge>
        )}
      </div>
      <p className="text-xs text-muted-foreground">{module.description}</p>
      <div className="text-xs text-muted-foreground">
        <p>
          Part: {module.partNumber} - Mfg: {module.manufacturer}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <p className="text-xs font-bold">Interfaces</p>
        {module.interfaces.map((iface) => (
          <Badge
            key={iface}
            variant="secondary"
            className="bg-muted text-muted-foreground text-xs font-mono"
          >
            {iface}
          </Badge>
        ))}
      </div>
    </div>
  );
};

export default function ComponentLibrary() {
  const [searchTerm, setSearchTerm] = useState("");
  const { modules: projectModules } = usePlayground();

  const filteredLibraryModules = MODULES.filter((module) =>
    module.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredProjectModules = projectModules.filter((module) =>
    module.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <aside className="hidden w-96 flex-col border-r bg-sidebar md:flex">
      <div className="p-4 pb-0">
        <Tabs defaultValue="library">
          <TabsList className="grid w-full grid-cols-2 bg-background">
            <TabsTrigger value="library">LIBRARY</TabsTrigger>
            <TabsTrigger value="project">IN PROJECT</TabsTrigger>
          </TabsList>
          <div className="p-4 px-0 flex gap-2">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search Parts..."
                className="pl-9 bg-background border-border"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              className="bg-background border-border"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="bg-background border-border"
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>
          <TabsContent value="library">
            <ScrollArea className="flex-1 h-[calc(100vh-210px)]">
              <div className="grid gap-2 pr-4">
                {filteredLibraryModules.map((module) => (
                  <ModuleCard key={module.id} module={module} draggable />
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
          <TabsContent value="project">
            <ScrollArea className="flex-1 h-[calc(100vh-210px)]">
              <div className="grid gap-2 pr-4">
                {filteredProjectModules.length > 0 ? (
                  filteredProjectModules.map((module) => (
                    <ModuleCard key={module.instanceId} module={module} />
                  ))
                ) : (
                  <div className="text-center text-sm text-muted-foreground pt-10">
                    <p>No components in project.</p>
                    <p>Drag components from the library to get started.</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>
    </aside>
  );
}
