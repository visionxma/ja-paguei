import { useState } from 'react';
import { Users, UserCheck, Mail, Plus, Check } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { formatUserName } from '@/lib/utils';
import { useFriends, FriendWithProfile } from '@/hooks/useFriends';

interface Participant {
  user_id: string;
  display_name: string | null;
  avatar_url?: string | null;
}

interface ParticipantPickerProps {
  selected: Participant[];
  onAdd: (p: Participant) => void;
  onRemove: (userId: string) => void;
  groupMembers?: { user_id: string; profiles: { display_name: string | null } | null }[];
  onAddByEmail?: (email: string) => Promise<boolean>;
}

const ParticipantPicker = ({ selected, onAdd, onRemove, groupMembers, onAddByEmail }: ParticipantPickerProps) => {
  const { friends } = useFriends();
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const selectedIds = new Set(selected.map(s => s.user_id));

  const handleEmailAdd = async () => {
    if (!email.trim() || !onAddByEmail) return;
    setSending(true);
    await onAddByEmail(email.trim());
    setEmail('');
    setSending(false);
  };

  const Avatar = ({ url, name }: { url: string | null | undefined; name: string | null }) => (
    url ? (
      <img src={url} alt="" className="w-8 h-8 rounded-full object-cover" />
    ) : (
      <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
        {(name || '?')[0]?.toUpperCase()}
      </div>
    )
  );

  const PersonRow = ({ userId, name, avatar, isSelected }: { userId: string; name: string | null; avatar?: string | null; isSelected: boolean }) => (
    <button
      type="button"
      onClick={() => isSelected ? onRemove(userId) : onAdd({ user_id: userId, display_name: name, avatar_url: avatar })}
      className={`w-full flex items-center gap-2.5 p-2.5 rounded-lg transition-all ${isSelected ? 'bg-primary/10 border border-primary/30' : 'hover:bg-accent border border-transparent'}`}
    >
      <Avatar url={avatar} name={name} />
      <span className="text-sm font-medium flex-1 text-left truncate">{formatUserName(name) || 'Usuário'}</span>
      {isSelected ? <Check size={16} className="text-primary shrink-0" /> : <Plus size={16} className="text-muted-foreground shrink-0" />}
    </button>
  );

  const defaultTab = groupMembers && groupMembers.length > 0 ? 'group' : 'friends';

  return (
    <Tabs defaultValue={defaultTab} className="w-full">
      <TabsList className="w-full">
        <TabsTrigger value="friends" className="flex-1 text-xs"><UserCheck size={12} className="mr-1" /> Amigos</TabsTrigger>
        {groupMembers && groupMembers.length > 0 && (
          <TabsTrigger value="group" className="flex-1 text-xs"><Users size={12} className="mr-1" /> Grupo</TabsTrigger>
        )}
        <TabsTrigger value="email" className="flex-1 text-xs"><Mail size={12} className="mr-1" /> Email</TabsTrigger>
      </TabsList>

      <TabsContent value="friends" className="mt-2 max-h-48 overflow-y-auto space-y-1">
        {friends.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-3">Nenhum amigo ainda.</p>
        ) : (
          friends.map(f => (
            <PersonRow
              key={f.friend_user_id}
              userId={f.friend_user_id}
              name={f.display_name}
              avatar={f.avatar_url}
              isSelected={selectedIds.has(f.friend_user_id)}
            />
          ))
        )}
      </TabsContent>

      {groupMembers && groupMembers.length > 0 && (
        <TabsContent value="group" className="mt-2 max-h-48 overflow-y-auto space-y-1">
          {groupMembers.map(m => (
            <PersonRow
              key={m.user_id}
              userId={m.user_id}
              name={(m.profiles as any)?.display_name}
              isSelected={selectedIds.has(m.user_id)}
            />
          ))}
        </TabsContent>
      )}

      <TabsContent value="email" className="mt-2">
        <div className="flex gap-2">
          <Input
            type="email"
            placeholder="email@exemplo.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="bg-secondary border-border text-sm"
            onKeyDown={e => e.key === 'Enter' && handleEmailAdd()}
          />
          <Button type="button" onClick={handleEmailAdd} disabled={sending || !email.trim()} size="sm" className="shrink-0">
            Adicionar
          </Button>
        </div>
      </TabsContent>
    </Tabs>
  );
};

export default ParticipantPicker;
