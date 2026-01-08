import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, KeyRound, Eye, EyeOff, Copy, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ClientResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: {
    id: string;
    company_name: string;
    cnpj: string;
  } | null;
}

const generatePassword = () => {
  const length = 12;
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const all = uppercase + lowercase + numbers;
  
  let password = '';
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  
  for (let i = 3; i < length; i++) {
    password += all[Math.floor(Math.random() * all.length)];
  }
  
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

const ClientResetPasswordModal = ({ isOpen, onClose, client }: ClientResetPasswordModalProps) => {
  const { toast } = useToast();
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [resetComplete, setResetComplete] = useState(false);

  const handleGeneratePassword = () => {
    const password = generatePassword();
    setNewPassword(password);
    setShowPassword(true);
  };

  const handleCopyPassword = async () => {
    await navigator.clipboard.writeText(newPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!newPassword.trim()) {
      setError('Digite ou gere uma nova senha');
      return;
    }

    if (newPassword.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres');
      return;
    }

    if (!client) return;

    setIsSubmitting(true);

    try {
      const { data, error: rpcError } = await supabase.rpc('admin_reset_client_password', {
        p_client_id: client.id,
        p_new_password: newPassword,
      });

      if (rpcError) {
        console.error('Error resetting password:', rpcError);
        setError('Erro ao resetar senha. Tente novamente.');
        setIsSubmitting(false);
        return;
      }

      const result = data as unknown as { success: boolean; error?: string };

      if (!result.success) {
        setError(result.error || 'Erro ao resetar senha');
        setIsSubmitting(false);
        return;
      }

      setResetComplete(true);
      toast({
        title: 'Senha Resetada',
        description: 'A senha foi alterada. O cliente deverá alterar no primeiro acesso.',
      });
    } catch (err) {
      console.error('Password reset error:', err);
      setError('Erro ao resetar senha. Tente novamente.');
    }

    setIsSubmitting(false);
  };

  const handleClose = () => {
    setNewPassword('');
    setShowPassword(false);
    setError('');
    setResetComplete(false);
    setCopied(false);
    onClose();
  };

  const formatCnpj = (cnpj: string) => {
    return cnpj
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  };

  if (!client) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-amber-600" />
            <DialogTitle>Resetar Senha do Cliente</DialogTitle>
          </div>
          <DialogDescription>
            {resetComplete 
              ? 'Senha resetada com sucesso! Copie e envie para o cliente.'
              : `Defina uma nova senha para ${client.company_name}`}
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          <div className="text-sm text-gray-500 mb-4">
            <p><strong>Empresa:</strong> {client.company_name}</p>
            <p><strong>CNPJ:</strong> {formatCnpj(client.cnpj)}</p>
          </div>

          {!resetComplete ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="newPassword">Nova Senha</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="newPassword"
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Digite ou gere uma senha"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleGeneratePassword}
                  >
                    Gerar
                  </Button>
                </div>
              </div>

              {newPassword && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopyPassword}
                  className="w-full"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copiar Senha
                    </>
                  )}
                </Button>
              )}

              <Alert className="border-amber-200 bg-amber-50">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-700 text-sm">
                  O cliente será obrigado a alterar a senha no primeiro acesso.
                </AlertDescription>
              </Alert>

              <DialogFooter className="flex gap-2">
                <Button type="button" variant="outline" onClick={handleClose}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Resetando...' : 'Resetar Senha'}
                </Button>
              </DialogFooter>
            </form>
          ) : (
            <div className="space-y-4">
              <Alert className="border-green-200 bg-green-50">
                <AlertDescription className="text-green-700">
                  <p className="font-medium mb-2">Nova senha:</p>
                  <code className="bg-green-100 px-2 py-1 rounded text-lg">
                    {newPassword}
                  </code>
                </AlertDescription>
              </Alert>

              <Button
                type="button"
                variant="outline"
                onClick={handleCopyPassword}
                className="w-full"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar Senha
                  </>
                )}
              </Button>

              <DialogFooter>
                <Button onClick={handleClose} className="w-full">
                  Fechar
                </Button>
              </DialogFooter>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ClientResetPasswordModal;
