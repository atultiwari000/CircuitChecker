import type { Connection, ModuleInstance, Port } from './types';

export function checkCompatibility(connection: Connection, modules: ModuleInstance[]): { compatible: boolean; reason: string } {
    const fromModule = modules.find(m => m.instanceId === connection.from.instanceId);
    const toModule = modules.find(m => m.instanceId === connection.to.instanceId);
    if (!fromModule || !toModule) {
        return { compatible: false, reason: 'Module not found.' };
    }

    const fromPort = fromModule.ports.find(p => p.id === connection.from.portId);
    const toPort = toModule.ports.find(p => p.id === connection.to.portId);
    if (!fromPort || !toPort) {
        return { compatible: false, reason: 'Port not found.' };
    }
    
    // Rule: Can't connect two output ports
    if (fromPort.type === 'power_out' && toPort.type === 'power_out') {
        return { compatible: false, reason: 'Cannot connect two power output ports together.' };
    }

    // Rule: GND must connect to GND
    if ((fromPort.type === 'gnd' && toPort.type !== 'gnd') || (fromPort.type !== 'gnd' && toPort.type === 'gnd')) {
        return { compatible: false, reason: 'Ground (GND) ports can only be connected to other GND ports.' };
    }
    if (fromPort.type === 'gnd' && toPort.type === 'gnd') {
        return { compatible: true, reason: 'GND connection is valid.' };
    }

    // Rule: Check voltage compatibility
    if (fromPort.type === 'power_out' && toPort.type === 'power_in') {
        const outputVoltage = fromPort.voltage;
        if (typeof outputVoltage !== 'number') {
            return { compatible: true, reason: 'Source voltage not specified, assuming compatibility.' };
        }

        const [minVoltage, maxVoltage] = toModule.operatingVoltage;
        if (outputVoltage < minVoltage || outputVoltage > maxVoltage) {
            return { 
                compatible: false, 
                reason: `${toModule.name} requires ${minVoltage}V-${maxVoltage}V, but is supplied with ${outputVoltage}V.`
            };
        }
    }
    
    // Reverse connection check
    if (toPort.type === 'power_out' && fromPort.type === 'power_in') {
        const outputVoltage = toPort.voltage;
        if (typeof outputVoltage !== 'number') {
            return { compatible: true, reason: 'Source voltage not specified, assuming compatibility.' };
        }

        const [minVoltage, maxVoltage] = fromModule.operatingVoltage;
        if (outputVoltage < minVoltage || outputVoltage > maxVoltage) {
            return { 
                compatible: false, 
                reason: `${fromModule.name} requires ${minVoltage}V-${maxVoltage}V, but is supplied with ${outputVoltage}V.`
            };
        }
    }


    // All checks passed
    return { compatible: true, reason: 'Connection is compatible.' };
}
