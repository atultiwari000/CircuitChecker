"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "../ui/scroll-area";
import { Card } from "../ui/card";
import { supabase } from "@/lib/server";

interface PartSearchResult {
  id: string;
  name: string;
  description: string;
  manufacturer?: string;
  part_number?: string;
  product_index: number;
  session_id: string;
  datasheet?: string;
  image_url?: string;
}

interface PartDetails extends PartSearchResult {
  // datasheetUrl?: string;
  // imageUrl?: string;
  // other details from supabase
}

// Initialize Supabase client with error handling
// let supabase: any = null;
// try {
//   const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
//   const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

//   if (supabaseUrl && supabaseAnonKey) {
//     supabase = createClient(supabaseUrl, supabaseAnonKey);
//   }
// } catch (error) {
//   console.warn("Supabase client initialization failed:", error);
// }

interface RequestPartDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefresh?: () => void;
}

export default function RequestPartDialog({
  open,
  onOpenChange,
  onRefresh,
}: RequestPartDialogProps) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<PartSearchResult[]>([]);
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast({
        variant: "destructive",
        title: "Search Query Required",
        description: "Please enter a search term.",
      });
      return;
    }

    setIsLoading(true);
    setSearchResults([]);
    setCurrentSessionId(null);
    console.log(`Searching for: ${searchQuery}`);

    try {
      // Check if webhook URL is configured
      const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK2_URL;
      if (!webhookUrl) {
        throw new Error("Search service not configured");
      }

      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery.trim() }),
      });

      if (!response.ok) {
        throw new Error(`Search webhook failed: ${response.status}`);
      }

      const { sessionId } = await response.json();
      console.log(`Received session ID: ${sessionId}`);
      setCurrentSessionId(sessionId);

      await fetchResultsFromSupabase(sessionId);
    } catch (error) {
      console.error("Failed to search for parts:", error);
      toast({
        variant: "destructive",
        title: "Search Failed",
        description:
          error instanceof Error
            ? error.message
            : "Could not fetch parts from the search service.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchResultsFromSupabase = async (sessionId: string) => {
    if (!supabase) {
      throw new Error("Database connection not available");
    }

    try {
      console.log(`Fetching results from Supabase for session: ${sessionId}`);

      const { data, error } = await supabase
        .from("temp_search_results")
        .select("*")
        .eq("session_id", sessionId)
        .order("product_index", { ascending: true });

      if (error) {
        throw new Error(`Supabase query failed: ${error.message}`);
      }

      console.log(`Found ${data?.length || 0} results from Supabase`);

      const transformedResults: PartSearchResult[] = (data || []).map(
        (item: any) => ({
          id:
            item.id || item.part_number || `${sessionId}-${item.product_index}`,
          name: item.name || item.part_number || "Unknown Part",
          description: item.description || "No description available",
          manufacturer: item.manufacturer_name,
          part_number: item.part_number,
          product_index: item.product_index,
          session_id: item.session_id,
          datasheet: item.datasheet_url,
          image_url: item.image_url,
        })
      );

      setSearchResults(transformedResults);

      if (transformedResults.length === 0) {
        toast({
          title: "No Results",
          description:
            "No parts found for your search query. Try different keywords.",
        });
      }
    } catch (error) {
      console.error("Failed to fetch results from Supabase:", error);
      throw error;
    }
  };

  const handlePartSelect = async (part: PartSearchResult) => {
    setIsFetchingDetails(true);
    console.log(`Selected part:`, part);

    try {
      const webhookResponse = await fetch("/api/process-part", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "process_part",
          part_data: {
            id: part.id,
            name: part.name,
            description: part.description,
            manufacturer: part.manufacturer,
            part_number: part.part_number,
            product_index: part.product_index,
            session_id: part.session_id,
            datasheet_url: part.datasheet,
            image_url: part.image_url,
          },
          timestamp: new Date().toISOString(),
        }),
      });

      let webhookResult: any;
      try {
        webhookResult = await webhookResponse.json();
      } catch {
        webhookResult = { status: "error", message: "Invalid JSON response" };
      }

      if (!webhookResponse.ok || webhookResult.status === "error") {
        console.error("API error:", webhookResult);
        toast({
          variant: "destructive",
          title: "Selection Failed",
          description:
            webhookResult.message || "Could not process the selected part.",
        });
        return;
      }

      // At this point, webhookResult.status could be "success"
      if (webhookResult.status === "success") {
        const componentId = webhookResult.id ?? `component-${Date.now()}`;
        toast({
          title: "Part Added",
          description:
            webhookResult.message || `Component added with id ${componentId}`,
        });

        // Option A: Refresh the temp search results for the current session so UI updates
        try {
          if (part.session_id) {
            await fetchResultsFromSupabase(part.session_id);
            console.log("Refetched search results after webhook success");
          }
        } catch (err) {
          console.warn("Refetching supabase results failed:", err);
        }

        // Option B: Also notify parent to refresh the main library immediately
        // if (onRefresh) {
        //   try {
        //     onRefresh();
        //   } catch (err) {
        //     console.warn("onRefresh threw:", err);
        //   }
        // }

        // Inform user processing started/completed
        toast({
          title: "Part Processing Started",
          description: `${part.name}${
            part.manufacturer ? ` by ${part.manufacturer}` : ""
          } is being processed and will appear in the library soon.`,
        });

        // Close dialog and reset
        handleDialogChange(false);
        onOpenChange(false);
        return;
      }

      // Fallback: if webhookResult had unexpected structure
      toast({
        title: "Selection Response",
        description:
          webhookResult.message ||
          "Received response from processing endpoint.",
      });

      handleDialogChange(false);
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to select part:", error);
      toast({
        variant: "destructive",
        title: "Selection Failed",
        description: "Could not process the selected part. Please try again.",
      });
    } finally {
      setIsFetchingDetails(false);
    }
  };

  const handleDialogChange = (open: boolean) => {
    if (!open) {
      setSearchQuery("");
      setSearchResults([]);
      setCurrentSessionId(null);
      setIsLoading(false);
      setIsFetchingDetails(false);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle>Request New Part</DialogTitle>
          <DialogDescription>
            Search for a new component to add to your library.
          </DialogDescription>
        </DialogHeader>

        <div className="flex w-full items-center space-x-2 py-4 shrink-0">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search for components like 'LM741' or 'NE555'..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              disabled={isLoading}
            />
          </div>
          <Button
            onClick={handleSearch}
            disabled={isLoading || !searchQuery.trim()}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Search
          </Button>
        </div>

        <div className="flex-1 min-h-0 overflow-auto">
          <ScrollArea className="h-full">
            <div className="space-y-2 pr-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Searching for parts...
                    </p>
                  </div>
                </div>
              ) : searchResults.length > 0 ? (
                searchResults.map((part) => (
                  <Card
                    key={`${part.session_id}-${part.product_index}`}
                    className="p-4 hover:bg-secondary cursor-pointer transition-colors border-l-4 border-l-primary/20 hover:border-l-primary"
                    onClick={() => handlePartSelect(part)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold">{part.name}</p>
                          {part.part_number &&
                            part.part_number !== part.name && (
                              <span className="text-xs font-mono bg-muted px-2 py-1 rounded">
                                {part.part_number}
                              </span>
                            )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {part.description}
                        </p>
                        {part.manufacturer && (
                          <p className="text-xs text-muted-foreground">
                            Manufacturer: {part.manufacturer}
                          </p>
                        )}
                      </div>
                      {isFetchingDetails && (
                        <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                      )}
                    </div>
                  </Card>
                ))
              ) : currentSessionId && !isLoading ? (
                <div className="text-center py-12">
                  <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mb-3 mx-auto">
                    <Search className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">
                    No parts found
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Try different search keywords
                  </p>
                </div>
              ) : (
                !isLoading && (
                  <div className="text-center py-12">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3 mx-auto">
                      <Search className="h-6 w-6 text-primary/60" />
                    </div>
                    <p className="text-sm font-medium">
                      Search for electronic components
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Enter a part number or component name above
                    </p>
                  </div>
                )
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
