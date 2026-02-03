import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Building2, Mail, Lock, AlertCircle, ArrowLeft, CheckCircle2, KeyRound } from 'lucide-react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import logo2m from '@/assets/logo-2m.png';
import { supabase } from '@/integrations/supabase/client';

type Step = 'request' | 'verify' | 'success';

const ResetPassword = () => {
  const [step, setStep] = useState<Step>('request');
  const [cnpj, setCnpj] = useState('');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();

  const formatCnpj = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 14) {
      return numbers
        .replace(/^(\d{2})(\d)/, '$1.$2')
        .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d)/, '.$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2');
    }
    return value;
  };

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCnpj(formatCnpj(e.target.value));
  };

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const cnpjNumbers = cnpj.replace(/\D/g, '');
    if (cnpjNumbers.length !== 14) {
      setError('CNPJ deve ter 14 dígitos');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setError('Digite um email válido');
      return;
    }

    setIsLoading(true);
    
    try {
      const { data, error: fnError } = await supabase.functions.invoke('send-reset-code', {
        body: { cnpj: cnpjNumbers, email }
      });

      if (fnError) {
        throw fnError;
      }

      if (!data.success) {
        setError(data.error || 'Erro ao solicitar código');
      } else {
        setStep('verify');
      }
    } catch (err: any) {
      console.error('Error requesting reset code:', err);
      setError('Erro ao processar solicitação. Tente novamente.');
    }
    
    setIsLoading(false);
  };

  const handleVerifyAndReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (code.length !== 6) {
      setError('Digite o código de 6 dígitos');
      return;
    }

    if (newPassword.length < 6) {
      setError('A nova senha deve ter pelo menos 6 caracteres');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    setIsLoading(true);
    
    try {
      const cnpjNumbers = cnpj.replace(/\D/g, '');
      
      const { data, error: rpcError } = await supabase.rpc('verify_reset_code_and_change_password', {
        p_cnpj: cnpjNumbers,
        p_code: code,
        p_new_password: newPassword
      });

      if (rpcError) {
        throw rpcError;
      }

      const result = data as { success: boolean; error?: string; message?: string };

      if (!result.success) {
        setError(result.error || 'Erro ao redefinir senha');
      } else {
        setStep('success');
      }
    } catch (err: any) {
      console.error('Error resetting password:', err);
      setError('Erro ao redefinir senha. Tente novamente.');
    }
    
    setIsLoading(false);
  };

  const renderRequestStep = () => (
    <form onSubmit={handleRequestCode} className="space-y-5">
      {error && (
        <Alert variant="destructive" className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="cnpj" className="text-gray-700 font-medium">
          CNPJ da Empresa
        </Label>
        <div className="relative">
          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            id="cnpj"
            type="text"
            placeholder="00.000.000/0000-00"
            value={cnpj}
            onChange={handleCnpjChange}
            maxLength={18}
            className="pl-10 h-12 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="email" className="text-gray-700 font-medium">
          Email de Contato
        </Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            id="email"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-10 h-12 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
          />
        </div>
        <p className="text-xs text-gray-500">
          Informe o email cadastrado para receber o código de verificação.
        </p>
      </div>
      
      <Button 
        type="submit" 
        className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium shadow-lg hover:shadow-xl transition-all"
        disabled={isLoading}
      >
        {isLoading ? 'Enviando...' : 'Enviar Código'}
      </Button>
    </form>
  );

  const renderVerifyStep = () => (
    <form onSubmit={handleVerifyAndReset} className="space-y-5">
      {error && (
        <Alert variant="destructive" className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="space-y-3">
        <Label className="text-gray-700 font-medium">
          Código de Verificação
        </Label>
        <div className="flex justify-center">
          <InputOTP 
            maxLength={6} 
            value={code} 
            onChange={setCode}
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>
        <p className="text-xs text-gray-500 text-center">
          Digite o código de 6 dígitos enviado para o seu email.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="newPassword" className="text-gray-700 font-medium">
          Nova Senha
        </Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            id="newPassword"
            type={showPassword ? 'text' : 'password'}
            placeholder="Digite a nova senha"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="pl-10 pr-10 h-12 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword" className="text-gray-700 font-medium">
          Confirmar Nova Senha
        </Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="Confirme a nova senha"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="pl-10 pr-10 h-12 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
      </div>
      
      <Button 
        type="submit" 
        className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium shadow-lg hover:shadow-xl transition-all"
        disabled={isLoading}
      >
        {isLoading ? 'Redefinindo...' : 'Redefinir Senha'}
      </Button>

      <button
        type="button"
        onClick={() => {
          setStep('request');
          setCode('');
          setNewPassword('');
          setConfirmPassword('');
          setError('');
        }}
        className="w-full text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        Solicitar novo código
      </button>
    </form>
  );

  const renderSuccessStep = () => (
    <div className="text-center space-y-6">
      <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
        <CheckCircle2 className="w-8 h-8 text-green-600" />
      </div>
      
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Senha Redefinida com Sucesso!
        </h3>
        <p className="text-gray-600">
          Sua senha foi alterada. Agora você pode fazer login com a nova senha.
        </p>
      </div>
      
      <Button 
        onClick={() => navigate('/login')}
        className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium shadow-lg hover:shadow-xl transition-all"
      >
        Ir para Login
      </Button>
    </div>
  );

  const getStepTitle = () => {
    switch (step) {
      case 'request': return 'Redefinição de Senha';
      case 'verify': return 'Verificar Código';
      case 'success': return 'Concluído';
    }
  };

  const getStepDescription = () => {
    switch (step) {
      case 'request': return 'Informe o CNPJ e email para receber o código';
      case 'verify': return 'Digite o código e defina sua nova senha';
      case 'success': return '';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
      <Card className="w-full max-w-md shadow-2xl border-0 bg-white/95 backdrop-blur">
        <CardHeader className="text-center space-y-4 pb-2">
          <div className="mx-auto">
            <img src={logo2m} alt="2M Contabilidade" className="h-24 w-auto mx-auto" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-gray-800">
              {getStepTitle()}
            </CardTitle>
            {getStepDescription() && (
              <CardDescription className="text-gray-600 mt-2">
                {getStepDescription()}
              </CardDescription>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="pt-6">
          {step === 'request' && renderRequestStep()}
          {step === 'verify' && renderVerifyStep()}
          {step === 'success' && renderSuccessStep()}
          
          {step !== 'success' && (
            <div className="mt-6 text-center">
              <Link 
                to="/login" 
                className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar para o login
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
