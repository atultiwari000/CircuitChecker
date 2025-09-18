"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
  useEffect,
  useRef,
} from "react";
import type {
  Module,
  ModuleInstance,
  Connection,
  Point,
  ConnectionMode,
  ViewTransform,
} from "@/lib/types";
// import { getModuleById } from "@/data/modules";
import { checkCompatibility } from "@/lib/compatibility";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

const MODULE_WIDTH = 250;
const CARD_HEIGHT = 130;

const generateId = () =>
  `id_${new Date().getTime()}_${Math.random().toString(36).substr(2, 9)}`;

interface TransformControls {
  zoomIn: () => void;
  zoomOut: () => void;
  resetTransform: () => void;
}

interface PlaygroundContextType {
  modules: ModuleInstance[];
  allModules: Module[];
  connections: Connection[];
  connectingPort: { instanceId: string; portId: string } | null;
  selectedModule: ModuleInstance | null;
  connectionMode: ConnectionMode;
  waypoints: Point[];
  isCutMode: boolean;
  transformControls: TransformControls | null;
  addModule: (moduleId: string, position: { x: number; y: number }) => void;
  updateModulePosition: (
    instanceId: string,
    position: { x: number; y: number }
  ) => void;
  handlePortClick: (instanceId: string, portId: string) => void;
  removeConnection: (connectionId: string) => void;
  playgroundRef: React.RefObject<HTMLDivElement>;
  removeModule: (instanceId: string) => void;
  setSelectedModule: (module: ModuleInstance | null) => void;
  validateCircuit: () => void;
  setTransformControls: (controls: TransformControls) => void;
  toggleConnectionMode: () => void;
  addWaypoint: (point: Point) => void;
  setConnectingPort: (
    port: { instanceId: string; portId: string } | null
  ) => void;
  toggleCutMode: () => void;
  panToModule: (instanceId: string) => void;
}

const PlaygroundContext = createContext<PlaygroundContextType | undefined>(
  undefined
);

export const PlaygroundProvider = ({
  children,
  initialModules = [],
}: {
  children: ReactNode;
  initialModules: Module[];
}) => {
  const [modules, setModules] = useState<ModuleInstance[]>([]);
  const [allModules] = useState<Module[]>(initialModules);
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
  const [transformControls, setTransformControls] =
    useState<TransformControls | null>(null);
  const [isCutMode, setIsCutMode] = useState(false);
  const [viewTransform, setViewTransform] = useState<ViewTransform>({
    x: 0,
    y: 0,
    scale: 1,
  });
  const playgroundRef = useRef<HTMLDivElement>(null);

  const getModuleById = useCallback(
    (id: string) => {
      return allModules.find((m) => m.id === id);
    },
    [allModules]
  );

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
    toast({
      title: "Connection Removed",
      description: "The connection has been cut.",
    });
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
    toast({
      title: "Module Removed",
      description: "The module has been cut from the circuit.",
    });
  };

  const panToModule = useCallback(
    (instanceId: string) => {
      const module = modules.find((m) => m.instanceId === instanceId);
      if (!module || !playgroundRef.current) return;

      const playgroundRect = playgroundRef.current.getBoundingClientRect();
      const newX =
        -module.position.x * viewTransform.scale +
        playgroundRect.width / 2 -
        (MODULE_WIDTH * viewTransform.scale) / 2;
      const newY =
        -module.position.y * viewTransform.scale +
        playgroundRect.height / 2 -
        (CARD_HEIGHT * viewTransform.scale) / 2;

      const innerPlayground =
        playgroundRef.current.querySelector<HTMLDivElement>(":scope > div");
      if (innerPlayground) {
        innerPlayground.style.transition = "transform 0.5s ease-in-out";
        setViewTransform((prev) => ({ ...prev, x: newX, y: newY }));
        setTimeout(() => {
          innerPlayground.style.transition = "";
        }, 500);
      } else {
        setViewTransform((prev) => ({ ...prev, x: newX, y: newY }));
      }

      setSelectedModule(instanceId ? module : null);
    },
    [modules, viewTransform.scale]
  );

  const handlePortClick = (instanceId: string, portId: string) => {
    if (isCutMode) {
      toast({
        title: "Cut Mode Active",
        description:
          "Cannot start a connection while in cut mode. Press 'x' to exit.",
        variant: "destructive",
      });
      return;
    }
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
      setTransformControls(controls);
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

  const toggleCutMode = useCallback(() => {
    setIsCutMode((prev) => {
      const newMode = !prev;
      if (newMode) {
        setConnectingPort(null); // Exit connection mode if entering cut mode
        toast({
          title: "Cut Mode Enabled",
          description:
            "Click on a component or wire to remove it. Press 'x' to exit.",
        });
      } else {
        toast({
          title: "Cut Mode Disabled",
          description: "You can now select and move components.",
        });
      }
      return newMode;
    });
  }, [toast]);

  const value = {
    modules,
    connections,
    connectingPort,
    selectedModule,
    connectionMode,
    waypoints,
    isCutMode,
    transformControls,
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
    toggleCutMode,
    allModules,
    panToModule,
    playgroundRef,
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
