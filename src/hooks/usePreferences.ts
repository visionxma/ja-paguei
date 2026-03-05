import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface UserPreferences {
  id: string;
  user_id: string;
  notify_due_1day: boolean;
  notify_due_3days: boolean;
  notify_due_7days: boolean;
  notify_overdue: boolean;
  notify_group_new_bill: boolean;
  notify_group_bill_changed: boolean;
  notify_group_new_member: boolean;
  notify_group_bill_paid: boolean;
  theme: string;
  currency: string;
  date_format: string;
}

const defaultPrefs: Omit<UserPreferences, 'id' | 'user_id'> = {
  notify_due_1day: true,
  notify_due_3days: false,
  notify_due_7days: false,
  notify_overdue: true,
  notify_group_new_bill: true,
  notify_group_bill_changed: true,
  notify_group_new_member: true,
  notify_group_bill_paid: true,
  theme: 'dark',
  currency: 'BRL',
  date_format: 'DD/MM/YYYY',
};

export function usePreferences() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['user_preferences', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        const { data: created, error: insertErr } = await supabase
          .from('user_preferences')
          .insert({ user_id: user!.id })
          .select()
          .single();
        if (insertErr) throw insertErr;
        return created as unknown as UserPreferences;
      }
      return data as unknown as UserPreferences;
    },
  });

  const mutation = useMutation({
    mutationFn: async (updates: Partial<Omit<UserPreferences, 'id' | 'user_id'>>) => {
      const { error } = await supabase
        .from('user_preferences')
        .update(updates as any)
        .eq('user_id', user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['user_preferences', user?.id] });
      toast.success('Configuração salva com sucesso');
    },
    onError: () => {
      toast.error('Erro ao salvar configuração');
    },
  });

  return {
    preferences: query.data ?? { ...defaultPrefs } as UserPreferences,
    isLoading: query.isLoading,
    updatePreference: mutation.mutate,
    isSaving: mutation.isPending,
  };
}
