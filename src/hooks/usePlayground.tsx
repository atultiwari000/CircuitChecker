"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
  useEffect,
} from "react";
import type {
  Module,
  ModuleInstance,
  Connection,
  Point,
  ConnectionMode,
} from "@/lib/types";
import { getModuleById } from "@/data/modules";
import { checkCompatibility } from "@/lib/compatibility";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

const generateId = () =>
  `id_${new Date().getTime()}_${Math.random().toString(36).substr(2, 9)}`;

interface TransformControls {
  zoomIn: () => void;
  zoomOut: () => void;
  resetTransform: () => void;
}

interface PlaygroundContextType {
  modules: ModuleInstance[];
  connections: Connection[];
  connectingPort: { instanceId: string; portId: string } | null;
  selectedModule: ModuleInstance | null;
  connectionMode: ConnectionMode;
  waypoints: Point[];
  addModule: (moduleId: string, position: { x: number; y: number }) => void;
  updateModulePosition: (
    instanceId: string,
    position: { x: number; y: number }
  ) => void;
  handlePortClick: (instanceId: string, portId: string) => void;
  removeConnection: (connectionId: string) => void;
  removeModule: (instanceId: string) => void;
  setSelectedModule: (module: ModuleInstance | null) => void;
  validateCircuit: () => void;
  setTransformControls: (controls: TransformControls) => void;
  toggleConnectionMode: () => void;
  addWaypoint: (point: Point) => void;
  setConnectingPort: (
    port: { instanceId: string; portId: string } | null
  ) => void;
}

const PlaygroundContext = createContext<PlaygroundContextType | undefined>(
  undefined
);

export const PlaygroundProvider = ({ children }: { children: ReactNode }) => {
  const [modules, setModules] = useState<ModuleInstance[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [connectingPort, setConnectingPort] = useState<{
    instanceId: string;
    portId: string;
  } | null>(null);
  const [selectedModule, setSelectedModule] = useState<ModuleInstance | null>(
    null
  );
  const [connectionMode, setConnectionMode] =
    useState<ConnectionMode>("curved");
  const [waypoints, setWaypoints] = useState<Point[]>([]);
  const { toast } = useToast();
  const [showConnectionModeToast, setShowConnectionModeToast] = useState(false);

  useEffect(() => {
    if (showConnectionModeToast) {
      toast({
        title: "Connection Mode Changed",
        description: `Future connections will be ${connectionMode}.`,
      });
      setShowConnectionModeToast(false);
    }
  }, [connectionMode, showConnectionModeToast, toast]);

  const addModule = (moduleId: string, position: { x: number; y: number }) => {
    const moduleData = getModuleById(moduleId);
    if (moduleData) {
      const newModule: ModuleInstance = {
        ...moduleData,
        instanceId: generateId(),
        position,
      };
      setModules((prev) => [...prev, newModule]);
    }
  };

  const updateModulePosition = (
    instanceId: string,
    position: { x: number; y: number }
  ) => {
    setModules((prev) =>
      prev.map((m) => (m.instanceId === instanceId ? { ...m, position } : m))
    );
  };

  const removeConnection = (connectionId: string) => {
    setConnections((prev) => prev.filter((c) => c.id !== connectionId));
  };

  const removeModule = (instanceId: string) => {
    setModules((prev) => prev.filter((m) => m.instanceId !== instanceId));
    setConnections((prev) =>
      prev.filter(
        (c) =>
          c.from.instanceId !== instanceId && c.to.instanceId !== instanceId
      )
    );
    if (selectedModule?.instanceId === instanceId) {
      setSelectedModule(null);
    }
  };

  const handlePortClick = (instanceId: string, portId: string) => {
    if (!connectingPort) {
      setConnectingPort({ instanceId, portId });
      setWaypoints([]);
      toast({
        title: "Starting Connection",
        description: "Select a port on another module to connect.",
      });
    } else {
      if (connectingPort.instanceId === instanceId) {
        toast({
          title: "Connection Canceled",
          description:
            "Cannot connect a module to itself. Canceled connection.",
          variant: "destructive",
        });
        setConnectingPort(null);
        setWaypoints([]);
        return;
      }

      const newConnection: Connection = {
        id: generateId(),
        from: {
          instanceId: connectingPort.instanceId,
          portId: connectingPort.portId,
        },
        to: { instanceId, portId },
        status: "pending",
        waypoints,
        mode: connectionMode,
      };

      setConnections((prev) => [...prev, newConnection]);
      setConnectingPort(null);
      setWaypoints([]);
      toast({
        title: "Connection Created",
        description: "Connection created. Click 'Validate' to check circuit.",
      });
    }
  };

  const validateCircuit = () => {
    if (connections.length === 0) {
      toast({
        title: "Nothing to Validate",
        description: "There are no connections in the circuit.",
      });
      return;
    }

    let incompatibleConnections = 0;
    const updatedConnections = connections.map((conn) => {
      const { compatible, reason } = checkCompatibility(conn, modules);
      if (!compatible) {
        incompatibleConnections++;
        const toModule = modules.find(
          (m) => m.instanceId === conn.to.instanceId
        );
        toast({
          variant: "destructive",
          title: "Compatibility Error",
          description: reason,
          duration: 10000,
          action: (
            <Button
              variant="secondary"
              onClick={() => {
                const event = new CustomEvent("open-recommendations", {
                  detail: { module: toModule, reason },
                });
                window.dispatchEvent(event);
              }}
            >
              Get AI Help
            </Button>
          ),
        });
      }
      return { ...conn, status: compatible ? "ok" : "incompatible" };
    });

    setConnections(updatedConnections);

    if (incompatibleConnections === 0) {
      toast({
        title: "Validation Successful",
        description: "All connections are compatible.",
      });
    } else {
      toast({
        title: "Validation Complete",
        description: `Found ${incompatibleConnections} incompatible connection(s).`,
      });
    }
  };

  const handleSetTransformControls = useCallback(
    (controls: TransformControls) => {
      // This function is kept for now in case we need to pass other controls in the future
    },
    []
  );

  const toggleConnectionMode = useCallback(() => {
    setConnectionMode((prev) => {
      const newMode = prev === "curved" ? "orthogonal" : "curved";
      setShowConnectionModeToast(true);
      return newMode;
    });
  }, []);

  const addWaypoint = (point: Point) => {
    if (connectingPort && connectionMode === "orthogonal") {
      setWaypoints((prev) => [...prev, point]);
    }
  };

  const handleSetConnectingPort = (
    port: { instanceId: string; portId: string } | null
  ) => {
    setConnectingPort(port);
    if (port === null) {
      setWaypoints([]);
    }
  };

  const value = {
    modules,
    connections,
    connectingPort,
    selectedModule,
    connectionMode,
    waypoints,
    addModule,
    updateModulePosition,
    handlePortClick,
    removeConnection,
    removeModule,
    setSelectedModule,
    validateCircuit,
    setTransformControls: handleSetTransformControls,
    toggleConnectionMode,
    addWaypoint,
    setConnectingPort: handleSetConnectingPort,
  };

  return (
    <PlaygroundContext.Provider value={value}>
      {children}
    </PlaygroundContext.Provider>
  );
};

export const usePlayground = () => {
  const context = useContext(PlaygroundContext);
  if (context === undefined) {
    throw new Error("usePlayground must be used within a PlaygroundProvider");
  }
  return context;
};
