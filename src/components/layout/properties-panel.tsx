'use client';

import type { CircuitComponent } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';

interface PropertiesPanelProps {
  component: CircuitComponent | undefined;
}

export default function PropertiesPanel({ component }: PropertiesPanelProps) {
  return (
    <aside className="w-80 flex flex-col border-l bg-card">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold tracking-tight">Properties</h2>
      </div>
      <ScrollArea className="flex-1">
        {component ? (
          <Tabs defaultValue="properties" className="p-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="properties">Properties</TabsTrigger>
              <TabsTrigger value="dataset">Dataset</TabsTrigger>
            </TabsList>
            <TabsContent value="properties" className="mt-4">
              <Card className="border-none shadow-none">
                <CardHeader className="p-0 mb-4">
                  <CardTitle className="text-base">{component.name}</CardTitle>
                  <CardDescription>Type: {component.type}</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="space-y-4">
                    {Object.entries(component.properties).map(([key, value]) => (
                      <div key={key} className="space-y-2">
                        <Label htmlFor={`${component.id}-${key}`}>{key}</Label>
                        <Input
                          id={`${component.id}-${key}`}
                          defaultValue={value}
                          className="h-8"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="dataset" className="mt-4">
                <Card className="border-none shadow-none">
                    <CardHeader className="p-0 mb-4">
                        <CardTitle className="text-base">Component Data</CardTitle>
                        <CardDescription>Underlying dataset for {component.name}.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="space-y-3 text-sm">
                            {Object.entries(component.dataset).map(([key, value]) => (
                                <div key={key} className="flex justify-between">
                                    <span className="text-muted-foreground">{key}</span>
                                    <span className="font-medium">{value}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="flex items-center justify-center h-full text-sm text-muted-foreground p-4 text-center">
            Select a component to view its properties.
          </div>
        )}
      </ScrollArea>
    </aside>
  );
}
