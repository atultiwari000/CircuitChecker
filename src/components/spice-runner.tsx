'use client';
import { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Loader2 } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
// @ts-ignore
import createNgspice from '../spice/spice.js';

const initialNetlist = `* Simple Resistor Voltage Divider
V1 in 0 DC 10
R1 in out 1k
R2 out 0 2k

.control
op
print allv
.endc

.end
`;

export default function SpiceRunner() {
  const [ngspice, setNgspice] = useState<any>(null);
  const [isReady, setIsReady] = useState(false);
  const [netlist, setNetlist] = useState(initialNetlist);
  const [output, setOutput] = useState<string>('');
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    async function loadNgspice() {
      try {
        const instance = await createNgspice({
            postRun: [],
            print: (text: string) => {
                setOutput(prev => prev + text + '\n');
            },
            printErr: (text: string) => {
                setOutput(prev => prev + 'ERROR: ' + text + '\n');
            }
        });
        setNgspice(instance);
        setIsReady(true);
      } catch (e) {
        console.error("Error loading ngspice:", e);
        setOutput("Failed to load ngspice WASM module. See console for details.");
      }
    }
    loadNgspice();
  }, []);

  const runSimulation = () => {
    if (!ngspice || !isReady) {
      setOutput('ngspice is not ready.');
      return;
    }
    setIsRunning(true);
    setOutput('');
    
    setTimeout(() => {
        try {
            ngspice.FS.writeFile('/netlist.cir', netlist);
            const result = ngspice.ccall(
              'ngspice_main',
              'number',
              ['array'],
              [['/netlist.cir']]
            );
            
            if (result !== 0) {
                 setOutput(prev => prev + `\nSimulation finished with exit code: ${result}`);
            }

        } catch (e: any) {
            setOutput(prev => prev + 'Exception during simulation: ' + e.message);
        } finally {
            setIsRunning(false);
        }
    }, 50); // Small delay to allow UI to update
  };

  return (
    <div className="grid grid-cols-2 gap-4 h-full">
      <div className="flex flex-col gap-4">
        <h3 className="font-semibold">SPICE Netlist</h3>
        <Textarea
          value={netlist}
          onChange={(e) => setNetlist(e.target.value)}
          className="h-full font-mono text-xs"
          placeholder="Enter your SPICE netlist here"
        />
        <Button onClick={runSimulation} disabled={!isReady || isRunning}>
          {isRunning ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          {isRunning ? 'Simulating...' : 'Run Simulation'}
        </Button>
      </div>
      <div className="flex flex-col gap-4">
        <h3 className="font-semibold">Simulation Output</h3>
        <ScrollArea className="h-full bg-muted rounded-md border p-4">
            <pre className="text-xs font-mono whitespace-pre-wrap">
                {isReady ? (output || "Output will appear here.") : "Loading ngspice..."}
            </pre>
        </ScrollArea>
      </div>
    </div>
  );
}
