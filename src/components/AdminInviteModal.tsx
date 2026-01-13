import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Copy, CheckCircle, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AdminInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInviteSent: () => void;
}

interface CreateInviteResponse {
  success: boolean;
  error?: string;
  token?: string;
}

const AdminInviteModal = ({ isOpen, onClose, onInviteSent }: AdminInviteModalProps) => {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState('');

  const handleSubmit = async () => {
    setError('');

    if (!email.trim()) {
      setError('Digite o email do novo administrador');
      return;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Email inválido');
      return;
    }

    setIsLoading(true);

    try {
      // Usar função RPC segura para criar convite
      // O token é gerado e processado server-side, não exposto no cliente
      const { data, error: rpcError } = await supabase.rpc('create_admin_invite', {
        p_email: email.trim()
      });

      const response = data as unknown as CreateInviteResponse;

      if (rpcError) {
        console.error('RPC error:', rpcError);
        setError('Erro ao criar convite');
        setIsLoading(false);
        return;
      }

      if (!response?.success) {
        setError(response?.error || 'Erro ao criar convite');
        setIsLoading(false);
        return;
      }

      // Gerar link de convite com o token retornado pela função segura
      const baseUrl = window.location.origin;
      const link = `${baseUrl}/admin/register?token=${response.token}`;
      setInviteLink(link);

      toast({
        title: 'Convite criado!',
        description: 'Copie o link e envie para o novo administrador',
      });

      onInviteSent();
    } catch (err) {
      console.error('Error creating invite:', err);
      setError('Erro ao criar convite');
    }

    setIsLoading(false);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      toast({
        title: 'Link copiado!',
        description: 'O link do convite foi copiado para a área de transferência',
      });
    } catch (err) {
      console.error('Error copying:', err);
    }
  };

  const handleClose = () => {
    setEmail('');
    setError('');
    setInviteLink('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Convidar Novo Administrador
          </DialogTitle>
          <DialogDescription>
            Envie um convite para adicionar um novo administrador ao sistema
          </DialogDescription>
        </DialogHeader>

        {inviteLink ? (
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm text-green-800">Convite criado com sucesso!</span>
            </div>

            <div className="space-y-2">
              <Label>Link do Convite</Label>
              <div className="flex gap-2">
                <Input
                  value={inviteLink}
                  readOnly
                  className="text-xs bg-slate-50"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={copyToClipboard}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-slate-500">
                Este link é válido por 7 dias. Envie para {email}.
              </p>
            </div>

            <DialogFooter>
              <Button onClick={handleClose} className="w-full">
                Fechar
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="invite-email">Email do novo administrador</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="novoadmin@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={isLoading}>
                {isLoading ? 'Criando...' : 'Criar Convite'}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AdminInviteModal;