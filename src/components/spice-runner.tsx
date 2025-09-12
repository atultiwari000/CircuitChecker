'use client';
import { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Loader2 } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';

const initialNetlist = `* Simple Resistor Voltage Divider
V1 in 0 DC 10
R1 in out 1k
R2 out 0 2k

.op
.print dc v(in) v(out) i(v1)

.end
`;

export default function SpiceRunner() {
  const [isReady, setIsReady] = useState(true);
  const [netlist, setNetlist] = useState(initialNetlist);
  const [output, setOutput] = useState<string>('Click the Run Simulation button to start...\n');
  const [isRunning, setIsRunning] = useState(false);
  const scriptLoadedRef = useRef(false);

  const runSimulation = () => {
    if (isRunning) return;

    setIsRunning(true);
    setOutput('Simulation running. Please wait...\n');

    // Setup Module configuration (global variable for Emscripten)
    (window as any).Module = {
      arguments: ['-b', 'circuit.cir'],
      preRun: [() => {
        console.log('Setting up ngspice simulation');
        // Write netlist to virtual filesystem
        (window as any).FS.writeFile('/circuit.cir', netlist);
      }],
      postRun: [() => {
        console.log('Simulation completed');
        setOutput(prev => prev + '\nSimulation finished. You can run another simulation.\n');
        setIsRunning(false);
      }],
      print: (text: string) => {
        if (text) {
          setOutput(prev => prev + text + '\n');
        }
      },
      printErr: (text: string) => {
        // Hide expected warnings and errors
        if (!text.includes('/proc/meminfo') &&
          !text.includes('spinit') &&
          !text.includes('init file') &&
          !text.includes('/proc/') &&
          !text.includes('compatibility mode') &&
          !text.includes('allv analysis')) {
          setOutput(prev => prev + 'ERROR: ' + text + '\n');
        }
      },
      locateFile: (file: string) => `/spice/${file}`
    };

    // Load spice script dynamically
    const script = document.createElement('script');
    script.src = '/spice/ngspice.js';
    script.type = 'text/javascript';
    script.onload = () => {
      console.log('ngspice.js loaded successfully');
    };
    script.onerror = () => {
      setOutput(prev => prev + 'ERROR: Failed to load ngspice.js\n');
      setIsRunning(false);
    };

    document.body.appendChild(script);

    // Clean up script after use
    setTimeout(() => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    }, 10000); // Remove after 10 seconds
  };

  return (
    <div className="grid grid-cols-2 gap-4 h-full overflow-auto">
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
