"use client";

import { useState, useMemo, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MODULES } from "@/data/modules";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  RefreshCw,
  Filter,
  Cpu,
  Zap,
  Package,
  Plus,
  Sparkles,
  ChevronRight,
  Grid3x3,
  List,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "../ui/button";
import { usePlayground } from "@/hooks/usePlayground";
import type { Module } from "@/lib/types";
import RequestPartDialog from "@/components/playground/RequestPartDialog";

const ModuleCard = ({
  module,
  draggable = false,
  variant = "default",
}: {
  module: Module;
  draggable?: boolean;
  variant?: "default" | "compact";
}) => {
  const handleDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    moduleId: string
  ) => {
    if (draggable) {
      e.dataTransfer.setData("text/plain", moduleId);
      e.dataTransfer.effectAllowed = "copy";
    }
  };

  if (variant === "compact") {
    return (
      <div
        draggable={draggable}
        onDragStart={(e) => handleDragStart(e, module.id)}
        className="group relative flex items-center gap-3 rounded-xl border border-border/50 bg-gradient-to-r from-background to-background/50 p-3 transition-all duration-200 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 cursor-grab active:cursor-grabbing"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Cpu className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{module.name}</p>
          <p className="text-xs text-muted-foreground truncate">
            {module.manufacturer}
          </p>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
    );
  }

  return (
    <div
      draggable={draggable}
      onDragStart={(e) => handleDragStart(e, module.id)}
      className="group relative overflow-hidden rounded-xl border border-border/50 bg-gradient-to-br from-card via-card to-card/80 p-4 transition-all duration-300 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 cursor-grab active:cursor-grabbing"
    >
      {/* Decorative gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Content */}
      <div className="relative space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Cpu className="h-4 w-4" />
            </div>
            <div>
              <p className="font-semibold text-sm leading-tight">
                {module.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {module.manufacturer}
              </p>
            </div>
          </div>
          {module.external && (
            <Badge
              variant="secondary"
              className="text-xs bg-amber-500/10 text-amber-600 border-amber-500/20"
            >
              <Zap className="h-3 w-3 mr-1" />
              External
            </Badge>
          )}
        </div>

        {/* Description */}
        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
          {module.description}
        </p>

        {/* Part info */}
        <div className="flex items-center gap-2 text-xs">
          <Badge variant="outline" className="font-mono text-xs px-2 py-0.5">
            {module.partNumber}
          </Badge>
        </div>

        {/* Interfaces */}
        <div className="flex flex-wrap items-center gap-1.5">
          {module.interfaces.map((iface) => (
            <Badge
              key={iface}
              variant="secondary"
              className="bg-primary/5 text-primary/80 hover:bg-primary/10 text-xs font-mono px-2 py-0.5 transition-colors"
            >
              {iface}
            </Badge>
          ))}
        </div>

        {/* Drag indicator */}
        {draggable && (
          <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex gap-0.5">
              <div className="h-1 w-1 rounded-full bg-primary/40" />
              <div className="h-1 w-1 rounded-full bg-primary/40" />
              <div className="h-1 w-1 rounded-full bg-primary/40" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default function ComponentLibrary() {
  const [searchTerm, setSearchTerm] = useState("");
  const { modules: projectModules } = usePlayground();
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);

  const filteredLibraryModules = useMemo(() => {
    if (!searchTerm) return MODULES;
    const lowerSearch = searchTerm.toLowerCase();
    return MODULES.filter(
      (module) =>
        module.name.toLowerCase().includes(lowerSearch) ||
        module.description?.toLowerCase().includes(lowerSearch) ||
        module.manufacturer?.toLowerCase().includes(lowerSearch)
    );
  }, [searchTerm]);

  const filteredProjectModules = useMemo(() => {
    if (!searchTerm) return projectModules;
    const lowerSearch = searchTerm.toLowerCase();
    return projectModules.filter(
      (module) =>
        module.name.toLowerCase().includes(lowerSearch) ||
        module.description?.toLowerCase().includes(lowerSearch) ||
        module.manufacturer?.toLowerCase().includes(lowerSearch)
    );
  }, [projectModules, searchTerm]);

  return (
    <aside className="hidden md:flex w-[420px] flex-col border-r bg-gradient-to-b from-sidebar via-sidebar/95 to-sidebar/90 h-screen">
      <div className="flex flex-col h-full">
        <Tabs defaultValue="library" className="flex flex-col h-full">
          {/* Enhanced header with gradient */}
          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b shrink-0">
            <TabsList className="w-full bg-transparent border-0 h-12 p-1">
              <TabsTrigger
                value="library"
                className="flex-1 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg transition-all"
              >
                <Package className="h-4 w-4 mr-2" />
                <span className="font-medium">LIBRARY</span>
              </TabsTrigger>
              <TabsTrigger
                value="project"
                className="flex-1 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg transition-all"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                <span className="font-medium">PROJECT</span>
                {projectModules.length > 0 && (
                  <Badge
                    variant="default"
                    className="ml-2 px-1.5 py-0 h-5 text-xs bg-primary"
                  >
                    {filteredProjectModules.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Enhanced search bar */}
          <div className="p-4 space-y-3 bg-background/50 backdrop-blur-sm border-b shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search components..."
                className="pl-10 pr-4 h-10 bg-background/80 border-border/50 focus:border-primary/30 focus:bg-background transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Tab content - this is the main scrollable area */}
          <div className="flex-1 min-h-0 flex flex-col">
            <TabsContent
              value="library"
              className="flex-1 flex flex-col min-h-0 mt-0"
            >
              {/* Scrollable content */}
              <div className="flex-1 overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="px-4 py-4">
                    <div className="grid gap-3">
                      {filteredLibraryModules.length > 0 ? (
                        filteredLibraryModules.map((module) => (
                          <ModuleCard
                            key={module.id}
                            module={module}
                            draggable
                          />
                        ))
                      ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                          <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                            <Search className="h-6 w-6 text-muted-foreground" />
                          </div>
                          <p className="text-sm font-medium text-muted-foreground">
                            No modules found
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Try adjusting your search
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </ScrollArea>
              </div>

              {/* Fixed Request part button at bottom */}
              <div className="shrink-0 p-4 border-t bg-background/95 backdrop-blur-sm">
                <Button
                  className="w-full h-10 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 font-medium"
                  onClick={() => setIsRequestDialogOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Request New Part
                </Button>
              </div>
            </TabsContent>

            {/* Project content */}
            <TabsContent
              value="project"
              className="flex-1 flex flex-col min-h-0 mt-0"
            >
              <div className="flex-1 overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="px-4 py-4">
                    <div className="grid gap-3">
                      {filteredProjectModules.length > 0 ? (
                        filteredProjectModules.map((module) => (
                          <ModuleCard key={module.instanceId} module={module} />
                        ))
                      ) : (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-4">
                            <Package className="h-8 w-8 text-primary/60" />
                          </div>
                          <p className="text-sm font-medium">
                            No components in project
                          </p>
                          <p className="text-xs text-muted-foreground mt-2 max-w-[200px]">
                            Drag components from the library to get started
                          </p>
                          {searchTerm && (
                            <Button
                              variant="link"
                              size="sm"
                              className="mt-3"
                              onClick={() => setSearchTerm("")}
                            >
                              Clear search
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </ScrollArea>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>

      <RequestPartDialog
        open={isRequestDialogOpen}
        onOpenChange={setIsRequestDialogOpen}
      />
    </aside>
  );
}
