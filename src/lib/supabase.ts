import type { Module } from '@/lib/types';
import { createClient } from '@/lib/server';

export async function getLibraryModules(): Promise<Module[]> {
  const supabase = createClient();

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

  const mapToModule = (item: any, status?: 'unreviewed'): Module => ({
    id: item.part_number || item.id,
    name: item.name,
    description: item.description,
    ports: typeof item.pins === 'string' ? JSON.parse(item.pins) : item.pins || [],
    imageUrl: item.imageUrl || item.image_url || undefined,
    operatingVoltage: item.operating_voltage,
    partNumber: '',
    manufacturer: '',
    external: false,
    interfaces: [],
    tags: [],
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
