"use client";

import { Code2, Moon, Sun, ShieldCheck } from "lucide-react";
import { Button } from "../ui/button";
import { useTheme } from "next-themes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePlayground } from "@/hooks/usePlayground";

export default function Header() {
  const { setTheme } = useTheme();
  const { validateCircuit } = usePlayground();

  return (
    <header className="flex h-12 shrink-0 items-center border-b px-4 md:px-6">
      <div className="flex items-center gap-2">
        <Code2 className="h-6 w-6 text-primary" />
        <h1 className="font-headline text-lg font-bold tracking-tight text-primary">
          CircuitVerse
        </h1>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <Button variant="outline" onClick={validateCircuit}>
          <ShieldCheck className="h-4 w-4 mr-2" />
          Validate
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setTheme("light")}>
              Light
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("dark")}>
              Dark
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("system")}>
              System
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
