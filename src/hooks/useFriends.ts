import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface FriendRow {
  id: string;
  requester_id: string;
  receiver_id: string;
  status: string;
  created_at: string;
}

export interface FriendWithProfile extends FriendRow {
  friend_user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  email: string | null;
}

export function useFriends() {
  const { user } = useAuth();
  const [friends, setFriends] = useState<FriendWithProfile[]>([]);
  const [pendingReceived, setPendingReceived] = useState<FriendWithProfile[]>([]);
  const [pendingSent, setPendingSent] = useState<FriendWithProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFriends = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    // Fetch all friend rows involving this user
    const { data: rows, error } = await supabase
      .from('friends')
      .select('*')
      .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`);

    if (error) {
      console.error('Error fetching friends:', error);
      setLoading(false);
      return;
    }

    if (!rows || rows.length === 0) {
      setFriends([]);
      setPendingReceived([]);
      setPendingSent([]);
      setLoading(false);
      return;
    }

    // Get all unique user IDs that are not the current user
    const otherIds = rows.map(r => r.requester_id === user.id ? r.receiver_id : r.requester_id);
    const uniqueIds = [...new Set(otherIds)];

    // Fetch profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, display_name, avatar_url, email')
      .in('user_id', uniqueIds);

    const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));

    const enriched: FriendWithProfile[] = rows.map(r => {
      const friendId = r.requester_id === user.id ? r.receiver_id : r.requester_id;
      const profile = profileMap.get(friendId);
      return {
        ...r,
        friend_user_id: friendId,
        display_name: profile?.display_name || null,
        avatar_url: profile?.avatar_url || null,
        email: profile?.email || null,
      };
    });

    setFriends(enriched.filter(f => f.status === 'accepted'));
    setPendingReceived(enriched.filter(f => f.status === 'pending' && f.receiver_id === user.id));
    setPendingSent(enriched.filter(f => f.status === 'pending' && f.requester_id === user.id));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchFriends();
  }, [fetchFriends]);

  const sendRequest = useCallback(async (receiverId: string) => {
    if (!user) return false;
    if (receiverId === user.id) {
      toast.error('Você não pode adicionar a si mesmo.');
      return false;
    }

    // Check if already exists
    const { data: existing } = await supabase
      .from('friends')
      .select('id, status')
      .or(`and(requester_id.eq.${user.id},receiver_id.eq.${receiverId}),and(requester_id.eq.${receiverId},receiver_id.eq.${user.id})`);

    if (existing && existing.length > 0) {
      const row = existing[0];
      if (row.status === 'accepted') {
        toast.info('Vocês já são amigos!');
      } else if (row.status === 'pending') {
        toast.info('Solicitação já enviada.');
      } else {
        // rejected - allow re-send by deleting old and creating new
        await supabase.from('friends').delete().eq('id', row.id);
        const { error } = await supabase.from('friends').insert({ requester_id: user.id, receiver_id: receiverId });
        if (error) { toast.error('Erro ao enviar solicitação.'); return false; }
        toast.success('Solicitação reenviada!');
        await fetchFriends();
        return true;
      }
      return false;
    }

    const { error } = await supabase.from('friends').insert({ requester_id: user.id, receiver_id: receiverId });
    if (error) { toast.error('Erro ao enviar solicitação.'); return false; }
    toast.success('Solicitação enviada!');
    await fetchFriends();
    return true;
  }, [user, fetchFriends]);

  const sendRequestByEmail = useCallback(async (email: string) => {
    if (!user) return false;
    const trimmed = email.trim().toLowerCase();
    if (trimmed === user.email?.toLowerCase()) {
      toast.error('Você não pode adicionar a si mesmo.');
      return false;
    }

    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('email', trimmed)
      .limit(1);

    if (!profiles || profiles.length === 0) {
      toast.error('Nenhum usuário encontrado com este email.');
      return false;
    }

    return sendRequest(profiles[0].user_id);
  }, [user, sendRequest]);

  const acceptRequest = useCallback(async (friendshipId: string) => {
    const { error } = await supabase.from('friends').update({ status: 'accepted' }).eq('id', friendshipId);
    if (error) { toast.error('Erro ao aceitar solicitação.'); return; }
    toast.success('Amizade aceita!');
    await fetchFriends();
  }, [fetchFriends]);

  const rejectRequest = useCallback(async (friendshipId: string) => {
    const { error } = await supabase.from('friends').update({ status: 'rejected' }).eq('id', friendshipId);
    if (error) { toast.error('Erro ao recusar solicitação.'); return; }
    toast.success('Solicitação recusada.');
    await fetchFriends();
  }, [fetchFriends]);

  const removeFriend = useCallback(async (friendshipId: string) => {
    const { error } = await supabase.from('friends').delete().eq('id', friendshipId);
    if (error) { toast.error('Erro ao remover amigo.'); return; }
    toast.success('Amigo removido.');
    await fetchFriends();
  }, [fetchFriends]);

  return { friends, pendingReceived, pendingSent, loading, sendRequest, sendRequestByEmail, acceptRequest, rejectRequest, removeFriend, refresh: fetchFriends };
}
