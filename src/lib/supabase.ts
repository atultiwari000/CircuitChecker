import type { Module } from '@/lib/types';
import { supabase } from '@/lib/server';

export async function getLibraryModules(): Promise<Module[]> {

  const { data: circuitverseData, error: circuitverseError } = await supabase
    .from('circuitverse')
    .select('*');

  if (circuitverseError) {
    console.error('Error fetching from circuitverse:', circuitverseError);
    return [];
  }

  const { data: unverifiedData, error: unverifiedError } = await supabase
    .from('unverified_components')
    .select('*');

  if (unverifiedError) {
    console.error('Error fetching from unverified_components:', unverifiedError);
  }

    const safeJSONParse = (jsonString: string | any, fallback: any = null) => {
    if (typeof jsonString !== 'string') return jsonString || fallback;
    try {
      return JSON.parse(jsonString);
    } catch (error) {
      console.warn('Failed to parse JSON:', jsonString, error);
      return fallback;
    }
  };

  const mapToModule = (item: any, status?: 'unreviewed'): Module => ({
    id: item.part_number || item.id || `module-${Math.random()}`,
    name: item.name || 'Unknown Component',
    description: item.description || '',
    
    // Parse JSON strings from Supabase
    ports: safeJSONParse(item.ports || item.pins, []),
    tags: safeJSONParse(item.tags, []),
    documentation: safeJSONParse(item.documentation, {}),
    operatingVoltage: safeJSONParse(item.operatingVoltage || item.operating_voltage, null),
    
    // Handle other fields
    imageUrl: item.imageUrl || item.image_url || undefined,
    datasheetUrl: item.datasheetUrl || item.datasheet_url || undefined,
    partNumber: item.part_number || item.partNumber || '',
    manufacturer: item.manufacturer || '',
    external: item.external || false,
    interfaces: safeJSONParse(item.interfaces, []),
    status: status,
  });

  const modules: Module[] = [];
  
  // Add verified components from circuitverse
  if (circuitverseData) {
    modules.push(...circuitverseData.map(item => mapToModule(item)));
  }

  // Add unverified components with 'unreviewed' status
  if (unverifiedData) {
    modules.push(...unverifiedData.map(item => mapToModule(item, 'unreviewed')));
  }

  return modules;
}
