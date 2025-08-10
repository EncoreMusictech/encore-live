import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export type ClientProfile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  onboarding_complete: boolean;
};

interface ClientProfileFormProps {
  profile: ClientProfile | null;
  userEmail: string;
  onSaved: (profile: ClientProfile) => void;
}

export const ClientProfileForm: React.FC<ClientProfileFormProps> = ({ profile, userEmail, onSaved }) => {
  const { toast } = useToast();
  const { user } = useAuth();

  const [firstName, setFirstName] = useState<string>(profile?.first_name ?? '');
  const [lastName, setLastName] = useState<string>(profile?.last_name ?? '');
  const [phone, setPhone] = useState<string>(profile?.phone ?? '');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile?.avatar_url ?? null);
  const [saving, setSaving] = useState(false);

  const initials = useMemo(() => {
    const f = firstName?.[0];
    const l = lastName?.[0];
    const fallback = (userEmail?.[0] || 'U').toUpperCase();
    return ((f || '') + (l || '')).toUpperCase() || fallback;
  }, [firstName, lastName, userEmail]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!user) {
      toast({ title: 'Not signed in', description: 'Please sign in to upload an avatar.', variant: 'destructive' });
      return;
    }

    try {
      const filePath = `${user.id}/${Date.now()}-${file.name}`;
      const { data, error } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true });
      if (error) throw error;

      const { data: pub } = supabase.storage.from('avatars').getPublicUrl(data.path);
      setAvatarUrl(pub.publicUrl);
      toast({ title: 'Avatar uploaded', description: 'Your profile picture has been updated.' });
    } catch (err: any) {
      console.error(err);
      toast({ title: 'Upload failed', description: err.message || 'Could not upload avatar.', variant: 'destructive' });
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const payload = {
        id: user.id,
        first_name: firstName?.trim() || null,
        last_name: lastName?.trim() || null,
        phone: phone?.trim() || null,
        avatar_url: avatarUrl,
        onboarding_complete: true,
      };

      const { data, error } = await supabase
        .from('profiles')
        .upsert(payload, { onConflict: 'id' })
        .select('*')
        .single();

      if (error) throw error;

      onSaved(data as ClientProfile);
      toast({ title: 'Profile saved', description: 'Your profile has been updated successfully.' });
    } catch (err: any) {
      console.error(err);
      toast({ title: 'Save failed', description: err.message || 'Could not save profile.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="max-w-md w-full mx-auto">
      <CardHeader>
        <CardTitle>My Profile</CardTitle>
        <CardDescription>Update your personal information and avatar</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col items-center gap-4">
          <Avatar className="h-24 w-24">
            <AvatarImage src={avatarUrl || undefined} alt="Client avatar" loading="lazy" />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div>
            <Input type="file" accept="image/*" onChange={handleAvatarChange} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="first_name">First name</Label>
            <Input id="first_name" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="last_name">Last name</Label>
            <Input id="last_name" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="email">Email (locked)</Label>
            <Input id="email" value={userEmail} disabled />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="phone">Phone number</Label>
            <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 123-4567" />
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save profile'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ClientProfileForm;
