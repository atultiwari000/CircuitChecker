"use client";

import { usePlayground } from "@/hooks/usePlayground";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { ScrollArea } from "../ui/scroll-area";
import { ExternalLink, Book, CircuitBoard } from "lucide-react";
import { Separator } from "../ui/separator";

export default function Inspector() {
  const { selectedModule } = usePlayground();

  if (!selectedModule) {
    return (
      <aside className="hidden w-96 flex-col border-l bg-sidebar p-4 md:flex">
        <h2 className="font-headline text-lg font-semibold">INSPECTOR</h2>
        <p className="text-sm text-muted-foreground">
          Part properties and capabilities
        </p>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">
            Select a module to see its properties
          </p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="hidden w-96 flex-col border-l bg-sidebar md:flex">
      <div className="p-4 border-b">
        <h2 className="font-headline text-lg font-semibold">INSPECTOR</h2>
        <p className="text-sm text-muted-foreground">
          Part properties and capabilities
        </p>
      </div>
      <ScrollArea>
        <div className="p-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline flex items-center justify-between text-base">
                <span>{selectedModule.name}</span>
                <CircuitBoard className="h-5 w-5 text-muted-foreground" />
              </CardTitle>
              <div className="flex flex-wrap gap-1 pt-2">
                {selectedModule.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="text-xs font-mono"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-headline text-base">
                Description
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {selectedModule.description}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-headline text-base">
                Documentation
              </CardTitle>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Button variant="outline" asChild>
                <a
                  href={selectedModule.documentation.datasheet}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Book className="mr-2 h-4 w-4" /> Datasheet{" "}
                  <ExternalLink className="ml-2 h-3 w-3" />
                </a>
              </Button>
              <Button variant="outline" asChild>
                <a
                  href={selectedModule.documentation.diagram}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <CircuitBoard className="mr-2 h-4 w-4" /> Diagram{" "}
                  <ExternalLink className="ml-2 h-3 w-3" />
                </a>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-headline text-base">
                Capacity Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Operating Voltage</span>
                <span>
                  {selectedModule.operatingVoltage[0]}V -{" "}
                  {selectedModule.operatingVoltage[1]}V
                </span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Manufacturer</span>
                <span>{selectedModule.manufacturer}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Part #</span>
                <span>{selectedModule.partNumber}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </aside>
  );
}
