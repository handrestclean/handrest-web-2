import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Panchayath {
  id: string;
  name: string;
  ward_count: number;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export function usePanchayaths() {
  return useQuery({
    queryKey: ['panchayaths'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('panchayaths')
        .select('*')
        .order('display_order', { ascending: true });
      if (error) throw error;
      return data as Panchayath[];
    },
  });
}

export function useCreatePanchayath() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (panchayath: { name: string; ward_count: number }) => {
      const { data, error } = await supabase
        .from('panchayaths')
        .insert(panchayath)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['panchayaths'] }),
  });
}

export function useUpdatePanchayath() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; ward_count?: number; is_active?: boolean }) => {
      const { data, error } = await supabase
        .from('panchayaths')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['panchayaths'] }),
  });
}

export function useDeletePanchayath() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('panchayaths').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['panchayaths'] }),
  });
}
