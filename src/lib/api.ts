import { supabase } from '@/integrations/supabase/client';

// Personal bills
export const fetchPersonalBills = async (userId: string) => {
  const { data, error } = await supabase
    .from('bills')
    .select('*')
    .eq('user_id', userId)
    .is('group_id', null)
    .order('due_date', { ascending: true, nullsFirst: false });
  if (error) throw error;
  return data;
};

export const fetchGroupBills = async (groupId: string) => {
  const { data, error } = await supabase
    .from('bills')
    .select('*')
    .eq('group_id', groupId)
    .order('due_date', { ascending: true, nullsFirst: false });
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
  responsible_id?: string | null;
}) => {
  const { data, error } = await supabase
    .from('bills')
    .insert(bill)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updateBill = async (id: string, updates: {
  description?: string;
  amount?: number;
  due_date?: string | null;
  category?: string;
  status?: string;
  recurrence?: string;
  notes?: string | null;
  responsible_id?: string | null;
  paid_at?: string | null;
}) => {
  const { error } = await supabase
    .from('bills')
    .update(updates)
    .eq('id', id);
  if (error) throw error;
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

  await supabase.from('group_members').insert({
    group_id: group.id,
    user_id: userId,
    role: 'admin',
  });

  return group;
};

export const deleteGroup = async (id: string) => {
  const { error } = await supabase.from('groups').delete().eq('id', id);
  if (error) throw error;
};

// Invites
export const inviteToGroup = async (groupId: string, email: string, invitedBy: string) => {
  // Check if user exists
  const { data: profile } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('email', email)
    .single();

  if (profile) {
    // User exists - add directly
    const { error } = await supabase.from('group_members').insert({
      group_id: groupId,
      user_id: profile.user_id,
      role: 'member',
    });
    if (error) {
      if (error.code === '23505') throw new Error('Usuário já é membro deste grupo');
      throw error;
    }
    return { added: true };
  }

  // Save invite
  const { error } = await supabase.from('group_invites').insert({
    group_id: groupId,
    email,
    invited_by: invitedBy,
  });
  if (error) {
    if (error.code === '23505') throw new Error('Convite já enviado para este email');
    throw error;
  }
  return { added: false, invited: true };
};

export const fetchGroupInvites = async (groupId: string) => {
  const { data, error } = await supabase
    .from('group_invites')
    .select('*')
    .eq('group_id', groupId)
    .eq('status', 'pending');
  if (error) throw error;
  return data;
};

export const removeGroupMember = async (memberId: string) => {
  const { error } = await supabase.from('group_members').delete().eq('id', memberId);
  if (error) throw error;
};

// Attachments
export const uploadAttachment = async (billId: string, userId: string, file: File) => {
  const filePath = `${userId}/${billId}/${Date.now()}_${file.name}`;
  const { error: uploadError } = await supabase.storage
    .from('attachments')
    .upload(filePath, file);
  if (uploadError) throw uploadError;

  const { data: urlData } = supabase.storage.from('attachments').getPublicUrl(filePath);

  const { data, error } = await supabase.from('bill_attachments').insert({
    bill_id: billId,
    file_name: file.name,
    file_url: urlData.publicUrl,
    file_type: file.type,
    uploaded_by: userId,
  }).select().single();
  if (error) throw error;
  return data;
};

export const fetchAttachments = async (billId: string) => {
  const { data, error } = await supabase
    .from('bill_attachments')
    .select('*')
    .eq('bill_id', billId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
};

export const deleteAttachment = async (id: string, fileUrl: string) => {
  // Extract path from URL
  const urlParts = fileUrl.split('/attachments/');
  if (urlParts[1]) {
    await supabase.storage.from('attachments').remove([urlParts[1]]);
  }
  const { error } = await supabase.from('bill_attachments').delete().eq('id', id);
  if (error) throw error;
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
