import { supabase } from '@/integrations/supabase/client';
import { Bill } from '@/types/finance';

// Personal bills
export const fetchPersonalBills = async (userId: string) => {
  const { data, error } = await supabase
    .from('bills')
    .select('*')
    .eq('user_id', userId)
    .is('group_id', null)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
};

export const fetchGroupBills = async (groupId: string) => {
  const { data, error } = await supabase
    .from('bills')
    .select('*')
    .eq('group_id', groupId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
};

export const createBill = async (bill: {
  user_id: string;
  description: string;
  amount: number;
  due_date?: string | null;
  category: string;
  status: string;
  recurrence: string;
  group_id?: string | null;
  notes?: string | null;
}) => {
  const { data, error } = await supabase
    .from('bills')
    .insert(bill)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updateBillStatus = async (id: string, status: string, paidAt?: string | null) => {
  const { error } = await supabase
    .from('bills')
    .update({ status, paid_at: paidAt })
    .eq('id', id);
  if (error) throw error;
};

export const deleteBill = async (id: string) => {
  const { error } = await supabase.from('bills').delete().eq('id', id);
  if (error) throw error;
};

// Groups
export const fetchGroups = async () => {
  const { data, error } = await supabase
    .from('group_members')
    .select('group_id, role, groups(id, name, description, created_at, created_by)')
    .order('joined_at', { ascending: false });
  if (error) throw error;
  return data;
};

export const fetchGroupDetail = async (groupId: string) => {
  const { data, error } = await supabase
    .from('groups')
    .select('*')
    .eq('id', groupId)
    .single();
  if (error) throw error;
  return data;
};

export const fetchGroupMembers = async (groupId: string) => {
  const { data, error } = await supabase
    .from('group_members')
    .select('*, profiles(display_name, avatar_url, email)')
    .eq('group_id', groupId);
  if (error) throw error;
  return data;
};

export const createGroup = async (name: string, description: string, userId: string) => {
  const { data: group, error } = await supabase
    .from('groups')
    .insert({ name, description, created_by: userId })
    .select()
    .single();
  if (error) throw error;

  // Add creator as admin member
  await supabase.from('group_members').insert({
    group_id: group.id,
    user_id: userId,
    role: 'admin',
  });

  return group;
};

// Profile
export const fetchProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single();
  if (error) throw error;
  return data;
};

export const updateProfile = async (userId: string, updates: { display_name?: string; avatar_url?: string }) => {
  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('user_id', userId);
  if (error) throw error;
};
