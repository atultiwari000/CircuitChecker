"use client";

import { useState, useEffect, useCallback } from "react";
import ComponentLibrary from "@/components/layout/component-library";
import RequestPartDialog from "@/components/playground/RequestPartDialog";
import type { Module } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

export default function PlaygroundPage() {
  const [allModules, setAllModules] = useState<Module[]>([]);
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Mock data for testing
  const mockModules: Module[] = [
    {
      id: "mock-1",
      name: "LM741",
      description: "Operational amplifier",
      manufacturer: "Texas Instruments",
      //   status: "reviewed",
      external: false,
      interfaces: [],
      ports: [],
      partNumber: "LM741CN",
      tags: ["analog", "amplifier"],
    },
    {
      id: "mock-2",
      name: "NE555",
      description: "Timer IC",
      manufacturer: "Texas Instruments",
      //   status: "reviewed",
      external: false,
      interfaces: [],
      ports: [],
      partNumber: "NE555P",
      tags: ["timer", "digital"],
    },
  ];

  // Function to fetch all modules (mock for now)
  const fetchModules = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log("Fetching modules...");

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // For now, use mock data
      setAllModules(mockModules);
      console.log(`Loaded ${mockModules.length} mock modules`);

      toast({
        title: "Components loaded",
        description: `Loaded ${mockModules.length} components`,
      });
    } catch (error) {
      console.error("Error fetching modules:", error);
      toast({
        variant: "destructive",
        title: "Error loading components",
        description: "An unexpected error occurred while loading components",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Initial load
  useEffect(() => {
    fetchModules();
  }, [fetchModules]);

  // Refresh function to be passed to RequestPartDialog
  const handleRefreshModules = useCallback(() => {
    console.log("Refreshing component library...");
    fetchModules();
  }, [fetchModules]);

  const handleOpenRequestDialog = useCallback(() => {
    console.log("Opening request dialog - current state:", isRequestDialogOpen);
    setIsRequestDialogOpen(true);
    console.log("Dialog state should now be: true");
  }, [isRequestDialogOpen]);

  const handleCloseRequestDialog = useCallback((open: boolean) => {
    console.log("Dialog onOpenChange called with:", open);
    setIsRequestDialogOpen(open);
  }, []);

  // Debug: Log state changes
  useEffect(() => {
    console.log("Dialog state changed to:", isRequestDialogOpen);
  }, [isRequestDialogOpen]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading components...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <ComponentLibrary
        allModules={allModules}
        onRequestNewPart={handleOpenRequestDialog}
      />

      {/* Debug info */}
      <div className="flex-1 p-4">
        <div className="bg-muted p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Debug Info</h2>
          <p>Dialog State: {isRequestDialogOpen ? "Open" : "Closed"}</p>
          <p>Modules Count: {allModules.length}</p>
          <button
            onClick={handleOpenRequestDialog}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded"
          >
            Test Open Dialog
          </button>
        </div>
      </div>
    </div>
  );
}
