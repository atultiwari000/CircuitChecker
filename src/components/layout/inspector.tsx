"use client";

import { usePlayground } from "@/hooks/usePlayground";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { ScrollArea } from "../ui/scroll-area";
import {
  ExternalLink,
  Book,
  CircuitBoard,
  Package,
  Zap,
  Database,
} from "lucide-react";
import { Separator } from "../ui/separator";
import type { Module } from "@/lib/types";

interface PropertiesPanelProps {
  module: Module | null;
}

const Inspector = ({ module }: PropertiesPanelProps) => {
  const { selectedModule } = usePlayground();

  // Use the selectedModule from the hook, not the prop
  const currentModule = selectedModule || module;

  // Helper function to safely parse JSON strings
  const safeJSONParse = (jsonString: string | any, fallback: any = null) => {
    if (typeof jsonString !== "string") return jsonString || fallback;
    try {
      return JSON.parse(jsonString);
    } catch {
      return fallback;
    }
  };

  if (!currentModule) {
    return (
      <aside className="hidden w-96 flex-col border-l bg-sidebar p-4 md:flex">
        <h2 className="font-headline text-lg font-semibold tracking-wider">
          INSPECTOR
        </h2>
        <p className="text-sm text-muted-foreground">
          Part properties and capabilities
        </p>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">
              Select a module to see its properties
            </p>
          </div>
        </div>
      </aside>
    );
  }

  // Parse JSON data from Supabase
  const ports = safeJSONParse(currentModule.ports, []);
  const tags = safeJSONParse(currentModule.tags, []);
  const documentation = safeJSONParse(currentModule.documentation, {});
  const operatingVoltage = safeJSONParse(currentModule.operatingVoltage, null);

  // Count interfaces and resources
  const interfaces = currentModule.interfaces || [];
  const interfaceCount = interfaces.length;
  // const resourceCount = 1; // Assuming each module counts as 1 resource

  // // Calculate resource utilization (mock data - you can replace with real logic)
  // const avgUtilization = Math.floor(Math.random() * 100); // Replace with real calculation

  return (
    <aside className="hidden w-96 flex-col border-l bg-sidebar md:flex">
      <div className="p-4 border-b">
        <h2 className="font-headline text-lg font-semibold tracking-wider">
          INSPECTOR
        </h2>
        <p className="text-sm text-muted-foreground">
          Part properties and capabilities
        </p>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Header Card */}
          <Card className="bg-card/50 border-border">
            <CardHeader className="pb-3">
              <CardTitle className="font-headline flex items-center justify-between text-base">
                <div>
                  <div className="text-lg font-bold">
                    {currentModule.id?.toUpperCase() || currentModule.name}
                  </div>
                  <div className="text-sm text-muted-foreground font-normal">
                    {tags.length > 0 ? tags.join(", ") : "No category"}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {currentModule.status === "unreviewed" && (
                    <Badge variant="destructive" className="text-xs">
                      Unreviewed
                    </Badge>
                  )}
                  <CircuitBoard className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardTitle>
            </CardHeader>
          </Card>

          {/* Description Card */}
          <Card className="bg-card/50 border-border">
            <CardHeader className="pb-2">
              <CardTitle className="font-headline text-base">
                Description
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {currentModule.description || "No description available"}
              </p>
            </CardContent>
          </Card>

          {/* Documentation Card */}
          {(documentation?.datasheetUrl || documentation?.imageUrl) && (
            <Card className="bg-card/50 border-border">
              <CardHeader className="pb-2">
                <CardTitle className="font-headline text-base">
                  Documentation
                </CardTitle>
              </CardHeader>
              <CardContent className="flex gap-2 flex-wrap">
                {documentation?.datasheetUrl && (
                  <Button
                    variant="outline"
                    asChild
                    size="sm"
                    className="flex-1"
                  >
                    <a
                      href={documentation.datasheetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Book className="mr-2 h-4 w-4" /> Datasheet{" "}
                      <ExternalLink className="ml-2 h-3 w-3" />
                    </a>
                  </Button>
                )}
                {documentation?.imageUrl && (
                  <Button
                    variant="outline"
                    asChild
                    size="sm"
                    className="flex-1"
                  >
                    <a
                      href={documentation.imageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <CircuitBoard className="mr-2 h-4 w-4" /> Diagram{" "}
                      <ExternalLink className="ml-2 h-3 w-3" />
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Capacity Summary Card */}
          <Card className="bg-card/50 border-border">
            <CardHeader className="pb-2">
              <CardTitle className="font-headline text-base">
                Capacity Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {currentModule.manufacturer && (
                <>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">
                      Manufacturer
                    </span>
                    <span className="text-sm font-medium">
                      {currentModule.manufacturer}
                    </span>
                  </div>
                </>
              )}

              {operatingVoltage && (
                <>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">
                      Operating Voltage
                    </span>
                    <span className="text-sm font-medium">
                      {Array.isArray(operatingVoltage)
                        ? `${operatingVoltage[0]}V - ${operatingVoltage[1]}V`
                        : operatingVoltage}
                    </span>
                  </div>
                </>
              )}

              {currentModule.partNumber && (
                <>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">
                      Part #
                    </span>
                    <span className="text-sm font-mono">
                      {currentModule.partNumber}
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Interfaces and Resources Cards Row */}
          <div className="grid grid-cols-2 gap-3">
            {/* Interfaces Card */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="pb-2 text-center">
                <CardTitle className="text-white text-xs font-bold tracking-wider">
                  INTERFACES ({interfaceCount})
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {interfaceCount > 0 ? (
                  <div className="space-y-1">
                    {interfaces.map((iface, index) => (
                      <div
                        key={index}
                        className="text-xs text-gray-300 font-mono"
                      >
                        {iface}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-2">
                    <Database className="h-6 w-6 mx-auto mb-1 text-gray-500" />
                    <p className="text-xs text-gray-500">No interfaces</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Ports Card */}
          {ports.length > 0 && (
            <Card className="bg-card/50 border-border">
              <CardHeader className="pb-2">
                <CardTitle className="font-headline text-base">
                  Ports ({ports.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {ports.map((port: any, index: any) => (
                    <div
                      key={index}
                      className="flex justify-between items-center text-xs p-2 bg-background/50 rounded"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            port.type === "power_in"
                              ? "bg-red-500"
                              : port.type === "data_in"
                              ? "bg-blue-500"
                              : port.type === "data_out"
                              ? "bg-green-500"
                              : port.type === "data_io"
                              ? "bg-yellow-500"
                              : "bg-gray-500"
                          }`}
                        />
                        <span className="font-mono text-xs">{port.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs py-0 px-1">
                          {port.type}
                        </Badge>
                        <span className="text-muted-foreground text-xs">
                          {port.position}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </ScrollArea>
    </aside>
  );
};

export default Inspector;
