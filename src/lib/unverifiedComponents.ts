import { createClient } from '@/lib/server'; 
import type { Module } from '@/lib/types';

export async function getUnverifiedComponents(): Promise<Module[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('unverified_components')
    .select('*')
    .order('created_at', { ascending: false }); 

  if (error) {
    console.error('Error fetching unverified components:', error);
    throw error;
  }

  // Map the data to Module format
  const modules: Module[] = (data || []).map((item: any): Module => ({
    id: item.part_number || item.id || `unverified-${Math.random()}`,
    name: item.name || 'Unknown Component',
    description: item.description || '',
    ports: typeof item.pins === 'string' ? JSON.parse(item.pins) : item.pins || [],
    imageUrl: item.image_url || undefined,
    operatingVoltage: item.operating_voltage,
    partNumber: item.part_number || '',
    manufacturer: item.manufacturer || '',
    external: item.external || false,
    interfaces: item.interfaces || [],
    tags: item.tags || [],
    status: 'unreviewed',
  }));

  return modules;
}

// Real-time subscription to unverified components
export function subscribeToUnverifiedComponents(
  callback: (modules: Module[]) => void
) {
  const supabase = createClient();
  
  const subscription = supabase
    .channel('unverified_components_changes')
    .on(
      'postgres_changes',
      {
        event: '*', // Listen to all changes (INSERT, UPDATE, DELETE)
        schema: 'public',
        table: 'unverified_components',
      },
      async (payload) => {
        console.log('Unverified components changed:', payload);
        // Fetch updated data and call callback
        try {
          const updatedModules = await getUnverifiedComponents();
          callback(updatedModules);
        } catch (error) {
          console.error('Error fetching updated unverified components:', error);
        }
      }
    )
    .subscribe();

  return subscription;
}