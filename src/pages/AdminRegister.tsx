import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertCircle, ArrowLeft, CheckCircle, Lock } from 'lucide-react';

const AdminRegister = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get('token');
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);
  const [canRegister, setCanRegister] = useState(false);
  const [isFirstAdmin, setIsFirstAdmin] = useState(false);
  const [inviteId, setInviteId] = useState<string | null>(null);

  useEffect(() => {
    checkRegistrationAccess();
  }, [inviteToken]);

  const checkRegistrationAccess = async () => {
    setIsCheckingAccess(true);
    setError('');

    try {
      // Verificar se existem admins
      const { count } = await supabase
        .from('admins')
        .select('*', { count: 'exact', head: true });

      if (count === 0) {
        // Primeiro admin - permitir registro livre
        setCanRegister(true);
        setIsFirstAdmin(true);
        setIsCheckingAccess(false);
        return;
      }

      // Se não é o primeiro admin, precisa de convite
      if (!inviteToken) {
        setCanRegister(false);
        setIsCheckingAccess(false);
        return;
      }

      // Validar token de convite (não precisa de autenticação para validar)
      // Usamos uma query direta já que precisamos validar antes do usuário estar autenticado
      const { data: invite, error: inviteError } = await supabase
        .from('admin_invites')
        .select('id, email, expires_at, used')
        .eq('token', inviteToken)
        .eq('used', false)
        .single();

      if (inviteError || !invite) {
        setError('Convite inválido ou já utilizado');
        setCanRegister(false);
        setIsCheckingAccess(false);
        return;
      }

      if (new Date(invite.expires_at) < new Date()) {
        setError('Convite expirado');
        setCanRegister(false);
        setIsCheckingAccess(false);
        return;
      }

      // Convite válido
      setEmail(invite.email);
      setInviteId(invite.id);
      setCanRegister(true);
    } catch (err) {
      console.error('Error checking access:', err);
      setError('Erro ao verificar acesso');
      setCanRegister(false);
    }

    setIsCheckingAccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Preencha todos os campos');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não conferem');
      return;
    }

    if (password.length < 8) {
      setError('A senha deve ter no mínimo 8 caracteres');
      return;
    }

    // Validar força da senha
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    
    if (!hasUpperCase || !hasLowerCase || !hasNumber) {
      setError('A senha deve conter letras maiúsculas, minúsculas e números');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Criar usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.toLowerCase().trim(),
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: { name }
        }
      });

      if (authError) {
        if (authError.message.includes('already registered')) {
          setError('Este email já está registrado');
        } else {
          setError(authError.message);
        }
        setIsLoading(false);
        return;
      }

      if (!authData.user) {
        setError('Erro ao criar conta');
        setIsLoading(false);
        return;
      }

      // 2. Adicionar role de admin
      const { error: roleError } = await supabase.from('user_roles').insert({
        user_id: authData.user.id,
        role: 'admin'
      });

      if (roleError) {
        console.error('Role error:', roleError);
        setError('Erro ao atribuir permissões de admin');
        setIsLoading(false);
        return;
      }

      // 3. Criar entrada na tabela admins
      const { error: adminError } = await supabase.from('admins').insert({
        email: email.toLowerCase().trim(),
        name: name.trim(),
        password_hash: 'supabase_auth',
        must_change_password: false, // Não precisa trocar pois acabou de criar
      });

      if (adminError) {
        console.error('Admin insert error:', adminError);
      }

      // 4. Marcar convite como usado (se houver)
      if (inviteId) {
        await supabase.rpc('use_admin_invite', { p_invite_id: inviteId });
      }

      setSuccess(true);
    } catch (err) {
      console.error('Registration error:', err);
      setError('Erro ao criar conta');
    }

    setIsLoading(false);
  };

  if (isCheckingAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-slate-600">Verificando acesso...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!canRegister) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <Lock className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle>Acesso Restrito</CardTitle>
            <CardDescription>
              {error || 'O registro de novos administradores requer um convite válido.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-slate-600 mb-4">
              Solicite um convite a um administrador existente para criar sua conta.
            </p>
            <Link 
              to="/admin/login" 
              className="text-sm text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar para login
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle>Conta Criada!</CardTitle>
            <CardDescription>
              Sua conta de administrador foi criada com sucesso.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full" 
              onClick={() => navigate('/admin/login')}
            >
              Ir para Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-4">
            <Shield className="h-6 w-6 text-slate-600" />
          </div>
          <CardTitle>
            {isFirstAdmin ? 'Criar Primeiro Administrador' : 'Registrar Administrador'}
          </CardTitle>
          <CardDescription>
            {isFirstAdmin 
              ? 'Configure a conta do administrador principal do sistema'
              : 'Complete seu cadastro usando o convite recebido'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                type="text"
                placeholder="Seu nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={!!inviteId} // Email fixo se veio do convite
                className={inviteId ? 'bg-slate-100' : ''}
              />
              {inviteId && (
                <p className="text-xs text-slate-500">
                  Email definido pelo convite
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="Mínimo 8 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <p className="text-xs text-slate-500">
                Use letras maiúsculas, minúsculas e números
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Repita a senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Criando conta...' : 'Criar Conta'}
            </Button>

            <div className="text-center">
              <Link 
                to="/admin/login" 
                className="text-sm text-slate-600 hover:text-slate-800 inline-flex items-center gap-1"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar para login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminRegister;