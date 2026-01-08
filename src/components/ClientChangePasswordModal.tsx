import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ClientChangePasswordModalProps {
  isOpen: boolean;
  clientId: string;
  onPasswordChanged: () => void;
}

const ClientChangePasswordModal = ({ isOpen, clientId, onPasswordChanged }: ClientChangePasswordModalProps) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return 'A senha deve ter pelo menos 8 caracteres';
    }
    if (!/[A-Z]/.test(password)) {
      return 'A senha deve conter pelo menos uma letra maiúscula';
    }
    if (!/[a-z]/.test(password)) {
      return 'A senha deve conter pelo menos uma letra minúscula';
    }
    if (!/[0-9]/.test(password)) {
      return 'A senha deve conter pelo menos um número';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!currentPassword.trim()) {
      setError('Digite a senha atual');
      return;
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    if (currentPassword === newPassword) {
      setError('A nova senha deve ser diferente da senha atual');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error: rpcError } = await supabase.rpc('change_client_password', {
        p_client_id: clientId,
        p_current_password: currentPassword,
        p_new_password: newPassword,
      });

      if (rpcError) {
        console.error('Error changing password:', rpcError);
        setError('Erro ao alterar senha. Tente novamente.');
        setIsSubmitting(false);
        return;
      }

      const result = data as unknown as { success: boolean; error?: string };

      if (!result.success) {
        setError(result.error || 'Erro ao alterar senha');
        setIsSubmitting(false);
        return;
      }

      // Limpar campos e resetar estado antes de fechar
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setError('');
      setIsSubmitting(false);
      
      // Chamar callback para fechar o modal
      onPasswordChanged();
    } catch (err) {
      console.error('Password change error:', err);
      setError('Erro ao alterar senha. Tente novamente.');
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-blue-600" />
            <DialogTitle>Alteração de Senha Obrigatória</DialogTitle>
          </div>
          <DialogDescription>
            Por segurança, você deve alterar sua senha no primeiro acesso.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="currentPassword">Senha Atual</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Digite a senha atual"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">Nova Senha</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Digite a nova senha"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirme a nova senha"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="text-xs text-gray-500 space-y-1">
            <p className="font-medium">Requisitos da senha:</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li className={newPassword.length >= 8 ? 'text-green-600' : ''}>
                Mínimo 8 caracteres
              </li>
              <li className={/[A-Z]/.test(newPassword) ? 'text-green-600' : ''}>
                Uma letra maiúscula
              </li>
              <li className={/[a-z]/.test(newPassword) ? 'text-green-600' : ''}>
                Uma letra minúscula
              </li>
              <li className={/[0-9]/.test(newPassword) ? 'text-green-600' : ''}>
                Um número
              </li>
            </ul>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? 'Alterando...' : 'Alterar Senha'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ClientChangePasswordModal;
