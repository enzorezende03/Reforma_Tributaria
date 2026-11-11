import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { validateClientPassword } from '@/lib/passwordRule';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const ClientChangePasswordModal = ({ open, onOpenChange, email }: { open: boolean; onOpenChange: (o: boolean) => void; email: string }) => {
  const { toast } = useToast();
  const [current, setCurrent] = useState('');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const close = (o: boolean) => { onOpenChange(o); if (!o) { setCurrent(''); setPw(''); setPw2(''); setError(''); } };

  const submit = async () => {
    setError('');
    const rule = validateClientPassword(pw);
    if (rule) return setError(rule);
    if (pw !== pw2) return setError('As senhas não conferem');
    setSaving(true);
    const { error: authErr } = await supabase.auth.signInWithPassword({ email, password: current });
    if (authErr) { setSaving(false); return setError('Senha atual incorreta'); }
    const { error: upErr } = await supabase.auth.updateUser({ password: pw });
    setSaving(false);
    if (upErr) return setError('Não foi possível alterar a senha');
    toast({ title: 'Senha alterada', description: 'Use a nova senha no próximo acesso.' });
    close(false);
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Alterar senha</DialogTitle>
          <DialogDescription>Mínimo de 8 caracteres, com letras e números.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {error && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}
          <div className="space-y-2"><Label>Senha atual</Label><Input type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} /></div>
          <div className="space-y-2"><Label>Nova senha</Label><Input type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} /></div>
          <div className="space-y-2"><Label>Confirme a nova senha</Label><Input type="password" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => close(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={saving}>{saving ? 'Salvando...' : 'Alterar senha'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
