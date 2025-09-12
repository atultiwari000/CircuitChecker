"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { Module } from "@/lib/types";
import { recommendAlternativeModulesAction } from "@/actions/recommend";
import type { RecommendAlternativeModulesOutput } from "@/ai/flows/recommend-alternative-modules";
import { Skeleton } from "../ui/skeleton";
import { Lightbulb } from "lucide-react";
import { Card, CardContent } from "../ui/card";

interface RecommendationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  module: Module | null | undefined;
  reason: string | null | undefined;
}

export default function RecommendationDialog({
  open,
  onOpenChange,
  module,
  reason,
}: RecommendationDialogProps) {
  const [recommendations, setRecommendations] =
    useState<RecommendAlternativeModulesOutput | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && module && reason) {
      const fetchRecommendations = async () => {
        setLoading(true);
        setRecommendations(null);
        const result = await recommendAlternativeModulesAction(module, reason);
        setRecommendations(result);
        setLoading(false);
      };
      fetchRecommendations();
    }
  }, [open, module, reason]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle className="font-headline flex items-center gap-2">
            <Lightbulb className="h-6 w-6 text-primary" />
            AI Recommendations
          </DialogTitle>
          <DialogDescription>
            Here are some alternative modules for{" "}
            <span className="font-semibold text-primary">{module?.name}</span>{" "}
            based on the issue: "{reason}"
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          {loading && (
            <>
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </>
          )}
          {recommendations && recommendations.recommendedModules.length > 0 && (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              {recommendations.recommendedModules.map((rec, index) => (
                <Card key={index} className="bg-card/50">
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-primary">{rec.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {rec.reason}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          {recommendations &&
            recommendations.recommendedModules.length === 0 &&
            !loading && (
              <p className="text-center text-muted-foreground">
                No alternative modules found.
              </p>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
