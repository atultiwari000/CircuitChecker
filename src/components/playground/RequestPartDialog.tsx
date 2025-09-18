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
import { createClient } from "@supabase/supabase-js";

// --- Types ---
interface PartSearchResult {
  id: string;
  name: string;
  description: string;
  manufacturer?: string;
  part_number?: string;
  product_index: number;
  session_id: string;
}

interface PartDetails extends PartSearchResult {
  datasheetUrl?: string;
  // other details from supabase
}

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);
const N8N_WEBHOOK_URL = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL!;

interface RequestPartDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function RequestPartDialog({
  open,
  onOpenChange,
}: RequestPartDialogProps) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<PartSearchResult[]>([]);
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setSearchResults([]);
    setCurrentSessionId(null);
    console.log(`Searching for: ${searchQuery}`);

    try {
      const response = await fetch(process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL!, {
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
          manufacturer: item.manufacturer,
          part_number: item.part_number,
          product_index: item.product_index,
          session_id: item.session_id,
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
      const partDetails: PartDetails = {
        ...part,
        datasheetUrl: undefined,
      };

      console.log("Part details:", partDetails);

      toast({
        title: "Part Selected",
        description: `${partDetails.name} ${
          partDetails.manufacturer ? `by ${partDetails.manufacturer}` : ""
        } is ready.`,
      });

      onOpenChange(false);

      setSearchQuery("");
      setSearchResults([]);
      setCurrentSessionId(null);
    } catch (error) {
      console.error("Failed to select part:", error);
      toast({
        variant: "destructive",
        title: "Selection Failed",
        description: "Could not process the selected part.",
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
