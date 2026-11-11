import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { AlertCircle, Mail, CheckCircle, Lock } from 'lucide-react';
import logo2m from '@/assets/logo-2m.png';

const Login = () => {
  const [mode, setMode] = useState<'password' | 'code'>('password');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [password, setPassword] = useState('');
  const [viaCode, setViaCode] = useState(false);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { requestCode, verifyCode, loginWithPassword, client, isAuthenticated, hasSession, isLoading: authLoading } = useAuth();
  const { isAuthenticated: isAdmin } = useAdminAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAdmin) navigate('/');
    else if (isAuthenticated) navigate(viaCode || client?.mustSetPassword ? '/criar-senha' : '/');
  }, [isAuthenticated, isAdmin, client, viaCode, navigate]);

  const handleRequest = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError('');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Email inválido');
      return;
    }
    setIsLoading(true);
    const r = await requestCode(email);
    setIsLoading(false);
    if (!r.success) return setError(r.error || 'Erro ao enviar código');
    setInfo(r.message || 'Se o email estiver cadastrado, enviaremos um código');
    setCode('');
    setStep('code');
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (code.length !== 6) return setError('Digite os 6 dígitos do código');
    setIsLoading(true);
    setViaCode(true);
    const r = await verifyCode(email, code);
    setIsLoading(false);
    if (!r.success) { setViaCode(false); setError(r.error || 'Código inválido'); }
  };

  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) return setError('Preencha email e senha');
    setIsLoading(true);
    const r = await loginWithPassword(email, password);
    setIsLoading(false);
    if (!r.success) setError(r.error || 'Erro ao entrar');
  };

  const notReleased = !authLoading && hasSession && !isAuthenticated && !isAdmin;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
      <Card className="w-full max-w-md shadow-2xl border-0 bg-white/95 backdrop-blur">
        <CardHeader className="text-center space-y-4 pb-2">
          <img src={logo2m} alt="2M Contabilidade" className="h-24 w-auto mx-auto" />
          <div>
            <CardTitle className="text-2xl font-bold text-gray-800">Reforma Tributária</CardTitle>
            <CardDescription className="text-gray-600 mt-2">
              {mode === 'password' ? 'Entre com seu email e senha' : step === 'email' ? 'Primeiro acesso ou esqueceu a senha? Receba um código por email' : `Digite o código enviado para ${email}`}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          {notReleased && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Seu acesso ainda não foi liberado. Entre em contato com a 2M.</AlertDescription>
            </Alert>
          )}
          {error && (
            <Alert variant="destructive" className="mb-4 border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {mode === 'password' ? (
            <form onSubmit={handlePassword} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 font-medium">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input id="email" type="email" autoComplete="email" placeholder="seu@email.com"
                    value={email} onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12 bg-gray-50 border-gray-200 focus:bg-white" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700 font-medium">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input id="password" type="password" autoComplete="current-password" placeholder="Digite sua senha"
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 h-12 bg-gray-50 border-gray-200 focus:bg-white" />
                </div>
              </div>
              <Button type="submit" className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium" disabled={isLoading}>
                {isLoading ? 'Entrando...' : 'Entrar'}
              </Button>
              <button type="button" className="text-sm text-blue-600 hover:underline font-medium w-full"
                onClick={() => { setMode('code'); setStep('email'); setError(''); }}>
                Primeiro acesso ou esqueci minha senha
              </button>
            </form>
          ) : step === 'email' ? (
            <form onSubmit={handleRequest} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 font-medium">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input id="email" type="email" autoComplete="email" placeholder="seu@email.com"
                    value={email} onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12 bg-gray-50 border-gray-200 focus:bg-white" />
                </div>
              </div>
              <Button type="submit" className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium" disabled={isLoading}>
                {isLoading ? 'Enviando...' : 'Receber código'}
              </Button>
              <button type="button" className="text-sm text-blue-600 hover:underline w-full" onClick={() => { setMode('password'); setError(''); }}>
                Voltar para entrar com senha
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="space-y-5">
              {info && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription>{info}. O código vale por 10 minutos.</AlertDescription>
                </Alert>
              )}
              <div className="flex justify-center">
                <InputOTP maxLength={6} value={code} onChange={setCode} autoFocus>
                  <InputOTPGroup>
                    {[0, 1, 2, 3, 4, 5].map((i) => <InputOTPSlot key={i} index={i} />)}
                  </InputOTPGroup>
                </InputOTP>
              </div>
              <Button type="submit" className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium" disabled={isLoading}>
                {isLoading ? 'Entrando...' : 'Entrar'}
              </Button>
              <div className="flex justify-between text-sm">
                <button type="button" className="text-blue-600 hover:underline" onClick={() => { setStep('email'); setError(''); }}>
                  Trocar email
                </button>
                <button type="button" className="text-blue-600 hover:underline" disabled={isLoading} onClick={() => handleRequest()}>
                  Reenviar código
                </button>
              </div>
            </form>
          )}

          <div className="text-center space-y-3 mt-6">
            <p className="text-sm text-gray-500">Não possui acesso? Entre em contato com seu contador.</p>
            <div className="pt-2 border-t border-gray-200 mt-4">
              <Link to="/admin/login" className="text-sm text-gray-500 hover:text-gray-700 hover:underline">
                Acesso Administrador
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
